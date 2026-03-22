import { Request, Response } from "express";
import { AgentPlanningService } from "../application/AgentPlanningService";
import { AgentPlanningV2Service } from "../application/AgentPlanningV2Service";
import {
  AgentPlanningProviderError,
  AgentPlanningServiceError,
  AgentPlanningValidationError,
} from "../application/errors";
import { cacheInvalidateSchema, cacheRefreshSchema, navigationCatalogUpsertSchema } from "../domain/contracts";
import { CacheRefreshDto } from "../domain/types";

const ensureAdmin = (req: Request) => {
  const role = String((req as any).user?.role || "").toLowerCase();
  return role === "admin";
};

const handleKnownError = (res: Response, error: any) => {
  if (error instanceof AgentPlanningValidationError) {
    res.status(error.status).json({ message: error.message, code: error.code });
    return true;
  }

  if (error instanceof AgentPlanningProviderError) {
    res.status(error.status).json({ message: error.message, code: error.code });
    return true;
  }

  if (error instanceof AgentPlanningServiceError) {
    res.status(error.status).json({ message: error.message, code: error.code });
    return true;
  }

  return false;
};

export const createPlanAgentActionsHandler = (service: AgentPlanningService) => {
  return async (req: Request, res: Response) => {
    try {
      const result = await service.plan(req.body || {});
      res.status(200).json(result);
    } catch (error: any) {
      if (handleKnownError(res, error)) return;

      console.error(JSON.stringify({ event: "agent_plan_unhandled_error", message: error?.message || "Unknown error" }));
      res.status(500).json({ message: "Internal server error", code: "agent_plan_internal_error" });
    }
  };
};

export const createPlanAgentActionsV2Handler = (service: AgentPlanningV2Service) => {
  return async (req: Request, res: Response) => {
    try {
      const result = await service.plan(req.body || {});
      res.status(200).json(result);
    } catch (error: any) {
      if (handleKnownError(res, error)) return;

      console.error(JSON.stringify({ event: "agent_plan_v2_unhandled_error", message: error?.message || "Unknown error" }));
      res.status(500).json({ message: "Internal server error", code: "agent_plan_internal_error" });
    }
  };
};

export const createUpsertNavigationCatalogHandler = (service: AgentPlanningV2Service) => {
  return async (req: Request, res: Response) => {
    try {
      if (!ensureAdmin(req)) {
        res.status(403).json({ message: "Admin role is required", code: "forbidden" });
        return;
      }

      const parsed = navigationCatalogUpsertSchema.safeParse(req.body || {});
      if (!parsed.success) {
        throw new AgentPlanningValidationError(parsed.error.message);
      }

      if (req.params.version !== parsed.data.navigationCatalog.version) {
        throw new AgentPlanningValidationError("Route version must match navigationCatalog.version");
      }

      const result = await service.upsertNavigationCatalog(parsed.data.navigationCatalog);
      res.status(200).json({ message: "Navigation catalog stored", ...result });
    } catch (error: any) {
      if (handleKnownError(res, error)) return;

      console.error(JSON.stringify({ event: "agent_navigation_catalog_upsert_error", message: error?.message || "Unknown error" }));
      res.status(500).json({ message: "Internal server error", code: "agent_plan_internal_error" });
    }
  };
};

export const createInvalidateCacheHandler = (service: AgentPlanningV2Service) => {
  return async (req: Request, res: Response) => {
    try {
      if (!ensureAdmin(req)) {
        res.status(403).json({ message: "Admin role is required", code: "forbidden" });
        return;
      }

      const parsed = cacheInvalidateSchema.safeParse(req.body || {});
      if (!parsed.success) {
        throw new AgentPlanningValidationError(parsed.error.message);
      }

      const result = await service.invalidateCache(parsed.data);
      res.status(200).json({ message: "Cache invalidated", ...result });
    } catch (error: any) {
      if (handleKnownError(res, error)) return;

      console.error(JSON.stringify({ event: "agent_cache_invalidate_error", message: error?.message || "Unknown error" }));
      res.status(500).json({ message: "Internal server error", code: "agent_plan_internal_error" });
    }
  };
};

export const createRefreshCacheHandler = (service: AgentPlanningV2Service) => {
  return async (req: Request, res: Response) => {
    try {
      if (!ensureAdmin(req)) {
        res.status(403).json({ message: "Admin role is required", code: "forbidden" });
        return;
      }

      const parsed = cacheRefreshSchema.safeParse(req.body || {});
      if (!parsed.success) {
        throw new AgentPlanningValidationError(parsed.error.message);
      }

      const payload: CacheRefreshDto = {
        requests: parsed.data.requests,
        invalidateFirst: parsed.data.invalidateFirst,
      };
      const result = await service.refreshCache(payload);
      res.status(200).json({ message: "Cache refreshed", ...result });
    } catch (error: any) {
      if (handleKnownError(res, error)) return;

      console.error(JSON.stringify({ event: "agent_cache_refresh_error", message: error?.message || "Unknown error" }));
      res.status(500).json({ message: "Internal server error", code: "agent_plan_internal_error" });
    }
  };
};
