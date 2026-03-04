export type CreateVideoSegmentDto = {
  roomId: string;
  libraryVideoId?: string;
  sequence: number;
  durationSec: number;
  startOffsetSec: number;
  endOffsetSec: number;
  s3Key: string;
  videoUrl: string;
};

export type SegmentUploadedEvent = {
  type: "segment_uploaded";
  roomId: string;
  matchSessionId: string;
  totalDurationSec: number;
  lastSequence: number;
  segment: Record<string, any>;
  at: string;
};

export type StreamClosedEvent = {
  type: "stream_closed";
  roomId: string;
  matchSessionId: string;
  endedAt: string;
  totalDurationSec: number;
  lastSequence: number;
  at: string;
};
