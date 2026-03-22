require("ts-node/register/transpile-only");

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  AgentPlanningV2Service,
} = require("../src/agents-ms/application/AgentPlanningV2Service");

class FakeProvider {
  constructor(text) {
    this.text = text;
    this.calls = 0;
  }

  async plan() {
    this.calls += 1;
    return {
      provider: "fake",
      model: "fake-model",
      text: this.text,
    };
  }
}

class InMemoryCacheRepository {
  constructor() {
    this.store = new Map();
  }

  async findByKey(key) {
    return this.store.get(key) || null;
  }

  async upsert(entry) {
    this.store.set(entry.key, entry);
  }

  async deleteMany(filter) {
    if (filter.all) {
      const size = this.store.size;
      this.store.clear();
      return size;
    }

    let deleted = 0;
    for (const [key, entry] of this.store.entries()) {
      if (filter.catalogVersion && entry.catalogVersion !== filter.catalogVersion) continue;
      if (filter.promptNormalized && entry.promptNormalized !== filter.promptNormalized) continue;
      this.store.delete(key);
      deleted += 1;
    }
    return deleted;
  }
}

class InMemoryCatalogRepository {
  constructor() {
    this.store = new Map();
  }

  async findByVersion(version) {
    return this.store.get(version) || null;
  }

  async upsert(catalog) {
    this.store.set(catalog.version, catalog);
  }
}

const actions = [
  {
    name: "navigation.go_to",
    description: "Navigate to route",
    parameters: [
      {
        name: "path",
        type: "string",
        description: "Target path",
        required: true,
      },
    ],
    returns: [],
    tags: ["navigation"],
  },
];

const navigationCatalog = {
  version: "nav-v1",
  locale: "es",
  entries: [
    {
      route: "/videos/subpages/dashboard",
      actionName: "navigation.go_to",
      title: "Videos Dashboard",
      section: "videos",
      page: "dashboard",
      aliases: ["videos", "dashboard de videos"],
      breadcrumbs: ["videos", "dashboard"],
      parents: ["/videos"],
      intentTags: ["videos"],
      isLanding: false,
      popularity: 10,
    },
    {
      route: "/videos/subpages/streaming/recording",
      actionName: "navigation.go_to",
      title: "Recording",
      section: "videos",
      page: "streaming",
      subpage: "recording",
      aliases: ["grabaciones", "grabacion", "recording", "recordings"],
      breadcrumbs: ["videos", "streaming", "recording"],
      parents: ["/videos", "/videos/subpages/streaming"],
      intentTags: ["streaming", "recording"],
      isLanding: false,
      popularity: 80,
    },
    {
      route: "/videos/subpages/streaming/timeline",
      actionName: "navigation.go_to",
      title: "Timeline",
      section: "videos",
      page: "streaming",
      subpage: "timeline",
      aliases: ["timeline", "streaming timeline"],
      breadcrumbs: ["videos", "streaming", "timeline"],
      parents: ["/videos", "/videos/subpages/streaming"],
      intentTags: ["streaming", "timeline"],
      isLanding: false,
      popularity: 70,
    },
    {
      route: "/scouting/subpages/library",
      actionName: "navigation.go_to",
      title: "Library",
      section: "scouting",
      page: "library",
      aliases: ["scouting library", "library", "libreria scouting"],
      breadcrumbs: ["scouting", "library"],
      parents: ["/scouting"],
      intentTags: ["scouting", "library"],
      isLanding: false,
      popularity: 65,
    },
    {
      route: "/tournaments",
      actionName: "navigation.go_to",
      title: "Tournaments",
      section: "tournaments",
      aliases: ["torneos", "torneo", "tournaments"],
      breadcrumbs: ["tournaments"],
      parents: [],
      intentTags: ["tournaments"],
      isLanding: true,
      popularity: 90,
    },
  ],
};

test("v2 resolves recordings deterministically without calling provider", async () => {
  const provider = new FakeProvider(JSON.stringify({ summary: "unused", calls: [] }));
  const service = new AgentPlanningV2Service(
    provider,
    new InMemoryCacheRepository(),
    new InMemoryCatalogRepository(),
  );

  const result = await service.plan({
    prompt: "llévame a grabaciones",
    currentPath: "/videos",
    actions,
    locale: "es",
    navigationCatalogVersion: navigationCatalog.version,
    navigationCatalog,
  });

  assert.equal(provider.calls, 0);
  assert.equal(result.calls[0].name, "navigation.go_to");
  assert.equal(result.calls[0].arguments.path, "/videos/subpages/streaming/recording");
  assert.equal(result.meta.plannerMode, "deterministic");
});

test("v2 reuses stored catalog by version and returns cache hit on repeated prompt", async () => {
  const provider = new FakeProvider(
    JSON.stringify({
      summary: "Navigate",
      calls: [{ name: "navigation.go_to", arguments: { path: "/tournaments" } }],
    }),
  );
  const cacheRepository = new InMemoryCacheRepository();
  const catalogRepository = new InMemoryCatalogRepository();
  const service = new AgentPlanningV2Service(provider, cacheRepository, catalogRepository);

  const first = await service.plan({
    prompt: "abre torneos",
    currentPath: "/fields",
    actions,
    locale: "es",
    navigationCatalogVersion: navigationCatalog.version,
    navigationCatalog,
  });

  const second = await service.plan({
    prompt: "abre torneos",
    currentPath: "/fields",
    actions,
    locale: "es",
    navigationCatalogVersion: navigationCatalog.version,
  });

  assert.equal(first.calls[0].arguments.path, "/tournaments");
  assert.equal(second.calls[0].arguments.path, "/tournaments");
  assert.equal(second.meta.plannerMode, "cache_hit");
  assert.equal(provider.calls, 0);
});

test("v2 caches llm responses globally for repeated prompts", async () => {
  const provider = new FakeProvider(
    JSON.stringify({
      summary: "Open timeline",
      calls: [{ name: "navigation.go_to", arguments: { path: "/videos/subpages/streaming/timeline" } }],
    }),
  );
  const service = new AgentPlanningV2Service(
    provider,
    new InMemoryCacheRepository(),
    new InMemoryCatalogRepository(),
  );

  const first = await service.plan({
    prompt: "open the streaming workspace for me",
    currentPath: "/videos",
    actions,
    locale: "en",
    navigationCatalogVersion: navigationCatalog.version,
    navigationCatalog,
  });

  const second = await service.plan({
    prompt: "open the streaming workspace for me",
    currentPath: "/videos",
    actions,
    locale: "en",
    navigationCatalogVersion: navigationCatalog.version,
  });

  assert.equal(first.calls[0].arguments.path, "/videos/subpages/streaming/timeline");
  assert.equal(second.calls[0].arguments.path, "/videos/subpages/streaming/timeline");
  assert.equal(provider.calls, 1);
  assert.equal(second.meta.plannerMode, "cache_hit");
});
