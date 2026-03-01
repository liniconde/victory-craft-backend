import mongoose from "mongoose";
import VideoAnalysisRecord from "../models/VideoAnalysisRecord";

export class VideoAnalysisRecordServiceError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const createVideoAnalysisRecord = async (params: {
  videoId: string;
  analysisJobId: string;
  analysisType: "agent_prompt" | "custom";
  input: Record<string, any>;
  output: Record<string, any>;
  extraParams?: Record<string, any>;
}) => {
  const created = await VideoAnalysisRecord.findOneAndUpdate(
    { analysisJobId: params.analysisJobId },
    {
      videoId: params.videoId,
      analysisJobId: params.analysisJobId,
      analysisType: params.analysisType,
      input: params.input || {},
      output: params.output || {},
      params: params.extraParams || {},
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  return created?.toObject ? created.toObject() : created;
};

export const listVideoAnalysisRecordsByVideoId = async (
  videoId: string,
  options?: { limit?: number; page?: number },
) => {
  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new VideoAnalysisRecordServiceError(400, "invalid_video_id", "Invalid video id");
  }

  const page = Math.max(1, options?.page || 1);
  const limit = Math.min(100, Math.max(1, options?.limit || 20));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    VideoAnalysisRecord.find({ videoId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    VideoAnalysisRecord.countDocuments({ videoId }),
  ]);

  return {
    items: items.map((item) => (item.toObject ? item.toObject() : item)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};
