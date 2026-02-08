"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeVideo = void 0;
const generative_ai_1 = require("@google/generative-ai");
const server_1 = require("@google/generative-ai/server");
// Polyfill `Headers` for environments where Fetch API is not available (Node <18)
if (typeof global.Headers === "undefined") {
    try {
        // undici provides a Fetch-compatible Headers implementation
        // use require so this works in CommonJS/ts-node
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Headers } = require("undici");
        global.Headers = Headers;
    }
    catch (e) {
        console.warn("Could not polyfill global.Headers:", e);
    }
}
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const https_1 = __importDefault(require("https"));
const Video_1 = __importDefault(require("../models/Video"));
const s3FilesService_1 = require("./s3FilesService");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is not set in environment variables.");
}
const genAI = new generative_ai_1.GoogleGenerativeAI(GEMINI_API_KEY || "");
const fileManager = new server_1.GoogleAIFileManager(GEMINI_API_KEY || "");
/**
 * Downloads a file from a URL to a local temporary path.
 */
const downloadFile = (url, destPath) => {
    return new Promise((resolve, reject) => {
        const file = fs_1.default.createWriteStream(destPath);
        https_1.default
            .get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download file, status code: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on("finish", () => {
                file.close();
                resolve();
            });
        })
            .on("error", (err) => {
            fs_1.default.unlink(destPath, () => { }); // Delete the file async
            reject(err);
        });
    });
};
const VideoStats_1 = __importDefault(require("../models/VideoStats"));
const football_1 = require("../utils/prompts/football");
const analyzeVideo = (videoId) => __awaiter(void 0, void 0, void 0, function* () {
    let localFilePath = "";
    let uploadResult = null;
    let fileUri = "";
    let fileMimeType = "";
    try {
        // 1. Get Video Metadata and Populate Field
        const video = yield Video_1.default.findById(videoId).populate("fieldId");
        if (!video) {
            throw new Error("Video not found");
        }
        if (!video.fieldId) {
            throw new Error("Video is not associated with a field");
        }
        const fieldType = video.fieldId.type;
        console.log(`Analyzing video for sport: ${fieldType}`);
        // Select Prompt based on sport
        let prompt = "";
        // Todo: Get duration from video metadata or external service if possible.
        // For now, prompt generic duration or we could assume 60s as max limit.
        const estimatedDuration = 60;
        if (fieldType === "football") {
            prompt = (0, football_1.getFootballPrompt)(estimatedDuration);
        }
        else {
            // Fallback or todo for other sports
            prompt = (0, football_1.getFootballPrompt)(estimatedDuration); // Default to football for now or throw
        }
        // Check if video is already uploaded to Google AI
        let isFileValid = false;
        if (video.googleAiFileId) {
            try {
                const file = yield fileManager.getFile(video.googleAiFileId);
                if (file.state === server_1.FileState.ACTIVE) {
                    console.log("Using existing Google AI file:", video.googleAiFileId);
                    fileUri = file.uri;
                    fileMimeType = file.mimeType;
                    isFileValid = true;
                }
                else if (file.state === server_1.FileState.FAILED) {
                    console.log("Existing Google AI file is in FAILED state. Re-uploading.");
                }
            }
            catch (err) {
                console.log("Google AI file not found or expired. Re-uploading.");
            }
        }
        if (!isFileValid) {
            // 2. Get S3 Signed URL for downloading
            const downloadUrl = yield (0, s3FilesService_1.getObjectS3SignedUrl)(video.s3Key);
            // 3. Download to temp file
            // Use the system temp directory (writable in serverless environments like Vercel)
            const systemTemp = process.env.TMPDIR || os_1.default.tmpdir();
            const tempDir = path_1.default.join(systemTemp, "victorycraft-tmp");
            if (!fs_1.default.existsSync(tempDir)) {
                fs_1.default.mkdirSync(tempDir, { recursive: true });
            }
            const fileName = `temp_${videoId}_${Date.now()}.mp4`;
            localFilePath = path_1.default.join(tempDir, fileName);
            console.log(`Downloading video from S3 to ${localFilePath}...`);
            yield downloadFile(downloadUrl, localFilePath);
            // 4. Upload to Google AI
            console.log("Uploading to Google AI File Manager...");
            uploadResult = yield fileManager.uploadFile(localFilePath, {
                mimeType: "video/mp4",
                displayName: `Video Analysis ${videoId}`,
            });
            console.log(`Uploaded file: ${uploadResult.file.name}`);
            // Save the new file ID to the database
            if (uploadResult.file.name) {
                // Use updateOne to avoid validating other fields like slotId if they are missing in old records
                yield Video_1.default.updateOne({ _id: video._id }, { $set: { googleAiFileId: uploadResult.file.name } });
            }
            // 5. Wait for processing
            let file = yield fileManager.getFile(uploadResult.file.name);
            while (file.state === server_1.FileState.PROCESSING) {
                console.log("Processing video...");
                yield new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s
                file = yield fileManager.getFile(uploadResult.file.name);
            }
            if (file.state === server_1.FileState.FAILED) {
                throw new Error("Video processing failed by Google AI.");
            }
            fileUri = file.uri;
            fileMimeType = file.mimeType;
        }
        console.log("Generating content...");
        // 6. Generate Content
        // Using gemini-flash-latest as requested/verified
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            generationConfig: { responseMimeType: "application/json" },
        });
        const result = yield model.generateContent([
            {
                fileData: {
                    mimeType: fileMimeType,
                    fileUri: fileUri,
                },
            },
            { text: prompt },
        ]);
        const response = yield result.response;
        const textResponse = response.text();
        // 7. Parse and Save Stats
        try {
            const statsJson = JSON.parse(textResponse);
            // Save to VideoStats
            const statsData = {
                videoId: video._id,
                // Try to pick a summary field from the model response if present
                summary: statsJson.summary || statsJson.playSummary || "",
                sportType: fieldType,
                teams: statsJson.teams || [],
                generatedByModel: "Gemini-2.0-Flash",
            };
            // Upsert stats
            yield VideoStats_1.default.findOneAndUpdate({ videoId: video._id }, statsData, {
                upsert: true,
                new: true,
            });
            return Object.assign(Object.assign({}, statsJson), { message: "Stats generated and saved successfully." });
        }
        catch (parseError) {
            console.error("Error parsing JSON response from Gemini:", textResponse);
            throw new Error("Failed to parse AI response as JSON");
        }
    }
    catch (error) {
        console.error("Error in AI analysis:", error);
        throw new Error(`AI Analysis failed: ${error.message}`);
    }
    finally {
        // 7. Cleanup
        // Only delete local file. Do NOT delete remote file so we can reuse it.
        if (localFilePath && fs_1.default.existsSync(localFilePath)) {
            fs_1.default.unlinkSync(localFilePath);
            console.log("Deleted local temp file.");
        }
    }
});
exports.analyzeVideo = analyzeVideo;
//# sourceMappingURL=aiAnalysisService.js.map