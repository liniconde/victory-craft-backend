type GeminiUsageMetadata = Record<string, any>;
import GeminiTokenUsage from "../models/GeminiTokenUsage";

type GeminiUsageEntry = {
  model: string;
  at: string;
  source?: string;
  usageMetadata: GeminiUsageMetadata;
  totalTokenCount: number | null;
  promptTokenCount: number | null;
  candidatesTokenCount: number | null;
};

const MAX_USAGE_HISTORY = 10;
const usageHistory: GeminiUsageEntry[] = [];

const normalizeCount = (value: any): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const registerGeminiUsage = async (params: {
  model: string;
  usageMetadata: GeminiUsageMetadata;
  source?: string;
}) => {
  if (!params.usageMetadata || typeof params.usageMetadata !== "object") {
    return null;
  }

  const entry: GeminiUsageEntry = {
    model: params.model,
    at: new Date().toISOString(),
    source: params.source,
    usageMetadata: params.usageMetadata,
    totalTokenCount: normalizeCount(params.usageMetadata.totalTokenCount),
    promptTokenCount: normalizeCount(params.usageMetadata.promptTokenCount),
    candidatesTokenCount: normalizeCount(params.usageMetadata.candidatesTokenCount),
  };

  usageHistory.push(entry);
  if (usageHistory.length > MAX_USAGE_HISTORY) {
    usageHistory.shift();
  }

  try {
    await GeminiTokenUsage.create({
      modelName: entry.model,
      source: entry.source,
      usageMetadata: entry.usageMetadata,
      totalTokenCount: entry.totalTokenCount,
      promptTokenCount: entry.promptTokenCount,
      candidatesTokenCount: entry.candidatesTokenCount,
    });
  } catch (error: any) {
    console.error("Failed to persist Gemini token usage:", error?.message || error);
  }

  return entry;
};

export const registerGeminiUsageFromGenerateResponse = (
  model: string,
  response: any,
  source?: string,
) => {
  const usageMetadata = response?.usageMetadata;
  if (!usageMetadata) {
    return null;
  }

  return registerGeminiUsage({
    model,
    usageMetadata,
    source,
  });
};

export const getLastGeminiTokenUsage = async () => {
  const dbLast = await GeminiTokenUsage.findOne().sort({ createdAt: -1 }).lean();
  if (dbLast) {
    return {
      model: dbLast.modelName,
      at: (dbLast.createdAt as Date).toISOString(),
      source: dbLast.source,
      usageMetadata: dbLast.usageMetadata || {},
      totalTokenCount: dbLast.totalTokenCount ?? null,
      promptTokenCount: dbLast.promptTokenCount ?? null,
      candidatesTokenCount: dbLast.candidatesTokenCount ?? null,
    };
  }

  return usageHistory.length ? usageHistory[usageHistory.length - 1] : null;
};

export const getGeminiTokenUsageSummary = async () => {
  const last = await getLastGeminiTokenUsage();
  const [totalsAgg, historySize, recent] = await Promise.all([
    GeminiTokenUsage.aggregate([
      {
        $group: {
          _id: null,
          requests: { $sum: 1 },
          totalTokenCount: { $sum: { $ifNull: ["$totalTokenCount", 0] } },
          promptTokenCount: { $sum: { $ifNull: ["$promptTokenCount", 0] } },
          candidatesTokenCount: { $sum: { $ifNull: ["$candidatesTokenCount", 0] } },
        },
      },
    ]),
    GeminiTokenUsage.countDocuments({}),
    GeminiTokenUsage.find()
      .sort({ createdAt: -1 })
      .limit(MAX_USAGE_HISTORY)
      .lean(),
  ]);

  if (!historySize) {
    const inMemoryTotals = usageHistory.reduce(
      (acc, item) => {
        acc.requests += 1;
        acc.totalTokenCount += item.totalTokenCount || 0;
        acc.promptTokenCount += item.promptTokenCount || 0;
        acc.candidatesTokenCount += item.candidatesTokenCount || 0;
        return acc;
      },
      {
        requests: 0,
        totalTokenCount: 0,
        promptTokenCount: 0,
        candidatesTokenCount: 0,
      },
    );

    return {
      last,
      totals: inMemoryTotals,
      historySize: usageHistory.length,
      recent: [...usageHistory].reverse(),
    };
  }

  const totals = totalsAgg?.[0] || {
    requests: 0,
    totalTokenCount: 0,
    promptTokenCount: 0,
    candidatesTokenCount: 0,
  };

  return {
    last,
    totals: {
      requests: totals.requests || 0,
      totalTokenCount: totals.totalTokenCount || 0,
      promptTokenCount: totals.promptTokenCount || 0,
      candidatesTokenCount: totals.candidatesTokenCount || 0,
    },
    historySize,
    recent: recent
      .map((item: any) => ({
        model: item.modelName,
        at: (item.createdAt as Date).toISOString(),
        source: item.source,
        usageMetadata: item.usageMetadata || {},
        totalTokenCount: item.totalTokenCount ?? null,
        promptTokenCount: item.promptTokenCount ?? null,
        candidatesTokenCount: item.candidatesTokenCount ?? null,
      }))
      .reverse(),
  };
};
