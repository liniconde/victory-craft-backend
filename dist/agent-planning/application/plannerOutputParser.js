"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePlannerModelOutput = void 0;
const schemas_1 = require("../domain/schemas");
const tryParseJsonObject = (text) => {
    try {
        return JSON.parse(text);
    }
    catch (_error) {
        return null;
    }
};
const tryExtractFromCodeFence = (text) => {
    const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
    let match = fenceRegex.exec(text);
    while (match) {
        const candidate = tryParseJsonObject(match[1] || "");
        if (candidate) {
            return candidate;
        }
        match = fenceRegex.exec(text);
    }
    return null;
};
const tryExtractBalancedObject = (text) => {
    let start = -1;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        if (inString) {
            if (escaped) {
                escaped = false;
            }
            else if (char === "\\") {
                escaped = true;
            }
            else if (char === '"') {
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
const parsePlannerModelOutput = (rawText) => {
    const direct = tryParseJsonObject(rawText);
    if (direct) {
        const parsed = schemas_1.plannerModelOutputSchema.safeParse(direct);
        if (parsed.success) {
            return parsed.data;
        }
    }
    const fromFence = tryExtractFromCodeFence(rawText);
    if (fromFence) {
        const parsed = schemas_1.plannerModelOutputSchema.safeParse(fromFence);
        if (parsed.success) {
            return parsed.data;
        }
    }
    const balanced = tryExtractBalancedObject(rawText);
    if (balanced) {
        const parsed = schemas_1.plannerModelOutputSchema.safeParse(balanced);
        if (parsed.success) {
            return parsed.data;
        }
    }
    return null;
};
exports.parsePlannerModelOutput = parsePlannerModelOutput;
//# sourceMappingURL=plannerOutputParser.js.map