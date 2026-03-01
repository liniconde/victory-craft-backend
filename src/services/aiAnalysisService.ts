import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
// Polyfill `Headers` for environments where Fetch API is not available (Node <18)
if (typeof (global as any).Headers === "undefined") {
  try {
    // undici provides a Fetch-compatible Headers implementation
    // use require so this works in CommonJS/ts-node
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Headers } = require("undici");
    (global as any).Headers = Headers;
  } catch (e) {
    console.warn("Could not polyfill global.Headers:", e);
  }
}
import fs from "fs";
import path from "path";
import os from "os";
import https from "https";
import Video from "../models/Video";
import Field from "../models/Field";
import { getObjectS3SignedUrl } from "./s3FilesService";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");
const fileManager = new GoogleAIFileManager(GEMINI_API_KEY || "");

/**
 * Downloads a file from a URL to a local temporary path.
 */
const downloadFile = (url: string, destPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(
              `Failed to download file, status code: ${response.statusCode}`,
            ),
          );
          return;
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(destPath, () => {}); // Delete the file async
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
import VideoStats from "../models/VideoStats";
import { getFootballPrompt } from "../utils/prompts/football";

type AnalyzeVideoOptions = {
  jobId?: string;
  promptOverride?: string;
  sportTypeOverride?: string;
  persistToVideoStats?: boolean;
  expectJson?: boolean;
};

const tryParseJson = (text: string) => {
  try {
    return JSON.parse(text);
  } catch (_error) {
    return null;
  }
};

