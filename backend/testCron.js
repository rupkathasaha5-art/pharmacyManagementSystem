import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./src/models/Product.model.js";
import { classifyBatchesByExpiry } from "./src/jobs/expiryClassificationCron.js"; // adjust path to match your actual file location

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI); // match your actual env var name
  console.log("Connected. Running classification job manually...");
  await classifyBatchesByExpiry();
  await mongoose.disconnect();
  console.log("Done.");
};

run();