"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleTournamentsError = void 0;
const errors_1 = require("../services/errors");
const handleTournamentsError = (res, error) => {
    if (error instanceof errors_1.TournamentsDomainError) {
        res.status(error.status).json({ message: error.message, code: error.code });
        return;
    }
    if ((error === null || error === void 0 ? void 0 : error.code) === 11000) {
        res.status(409).json({ message: "Duplicated resource", code: "duplicate_resource" });
        return;
    }
    res.status(500).json({ message: (error === null || error === void 0 ? void 0 : error.message) || "Internal server error", code: "internal_error" });
};
exports.handleTournamentsError = handleTournamentsError;
//# sourceMappingURL=common.js.map