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
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const AgentPlanningService_1 = require("../application/AgentPlanningService");
const AgentPlanningV2Service_1 = require("../application/AgentPlanningV2Service");
const MongoAgentPlanCacheRepository_1 = require("../infrastructure/repositories/MongoAgentPlanCacheRepository");
const MongoNavigationCatalogRepository_1 = require("../infrastructure/repositories/MongoNavigationCatalogRepository");
const createAgentPlannerProvider_1 = require("../infrastructure/providers/createAgentPlannerProvider");
const agentController_1 = require("./agentController");
const router = express_1.default.Router();
let planV1Handler = null;
let planV2Handler = null;
let upsertCatalogHandler = null;
let invalidateCacheHandler = null;
let refreshCacheHandler = null;
let bootstrapError = null;
const bootstrap = () => {
    if (planV1Handler && planV2Handler && upsertCatalogHandler && invalidateCacheHandler && refreshCacheHandler) {
        return;
    }
    if (bootstrapError) {
        throw bootstrapError;
    }
    try {
        const provider = (0, createAgentPlannerProvider_1.createAgentPlannerProvider)();
        const cacheRepository = new MongoAgentPlanCacheRepository_1.MongoAgentPlanCacheRepository();
        const catalogRepository = new MongoNavigationCatalogRepository_1.MongoNavigationCatalogRepository();
        const v1Service = new AgentPlanningService_1.AgentPlanningService(provider);
        const v2Service = new AgentPlanningV2Service_1.AgentPlanningV2Service(provider, cacheRepository, catalogRepository);
        planV1Handler = (0, agentController_1.createPlanAgentActionsHandler)(v1Service);
        planV2Handler = (0, agentController_1.createPlanAgentActionsV2Handler)(v2Service);
        upsertCatalogHandler = (0, agentController_1.createUpsertNavigationCatalogHandler)(v2Service);
        invalidateCacheHandler = (0, agentController_1.createInvalidateCacheHandler)(v2Service);
        refreshCacheHandler = (0, agentController_1.createRefreshCacheHandler)(v2Service);
    }
    catch (error) {
        bootstrapError = error;
        throw error;
    }
};
const runHandler = (req, res, getHandler) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        bootstrap();
        const handler = getHandler();
        if (!handler) {
            res.status(500).json({
                message: "Agent planner is not properly configured",
                code: "agent_plan_bootstrap_error",
            });
            return;
        }
        yield handler(req, res);
    }
    catch (error) {
        console.error(JSON.stringify({ event: "agent_plan_bootstrap_error", message: (error === null || error === void 0 ? void 0 : error.message) || "Unknown bootstrap error" }));
        res.status(500).json({
            message: "Agent planner is not properly configured",
            code: "agent_plan_bootstrap_error",
        });
    }
});
router.post("/plan", (req, res) => __awaiter(void 0, void 0, void 0, function* () { return runHandler(req, res, () => planV1Handler); }));
router.post("/v2/plan", (req, res) => __awaiter(void 0, void 0, void 0, function* () { return runHandler(req, res, () => planV2Handler); }));
router.put("/v2/navigation-catalogs/:version", authMiddleware_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () { return runHandler(req, res, () => upsertCatalogHandler); }));
router.post("/v2/cache/invalidate", authMiddleware_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () { return runHandler(req, res, () => invalidateCacheHandler); }));
router.post("/v2/cache/refresh", authMiddleware_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () { return runHandler(req, res, () => refreshCacheHandler); }));
exports.default = router;
//# sourceMappingURL=agentRoutes.js.map