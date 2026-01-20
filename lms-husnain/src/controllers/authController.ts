import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { authConfig } from "../config/auth";
import { db } from "../config/database";
import { userSessionsTable, usersTable } from "../db/schema";
import { EmailService } from "../services/emailService";
import { FaceService } from "../services/faceService";
import { AuthResponse, JWTPayload } from "../types/auth";
import { comparePassword, hashPassword } from "../utils/password";
import { generateUniqueRollNumber } from "../utils/rollNumber";
import {
  compareToken,
  generateSecureToken,
  getExpirationDate,
  hashToken,
} from "../utils/tokenUtils";

export class AuthController {
  // 1. REGISTER
 static async register(req: Request, res: Response) {
    try {
      const { email, password, role, firstName, lastName } = req.body;
      const faceImage = req.file;

      const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));
      if (existingUser.length > 0) {
        return res.status(409).json({ error: "Email already registered" });
      }

      let generatedRollNumber: string | null = null;
      if (role === "student") {
        generatedRollNumber = await generateUniqueRollNumber();
      }

      if (!faceImage) {
        return res.status(400).json({
          error: "Face image required",
          details: "Face image is required for registration to enable face recognition login",
        });
      }

      let faceEmbedding: number[] | null = null;
      const faceResult = await FaceService.detectFace(faceImage.buffer);
      console.log("Face detection result:", faceResult);

      if (!faceResult.success || !faceResult.embedding) {
        return res.status(400).json({
          error: "Face detection failed",
          details: faceResult.message || "No face detected in image.",
        });
      }
      faceEmbedding = faceResult.embedding;

      const hashedPassword = await hashPassword(password);
      const verificationToken = generateSecureToken();
      const hashedVerificationToken = await hashToken(verificationToken);

      const [newUser] = await db
        .insert(usersTable)
        .values({
          email,
          password: hashedPassword,
          role,
          firstName,
          lastName,
          rollNumber: generatedRollNumber,
          faceEmbedding,
          emailVerificationToken: hashedVerificationToken,
          emailVerificationExpires: getExpirationDate(authConfig.emailVerificationExpires),
        })
        .returning();

      // ✅ FIX: Passed newUser.id as the 3rd argument
      await EmailService.sendVerificationEmail(
        email,
        firstName,
        newUser.id, 
        verificationToken 
      );

      const tokens = await AuthController.generateTokens(newUser);

      const response: AuthResponse = {
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          rollNumber: newUser.rollNumber,
          profilePicture: newUser.profilePicture,
          isActive: newUser.isActive,
          createdAt: newUser.createdAt,
          updatedAt: newUser.updatedAt,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };

