import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import fs from "fs";
import authRoutes from "./routes/auth";
import { publicRouter, adminRouter } from "./routes/applications";
import uploadRouter from "./routes/upload";

const app = express();

// Configure CORS
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(",")
  : ["*"];

const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    if (
      !origin ||
      allowedOrigins.includes("*") ||
      allowedOrigins.includes(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  exposedHeaders: ["Content-Disposition"],
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());

// Set up uploads directory
const uploadsDir = path.join(process.cwd(), "uploads");
console.log("Serving static files from:", uploadsDir);

if (!fs.existsSync(uploadsDir)) {
  console.log("Creating uploads directory at:", uploadsDir);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(
  "/uploads",
  (req, res, next) => {
    const origin = req.headers.origin;
    if (
      allowedOrigins.includes("*") ||
      (origin && allowedOrigins.includes(origin))
    ) {
      res.header("Access-Control-Allow-Origin", origin || "*");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header(
        "Access-Control-Expose-Headers",
        "Content-Length,Content-Type"
      );
    }

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    next();
  },
  express.static(uploadsDir, {
    etag: true,
    lastModified: true,
    maxAge: "1d",
    setHeaders: (res, path) => {
      if (path.endsWith(".jpg") || path.endsWith(".jpeg")) {
        res.setHeader("Content-Type", "image/jpeg");
      } else if (path.endsWith(".png")) {
        res.setHeader("Content-Type", "image/png");
      } else if (path.endsWith(".pdf")) {
        res.setHeader("Content-Type", "application/pdf");
      }
    },
  })
);

app.use("/auth", authRoutes);
app.use("/applications", publicRouter);
app.use("/admin", adminRouter);
app.use("/api/upload", uploadRouter);

app.listen(process.env.PORT || 4000, () =>
  console.log(`✅ API running at http://localhost:${process.env.PORT || 4000}`)
);
