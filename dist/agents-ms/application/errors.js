"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentPlanningServiceError = exports.AgentPlanningProviderError = exports.AgentPlanningValidationError = void 0;
class AgentPlanningValidationError extends Error {
    constructor() {
        super(...arguments);
        this.status = 400;
        this.code = "agent_plan_validation_error";
    }
}
exports.AgentPlanningValidationError = AgentPlanningValidationError;
class AgentPlanningProviderError extends Error {
    constructor() {
        super(...arguments);
        this.status = 502;
        this.code = "agent_plan_provider_error";
    }
}
exports.AgentPlanningProviderError = AgentPlanningProviderError;
class AgentPlanningServiceError extends Error {
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
exports.AgentPlanningServiceError = AgentPlanningServiceError;
//# sourceMappingURL=errors.js.map