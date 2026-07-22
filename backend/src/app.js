import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js"
import orgRouter from "./routes/org.routes.js"
import catalogRouter from "./routes/catalog.routes.js"

const app=express();
app.use(cors({origin:process.env.CORS_ORIGIN,
    credentials:true
}))
app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true,limit:"16kb"}));
app.use(express.static("public"));
app.use(cookieParser());


app.use("/api/v1/users",userRouter);
app.use("/api/v1/org",orgRouter);
app.use("/api/v1/catalog",catalogRouter);

app.use((err, req, res, next) => {
    console.error("ERROR INTERCEPTED:", err.message);

    // Multer-specific errors 
    if (err.name === 'MulterError') {
        return res.status(400).json({
            success: false,
            message: err.message,
            errors: []
        });
    }

    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || []
    });
});
export {app};