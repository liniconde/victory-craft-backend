"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// Esquema de Mongoose
const SlotSchema = new mongoose_1.Schema({
    field: { type: mongoose_1.Schema.Types.ObjectId, ref: "Field", required: true }, // Relación con Field
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    isAvailable: { type: Boolean, required: true, default: true },
    value: { type: Number, required: true },
}, { timestamps: true } // Agrega `createdAt` y `updatedAt` automáticamente
);
// Validación: `endTime` debe ser mayor que `startTime`
SlotSchema.pre("save", function (next) {
    if (this.endTime <= this.startTime) {
        return next(new Error("endTime must be greater than startTime"));
    }
    next();
});
exports.default = mongoose_1.default.model("Slot", SlotSchema);
//# sourceMappingURL=Slot.js.map