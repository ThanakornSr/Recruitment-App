import express, {
  Router,
  Request as ExpressBaseRequest,
  Response,
  NextFunction,
} from "express";
import { body, validationResult, ValidationError } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient, User } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "../middleware/auth";

type ExpressRequest = ExpressBaseRequest;
type ExpressResponse = Response;
type ExpressNextFunction = NextFunction;

interface LoginRequest extends ExpressRequest {
  body: {
    email: string;
    password: string;
  };
}

interface ErrorResponse {
  errors?: ValidationError[];
  message?: string;
}

const prisma = new PrismaClient();
const router = Router();

// Helper function to get user agent and IP from request
const getDeviceInfo = (req: ExpressRequest) => {
  const userAgent = req.headers["user-agent"] || "unknown";
  const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
  return { userAgent, ipAddress };
};

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 4 })
      .withMessage("Password must be at least 4 characters long"),
  ],
  async (req: ExpressRequest, res: ExpressResponse) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const user: User | null = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
      }

      const token = uuidv4();

      const { userAgent, ipAddress } = getDeviceInfo(req);

      try {
        await prisma.userSession.create({
          data: {
            userId: user.id,
            accessToken: token,
            userAgent: userAgent || null,
            ipAddress: ipAddress || null,
            isActive: true,
            loginAt: new Date(),
            expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
          },
        });

        // Create JWT token
        const jwtToken = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            role: user.role,
            sessionId: token,
          },
          process.env.JWT_SECRET!,
          { expiresIn: "8h" }
        );

        return res.json({
          token: jwtToken,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
        });
      } catch (error) {
        console.error("Error creating session:", error);
        return res.status(500).json({ message: "Failed to create session" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Get current user's profile
router.get(
  "/me",
  requireAuth,
  async (req: ExpressRequest, res: ExpressResponse) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json(user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Logout user
router.post(
  "/logout",
  requireAuth,
  async (req: ExpressRequest, res: ExpressResponse) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ message: "Missing or invalid authorization header" });
      }

      const token = authHeader.split(" ")[1];

      if (!req.user?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      await prisma.userSession.updateMany({
        where: {
          userId: req.user.userId,
          accessToken: token,
          isActive: true,
        },
        data: {
          isActive: false,
          logoutAt: new Date(),
        },
      });

      return res.json({ message: "Successfully logged out" });
    } catch (error) {
      console.error("Error during logout:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
