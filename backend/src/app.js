import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";
import orgRouter from "./routes/org.routes.js";
import catalogRouter from "./routes/catalog.routes.js";
import cartRouter from "./routes/cart.routes.js";
import orderRouter from "./routes/order.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import manufacturerReturnRouter from "./routes/manufacturerReturn.routes.js";
import orgAdminRouter from "./routes/orgAdmin.routes.js";

const app = express();

// Request Logger
app.use((req, res, next) => {
  console.log("🌐 [INCOMING REQUEST]:", req.method, req.originalUrl);
  next();
});

// CORS Configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);



// 2. Standard Parsers for all other endpoints
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// 3. API Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/users", cartRouter); 
app.use("/api/v1/org", orgRouter);
app.use("/api/v1/catalog", catalogRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/manufacturer-returns", manufacturerReturnRouter);
app.use("/api/v1/org-admin", orgAdminRouter);
// 4. Global Error Handler
app.use((err, req, res, next) => {
  console.error("ERROR INTERCEPTED:", err.message);

  // Multer-specific errors
  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: [],
    });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
  });
});

export { app };