      res.status(201).json(response);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
  // 2. LOGIN
  static async login(req: Request, res: Response) {
    try {
      const { email, rollNumber, password } = req.body;
      const faceImage = req.file;

      if (!email && !rollNumber) {
        return res.status(400).json({
          error: "Login method required",
          details: "Provide email/rollNumber with password, or face image",
        });
      }

      let user;
      if (email) {
        const [foundUser] = await db.select().from(usersTable).where(eq(usersTable.email, email));
        user = foundUser;
      } else if (rollNumber) {
        const [foundUser] = await db.select().from(usersTable).where(eq(usersTable.rollNumber, rollNumber));
        user = foundUser;
      }

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      if (!user.isActive) {
        return res.status(401).json({
          error: "Email not verified",
          details: "Please check your email and verify your account",
        });
      }

      let faceVerificationResult = null;

      if (faceImage && user.faceEmbedding) {
        const faceResult = await FaceService.verifyFace(faceImage.buffer, user.faceEmbedding);
        if (!faceResult.success || faceResult.confidence < 0.5) {
          return res.status(401).json({
            error: "Face verification failed",
            details: faceResult.message,
          });
        }
        faceVerificationResult = {
          success: faceResult.success,
          confidence: faceResult.confidence,
          similarity: faceResult.similarity,
          verified: faceResult.is_match,
          message: faceResult.message,
        };
      } else if (password) {
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ error: "Invalid credentials" });
        }
      } else {
        return res.status(400).json({
          error: "Invalid login method",
          details: "Provide either password or face image",
        });
      }

      const tokens = await AuthController.generateTokens(user);

      res.cookie("accessToken", tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 1000,
      });

      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const response = {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          rollNumber: user.rollNumber,
          profilePicture: user.profilePicture,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        message: "Login successful",
        // ✅ Added this to support your frontend which expects 'token' in body
        token: tokens.accessToken, 
      };

      if (faceVerificationResult) {
        (response as any).faceVerification = faceVerificationResult;
      }

      res.json(response);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // 3. REFRESH TOKEN (Fixed Security & Logic)
  static async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token required" });
      }

      const [session] = await db
        .select()
        .from(userSessionsTable)
        .where(eq(userSessionsTable.refreshToken, refreshToken));

      if (!session || session.expiresAt < new Date()) {
        return res.status(401).json({ error: "Invalid or expired refresh token" });
      }

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, session.userId));

      if (!user || !user.isActive) {
        return res.status(401).json({ error: "User not found or inactive" });
      }

      // ✅ FIX: Delete the old session (Token Rotation)
      await db
        .delete(userSessionsTable)
        .where(eq(userSessionsTable.refreshToken, refreshToken));

      // Generate new tokens
      const tokens = await AuthController.generateTokens(user);

      // ✅ FIX: Set new Cookies
      res.cookie("accessToken", tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 1000,
      });

      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // 4. GET PROFILE
  static async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user!.userId;

      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
      if (!user) return res.status(404).json({ error: "User not found" });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          rollNumber: user.rollNumber,
          profilePicture: user.profilePicture,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

 // 5. UPDATE PROFILE
  static async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user!.userId;
      const { firstName, lastName } = req.body; // Now this will work because of Multer!

      const updateData: any = { updatedAt: new Date() };
      
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;

      // ✅ Handle Image Upload
      if (req.file) {
        // Construct the full URL for the image
        const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        updateData.profilePicture = imageUrl;
      }

      const [updatedUser] = await db
        .update(usersTable)
        .set(updateData)
        .where(eq(usersTable.id, userId))
        .returning();

      res.json({
        success: true,
        user: updatedUser, // Return the raw user object or map fields like you did before
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // 6. LOGOUT
  static async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (refreshToken) {
        await db.delete(userSessionsTable).where(eq(userSessionsTable.refreshToken, refreshToken));
      }

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // 7. VERIFY EMAIL (Optimized)
  // ⚠️ Requirement: Route must be /verify-email/:userId/:token
  static async verifyEmail(req: Request, res: Response) {
    try {
      const { userId, token } = req.params;

      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

      if (!user) return res.status(404).json({ error: "User not found" });
      if (user.isActive) return res.status(400).json({ error: "Email already verified" });
      if (!user.emailVerificationToken || !user.emailVerificationExpires) {
        return res.status(400).json({ error: "No verification pending" });
      }

      const isValidToken = await compareToken(token, user.emailVerificationToken);
      if (isValidToken && user.emailVerificationExpires > new Date()) {
        await db
          .update(usersTable)
          .set({
            isActive: true,
            emailVerificationToken: null,
            emailVerificationExpires: null,
          })
          .where(eq(usersTable.id, user.id));

        return res.json({ message: "Email verified successfully" });
      }

      res.status(400).json({ error: "Invalid or expired verification token" });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // 8. RESEND VERIFICATION
  static async resendVerification(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

      if (!user) return res.status(404).json({ error: "User not found" });
      if (user.isActive) return res.status(400).json({ error: "Email already verified" });

      const verificationToken = generateSecureToken();
      const hashedVerificationToken = await hashToken(verificationToken);

      await db
        .update(usersTable)
        .set({
          emailVerificationToken: hashedVerificationToken,
          emailVerificationExpires: getExpirationDate(authConfig.emailVerificationExpires),
        })
        .where(eq(usersTable.id, user.id));

      await EmailService.sendVerificationEmail(email, user.firstName, user.id,verificationToken);
      res.json({ message: "Verification email sent" });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // 9. FORGOT PASSWORD
  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

      if (!user) return res.json({ message: "If email exists, reset link has been sent" });

      const resetToken = generateSecureToken();
      const hashedResetToken = await hashToken(resetToken);

      await db
        .update(usersTable)
        .set({
          passwordResetToken: hashedResetToken,
          passwordResetExpires: getExpirationDate(authConfig.passwordResetExpires),
        })
        .where(eq(usersTable.id, user.id));

      // TODO: Ensure EmailService uses user.id in the link: /reset-password/${user.id}/${resetToken}
      await EmailService.sendPasswordResetEmail(email, user.firstName, resetToken);

      res.json({ message: "If email exists, reset link has been sent" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // 10. RESET PASSWORD (Optimized)
  // ⚠️ Requirement: Route must be /reset-password/:userId/:token
  static async resetPassword(req: Request, res: Response) {
    try {
      const { userId, token } = req.params;
      const { password } = req.body;

      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

      if (!user || !user.passwordResetToken || !user.passwordResetExpires) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const isValidToken = await compareToken(token, user.passwordResetToken);
      if (isValidToken && user.passwordResetExpires > new Date()) {
        const hashedPassword = await hashPassword(password);

        await db
          .update(usersTable)
          .set({
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpires: null,
          })
          .where(eq(usersTable.id, user.id));

        // ✅ Security: Kill all sessions
        await db.delete(userSessionsTable).where(eq(userSessionsTable.userId, user.id));

        return res.json({ message: "Password reset successfully" });
      }

      res.status(400).json({ error: "Invalid or expired reset token" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // 11. CHANGE PASSWORD
  static async changePassword(req: Request, res: Response) {
    try {
      if (!req.body?.currentPassword || !req.body?.newPassword) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = (req as any).user?.userId;

      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
      if (!user) return res.status(404).json({ error: "User not found" });

      const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      const hashedPassword = await hashPassword(newPassword);

      await db
        .update(usersTable)
        .set({ password: hashedPassword })
        .where(eq(usersTable.id, userId));

      await db.delete(userSessionsTable).where(eq(userSessionsTable.userId, userId));

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      return res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // HELPER: GENERATE TOKENS
  private static async generateTokens(user: any) {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, authConfig.jwtSecret, { expiresIn: "1hr" });
    const refreshToken = jwt.sign(payload, authConfig.jwtSecret, { expiresIn: "7d" });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(userSessionsTable).values({
      userId: user.id,
      refreshToken,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }
}