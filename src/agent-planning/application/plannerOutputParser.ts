import { plannerModelOutputSchema } from "../domain/schemas";
import { PlannerModelOutput } from "../domain/types";

const tryParseJsonObject = (text: string): unknown | null => {
  try {
    return JSON.parse(text);
  } catch (_error) {
    return null;
  }
};

const tryExtractFromCodeFence = (text: string): unknown | null => {
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
  let match: RegExpExecArray | null = fenceRegex.exec(text);
  while (match) {
    const candidate = tryParseJsonObject(match[1] || "");
    if (candidate) {
      return candidate;
    }
    match = fenceRegex.exec(text);
  }
  return null;
};

const tryExtractBalancedObject = (text: string): unknown | null => {
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) {
        start = i;
      }
      depth += 1;
      continue;
    }

    if (char === "}") {
      if (depth > 0) {
        depth -= 1;
      }
      if (depth === 0 && start >= 0) {
        const candidateText = text.slice(start, i + 1);
        const candidate = tryParseJsonObject(candidateText);
        if (candidate) {
          return candidate;
        }
        start = -1;
      }
    }
  }

  return null;
};

export const parsePlannerModelOutput = (rawText: string): PlannerModelOutput | null => {
  const direct = tryParseJsonObject(rawText);
  if (direct) {
    const parsed = plannerModelOutputSchema.safeParse(direct);
    if (parsed.success) {
      return parsed.data;
    }
  }

  const fromFence = tryExtractFromCodeFence(rawText);
  if (fromFence) {
    const parsed = plannerModelOutputSchema.safeParse(fromFence);
    if (parsed.success) {
      return parsed.data;
    }
  }

  const balanced = tryExtractBalancedObject(rawText);
  if (balanced) {
    const parsed = plannerModelOutputSchema.safeParse(balanced);
    if (parsed.success) {
      return parsed.data;
    }
  }

  return null;
};
