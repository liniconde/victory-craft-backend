export class AgentPlanningValidationError extends Error {
  status = 400;
  code = "agent_plan_validation_error";
}

export class AgentPlanningProviderError extends Error {
  status = 502;
  code = "agent_plan_provider_error";
}

export class AgentPlanningServiceError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
