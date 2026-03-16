import { Request, Response } from "express";
import { AgentPlanningService } from "../application/agentPlanningService";
import { AgentPlanningProviderError, AgentPlanningValidationError } from "../application/errors";

export const createPlanAgentActionsHandler = (service: AgentPlanningService) => {
  return async (req: Request, res: Response) => {
    try {
      const result = await service.plan(req.body || {});
      res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof AgentPlanningValidationError) {
        res.status(error.status).json({ message: error.message, code: error.code });
        return;
      }

      if (error instanceof AgentPlanningProviderError) {
        res.status(error.status).json({ message: error.message, code: error.code });
        return;
      }

      console.error(
        JSON.stringify({
          event: "agent_plan_unhandled_error",
          message: error?.message || "Unknown error",
        }),
      );

      res.status(500).json({ message: "Internal server error", code: "agent_plan_internal_error" });
    }
  };
};
