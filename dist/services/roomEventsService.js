"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomEventsBus = void 0;
class RoomEventsBus {
    constructor() {
        this.listeners = new Map();
    }
    subscribe(roomId, listener) {
        var _a;
        if (!this.listeners.has(roomId)) {
            this.listeners.set(roomId, new Set());
        }
        (_a = this.listeners.get(roomId)) === null || _a === void 0 ? void 0 : _a.add(listener);
        return () => {
            var _a, _b;
            (_a = this.listeners.get(roomId)) === null || _a === void 0 ? void 0 : _a.delete(listener);
            if ((((_b = this.listeners.get(roomId)) === null || _b === void 0 ? void 0 : _b.size) || 0) === 0) {
                this.listeners.delete(roomId);
            }
        };
    }
    publish(roomId, event) {
        const roomListeners = this.listeners.get(roomId);
        if (!roomListeners)
            return;
        roomListeners.forEach((listener) => {
            try {
                listener(event);
            }
            catch (_error) {
                // Do not break all listeners if one fails.
            }
        });
    }
}
exports.roomEventsBus = new RoomEventsBus();
//# sourceMappingURL=roomEventsService.js.map