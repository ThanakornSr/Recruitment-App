import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { Request, Response, Router } from "express";
import { body, param, validationResult } from "express-validator";
import FormData from "form-data";
import multer from "multer";
import { requireAuth } from "../middleware/auth";

type ExpressRequest = Request;
type ExpressResponse = Response;

interface UploadedFilesResponse {
  success: boolean;
  message: string;
  files: {
    photo?: string;
    cv: string;
  };
}

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
const UPLOAD_API_URL =
  process.env.UPLOAD_API_URL || "http://localhost:4000/api/upload";

const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });

async function uploadFiles(files: {
  photo?: Express.Multer.File[];
  cv: Express.Multer.File[];
}): Promise<{ cvPath: string; photoPath?: string }> {
  const formData = new FormData();

  if (files.cv?.[0]) {
    const cvFile = files.cv[0];
    formData.append("cv", cvFile.buffer, {
      filename: cvFile.originalname,
      contentType: cvFile.mimetype,
    });
  }

  if (files.photo?.[0]) {
    const photoFile = files.photo[0];
    formData.append("photo", photoFile.buffer, {
      filename: photoFile.originalname,
      contentType: photoFile.mimetype,
    });
  }

  try {
    const response = await axios.post<UploadedFilesResponse>(
      UPLOAD_API_URL,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (response.data.success) {
      return {
        cvPath: `/uploads/${response.data.files.cv}`,
        photoPath: response.data.files.photo
          ? `/uploads/${response.data.files.photo}`
          : undefined,
      };
    } else {
      throw new Error("File upload failed");
    }
  } catch (error) {
    console.error("Error uploading files:", error);
    throw new Error("Failed to upload files");
  }
}

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

  const prisma = new PrismaClient();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, phone, dob, email, position } = req.body;

    const filesToUpload: { field: string; file: Express.Multer.File }[] = [
      { field: "cv", file: cv[0] },
    ];

    if (photo?.[0]) {
      filesToUpload.push({ field: "photo", file: photo[0] });
    }

    const { application, applicant } = await prisma.$transaction(async (tx) => {
      const applicant = await tx.applicant.create({
        data: {
          fullName,
          phone,
          email,
          position,
          dateOfBirth: dob ? new Date(dob) : null,
          status: "PENDING",
          appliedAt: new Date(),
        },
      });

      const application = await tx.application.create({
        data: {
          applicant: {
            connect: { id: applicant.id },
          },
          status: "PENDING",
        },
      });

      return { application, applicant };
    });

    const uploadedFiles: Record<string, any> = {};
    for (const { field, file } of filesToUpload) {
      try {
        console.log(`Preparing to upload ${field} file`);
        const fileFormData = new FormData();
        fileFormData.append(field, file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });

        console.log(`Sending ${field} to upload API`);
        const uploadResponse = await axios.post<{
          success: boolean;
          files: Record<
            string,
            { id: number; filePath: string; fileType: string }
          >;
          message?: string;
          error?: any;
        }>(UPLOAD_API_URL, fileFormData, {
          headers: {
            ...fileFormData.getHeaders(),
          },
          params: {
            applicationId: application.id,
          },
        });

        console.log(`Upload response for ${field}:`, {
          status: uploadResponse.status,
          data: uploadResponse.data,
        });

        if (!uploadResponse.data.success) {
          console.error(`Upload failed for ${field}:`, uploadResponse.data);
          throw new Error(
            uploadResponse.data.message || `Failed to upload ${field}`
          );
        }

        // Store the uploaded file info
        if (field === "cv") {
          uploadedFiles.cv = uploadResponse.data.files?.cv;
        } else if (field === "photo" && uploadResponse.data.files?.photo) {
          uploadedFiles.photo = uploadResponse.data.files.photo;
        }
      } catch (error: any) {
        console.error(`Error uploading ${field}:`, {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          response: error.response?.data,
        });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        applicant,
        application,
        files: uploadedFiles,
      },
    });
  } catch (error: any) {
    const errorInfo = {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      response: error?.response?.data,
      request: {
        method: error?.request?.method,
        url: error?.request?.path,
        headers: error?.config?.headers,
        data: error?.config?.data?.toString(),
      },
    };

    console.error("Error submitting application:", errorInfo);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.message
            : String(error)
          : "An error occurred while processing your application",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const publicRouter = Router();

const uploadFields = upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "cv", maxCount: 1 },
]);

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
        include: {
          applications: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              updatedAt: true,
              files: {
                select: {
                  id: true,
                  filePath: true,
                  fileType: true,
                  createdAt: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          createdBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: { applications: true },
          },
        },
      });

      const applicationsWithFiles = applications.map((applicant) => {
        const latestApplication = applicant.applications[0];
        const photoFile = latestApplication?.files.find(
          (f) => f.fileType === "PHOTO"
        );
        const cvFile = latestApplication?.files.find(
          (f) => f.fileType === "CV"
        );

        return {
          ...applicant,
          photoPath: photoFile?.filePath,
          cvPath: cvFile?.filePath,
        };
      });

      res.json(applicationsWithFiles);
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

