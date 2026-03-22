import mongoose, { Schema } from "mongoose";

const PlannerCallSchema = new Schema(
  {
    name: { type: String, required: true },
    arguments: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const AgentPlanCacheResponseSchema = new Schema(
  {
    summary: { type: String, required: true },
    calls: { type: [PlannerCallSchema], default: [] },
    meta: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false },
);

const AgentPlanCacheEntrySchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    catalogVersion: { type: String, required: true, index: true },
    promptNormalized: { type: String, required: true, index: true },
    currentPath: { type: String, required: true },
    locale: { type: String, required: false },
    actionsFingerprint: { type: String, required: true },
    response: { type: AgentPlanCacheResponseSchema, required: true },
    source: { type: String, enum: ["deterministic", "llm"], required: true },
    confidence: { type: Number, min: 0, max: 1, required: true },
    hitCount: { type: Number, default: 0 },
    lastAccessedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

AgentPlanCacheEntrySchema.index({ catalogVersion: 1, promptNormalized: 1 });

export default mongoose.model("AgentPlanCacheEntry", AgentPlanCacheEntrySchema, "agent_plan_cache_entries");
