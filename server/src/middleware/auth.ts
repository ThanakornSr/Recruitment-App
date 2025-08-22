import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        role: string;
        sessionId?: string;
      };
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Missing or invalid authorization header" });
  }

  const token = authHeader.split(" ")[1];

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not defined");
    return res.status(500).json({ message: "Internal server error" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as {
      userId: number;
      email: string;
      role: string;
      sessionId: string;
      iat: number;
      exp: number;
    };

    // Check if session is still active using the correct table name and field names
    const activeSession = await prisma.$queryRaw`
      SELECT 1 FROM user_sessions 
      WHERE "accessToken" = ${payload.sessionId} 
      AND "userId" = ${payload.userId}
      AND "isActive" = 1
      AND "expiresAt" > CURRENT_TIMESTAMP
    `;

    if (!activeSession) {
      return res.status(401).json({ message: "Session expired or invalid" });
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sessionId,
    };

    next();
  } catch (error: any) {
    console.error("Authentication error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
}
