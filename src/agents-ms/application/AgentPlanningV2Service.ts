import crypto from "crypto";
import { AgentPlannerProvider } from "../domain/AgentPlannerProvider";
import {
  AGENT_PLAN_FALLBACK_SUMMARY,
  AgentPlanningPromptService,
} from "../domain/AgentPlanningPromptService";
import { agentPlanV2RequestSchema, navigationCatalogSchema } from "../domain/contracts";
import { AgentPlanCacheRepository } from "../domain/ports/AgentPlanCacheRepository";
import { NavigationCatalogRepository } from "../domain/ports/NavigationCatalogRepository";
import {
  AgentActionDefinition,
  AgentParameterType,
  AgentPlanV2Request,
  AgentPlanV2Response,
  CacheRefreshDto,
  NavigationCatalog,
  NavigationCatalogEntry,
  PlannerModelOutput,
  PlanCacheEntry,
} from "../domain/types";
import {
  AgentPlanningProviderError,
  AgentPlanningServiceError,
  AgentPlanningValidationError,
} from "./errors";
import { parsePlannerModelOutput } from "./plannerOutputParser";

type LoggerLike = Pick<typeof console, "info" | "warn" | "error">;

type RankedCandidate = {
  entry: NavigationCatalogEntry;
  score: number;
};

const GENERIC_SEGMENTS = new Set(["dashboard", "home", "index", "main"]);
const PROMPT_STOP_WORDS = new Set([
  "a",
  "abre",
  "abrir",
  "al",
  "de",
  "del",
  "el",
  "go",
  "ir",
  "la",
  "llename",
  "llevame",
  "llévame",
  "me",
  "page",
  "pagina",
  "página",
  "quiero",
  "to",
  "the",
]);
const TOKEN_SYNONYMS: Record<string, string> = {
  grabacion: "recording",
  grabaciones: "recording",
  recordings: "recording",
  recording: "recording",
  torneos: "tournaments",
  torneo: "tournaments",
  tournament: "tournaments",
  tournaments: "tournaments",
  library: "library",
  libreria: "library",
  librería: "library",
  scouting: "scouting",
  timeline: "timeline",
  streaming: "streaming",
};

