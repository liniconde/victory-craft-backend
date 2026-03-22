"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSportTypeOrThrow = exports.isValidSportType = exports.normalizeSportType = exports.SPORT_TYPES = void 0;
exports.SPORT_TYPES = [
    "football",
    "futsal",
    "basketball",
    "baseball",
    "volleyball",
    "tennis",
    "padel",
    "other",
];
const SPORT_TYPE_SET = new Set(exports.SPORT_TYPES);
const SPORT_TYPE_ALIASES = {
    football: "football",
    soccer: "football",
    futsal: "futsal",
    basketball: "basketball",
    baseball: "baseball",
    volleyball: "volleyball",
    tennis: "tennis",
    padel: "padel",
    other: "other",
};
const normalizeSportType = (value) => {
    if (typeof value !== "string")
        return undefined;
    const normalized = value.trim().toLowerCase();
    if (!normalized)
        return undefined;
    return SPORT_TYPE_ALIASES[normalized];
};
exports.normalizeSportType = normalizeSportType;
const isValidSportType = (value) => typeof value === "string" && SPORT_TYPE_SET.has(value);
exports.isValidSportType = isValidSportType;
const normalizeSportTypeOrThrow = (value, errorFactory) => {
    const normalized = (0, exports.normalizeSportType)(value);
    if (value === undefined || value === null || value === "") {
        return undefined;
    }
    if (!normalized) {
        throw errorFactory(`sportType is invalid. Supported values: ${exports.SPORT_TYPES.join(", ")}`);
    }
    return normalized;
};
exports.normalizeSportTypeOrThrow = normalizeSportTypeOrThrow;
//# sourceMappingURL=sportTypes.js.map