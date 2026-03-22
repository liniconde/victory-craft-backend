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
exports.createRefreshCacheHandler = exports.createInvalidateCacheHandler = exports.createUpsertNavigationCatalogHandler = exports.createPlanAgentActionsV2Handler = exports.createPlanAgentActionsHandler = void 0;
const errors_1 = require("../application/errors");
const contracts_1 = require("../domain/contracts");
const ensureAdmin = (req) => {
    var _a;
    const role = String(((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) || "").toLowerCase();
    return role === "admin";
};
const handleKnownError = (res, error) => {
    if (error instanceof errors_1.AgentPlanningValidationError) {
        res.status(error.status).json({ message: error.message, code: error.code });
        return true;
    }
    if (error instanceof errors_1.AgentPlanningProviderError) {
        res.status(error.status).json({ message: error.message, code: error.code });
        return true;
    }
    if (error instanceof errors_1.AgentPlanningServiceError) {
        res.status(error.status).json({ message: error.message, code: error.code });
        return true;
    }
    return false;
};
const createPlanAgentActionsHandler = (service) => {
    return (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield service.plan(req.body || {});
            res.status(200).json(result);
        }
        catch (error) {
            if (handleKnownError(res, error))
                return;
            console.error(JSON.stringify({ event: "agent_plan_unhandled_error", message: (error === null || error === void 0 ? void 0 : error.message) || "Unknown error" }));
            res.status(500).json({ message: "Internal server error", code: "agent_plan_internal_error" });
        }
    });
};
exports.createPlanAgentActionsHandler = createPlanAgentActionsHandler;
const createPlanAgentActionsV2Handler = (service) => {
    return (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield service.plan(req.body || {});
            res.status(200).json(result);
        }
        catch (error) {
            if (handleKnownError(res, error))
                return;
            console.error(JSON.stringify({ event: "agent_plan_v2_unhandled_error", message: (error === null || error === void 0 ? void 0 : error.message) || "Unknown error" }));
            res.status(500).json({ message: "Internal server error", code: "agent_plan_internal_error" });
        }
    });
};
exports.createPlanAgentActionsV2Handler = createPlanAgentActionsV2Handler;
const createUpsertNavigationCatalogHandler = (service) => {
    return (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!ensureAdmin(req)) {
                res.status(403).json({ message: "Admin role is required", code: "forbidden" });
                return;
            }
            const parsed = contracts_1.navigationCatalogUpsertSchema.safeParse(req.body || {});
            if (!parsed.success) {
                throw new errors_1.AgentPlanningValidationError(parsed.error.message);
            }
            if (req.params.version !== parsed.data.navigationCatalog.version) {
                throw new errors_1.AgentPlanningValidationError("Route version must match navigationCatalog.version");
            }
            const result = yield service.upsertNavigationCatalog(parsed.data.navigationCatalog);
            res.status(200).json(Object.assign({ message: "Navigation catalog stored" }, result));
        }
        catch (error) {
            if (handleKnownError(res, error))
                return;
            console.error(JSON.stringify({ event: "agent_navigation_catalog_upsert_error", message: (error === null || error === void 0 ? void 0 : error.message) || "Unknown error" }));
            res.status(500).json({ message: "Internal server error", code: "agent_plan_internal_error" });
        }
    });
};
exports.createUpsertNavigationCatalogHandler = createUpsertNavigationCatalogHandler;
const createInvalidateCacheHandler = (service) => {
    return (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!ensureAdmin(req)) {
                res.status(403).json({ message: "Admin role is required", code: "forbidden" });
                return;
            }
            const parsed = contracts_1.cacheInvalidateSchema.safeParse(req.body || {});
            if (!parsed.success) {
                throw new errors_1.AgentPlanningValidationError(parsed.error.message);
            }
            const result = yield service.invalidateCache(parsed.data);
            res.status(200).json(Object.assign({ message: "Cache invalidated" }, result));
        }
        catch (error) {
            if (handleKnownError(res, error))
                return;
            console.error(JSON.stringify({ event: "agent_cache_invalidate_error", message: (error === null || error === void 0 ? void 0 : error.message) || "Unknown error" }));
            res.status(500).json({ message: "Internal server error", code: "agent_plan_internal_error" });
        }
    });
};
exports.createInvalidateCacheHandler = createInvalidateCacheHandler;
const createRefreshCacheHandler = (service) => {
    return (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!ensureAdmin(req)) {
                res.status(403).json({ message: "Admin role is required", code: "forbidden" });
                return;
            }
            const parsed = contracts_1.cacheRefreshSchema.safeParse(req.body || {});
            if (!parsed.success) {
                throw new errors_1.AgentPlanningValidationError(parsed.error.message);
            }
            const payload = {
                requests: parsed.data.requests,
                invalidateFirst: parsed.data.invalidateFirst,
            };
            const result = yield service.refreshCache(payload);
            res.status(200).json(Object.assign({ message: "Cache refreshed" }, result));
        }
        catch (error) {
            if (handleKnownError(res, error))
                return;
            console.error(JSON.stringify({ event: "agent_cache_refresh_error", message: (error === null || error === void 0 ? void 0 : error.message) || "Unknown error" }));
            res.status(500).json({ message: "Internal server error", code: "agent_plan_internal_error" });
        }
    });
};
exports.createRefreshCacheHandler = createRefreshCacheHandler;
//# sourceMappingURL=agentController.js.map