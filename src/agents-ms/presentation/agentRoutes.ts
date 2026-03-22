import express from "express";
import { requireAuth } from "../../middlewares/authMiddleware";
import { AgentPlanningService } from "../application/AgentPlanningService";
import { AgentPlanningV2Service } from "../application/AgentPlanningV2Service";
import { MongoAgentPlanCacheRepository } from "../infrastructure/repositories/MongoAgentPlanCacheRepository";
import { MongoNavigationCatalogRepository } from "../infrastructure/repositories/MongoNavigationCatalogRepository";
import { createAgentPlannerProvider } from "../infrastructure/providers/createAgentPlannerProvider";
import {
  createInvalidateCacheHandler,
  createPlanAgentActionsHandler,
  createPlanAgentActionsV2Handler,
  createRefreshCacheHandler,
  createUpsertNavigationCatalogHandler,
} from "./agentController";

const router = express.Router();

let planV1Handler: ((req: express.Request, res: express.Response) => Promise<void>) | null = null;
let planV2Handler: ((req: express.Request, res: express.Response) => Promise<void>) | null = null;
let upsertCatalogHandler: ((req: express.Request, res: express.Response) => Promise<void>) | null = null;
let invalidateCacheHandler: ((req: express.Request, res: express.Response) => Promise<void>) | null = null;
let refreshCacheHandler: ((req: express.Request, res: express.Response) => Promise<void>) | null = null;
let bootstrapError: Error | null = null;

const bootstrap = () => {
  if (planV1Handler && planV2Handler && upsertCatalogHandler && invalidateCacheHandler && refreshCacheHandler) {
    return;
  }
  if (bootstrapError) {
    throw bootstrapError;
  }

  try {
    const provider = createAgentPlannerProvider();
    const cacheRepository = new MongoAgentPlanCacheRepository();
    const catalogRepository = new MongoNavigationCatalogRepository();
    const v1Service = new AgentPlanningService(provider);
    const v2Service = new AgentPlanningV2Service(provider, cacheRepository, catalogRepository);

    planV1Handler = createPlanAgentActionsHandler(v1Service);
    planV2Handler = createPlanAgentActionsV2Handler(v2Service);
    upsertCatalogHandler = createUpsertNavigationCatalogHandler(v2Service);
    invalidateCacheHandler = createInvalidateCacheHandler(v2Service);
    refreshCacheHandler = createRefreshCacheHandler(v2Service);
  } catch (error: any) {
    bootstrapError = error;
    throw error;
  }
};

const runHandler = async (
  req: express.Request,
  res: express.Response,
  getHandler: () => ((req: express.Request, res: express.Response) => Promise<void>) | null,
) => {
  try {
    bootstrap();
    const handler = getHandler();
    if (!handler) {
      res.status(500).json({
        message: "Agent planner is not properly configured",
        code: "agent_plan_bootstrap_error",
      });
      return;
    }
    await handler(req, res);
  } catch (error: any) {
    console.error(JSON.stringify({ event: "agent_plan_bootstrap_error", message: error?.message || "Unknown bootstrap error" }));
    res.status(500).json({
      message: "Agent planner is not properly configured",
      code: "agent_plan_bootstrap_error",
    });
  }
};

router.post("/plan", async (req, res) => runHandler(req, res, () => planV1Handler));
router.post("/v2/plan", async (req, res) => runHandler(req, res, () => planV2Handler));
router.put("/v2/navigation-catalogs/:version", requireAuth, async (req, res) => runHandler(req, res, () => upsertCatalogHandler));
router.post("/v2/cache/invalidate", requireAuth, async (req, res) => runHandler(req, res, () => invalidateCacheHandler));
router.post("/v2/cache/refresh", requireAuth, async (req, res) => runHandler(req, res, () => refreshCacheHandler));

export default router;
