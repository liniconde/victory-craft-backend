"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentPlanningProviderError = exports.AgentPlanningValidationError = void 0;
class AgentPlanningValidationError extends Error {
    constructor(message) {
        super(message);
        this.status = 400;
        this.code = "agent_plan_validation_error";
        this.name = "AgentPlanningValidationError";
    }
}
exports.AgentPlanningValidationError = AgentPlanningValidationError;
class AgentPlanningProviderError extends Error {
    constructor(message) {
        super(message);
        this.status = 502;
        this.code = "agent_plan_provider_error";
        this.name = "AgentPlanningProviderError";
    }
}
exports.AgentPlanningProviderError = AgentPlanningProviderError;
//# sourceMappingURL=errors.js.map