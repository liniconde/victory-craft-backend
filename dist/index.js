"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const concertRoutes_1 = __importDefault(require("./routes/concertRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const fieldRoutes_1 = __importDefault(require("./routes/fieldRoutes"));
const slotRoutes_1 = __importDefault(require("./routes/slotRoutes"));
const imageRoutes_1 = __importDefault(require("./routes/imageRoutes"));
const reservationRoutes_1 = __importDefault(require("./routes/reservationRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5001;
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Conectar con MongoDB
mongoose_1.default
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.error(err));
app.use("/concerts", concertRoutes_1.default);
app.use("/images", imageRoutes_1.default);
app.use("/users", userRoutes_1.default);
app.use("/fields", fieldRoutes_1.default);
app.use("/slots", slotRoutes_1.default);
app.use("/reservations", reservationRoutes_1.default);
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map