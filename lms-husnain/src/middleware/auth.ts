import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { authConfig } from "../config/auth";
import { JWTPayload } from "../types/auth";
import { db } from "../config/database";
import { usersTable, userSessionsTable } from "../db/schema";

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Gets "eyJ..." part

  if (!token) {
    console.log("❌ Middleware: No token found");
    return res.sendStatus(401);
  }

  // 👇 CRITICAL FIX: Use authConfig.jwtSecret (not process.env directly)
  jwt.verify(token, authConfig.jwtSecret, (err: any, user: any) => {
    if (err) {
      console.log("❌ Middleware: Token verification failed:", err.message);
      // If you see "invalid signature" in terminal, it means secrets didn't match
      return res.sendStatus(403);
    }

    // Token is good! Attach user to request
    req.user = user;
    next();
  });
};
export const authorizeRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};
