import { Router, Request, Response } from "express";
import multer, { FileFilterCallback } from "multer";
import * as fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

type ExpressRequest = Request & {
  user?: {
    userId: number;
    email: string;
    role: string;
    sessionId?: string;
  };
};

type ExpressResponse = Response;

interface UploadedFiles {
  photo?: Express.Multer.File[];
  cv: Express.Multer.File[];
}

interface UploadedFileResponse {
  id: number;
  filePath: string;
  fileType: string;
  createdAt: Date;
}

const prisma = new PrismaClient();
const router = Router();

const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const fileFilter = (
  req: ExpressRequest,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const isPhoto = file.fieldname === "photo" && file.mimetype.startsWith("image/");
  const isCV = file.fieldname === "cv" && file.mimetype === "application/pdf";
  
  if (isPhoto || isCV) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${file.fieldname}. Photo must be an image and CV must be a PDF.`));
  }
};

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Handle file upload
router.post(
  "/",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "cv", maxCount: 1 },
  ]),
  async (req: ExpressRequest, res: ExpressResponse) => {
    try {
      const files = req.files as unknown as UploadedFiles;
      const applicationId = req.query.applicationId as string;
      
      if (!applicationId) {
        return res.status(400).json({
          success: false,
          error: "applicationId is required"
        });
      }

      const uploadedFiles: Record<string, any> = {};

      // Verify application exists
      const application = await prisma.application.findUnique({
        where: { id: parseInt(applicationId, 10) }
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          error: "Application not found"
        });
      }

      if (files.photo) {
        const photo = files.photo[0];
        const photoPath = `photo-${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${path.extname(photo.originalname)}`;

        await fs.promises.writeFile(
          path.join(uploadDir, photoPath),
          photo.buffer
        );

        const photoFile = await prisma.file.create({
          data: {
            filePath: photoPath,
            fileType: "PHOTO",
            application: {
              connect: { id: parseInt(applicationId, 10) }
            },
            uploader: req.user?.userId ? {
              connect: { id: req.user.userId }
            } : undefined,
          },
          select: {
            id: true,
            filePath: true,
            fileType: true,
            createdAt: true,
          },
        });

        uploadedFiles.photo = photoFile;
      }

      if (files.cv) {
        const cv = files.cv[0];
        const cvPath = `cv-${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${path.extname(cv.originalname)}`;

        await fs.promises.writeFile(path.join(uploadDir, cvPath), cv.buffer);

        const cvFile = await prisma.file.create({
          data: {
            filePath: cvPath,
            fileType: "CV",
            application: {
              connect: { id: parseInt(applicationId, 10) }
            },
            uploader: req.user?.userId ? {
              connect: { id: req.user.userId }
            } : undefined,
          },
          select: {
            id: true,
            filePath: true,
            fileType: true,
            createdAt: true,
          },
        });

        uploadedFiles.cv = cvFile;
      }

      res.status(200).json({
        success: true,
        files: uploadedFiles,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({
        success: false,
        error: "Error uploading files",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
