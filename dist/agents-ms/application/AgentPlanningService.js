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
exports.AgentPlanningService = void 0;
const AgentPlanningPromptService_1 = require("../domain/AgentPlanningPromptService");
const contracts_1 = require("../domain/contracts");
const errors_1 = require("./errors");
const plannerOutputParser_1 = require("./plannerOutputParser");
const isParameterTypeMatch = (value, type) => {
    if (type === "string")
        return typeof value === "string";
    if (type === "number")
        return typeof value === "number" && Number.isFinite(value);
    if (type === "boolean")
        return typeof value === "boolean";
    if (type === "array")
        return Array.isArray(value);
    if (type === "object")
        return typeof value === "object" && value !== null && !Array.isArray(value);
    return false;
};
class AgentPlanningService {
    constructor(provider, logger = console, promptService = new AgentPlanningPromptService_1.AgentPlanningPromptService()) {
        this.provider = provider;
        this.logger = logger;
        this.promptService = promptService;
        this.timeoutMs = Number(process.env.AGENT_PLANNER_TIMEOUT_MS || 12000);
    }
    plan(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const parsedRequest = contracts_1.agentPlanRequestSchema.safeParse(input);
            if (!parsedRequest.success) {
                throw new errors_1.AgentPlanningValidationError(parsedRequest.error.message);
            }
            const request = parsedRequest.data;
            if (request.actions.length === 0) {
                return { summary: AgentPlanningPromptService_1.AGENT_PLAN_FALLBACK_SUMMARY, calls: [] };
            }
            const rawText = yield this.requestPlanFromProvider(request);
            const modelOutput = (0, plannerOutputParser_1.parsePlannerModelOutput)(rawText);
            if (!modelOutput) {
                this.logger.warn(JSON.stringify({ event: "agent_plan_parse_failed", reason: "invalid_json_payload", rawText }));
                return { summary: AgentPlanningPromptService_1.AGENT_PLAN_FALLBACK_SUMMARY, calls: [] };
            }
            return this.normalizeOutput(request, modelOutput.summary, modelOutput.calls);
        });
    }
    requestPlanFromProvider(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.provider.plan({
                    systemPrompt: this.promptService.buildSystemPrompt(),
                    userPrompt: this.promptService.buildUserPrompt(request),
                    timeoutMs: this.timeoutMs,
                });
                this.logger.info(JSON.stringify({
                    event: "agent_plan_provider_response",
                    provider: response.provider,
                    model: response.model,
                    textLength: response.text.length,
                }));
                return response.text;
            }
            catch (error) {
                this.logger.error(JSON.stringify({ event: "agent_plan_provider_error", message: (error === null || error === void 0 ? void 0 : error.message) || "Unknown provider error" }));
                throw new errors_1.AgentPlanningProviderError((error === null || error === void 0 ? void 0 : error.message) || "Failed to get plan from LLM provider");
            }
        });
    }
    normalizeOutput(request, summary, calls) {
        const actionMap = new Map(request.actions.map((action) => [action.name, action]));
        const validCalls = calls
            .map((call) => {
            if (!call.name || typeof call.name !== "string") {
                this.logger.warn(JSON.stringify({ event: "agent_plan_invalid_call_name" }));
                return null;
            }
            const action = actionMap.get(call.name);
            if (!action) {
                this.logger.warn(JSON.stringify({ event: "agent_plan_unknown_action_filtered", actionName: call.name }));
                return null;
            }
            const originalArgs = call.arguments || {};
            const normalizedArgs = {};
            for (const parameter of action.parameters || []) {
                const value = originalArgs[parameter.name];
                if (value === undefined) {
                    if (parameter.required) {
                        this.logger.warn(JSON.stringify({
                            event: "agent_plan_missing_required_argument",
                            actionName: call.name,
                            parameter: parameter.name,
                        }));
                        return null;
                    }
                    continue;
                }
                if (!isParameterTypeMatch(value, parameter.type)) {
                    this.logger.warn(JSON.stringify({
                        event: "agent_plan_invalid_argument_type",
                        actionName: call.name,
                        parameter: parameter.name,
                        expectedType: parameter.type,
                    }));
                    return null;
                }
                if (parameter.enum && parameter.enum.length > 0 && !parameter.enum.includes(value)) {
                    this.logger.warn(JSON.stringify({
                        event: "agent_plan_invalid_argument_enum",
                        actionName: call.name,
                        parameter: parameter.name,
                    }));
                    return null;
                }
                normalizedArgs[parameter.name] = value;
            }
            return { name: call.name, arguments: normalizedArgs };
        })
            .filter((value) => value !== null);
        if (validCalls.length === 0) {
            return { summary: AgentPlanningPromptService_1.AGENT_PLAN_FALLBACK_SUMMARY, calls: [] };
        }
        return {
            summary: summary.trim() || "Planned frontend action calls.",
            calls: validCalls,
        };
    }
}
exports.AgentPlanningService = AgentPlanningService;
//# sourceMappingURL=AgentPlanningService.js.map