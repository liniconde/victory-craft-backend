import AgentPlanCacheEntryModel from "../models/AgentPlanCacheEntry";
import { AgentPlanCacheRepository, CacheDeleteFilter } from "../../domain/ports/AgentPlanCacheRepository";
import { PlanCacheEntry } from "../../domain/types";

const toPlainEntry = (doc: any): PlanCacheEntry => ({
  key: doc.key,
  catalogVersion: doc.catalogVersion,
  promptNormalized: doc.promptNormalized,
  currentPath: doc.currentPath,
  locale: doc.locale,
  actionsFingerprint: doc.actionsFingerprint,
  response: doc.response,
  source: doc.source,
  confidence: doc.confidence,
});

export class MongoAgentPlanCacheRepository implements AgentPlanCacheRepository {
  async findByKey(key: string): Promise<PlanCacheEntry | null> {
    const doc = await AgentPlanCacheEntryModel.findOneAndUpdate(
      { key },
      { $set: { lastAccessedAt: new Date() }, $inc: { hitCount: 1 } },
      { new: true },
    ).lean();

    return doc ? toPlainEntry(doc) : null;
  }

  async upsert(entry: PlanCacheEntry): Promise<void> {
    await AgentPlanCacheEntryModel.updateOne(
      { key: entry.key },
      {
        $set: {
          catalogVersion: entry.catalogVersion,
          promptNormalized: entry.promptNormalized,
          currentPath: entry.currentPath,
          locale: entry.locale,
          actionsFingerprint: entry.actionsFingerprint,
          response: entry.response,
          source: entry.source,
          confidence: entry.confidence,
          lastAccessedAt: new Date(),
        },
        $setOnInsert: { hitCount: 0 },
      },
      { upsert: true },
    );
  }

  async deleteMany(filter: CacheDeleteFilter): Promise<number> {
    if (filter.all) {
      const result = await AgentPlanCacheEntryModel.deleteMany({});
      return result.deletedCount || 0;
    }

    const query: Record<string, unknown> = {};
    if (filter.catalogVersion) query.catalogVersion = filter.catalogVersion;
    if (filter.promptNormalized) query.promptNormalized = filter.promptNormalized;

    const result = await AgentPlanCacheEntryModel.deleteMany(query);
    return result.deletedCount || 0;
  }
}
