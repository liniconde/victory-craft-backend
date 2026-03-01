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
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const analysisJobsConsumerService_1 = require("../services/analysisJobsConsumerService");
dotenv_1.default.config();
let running = true;
const mongoUri = process.env.MONGO_URI_3 || process.env.MONGO_URI;
const stopWorker = () => __awaiter(void 0, void 0, void 0, function* () {
    running = false;
    try {
        yield mongoose_1.default.disconnect();
    }
    catch (_error) {
        // ignore disconnect errors on shutdown
    }
    process.exit(0);
});
const bootstrap = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoUri) {
        throw new Error("MONGO_URI_3 or MONGO_URI must be configured");
    }
    yield mongoose_1.default.connect(mongoUri);
    console.log("✅ MongoDB Connected (analysis jobs consumer)");
    while (running) {
        try {
            yield (0, analysisJobsConsumerService_1.pollAnalysisJobsQueueOnce)();
        }
        catch (error) {
            console.error("Consumer loop error:", error.message);
            yield new Promise((resolve) => setTimeout(resolve, 2000));
        }
    }
});
process.on("SIGINT", stopWorker);
process.on("SIGTERM", stopWorker);
bootstrap().catch((error) => __awaiter(void 0, void 0, void 0, function* () {
    console.error("Failed to start analysis jobs consumer:", error.message);
    try {
        yield mongoose_1.default.disconnect();
    }
    catch (_disconnectError) {
        // ignore
    }
    process.exit(1);
}));
//# sourceMappingURL=analysisJobsConsumer.js.map