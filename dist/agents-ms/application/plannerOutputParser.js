"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePlannerModelOutput = void 0;
const contracts_1 = require("../domain/contracts");
const tryParseJson = (value) => {
    try {
        return JSON.parse(value);
    }
    catch (_error) {
        return null;
    }
};
const extractFromCodeFence = (value) => {
    const jsonFencePattern = /```(?:json)?\s*([\s\S]*?)```/gi;
    let match = jsonFencePattern.exec(value);
    while (match) {
        const parsed = tryParseJson(match[1].trim());
        if (parsed)
            return parsed;
        match = jsonFencePattern.exec(value);
    }
    return null;
};
const extractBalancedJson = (value) => {
    let depth = 0;
    let start = -1;
    let inString = false;
    let escaped = false;
    for (let index = 0; index < value.length; index += 1) {
        const char = value[index];
        if (inString) {
            if (escaped) {
                escaped = false;
            }
            else if (char === "\\") {
                escaped = true;
            }
            else if (char === "\"") {
                inString = false;
            }
            continue;
        }
        if (char === "\"") {
            inString = true;
            continue;
        }
        if (char === "{") {
            if (depth === 0)
                start = index;
            depth += 1;
            continue;
        }
        if (char === "}") {
            if (depth > 0)
                depth -= 1;
            if (depth === 0 && start >= 0) {
                const candidate = value.slice(start, index + 1);
                const parsed = tryParseJson(candidate);
                if (parsed)
                    return parsed;
                start = -1;
            }
        }
    }
    return null;
};
const parsePlannerModelOutput = (output) => {
    const direct = tryParseJson(output);
    if (direct) {
        const parsed = contracts_1.plannerModelOutputSchema.safeParse(direct);
        if (parsed.success)
            return parsed.data;
    }
    const fromFence = extractFromCodeFence(output);
    if (fromFence) {
        const parsed = contracts_1.plannerModelOutputSchema.safeParse(fromFence);
        if (parsed.success)
            return parsed.data;
    }
    const balanced = extractBalancedJson(output);
    if (balanced) {
        const parsed = contracts_1.plannerModelOutputSchema.safeParse(balanced);
        if (parsed.success)
            return parsed.data;
    }
    return null;
};
exports.parsePlannerModelOutput = parsePlannerModelOutput;
//# sourceMappingURL=plannerOutputParser.js.map