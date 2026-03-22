import { AgentPlannerProvider } from "../domain/AgentPlannerProvider";
import {
  AGENT_PLAN_FALLBACK_SUMMARY,
  AgentPlanningPromptService,
} from "../domain/AgentPlanningPromptService";
import { agentPlanRequestSchema } from "../domain/contracts";
import { AgentPlanRequest, AgentPlanResponse, AgentParameterType } from "../domain/types";
import { AgentPlanningProviderError, AgentPlanningValidationError } from "./errors";
import { parsePlannerModelOutput } from "./plannerOutputParser";

type LoggerLike = Pick<typeof console, "info" | "warn" | "error">;

const isParameterTypeMatch = (value: unknown, type: AgentParameterType): boolean => {
  if (type === "string") return typeof value === "string";
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  if (type === "boolean") return typeof value === "boolean";
  if (type === "array") return Array.isArray(value);
  if (type === "object") return typeof value === "object" && value !== null && !Array.isArray(value);
  return false;
};

export class AgentPlanningService {
  private provider: AgentPlannerProvider;

  private logger: LoggerLike;

  private timeoutMs: number;

  private promptService: AgentPlanningPromptService;

  constructor(
    provider: AgentPlannerProvider,
    logger: LoggerLike = console,
    promptService: AgentPlanningPromptService = new AgentPlanningPromptService(),
  ) {
    this.provider = provider;
    this.logger = logger;
    this.promptService = promptService;
    this.timeoutMs = Number(process.env.AGENT_PLANNER_TIMEOUT_MS || 12000);
  }

  async plan(input: unknown): Promise<AgentPlanResponse> {
    const parsedRequest = agentPlanRequestSchema.safeParse(input);
    if (!parsedRequest.success) {
      throw new AgentPlanningValidationError(parsedRequest.error.message);
    }

    const request = parsedRequest.data;
    if (request.actions.length === 0) {
      return { summary: AGENT_PLAN_FALLBACK_SUMMARY, calls: [] };
    }

    const rawText = await this.requestPlanFromProvider(request);
    const modelOutput = parsePlannerModelOutput(rawText);

    if (!modelOutput) {
      this.logger.warn(JSON.stringify({ event: "agent_plan_parse_failed", reason: "invalid_json_payload", rawText }));
      return { summary: AGENT_PLAN_FALLBACK_SUMMARY, calls: [] };
    }

    return this.normalizeOutput(request, modelOutput.summary, modelOutput.calls);
  }

  private async requestPlanFromProvider(request: AgentPlanRequest): Promise<string> {
    try {
      const response = await this.provider.plan({
        systemPrompt: this.promptService.buildSystemPrompt(),
        userPrompt: this.promptService.buildUserPrompt(request),
        timeoutMs: this.timeoutMs,
      });

      this.logger.info(
        JSON.stringify({
          event: "agent_plan_provider_response",
          provider: response.provider,
          model: response.model,
          textLength: response.text.length,
        }),
      );

      return response.text;
    } catch (error: any) {
      this.logger.error(JSON.stringify({ event: "agent_plan_provider_error", message: error?.message || "Unknown provider error" }));
      throw new AgentPlanningProviderError(error?.message || "Failed to get plan from LLM provider");
    }
  }

  private normalizeOutput(
    request: AgentPlanRequest,
    summary: string,
    calls: Array<{ name?: string; arguments?: Record<string, unknown> }>,
  ): AgentPlanResponse {
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
        const normalizedArgs: Record<string, unknown> = {};

        for (const parameter of action.parameters || []) {
          const value = (originalArgs as Record<string, unknown>)[parameter.name];

          if (value === undefined) {
            if (parameter.required) {
              this.logger.warn(
                JSON.stringify({
                  event: "agent_plan_missing_required_argument",
                  actionName: call.name,
                  parameter: parameter.name,
                }),
              );
              return null;
            }
            continue;
          }

          if (!isParameterTypeMatch(value, parameter.type)) {
            this.logger.warn(
              JSON.stringify({
                event: "agent_plan_invalid_argument_type",
                actionName: call.name,
                parameter: parameter.name,
                expectedType: parameter.type,
              }),
            );
            return null;
          }

          if (parameter.enum && parameter.enum.length > 0 && !parameter.enum.includes(value as any)) {
            this.logger.warn(
              JSON.stringify({
                event: "agent_plan_invalid_argument_enum",
                actionName: call.name,
                parameter: parameter.name,
              }),
            );
            return null;
          }

          normalizedArgs[parameter.name] = value;
        }

        return { name: call.name, arguments: normalizedArgs };
      })
      .filter((value): value is { name: string; arguments: Record<string, unknown> } => value !== null);

    if (validCalls.length === 0) {
      return { summary: AGENT_PLAN_FALLBACK_SUMMARY, calls: [] };
    }

    return {
      summary: summary.trim() || "Planned frontend action calls.",
      calls: validCalls,
    };
  }
}
