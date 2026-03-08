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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.listNotifications = exports.createNotification = exports.NotificationServiceError = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Notification_1 = __importDefault(require("../models/Notification"));
class NotificationServiceError extends Error {
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
exports.NotificationServiceError = NotificationServiceError;
const createNotification = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const doc = yield Notification_1.default.create({
        type: params.type,
        message: params.message,
        videoId: params.videoId,
        analysisJobId: params.analysisJobId,
        metadata: params.metadata,
    });
    return doc.toObject();
});
exports.createNotification = createNotification;
const listNotifications = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const limit = Math.min(100, Math.max(1, (params === null || params === void 0 ? void 0 : params.limit) || 50));
    const query = {};
    if (params === null || params === void 0 ? void 0 : params.videoId) {
        query.videoId = params.videoId;
    }
    if (params === null || params === void 0 ? void 0 : params.analysisJobId) {
        query.analysisJobId = params.analysisJobId;
    }
    if (params === null || params === void 0 ? void 0 : params.type) {
        query.type = params.type;
    }
    const rows = yield Notification_1.default.find(query).sort({ createdAt: -1 }).limit(limit);
    return rows.map((row) => row.toObject());
});
exports.listNotifications = listNotifications;
const deleteNotification = (notificationId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!notificationId || !mongoose_1.default.Types.ObjectId.isValid(notificationId)) {
        throw new NotificationServiceError(400, "invalid_notification_id", "Invalid notification id");
    }
    const deleted = yield Notification_1.default.findByIdAndDelete(notificationId);
    if (!deleted) {
        throw new NotificationServiceError(404, "notification_not_found", "Notification not found");
    }
    return { message: "Notification deleted successfully" };
});
exports.deleteNotification = deleteNotification;
//# sourceMappingURL=notificationService.js.map