const removeDiacritics = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const normalizeText = (value: string) =>
  removeDiacritics(value)
    .toLowerCase()
    .replace(/[_/.-]+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeToken = (token: string) => {
  const normalized = normalizeText(token);
  if (!normalized) return "";
  if (TOKEN_SYNONYMS[normalized]) return TOKEN_SYNONYMS[normalized];
  if (normalized.endsWith("s") && normalized.length > 3) {
    const singular = normalized.slice(0, -1);
    if (TOKEN_SYNONYMS[singular]) return TOKEN_SYNONYMS[singular];
    return singular;
  }
  return normalized;
};

const tokenize = (value: string) =>
  normalizeText(value)
    .split(" ")
    .map(normalizeToken)
    .filter((token) => token && !PROMPT_STOP_WORDS.has(token));

const dedupe = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const stableHash = (value: unknown) => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

const getCurrentPathScope = (path: string) => {
  const firstSegment = path.split("/").filter(Boolean)[0];
  return firstSegment || "root";
};

const isParameterTypeMatch = (value: unknown, type: AgentParameterType): boolean => {
  if (type === "string") return typeof value === "string";
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  if (type === "boolean") return typeof value === "boolean";
  if (type === "array") return Array.isArray(value);
  if (type === "object") return typeof value === "object" && value !== null && !Array.isArray(value);
  return false;
};

const getSharedPrefixDepth = (leftPath: string, rightPath: string) => {
  const leftSegments = leftPath.split("/").filter(Boolean);
  const rightSegments = rightPath.split("/").filter(Boolean);
  let depth = 0;
  while (depth < leftSegments.length && depth < rightSegments.length && leftSegments[depth] === rightSegments[depth]) {
    depth += 1;
  }
  return depth;
};

const getEntrySearchTexts = (entry: NavigationCatalogEntry) =>
  dedupe([
    entry.title,
    ...(entry.aliases || []),
    ...(entry.breadcrumbs || []),
    ...(entry.intentTags || []),
    entry.section || "",
    entry.page || "",
    entry.subpage || "",
    entry.route,
  ]);

const getEntryTokens = (entry: NavigationCatalogEntry) => dedupe(getEntrySearchTexts(entry).flatMap((value) => tokenize(value)));

const getExactTexts = (entry: NavigationCatalogEntry) => new Set(getEntrySearchTexts(entry).map(normalizeText).filter(Boolean));

const isLikelyNavigationPrompt = (request: AgentPlanV2Request) => {
  const hasNavigationAction = request.actions.some((action) => action.name === "navigation.go_to");
  if (!hasNavigationAction) return false;

  const normalizedPrompt = normalizeText(request.prompt);
  if (!normalizedPrompt) return false;

  const keywords = ["go to", "abre", "abrir", "ir", "llevame", "llévame", "open", "navigate", "quiero ir"];
  return keywords.some((keyword) => normalizedPrompt.includes(normalizeText(keyword))) || tokenize(request.prompt).length > 0;
};

const buildCacheKey = (request: AgentPlanV2Request, normalizedPrompt: string) => {
  const currentPathScope = getCurrentPathScope(request.currentPath);
  const actionsFingerprint = stableHash(
    request.actions.map((action) => ({
      name: action.name,
      parameters: (action.parameters || []).map((parameter) => ({
        name: parameter.name,
        type: parameter.type,
        required: !!parameter.required,
      })),
    })),
  );

  return {
    cacheKey: stableHash({
      prompt: normalizedPrompt,
      catalogVersion: request.navigationCatalogVersion,
      locale: request.locale || "",
      currentPathScope,
      actionsFingerprint,
    }),
    actionsFingerprint,
  };
};

export class AgentPlanningV2Service {
  private provider: AgentPlannerProvider;

  private cacheRepository: AgentPlanCacheRepository;

  private catalogRepository: NavigationCatalogRepository;

  private logger: LoggerLike;

  private timeoutMs: number;

  private promptService: AgentPlanningPromptService;

  constructor(
    provider: AgentPlannerProvider,
    cacheRepository: AgentPlanCacheRepository,
    catalogRepository: NavigationCatalogRepository,
    logger: LoggerLike = console,
    promptService: AgentPlanningPromptService = new AgentPlanningPromptService(),
  ) {
    this.provider = provider;
    this.cacheRepository = cacheRepository;
    this.catalogRepository = catalogRepository;
    this.logger = logger;
    this.promptService = promptService;
    this.timeoutMs = Number(process.env.AGENT_PLANNER_TIMEOUT_MS || 12000);
  }

  async plan(input: unknown): Promise<AgentPlanV2Response> {
    const parsed = agentPlanV2RequestSchema.safeParse(input);
    if (!parsed.success) {
      throw new AgentPlanningValidationError(parsed.error.message);
    }

    const request = parsed.data;
    const traceId = crypto.randomUUID();
    const normalizedPrompt = normalizeText(request.prompt);
    const { cacheKey, actionsFingerprint } = buildCacheKey(request, normalizedPrompt);

    const catalog = await this.loadCatalog(request);
    const cached = await this.cacheRepository.findByKey(cacheKey);
    if (cached) {
      this.logger.info(JSON.stringify({ event: "agent_plan_v2_cache_hit", traceId, cacheKey }));
      return {
        ...cached.response,
        meta: {
          ...cached.response.meta,
          traceId,
          cacheKey,
          cacheHit: true,
          plannerMode: "cache_hit",
        },
      };
    }

    if (request.actions.length === 0) {
      return this.buildFallbackResponse(traceId, request.navigationCatalogVersion, cacheKey, []);
    }

    if (isLikelyNavigationPrompt(request) && catalog.entries.length > 0) {
      const ranked = this.rankNavigationCandidates(request, catalog);
      if (ranked[0] && this.isDeterministicWinner(ranked)) {
        const response = this.buildDeterministicResponse(traceId, request.navigationCatalogVersion, cacheKey, ranked);
        await this.persistCache({
          key: cacheKey,
          catalogVersion: request.navigationCatalogVersion,
          promptNormalized: normalizedPrompt,
          currentPath: request.currentPath,
          locale: request.locale,
          actionsFingerprint,
          response,
          source: "deterministic",
          confidence: response.meta.confidence,
        });
        return response;
      }

      const llmResponse = await this.planWithLlm(request, catalog, traceId, cacheKey, ranked);
      await this.persistCache({
        key: cacheKey,
        catalogVersion: request.navigationCatalogVersion,
        promptNormalized: normalizedPrompt,
        currentPath: request.currentPath,
        locale: request.locale,
        actionsFingerprint,
        response: llmResponse,
        source: "llm",
        confidence: llmResponse.meta.confidence,
      });
      return llmResponse;
    }

    const llmResponse = await this.planWithLlm(request, catalog, traceId, cacheKey, []);
    await this.persistCache({
      key: cacheKey,
      catalogVersion: request.navigationCatalogVersion,
      promptNormalized: normalizedPrompt,
      currentPath: request.currentPath,
      locale: request.locale,
      actionsFingerprint,
      response: llmResponse,
      source: "llm",
      confidence: llmResponse.meta.confidence,
    });
    return llmResponse;
  }

  async upsertNavigationCatalog(input: unknown): Promise<{ version: string; entries: number; invalidatedCount: number }> {
    const parsed = navigationCatalogSchema.safeParse(input);
    if (!parsed.success) {
      throw new AgentPlanningValidationError(parsed.error.message);
    }

    await this.catalogRepository.upsert(parsed.data);
    const invalidatedCount = await this.cacheRepository.deleteMany({ catalogVersion: parsed.data.version });
    return { version: parsed.data.version, entries: parsed.data.entries.length, invalidatedCount };
  }

  async invalidateCache(input: { all?: boolean; catalogVersion?: string; prompt?: string }): Promise<{ deletedCount: number }> {
    const promptNormalized = input.prompt ? normalizeText(input.prompt) : undefined;
    const deletedCount = await this.cacheRepository.deleteMany({
      all: input.all,
      catalogVersion: input.catalogVersion,
      promptNormalized,
    });

    return { deletedCount };
  }

  async refreshCache(input: CacheRefreshDto) {
    const deletedCounts: number[] = [];
    if (input.invalidateFirst) {
      for (const request of input.requests) {
        const result = await this.invalidateCache({ catalogVersion: request.navigationCatalogVersion });
        deletedCounts.push(result.deletedCount);
      }
    }

    const results: Array<{ prompt: string; summary: string; plannerMode: string }> = [];
    for (const request of input.requests) {
      const response = await this.plan(request);
      results.push({
        prompt: request.prompt,
        summary: response.summary,
        plannerMode: response.meta.plannerMode,
      });
    }

    return {
      invalidatedCount: deletedCounts.reduce((acc, value) => acc + value, 0),
      results,
    };
  }

  private async loadCatalog(request: AgentPlanV2Request): Promise<NavigationCatalog> {
    if (request.navigationCatalog) {
      if (request.navigationCatalog.version !== request.navigationCatalogVersion) {
        throw new AgentPlanningValidationError("navigationCatalog.version must match navigationCatalogVersion");
      }

      await this.catalogRepository.upsert(request.navigationCatalog);
      return request.navigationCatalog;
    }

    const catalog = await this.catalogRepository.findByVersion(request.navigationCatalogVersion);
    if (!catalog) {
      throw new AgentPlanningServiceError(
        400,
        "agent_navigation_catalog_not_found",
        "navigationCatalog is required the first time a catalogVersion is used",
      );
    }
    return catalog;
  }

  private rankNavigationCandidates(request: AgentPlanV2Request, catalog: NavigationCatalog): RankedCandidate[] {
    const promptNormalized = normalizeText(request.prompt);
    const promptTokens = dedupe(tokenize(request.prompt));
    const currentPath = request.currentPath;

    const ranked = catalog.entries.map((entry) => {
      const entryTokens = getEntryTokens(entry);
      const exactTexts = getExactTexts(entry);
      const normalizedRoute = normalizeText(entry.route);

      const exactAliasHit = exactTexts.has(promptNormalized) ? 1 : 0;
      const titleHit = normalizeText(entry.title) === promptNormalized ? 1 : 0;
      const overlapCount = promptTokens.filter((token) => entryTokens.includes(token)).length;
      const overlapRatio = promptTokens.length ? overlapCount / promptTokens.length : 0;
      const allPromptTokensMatched = promptTokens.length > 0 && overlapCount === promptTokens.length ? 1 : 0;
      const sectionBoost =
        promptTokens.includes(normalizeToken(entry.section || "")) ||
        promptTokens.includes(normalizeToken(entry.page || "")) ||
        promptTokens.includes(normalizeToken(entry.subpage || ""))
          ? 0.15
          : 0;
      const routeSegmentDepth = entry.route.split("/").filter(Boolean).length;
      const specificityBoost = Math.min(routeSegmentDepth * 0.03, 0.15);
      const currentPathAffinity = Math.min(getSharedPrefixDepth(currentPath, entry.route) * 0.05, 0.2);
      const genericPenalty = normalizedRoute.split(" ").some((segment) => GENERIC_SEGMENTS.has(segment)) ? 0.28 : 0;
      const landingBoost = entry.isLanding ? 0.08 : 0;
      const popularityBoost = Math.min((entry.popularity || 0) / 100, 0.05);

      const score = Math.max(
        0,
        Math.min(
          1,
          exactAliasHit * 0.65 +
            titleHit * 0.25 +
            overlapRatio * 0.45 +
            allPromptTokensMatched * 0.18 +
            sectionBoost +
            specificityBoost +
            currentPathAffinity +
            landingBoost +
            popularityBoost -
            genericPenalty,
        ),
      );

      return { entry, score };
    });

    return ranked.sort((left, right) => right.score - left.score);
  }

  private isDeterministicWinner(ranked: RankedCandidate[]) {
    const first = ranked[0];
    const second = ranked[1];
    if (!first) return false;
    if (first.score >= 0.9) return true;
    return first.score >= 0.7 && (!second || first.score - second.score >= 0.15);
  }

  private buildDeterministicResponse(
    traceId: string,
    navigationCatalogVersion: string,
    cacheKey: string,
    ranked: RankedCandidate[],
  ): AgentPlanV2Response {
    const winner = ranked[0];
    return {
      summary: `Navigate to ${winner.entry.title}.`,
      calls: [
        {
          name: "navigation.go_to",
          arguments: { path: winner.entry.route },
        },
      ],
      meta: {
        plannerMode: "deterministic",
        confidence: winner.score,
        selectedRoute: winner.entry.route,
        navigationCatalogVersion,
        traceId,
        cacheKey,
        cacheHit: false,
        candidateRoutes: ranked.slice(0, 3).map((candidate) => ({
          route: candidate.entry.route,
          score: candidate.score,
        })),
      },
    };
  }

  private async planWithLlm(
    request: AgentPlanV2Request,
    catalog: NavigationCatalog,
    traceId: string,
    cacheKey: string,
    ranked: RankedCandidate[],
  ): Promise<AgentPlanV2Response> {
    const candidates = (ranked.length > 0 ? ranked.slice(0, 5).map((item) => item.entry) : catalog.entries.slice(0, 10));
    const rawText = await this.requestPlanFromProvider(request, candidates);
    const modelOutput = parsePlannerModelOutput(rawText);

    if (!modelOutput) {
      this.logger.warn(JSON.stringify({ event: "agent_plan_v2_parse_failed", traceId, rawText }));
      return this.buildFallbackResponse(traceId, request.navigationCatalogVersion, cacheKey, ranked);
    }

    return this.normalizeOutput(request, modelOutput, catalog, ranked, traceId, cacheKey);
  }

  private async requestPlanFromProvider(request: AgentPlanV2Request, candidates: NavigationCatalogEntry[]): Promise<string> {
    try {
      const response = await this.provider.plan({
        systemPrompt: this.promptService.buildSystemPrompt(),
        userPrompt: this.promptService.buildUserPromptV2(request, candidates),
        timeoutMs: this.timeoutMs,
      });

      this.logger.info(
        JSON.stringify({
          event: "agent_plan_v2_provider_response",
          provider: response.provider,
          model: response.model,
          textLength: response.text.length,
        }),
      );

      return response.text;
    } catch (error: any) {
      this.logger.error(JSON.stringify({ event: "agent_plan_v2_provider_error", message: error?.message || "Unknown provider error" }));
      throw new AgentPlanningProviderError(error?.message || "Failed to get plan from LLM provider");
    }
  }

  private normalizeOutput(
    request: AgentPlanV2Request,
    modelOutput: PlannerModelOutput,
    catalog: NavigationCatalog,
    ranked: RankedCandidate[],
    traceId: string,
    cacheKey: string,
  ): AgentPlanV2Response {
    const warnings: string[] = [];
    const actionMap = new Map(request.actions.map((action) => [action.name, action]));
    let plannerMode: AgentPlanV2Response["meta"]["plannerMode"] = "llm";
    let confidence = ranked[0]?.score || 0.5;
    let selectedRoute: string | undefined;

    const validCalls = modelOutput.calls
      .map((call) => {
        if (!call.name || typeof call.name !== "string") return null;
        const action = actionMap.get(call.name);
        if (!action) return null;

        const originalArgs = call.arguments || {};
        const normalizedArgs: Record<string, unknown> = {};

        for (const parameter of action.parameters || []) {
          const value = (originalArgs as Record<string, unknown>)[parameter.name];

          if (value === undefined) {
            if (parameter.required) return null;
            continue;
          }

          if (!isParameterTypeMatch(value, parameter.type)) return null;
          if (parameter.enum && parameter.enum.length > 0 && !parameter.enum.includes(value as any)) return null;

          normalizedArgs[parameter.name] = value;
        }

        if (call.name === "navigation.go_to") {
          const repaired = this.validateNavigationCall(normalizedArgs.path, catalog, ranked);
          if (!repaired.path) return null;
          normalizedArgs.path = repaired.path;
          selectedRoute = repaired.path;
          if (repaired.repaired) {
            plannerMode = "llm_repaired";
            confidence = Math.max(confidence, repaired.confidence);
            warnings.push(repaired.reason);
          }
        }

        return { name: call.name, arguments: normalizedArgs };
      })
      .filter((value): value is { name: string; arguments: Record<string, unknown> } => value !== null);

    if (validCalls.length === 0) {
      return this.buildFallbackResponse(traceId, request.navigationCatalogVersion, cacheKey, ranked);
    }

    return {
      summary: modelOutput.summary.trim() || "Planned frontend action calls.",
      calls: validCalls,
      meta: {
        plannerMode,
        confidence,
        selectedRoute,
        navigationCatalogVersion: request.navigationCatalogVersion,
        traceId,
        cacheKey,
        cacheHit: false,
        candidateRoutes: ranked.slice(0, 3).map((candidate) => ({
          route: candidate.entry.route,
          score: candidate.score,
        })),
        validationWarnings: warnings.length > 0 ? warnings : undefined,
      },
    };
  }

  private validateNavigationCall(
    rawPath: unknown,
    catalog: NavigationCatalog,
    ranked: RankedCandidate[],
  ): { path: string; repaired: boolean; confidence: number; reason: string } {
    const requestedPath = typeof rawPath === "string" ? rawPath : "";
    const routeExists = catalog.entries.some((entry) => entry.route === requestedPath);
    const winner = ranked[0];

    if (routeExists && requestedPath) {
      const requestedIsGeneric = requestedPath.split("/").some((segment) => GENERIC_SEGMENTS.has(segment));
      if (!requestedIsGeneric) {
        return { path: requestedPath, repaired: false, confidence: winner?.score || 0.65, reason: "" };
      }

      if (winner && winner.entry.route !== requestedPath && winner.score >= 0.7) {
        return {
          path: winner.entry.route,
          repaired: true,
          confidence: winner.score,
          reason: `Replaced generic navigation path ${requestedPath} with ${winner.entry.route}.`,
        };
      }

      return { path: requestedPath, repaired: false, confidence: winner?.score || 0.65, reason: "" };
    }

    if (winner) {
      return {
        path: winner.entry.route,
        repaired: true,
        confidence: winner.score,
        reason: requestedPath
          ? `Replaced unknown navigation path ${requestedPath} with ${winner.entry.route}.`
          : `Filled missing navigation path with ${winner.entry.route}.`,
      };
    }

    return { path: requestedPath, repaired: false, confidence: 0.2, reason: "" };
  }

  private buildFallbackResponse(
    traceId: string,
    navigationCatalogVersion: string,
    cacheKey: string,
    ranked: RankedCandidate[],
  ): AgentPlanV2Response {
    return {
      summary: AGENT_PLAN_FALLBACK_SUMMARY,
      calls: [],
      meta: {
        plannerMode: "fallback",
        confidence: 0,
        navigationCatalogVersion,
        traceId,
        cacheKey,
        cacheHit: false,
        candidateRoutes: ranked.slice(0, 3).map((candidate) => ({
          route: candidate.entry.route,
          score: candidate.score,
        })),
      },
    };
  }

  private async persistCache(entry: PlanCacheEntry) {
    await this.cacheRepository.upsert(entry);
  }
}
