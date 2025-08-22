import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import fs from "fs";
import authRoutes from "./routes/auth";
import { publicRouter, adminRouter } from "./routes/applications";

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "*", credentials: true }));
app.use(express.json());

const uploadsDir = path.join(process.cwd(), "uploads");
console.log("Serving static files from:", uploadsDir);

if (!fs.existsSync(uploadsDir)) {
  console.log("Creating uploads directory at:", uploadsDir);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(
  "/uploads",
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

app.listen(process.env.PORT || 4000, () =>
  console.log(`✅ API running at http://localhost:${process.env.PORT || 4000}`)
);
