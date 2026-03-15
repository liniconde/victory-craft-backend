"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPairKey = exports.parseOptionalDate = exports.assertObjectId = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const errors_1 = require("./errors");
const assertObjectId = (value, field) => {
    if (!value || !mongoose_1.default.Types.ObjectId.isValid(value)) {
        throw new errors_1.TournamentsDomainError(400, `invalid_${field}`, `${field} is invalid`);
    }
};
exports.assertObjectId = assertObjectId;
const parseOptionalDate = (value) => {
    if (!value)
        return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new errors_1.TournamentsDomainError(400, "invalid_date", "date value is invalid");
    }
    return parsed;
};
exports.parseOptionalDate = parseOptionalDate;
const buildPairKey = (firstTeamId, secondTeamId) => [firstTeamId, secondTeamId].sort().join("::");
exports.buildPairKey = buildPairKey;
//# sourceMappingURL=utils.js.map