const analyzeVideoInternal = async (videoId: string, options?: AnalyzeVideoOptions) => {
  let localFilePath = "";
  let uploadResult: any = null;
  let fileUri = "";
  let fileMimeType = "";

  try {
    // 1. Get video metadata and resolve sport type from field (if linked)
    const video: any = await Video.findById(videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    let fieldTypeFromField: string | undefined;
    if (video.fieldId) {
      const field = await Field.findById(video.fieldId).select("type");
      fieldTypeFromField = (field as any)?.type;
    }

    const fieldType = options?.sportTypeOverride || fieldTypeFromField || video.sportType;
    const requiresSportType = !options?.promptOverride;
    if (!fieldType && requiresSportType) {
      throw new Error(
        "Sport type could not be determined. Associate fieldId or set video.sportType.",
      );
    }

    const analysisMode = options?.promptOverride ? "prompt_driven" : "default_stats";
    console.log(
      JSON.stringify({
        event: "video_analysis_started",
        jobId: options?.jobId || null,
        videoId,
        sportType: fieldType || "unknown",
        analysisMode,
        at: new Date().toISOString(),
      }),
    );

    // Select Prompt based on sport
    let prompt = "";
    // Todo: Get duration from video metadata or external service if possible.
    // For now, prompt generic duration or we could assume 60s as max limit.
    const estimatedDuration = 60;

    if (options?.promptOverride && options.promptOverride.trim()) {
      prompt = options.promptOverride.trim();
    } else if (fieldType === "football") {
      prompt = getFootballPrompt(estimatedDuration);
    } else {
      // Fallback or todo for other sports
      prompt = getFootballPrompt(estimatedDuration); // Default to football for now or throw
    }

    // Check if video is already uploaded to Google AI
    let isFileValid = false;
    if (video.googleAiFileId) {
      try {
        const file = await fileManager.getFile(video.googleAiFileId);
        if (file.state === FileState.ACTIVE) {
          console.log("Using existing Google AI file:", video.googleAiFileId);
          fileUri = file.uri;
          fileMimeType = file.mimeType;
          isFileValid = true;
        } else if (file.state === FileState.FAILED) {
          console.log(
            "Existing Google AI file is in FAILED state. Re-uploading.",
          );
        }
      } catch (err) {
        console.log("Google AI file not found or expired. Re-uploading.");
      }
    }

    if (!isFileValid) {
      // 2. Get S3 Signed URL for downloading
      const downloadUrl = await getObjectS3SignedUrl(video.s3Key);

      // 3. Download to temp file
      // Use the system temp directory (writable in serverless environments like Vercel)
      const systemTemp = process.env.TMPDIR || os.tmpdir();
      const tempDir = path.join(systemTemp, "victorycraft-tmp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      const fileName = `temp_${videoId}_${Date.now()}.mp4`;
      localFilePath = path.join(tempDir, fileName);

      console.log(`Downloading video from S3 to ${localFilePath}...`);
      await downloadFile(downloadUrl, localFilePath);

      // 4. Upload to Google AI
      console.log("Uploading to Google AI File Manager...");
      uploadResult = await fileManager.uploadFile(localFilePath, {
        mimeType: "video/mp4",
        displayName: `Video Analysis ${videoId}`,
      });

      console.log(`Uploaded file: ${uploadResult.file.name}`);

      // Save the new file ID to the database
      if (uploadResult.file.name) {
        // Use updateOne to avoid validating other fields like slotId if they are missing in old records
        await Video.updateOne(
          { _id: video._id },
          { $set: { googleAiFileId: uploadResult.file.name } },
        );
      }

      // 5. Wait for processing
      let file = await fileManager.getFile(uploadResult.file.name);
      while (file.state === FileState.PROCESSING) {
        console.log("Processing video...");
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s
        file = await fileManager.getFile(uploadResult.file.name);
      }

      if (file.state === FileState.FAILED) {
        throw new Error("Video processing failed by Google AI.");
      }

      fileUri = file.uri;
      fileMimeType = file.mimeType;
    }

    console.log("Generating content...");

    // 6. Generate Content
    // Using gemini-flash-latest as requested/verified
    const modelConfig: any = { model: "gemini-flash-latest" };
    if (options?.expectJson !== false) {
      modelConfig.generationConfig = { responseMimeType: "application/json" };
    }
    const model = genAI.getGenerativeModel(modelConfig);

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: fileMimeType,
          fileUri: fileUri,
        },
      },
      { text: prompt },
    ]);

    const response = await result.response;
    const textResponse = response.text();

    // 7. Parse and Save Stats
    const parsed = tryParseJson(textResponse);
    const persistToVideoStats = options?.persistToVideoStats !== false;

    if (persistToVideoStats) {
      if (!parsed) {
        console.error("Error parsing JSON response from Gemini:", textResponse);
        throw new Error("Failed to parse AI response as JSON");
      }

      // Save to VideoStats
      const statsData = {
        videoId: video._id,
        // Try to pick a summary field from the model response if present
        summary: parsed.summary || parsed.playSummary || "",
        sportType: fieldType,
        teams: parsed.teams || [],
        generatedByModel: "Gemini-2.0-Flash",
      };

      // Upsert stats
      await VideoStats.findOneAndUpdate({ videoId: video._id }, statsData, {
        upsert: true,
        new: true,
      });

      return {
        ...parsed,
        message: "Stats generated and saved successfully.",
      };
    }

    return {
      output: parsed || { text: textResponse },
      rawText: textResponse,
      sportType: fieldType || "other",
      model: "gemini-flash-latest",
      message: "Analysis generated successfully.",
    };
  } catch (error: any) {
    console.error("Error in AI analysis:", error);
    throw new Error(`AI Analysis failed: ${error.message}`);
  } finally {
    // 7. Cleanup
    // Only delete local file. Do NOT delete remote file so we can reuse it.
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      console.log("Deleted local temp file.");
    }
  }
};

export const analyzeVideo = async (videoId: string) =>
  analyzeVideoInternal(videoId, {
    persistToVideoStats: true,
    expectJson: true,
  });

export const analyzeVideoWithPrompt = async (
  videoId: string,
  prompt: string,
  sportTypeOverride?: string,
  jobId?: string,
) =>
  analyzeVideoInternal(videoId, {
    jobId,
    promptOverride: prompt,
    sportTypeOverride,
    persistToVideoStats: false,
    expectJson: false,
  });
