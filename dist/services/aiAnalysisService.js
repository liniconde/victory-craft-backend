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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
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
/**
 * Analyzes a video using Google Gemini AI.
 * @param videoId - The ID of the video in the database.
 * @param prompt - The question or prompt for the AI.
 * @returns The AI's text response.
 */
const analyzeVideo = (videoId, prompt) => __awaiter(void 0, void 0, void 0, function* () {
    let localFilePath = "";
    let uploadResult = null;
    try {
        // 1. Get Video Metadata
        const video = yield Video_1.default.findById(videoId);
        if (!video) {
            throw new Error("Video not found");
        }
        // 2. Get S3 Signed URL for downloading
        // The s3FilesService mostly returns the simpler signed URL string if checking getObjectS3SignedUrl implementation
        const downloadUrl = yield (0, s3FilesService_1.getObjectS3SignedUrl)(video.s3Key);
        // 3. Download to temp file
        const tempDir = path_1.default.join(__dirname, "../../tmp");
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
        console.log("Video processing complete. generating content...");
        // 6. Generate Content
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = yield model.generateContent([
            {
                fileData: {
                    mimeType: file.mimeType,
                    fileUri: file.uri,
                },
            },
            { text: prompt },
        ]);
        const response = yield result.response;
        return response.text();
    }
    catch (error) {
        console.error("Error in AI analysis:", error);
        throw new Error(`AI Analysis failed: ${error.message}`);
    }
    finally {
        // 7. Cleanup
        // Delete local file
        if (localFilePath && fs_1.default.existsSync(localFilePath)) {
            fs_1.default.unlinkSync(localFilePath);
            console.log("Deleted local temp file.");
        }
        // Delete remote file from Google AI to save storage/privacy
        if (uploadResult && uploadResult.file && uploadResult.file.name) {
            try {
                yield fileManager.deleteFile(uploadResult.file.name);
                console.log("Deleted remote Google AI file.");
            }
            catch (cleanupErr) {
                console.error("Failed to delete remote file:", cleanupErr);
            }
        }
    }
});
exports.analyzeVideo = analyzeVideo;
//# sourceMappingURL=aiAnalysisService.js.map