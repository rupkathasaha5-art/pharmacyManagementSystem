import mongoose from "mongoose";
import dotenv from "dotenv";
import BatchInventory from "./src/models/BatchInventory.model.js"; // adjust path if your models folder is elsewhere

dotenv.config();

const backfillExpiryStatus = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI); // use whatever env var name your app actually uses for the DB connection

    console.log("Connected to DB. Running backfill...");

    const now = new Date();
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const in1Year = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const redResult = await BatchInventory.updateMany(
      { expiryDate: { $lt: in90Days } },
      { $set: { expiryStatus: 'red' } }
    );

    const yellowResult = await BatchInventory.updateMany(
      { expiryDate: { $gte: in90Days, $lt: in1Year } },
      { $set: { expiryStatus: 'yellow' } }
    );

    const greenResult = await BatchInventory.updateMany(
      { expiryDate: { $gte: in1Year } },
      { $set: { expiryStatus: 'green' } }
    );

    console.log(`Backfilled: ${redResult.modifiedCount} red, ${yellowResult.modifiedCount} yellow, ${greenResult.modifiedCount} green`);
  } catch (error) {
    console.error("Backfill failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected. Done.");
  }
};

backfillExpiryStatus();