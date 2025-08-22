import express, { Router, Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { body, param, validationResult } from "express-validator";
import { requireAuth } from "../middleware/auth";
import multer, { FileFilterCallback, Multer } from "multer";
import * as fs from "fs";
import path from "path";

type ExpressRequest = Request;
type ExpressResponse = Response;

interface ApplicationFiles {
  photo?: Express.Multer.File[];
  cv: Express.Multer.File[];
}

function isApplicationFiles(files: any): files is ApplicationFiles {
  return files && Array.isArray(files.cv) && files.cv.length > 0;
}
type RequestWithFiles = ExpressRequest & {
  files?: {
    [fieldname: string]: Express.Multer.File[];
  };
};

const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (
    req: ExpressRequest,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (
    req: ExpressRequest,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (
  req: ExpressRequest,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedTypes = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only .pdf, .doc, .docx, .jpg, .jpeg, and .png files are allowed"
      )
    );
  }
};

// Upload Multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 2,
  },
});
const submitApplicationHandler = async (
  req: RequestWithFiles,
  res: ExpressResponse
) => {
  if (!req.files || !isApplicationFiles(req.files)) {
    return res
      .status(400)
      .json({ message: "No files were uploaded or invalid file structure" });
  }

  const { photo, cv } = req.files;

  if (!cv?.[0]) {
    return res.status(400).json({ message: "CV is required" });
  }

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, phone, dob, email, position } = req.body;
    const cvFile = cv[0];
    const photoFile = photo?.[0];

    const cvFilename = path.basename(cvFile.path);
    const cvPublicPath = `/uploads/${cvFilename}`;

    let photoPublicPath: string | null = null;
    if (photoFile) {
      const photoFilename = path.basename(photoFile.path);
      photoPublicPath = `/uploads/${photoFilename}`;
    }

    const applicant = await prisma.applicant.create({
      data: {
        fullName,
        phone,
        email,
        position,
        photoPath: photoPublicPath,
        cvPath: cvPublicPath,
        notes: `Date of Birth: ${dob}`,
        status: "PENDING",
        appliedAt: new Date(),
      },
    });

    // Create application record
    await prisma.application.create({
      data: {
        applicantId: applicant.id,
        status: "PENDING",
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        id: applicant.id,
        fullName: applicant.fullName,
        email: applicant.email,
        position: applicant.position,
        status: applicant.status,
        appliedAt: applicant.appliedAt,
      },
    });
  } catch (error) {
    console.error("Error submitting application:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

const publicRouter = Router();

// Configure multer for file uploads
const uploadFields = upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "cv", maxCount: 1 },
]);

// Apply the middleware and handler in a single route
publicRouter.post(
  "/submit",
  (req, res, next) => {
    const typedReq = req as RequestWithFiles;
    uploadFields(typedReq, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File too large. Maximum size is 10MB per file.",
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || "Error uploading files",
        });
      }

      if (
        !typedReq.files ||
        !typedReq.files.cv ||
        !Array.isArray(typedReq.files.cv) ||
        typedReq.files.cv.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "CV file is required",
        });
      }

      next();
    });
  },
  (req, res) => {
    const typedReq = req as RequestWithFiles;
    return submitApplicationHandler(typedReq, res);
  }
);

// Admin routes protected by requireAuth middleware
const adminRouter = Router();
adminRouter.get(
  "/applications",
  requireAuth,
  async (req: ExpressRequest, res: ExpressResponse) => {
    try {
      const { status } = req.query;

      const whereClause: any = {};
      if (status && status !== "") {
        whereClause.status = status;
      }

      const applications = await prisma.applicant.findMany({
        where: whereClause,
        orderBy: { appliedAt: "desc" },
        select: {
          id: true,
          fullName: true,
          email: true,
          position: true,
          status: true,
          appliedAt: true,
          updatedAt: true,
          photoPath: true,
          cvPath: true,
          phone: true,
          _count: {
            select: { applications: true },
          },
        },
      });

      res.json(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ message: "Error fetching applications" });
    }
  }
);

// Get application by ID
adminRouter.get(
  "/applications/:id",
  requireAuth,
  [param("id").isInt().withMessage("Invalid application ID")],
  async (req: ExpressRequest, res: ExpressResponse) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const application = await prisma.applicant.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
          applications: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      res.json(application);
    } catch (error) {
      console.error("Error fetching application:", error);
      res.status(500).json({ message: "Error fetching application" });
    }
  }
);

// Update application status
adminRouter.put(
  "/applications/:id/status",
  requireAuth,
  [
    param("id").isInt().withMessage("Invalid application ID"),
    body("status")
      .isString()
      .isIn([
        "PENDING",
        "WAIT_RESULT",
        "PASS_INTERVIEW",
        "REJECTED_INTERVIEW",
        "REJECTED",
      ])
      .withMessage("Invalid status"),
    body("notes").optional().isString(),
  ],
  async (req: ExpressRequest, res: ExpressResponse) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status } = req.body;
      const updated = await prisma.applicant.update({
        where: { id: parseInt(req.params.id) },
        data: { status },
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating application status:", error);
      res.status(500).json({ message: "Error updating application status" });
    }
  }
);

// Delete application
adminRouter.delete(
  "/applications/:id",
  requireAuth,
  [param("id").isInt().withMessage("Invalid application ID")],
  async (req: ExpressRequest, res: ExpressResponse) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      await prisma.$transaction([
        prisma.application.deleteMany({
          where: { applicantId: parseInt(req.params.id) },
        }),
        prisma.applicant.delete({
          where: { id: parseInt(req.params.id) },
        }),
      ]);

      res.json({ message: "Application deleted successfully" });
    } catch (error) {
      console.error("Error deleting application:", error);
      res.status(500).json({ message: "Error deleting application" });
    }
  }
);

export { publicRouter, adminRouter };
