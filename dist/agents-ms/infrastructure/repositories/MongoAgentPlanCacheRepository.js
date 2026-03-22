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
exports.MongoAgentPlanCacheRepository = void 0;
const AgentPlanCacheEntry_1 = __importDefault(require("../models/AgentPlanCacheEntry"));
const toPlainEntry = (doc) => ({
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
class MongoAgentPlanCacheRepository {
    findByKey(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield AgentPlanCacheEntry_1.default.findOneAndUpdate({ key }, { $set: { lastAccessedAt: new Date() }, $inc: { hitCount: 1 } }, { new: true }).lean();
            return doc ? toPlainEntry(doc) : null;
        });
    }
    upsert(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            yield AgentPlanCacheEntry_1.default.updateOne({ key: entry.key }, {
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
            }, { upsert: true });
        });
    }
    deleteMany(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            if (filter.all) {
                const result = yield AgentPlanCacheEntry_1.default.deleteMany({});
                return result.deletedCount || 0;
            }
            const query = {};
            if (filter.catalogVersion)
                query.catalogVersion = filter.catalogVersion;
            if (filter.promptNormalized)
                query.promptNormalized = filter.promptNormalized;
            const result = yield AgentPlanCacheEntry_1.default.deleteMany(query);
            return result.deletedCount || 0;
        });
    }
}
exports.MongoAgentPlanCacheRepository = MongoAgentPlanCacheRepository;
//# sourceMappingURL=MongoAgentPlanCacheRepository.js.map