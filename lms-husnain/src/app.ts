import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/auth";
import courseRoutes from "./routes/courses";
import quizRoutes from "./routes/quizzes";
import enrollmentRoutes from "./routes/enrollments";
import dashboardRoute from "./routes/dashboard";
import lectureRoutes from "./routes/lectureRoutes";
import attendanceRoutes from "./routes/attendance";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());

// ✅ OK: CORS configured
app.use(
  cors({
    origin: process.env.FRONTEND_URL || [
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);

app.use(morgan("combined"));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ✅ OK: CRITICAL FIX - Serve the "uploads" folder publicly
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Serve public static files (frontend helper scripts)
app.use(express.static(path.join(process.cwd(), "public")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/courses", courseRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/lectures", lectureRoutes);
app.use("/api/attendance", attendanceRoutes);
app.get("/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("*", (_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📂 Uploads served at: http://localhost:${PORT}/uploads`);
});
