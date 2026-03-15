"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentsDomainError = void 0;
class TournamentsDomainError extends Error {
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
exports.TournamentsDomainError = TournamentsDomainError;
//# sourceMappingURL=errors.js.map