"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tournamentRoutes_1 = __importDefault(require("./tournamentRoutes"));
const teamRoutes_1 = __importDefault(require("./teamRoutes"));
const playerRoutes_1 = __importDefault(require("./playerRoutes"));
const matchRoutes_1 = __importDefault(require("./matchRoutes"));
const matchStatRoutes_1 = __importDefault(require("./matchStatRoutes"));
const router = express_1.default.Router();
router.use("/teams", teamRoutes_1.default);
router.use("/matches/players", playerRoutes_1.default);
router.use("/matches/match-stats", matchStatRoutes_1.default);
router.use("/matches", matchRoutes_1.default);
router.use("/", tournamentRoutes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map