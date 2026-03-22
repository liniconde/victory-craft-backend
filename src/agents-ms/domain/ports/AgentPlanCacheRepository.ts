import { PlanCacheEntry } from "../types";

export type CacheDeleteFilter = {
  all?: boolean;
  catalogVersion?: string;
  promptNormalized?: string;
};

export interface AgentPlanCacheRepository {
  findByKey(key: string): Promise<PlanCacheEntry | null>;
  upsert(entry: PlanCacheEntry): Promise<void>;
  deleteMany(filter: CacheDeleteFilter): Promise<number>;
}
