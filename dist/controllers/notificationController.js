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
exports.handleDeleteNotification = exports.handleListNotifications = void 0;
const notificationService_1 = require("../services/notificationService");
const handleNotificationError = (res, error) => {
    if (error instanceof notificationService_1.NotificationServiceError) {
        res.status(error.status).json({ message: error.message, code: error.code });
        return;
    }
    res.status(500).json({ message: error.message || "Internal server error" });
};
const handleListNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const limit = Number(req.query.limit || 50);
        const items = yield (0, notificationService_1.listNotifications)({ limit });
        res.status(200).json(items);
    }
    catch (error) {
        handleNotificationError(res, error);
    }
});
exports.handleListNotifications = handleListNotifications;
const handleDeleteNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield (0, notificationService_1.deleteNotification)(id);
        res.status(200).json(result);
    }
    catch (error) {
        handleNotificationError(res, error);
    }
});
exports.handleDeleteNotification = handleDeleteNotification;
//# sourceMappingURL=notificationController.js.map