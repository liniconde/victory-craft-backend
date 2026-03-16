import express from "express";
import { AgentPlanningService } from "../application/agentPlanningService";
import { createAgentPlannerProvider } from "../infrastructure/providers/createAgentPlannerProvider";
import { createPlanAgentActionsHandler } from "./agentPlanningController";

const router = express.Router();

let routeHandler:
  | ((req: express.Request, res: express.Response) => Promise<void>)
  | null = null;
let bootstrapError: Error | null = null;

const getRouteHandler = () => {
  if (routeHandler) {
    return routeHandler;
  }
  if (bootstrapError) {
    return null;
  }

  try {
    const provider = createAgentPlannerProvider();
    const service = new AgentPlanningService(provider);
    routeHandler = createPlanAgentActionsHandler(service);
    return routeHandler;
  } catch (error: any) {
    bootstrapError = error;
    return null;
  }
};

router.post("/plan", async (req, res) => {
  const handler = getRouteHandler();
  if (!handler) {
    console.error(
      JSON.stringify({
        event: "agent_plan_bootstrap_error",
        message: bootstrapError?.message || "Unknown bootstrap error",
      }),
    );
    res.status(500).json({
      message: "Agent planner is not properly configured",
      code: "agent_plan_bootstrap_error",
    });
    return;
  }

  await handler(req, res);
});

export default router;
