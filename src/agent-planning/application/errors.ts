export class AgentPlanningValidationError extends Error {
  status = 400;
  code = "agent_plan_validation_error";

  constructor(message: string) {
    super(message);
    this.name = "AgentPlanningValidationError";
  }
}

export class AgentPlanningProviderError extends Error {
  status = 502;
  code = "agent_plan_provider_error";

  constructor(message: string) {
    super(message);
    this.name = "AgentPlanningProviderError";
  }
}
