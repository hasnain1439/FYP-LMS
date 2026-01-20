import { Request, Response } from "express";
import { db } from "../config/database";
import { usersTable } from "../db/schema";
import { eq } from "drizzle-orm";
import FormData from "form-data";
import axios from "axios";
import fs from "fs";

export class UserController {

  // ✅ Update Profile Picture & Generate Face ID
  static async updateProfilePicture(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No image file provided." });
      }

      // 1. Send Image to Python to Generate Face Embedding
      let faceEmbedding = null;
      try {
        const formData = new FormData();
        // Convert buffer to file stream-like object for FormData
        formData.append('image', file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });

        const aiResponse = await axios.post("http://localhost:8000/generate-embedding", formData, {
          headers: { ...formData.getHeaders() },
        });

        if (aiResponse.data.success) {
          faceEmbedding = aiResponse.data.embedding; // Array of 512 floats
          console.log(`✅ Face ID generated for User ${userId}`);
        } else {
          console.warn("⚠️ AI Service Warning:", aiResponse.data.message);
          // Optional: Return error if you want to enforce strict "Face required on profile"
          // return res.status(400).json({ error: "No face detected. Please upload a clear photo." });
        }

      } catch (aiError) {
        console.error("❌ AI Service Offline:", aiError.message);
        // Continue saving image even if AI fails? Up to you. 
        // For a Face-First LMS, you might want to stop here.
      }

      // 2. Save File Path & Embedding to Database
      // Assuming you handle file upload storage (disk/s3) and get a path:
      const filePath = `/uploads/${file.filename}`; // Or however your upload middleware saves it

      await db.update(usersTable)
        .set({ 
          profilePicture: filePath,
          faceEmbedding: faceEmbedding, // ✅ Saving the vector
          updatedAt: new Date()
        })
        .where(eq(usersTable.id, userId));

      res.json({
        success: true,
        message: "Profile picture updated and Face ID registered successfully.",
        profilePicture: filePath,
        faceRegistered: !!faceEmbedding
      });

    } catch (error) {
      console.error("Update Profile Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}