"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleEnqueueWorkersStart = void 0;
const workersControlService_1 = require("../services/workersControlService");
const getAuthUserId = (req) => { var _a, _b, _c; return ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id) || ((_c = req.user) === null || _c === void 0 ? void 0 : _c.userId); };
const handleEnqueueWorkersStart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = getAuthUserId(req);
        if (!userId) {
            res.status(401).json({ message: "Unauthorized", code: "unauthorized" });
            return;
        }
        const result = yield (0, workersControlService_1.enqueueWorkersStart)({
            requestedBy: userId,
            reason: typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.reason) === "string" ? req.body.reason : undefined,
            metadata: ((_b = req.body) === null || _b === void 0 ? void 0 : _b.metadata) && typeof req.body.metadata === "object"
                ? req.body.metadata
                : undefined,
        });
        res.status(202).json(Object.assign({ message: "Workers start request queued" }, result));
    }
    catch (error) {
        if (error instanceof workersControlService_1.WorkersControlServiceError) {
            res.status(error.status).json({ message: error.message, code: error.code });
            return;
        }
        res.status(500).json({ message: (error === null || error === void 0 ? void 0 : error.message) || "Internal server error" });
    }
});
exports.handleEnqueueWorkersStart = handleEnqueueWorkersStart;
//# sourceMappingURL=workersControlController.js.map