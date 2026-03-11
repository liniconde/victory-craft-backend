import dotenv from "dotenv";
import mongoose from "mongoose";
import { pollWorkerResultsQueueOnce } from "../services/workerAgentResultsConsumerService";

dotenv.config();

let running = true;

const mongoUri = process.env.MONGO_URI;

const stopWorker = async () => {
  running = false;
  try {
    await mongoose.disconnect();
  } catch (_error) {
    // ignore disconnect errors on shutdown
  }
  process.exit(0);
};

const bootstrap = async () => {
  if (!mongoUri) {
    throw new Error("MONGO_URI must be configured");
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB Connected (worker results consumer)");

  while (running) {
    try {
      await pollWorkerResultsQueueOnce();
    } catch (error: any) {
      console.error("Worker results consumer loop error:", error.message);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
};

process.on("SIGINT", stopWorker);
process.on("SIGTERM", stopWorker);

bootstrap().catch(async (error) => {
  console.error("Failed to start worker results consumer:", error.message);
  try {
    await mongoose.disconnect();
  } catch (_disconnectError) {
    // ignore
  }
  process.exit(1);
});
