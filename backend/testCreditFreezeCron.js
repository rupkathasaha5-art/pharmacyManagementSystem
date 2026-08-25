// backend/testMakeOverdue.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "./src/models/Order.model.js";

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await Order.updateOne(
    { invoiceNumber: "INV-1787465800992-630" }, // replace with a REAL invoice number
    { $set: { dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) } }
  );
  console.log("Modified:", result.modifiedCount);
  await mongoose.disconnect();
};

run();