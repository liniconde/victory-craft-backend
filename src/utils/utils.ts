import dotenv from "dotenv";

dotenv.config();

export const isDevMode = () => process.env.DEV_MODE === "true";
