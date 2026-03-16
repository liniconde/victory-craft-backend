require("ts-node/register/transpile-only");

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  parsePlannerModelOutput,
} = require("../src/agent-planning/application/plannerOutputParser");

test("parsePlannerModelOutput extracts JSON from markdown text", () => {
  const raw = "Plan generated:\n```json\n{\"summary\":\"ok\",\"calls\":[{\"name\":\"navigation.go_to\",\"arguments\":{\"path\":\"/fields\"}}]}\n```";

  const parsed = parsePlannerModelOutput(raw);

  assert.equal(parsed.summary, "ok");
  assert.equal(parsed.calls.length, 1);
  assert.equal(parsed.calls[0].name, "navigation.go_to");
});

test("parsePlannerModelOutput returns null for invalid payload", () => {
  const raw = "hello this is not json";
  const parsed = parsePlannerModelOutput(raw);

  assert.equal(parsed, null);
});