// Approve an application
adminRouter.put(
  "/applications/:id/approve",
  requireAuth,
  [
    param("id").isInt().withMessage("Invalid application ID"),
    body("interviewDate")
      .isISO8601()
      .withMessage("Interview date is required and must be a valid date"),
    body("notes").optional().isString().withMessage("Notes must be a string"),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { interviewDate, notes } = req.body;

      const application = await prisma.application.update({
        where: { id: parseInt(id) },
        data: {
          status: "WAIT_RESULT",
          notes,
          interviewDate: new Date(interviewDate),
          updatedAt: new Date(),
        },
        include: { applicant: true },
      });

      res.json({
        success: true,
        message: "Application approved successfully. Interview scheduled.",
        data: application,
      });
    } catch (error) {
      console.error("Error approving application:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to approve application" });
    }
  }
);

// Reject an application
adminRouter.put(
  "/applications/:id/reject",
  requireAuth,
  [
    param("id").isInt().withMessage("Invalid application ID"),
    body("notes").optional().isString().withMessage("Notes must be a string"),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { notes } = req.body;
      const userId = (req as any).user.id;

      const application = await prisma.application.update({
        where: { id: parseInt(id) },
        data: {
          status: "REJECT",
          notes,
          updatedAt: new Date(),
        },
        include: { applicant: true },
      });

      res.json({
        success: true,
        message: "Application rejected successfully",
        data: application,
      });
    } catch (error) {
      console.error("Error rejecting application:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to reject application" });
    }
  }
);

// Record interview result
adminRouter.put(
  "/applications/:id/interview-result",
  requireAuth,
  [
    param("id").isInt().withMessage("Invalid application ID"),
    body("result")
      .isIn(["PASS_INTERVIEW", "REJECT_INTERVIEW"])
      .withMessage(
        "Result must be either 'PASS_INTERVIEW' or 'REJECT_INTERVIEW'"
      ),
    body("feedback")
      .optional()
      .isString()
      .withMessage("Feedback must be a string"),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { result, feedback } = req.body;
      const userId = (req as any).user.id;

      const application = await prisma.application.update({
        where: { id: parseInt(id) },
        data: {
          status: result,
          notes: feedback,
          updatedAt: new Date(),
        },
        include: { applicant: true },
      });

      res.json({
        success: true,
        message: `Interview result recorded successfully (${result})`,
        data: application,
      });
    } catch (error) {
      console.error("Error recording interview result:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to record interview result" });
    }
  }
);

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
        "REJECT_INTERVIEW",
        "REJECT",
      ])
      .withMessage("Invalid status"),
    body("dateOfBirth").optional().isString(),
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

      const applicationId = parseInt(req.params.id);

      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          files: true,
          applicant: {
            include: {
              applications: true,
            },
          },
        },
      });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      await prisma.$transaction(async (prisma) => {
        const { applicant } = application;

        await prisma.file.deleteMany({
          where: { applicationId: applicationId },
        });

        await prisma.application.delete({
          where: { id: applicationId },
        });
        const remainingApplications = await prisma.application.count({
          where: { applicantId: applicant.id },
        });

        if (remainingApplications === 0) {
          await prisma.applicant.delete({
            where: { id: applicant.id },
          });
        }
      });

      res.json({
        message: "Application and related data deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting application:", error);
      res.status(500).json({
        message: "Error deleting application: " + (error as Error).message,
      });
    }
  }
);

export { adminRouter, publicRouter };
