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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPlanAgentActionsHandler = void 0;
const errors_1 = require("../application/errors");
const createPlanAgentActionsHandler = (service) => {
    return (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield service.plan(req.body || {});
            res.status(200).json(result);
        }
        catch (error) {
            if (error instanceof errors_1.AgentPlanningValidationError) {
                res.status(error.status).json({ message: error.message, code: error.code });
                return;
            }
            if (error instanceof errors_1.AgentPlanningProviderError) {
                res.status(error.status).json({ message: error.message, code: error.code });
                return;
            }
            console.error(JSON.stringify({
                event: "agent_plan_unhandled_error",
                message: (error === null || error === void 0 ? void 0 : error.message) || "Unknown error",
            }));
            res.status(500).json({ message: "Internal server error", code: "agent_plan_internal_error" });
        }
    });
};
exports.createPlanAgentActionsHandler = createPlanAgentActionsHandler;
//# sourceMappingURL=agentPlanningController.js.map