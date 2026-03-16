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
const agentPlanningService_1 = require("../application/agentPlanningService");
const createAgentPlannerProvider_1 = require("../infrastructure/providers/createAgentPlannerProvider");
const agentPlanningController_1 = require("./agentPlanningController");
const router = express_1.default.Router();
let routeHandler = null;
let bootstrapError = null;
const getRouteHandler = () => {
    if (routeHandler) {
        return routeHandler;
    }
    if (bootstrapError) {
        return null;
    }
    try {
        const provider = (0, createAgentPlannerProvider_1.createAgentPlannerProvider)();
        const service = new agentPlanningService_1.AgentPlanningService(provider);
        routeHandler = (0, agentPlanningController_1.createPlanAgentActionsHandler)(service);
        return routeHandler;
    }
    catch (error) {
        bootstrapError = error;
        return null;
    }
};
router.post("/plan", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const handler = getRouteHandler();
    if (!handler) {
        console.error(JSON.stringify({
            event: "agent_plan_bootstrap_error",
            message: (bootstrapError === null || bootstrapError === void 0 ? void 0 : bootstrapError.message) || "Unknown bootstrap error",
        }));
        res.status(500).json({
            message: "Agent planner is not properly configured",
            code: "agent_plan_bootstrap_error",
        });
        return;
    }
    yield handler(req, res);
}));
exports.default = router;
//# sourceMappingURL=routes.js.map