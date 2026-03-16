require("ts-node/register/transpile-only");

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  AgentPlanningService,
} = require("../src/agent-planning/application/agentPlanningService");
const {
  AgentPlanningValidationError,
} = require("../src/agent-planning/application/errors");

class FakeProvider {
  constructor(text) {
    this.text = text;
  }

  async plan() {
    return {
      provider: "fake",
      model: "fake-model",
      text: this.text,
    };
  }
}

const validRequest = {
  prompt: "go to tournaments",
  currentPath: "/fields",
  actions: [
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
  ],
};

test("request validation rejects invalid request", async () => {
  const service = new AgentPlanningService(new FakeProvider("{}"));

  await assert.rejects(
    () => service.plan({ currentPath: "/fields", actions: [] }),
    (error) => error instanceof AgentPlanningValidationError,
  );
});

test("unknown actions are filtered out", async () => {
  const provider = new FakeProvider(
    JSON.stringify({
      summary: "some summary",
      calls: [
        {
          name: "navigation.invalid",
          arguments: { path: "/somewhere" },
        },
      ],
    }),
  );
  const service = new AgentPlanningService(provider);

  const result = await service.plan(validRequest);

  assert.equal(result.summary, "No valid action could be planned.");
  assert.equal(result.calls.length, 0);
});

test("fallback is returned when required args are missing", async () => {
  const provider = new FakeProvider(
    JSON.stringify({
      summary: "go",
      calls: [
        {
          name: "navigation.go_to",
          arguments: {},
        },
      ],
    }),
  );
  const service = new AgentPlanningService(provider);

  const result = await service.plan(validRequest);

  assert.equal(result.summary, "No valid action could be planned.");
  assert.deepEqual(result.calls, []);
});

test("valid calls are normalized and returned", async () => {
  const provider = new FakeProvider(
    JSON.stringify({
      summary: "Navigate",
      calls: [
        {
          name: "navigation.go_to",
          arguments: { path: "/tournaments", extra: "ignore" },
        },
      ],
    }),
  );
  const service = new AgentPlanningService(provider);

  const result = await service.plan(validRequest);

  assert.equal(result.summary, "Navigate");
  assert.equal(result.calls.length, 1);
  assert.deepEqual(result.calls[0], {
    name: "navigation.go_to",
    arguments: { path: "/tournaments" },
  });
});
