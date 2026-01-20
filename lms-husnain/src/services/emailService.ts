import nodemailer from "nodemailer";
import { emailConfig } from "../config/email";

export class EmailService {
  private static transporter = nodemailer.createTransport(emailConfig.smtp);

  // ✅ UPDATED: Added userId parameter
  static async sendVerificationEmail(
    email: string,
    firstName: string,
    userId: string, // <--- New parameter here
    token: string
  ) {
    // ✅ UPDATED: Link now follows /verify-email/:userId/:token format
    const verificationUrl = `${emailConfig.frontendUrl}/verify-email/${userId}/${token}`;

    const mailOptions = {
      from: `${emailConfig.from.name} <${emailConfig.from.email}>`,
      to: email,
      subject: "Verify Your Email Address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to LMS Platform, ${firstName}!</h2>
          <p>Please verify your email address to activate your account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p><small>This link will expire in 24 hours.</small></p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  static async sendPasswordResetEmail(
    email: string,
    firstName: string,
    token: string
  ) {
    const resetUrl = `${emailConfig.frontendUrl}/reset-password/${token}`;

    const mailOptions = {
      from: `${emailConfig.from.name} <${emailConfig.from.email}>`,
      to: email,
      subject: "Reset Your Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello ${firstName},</p>
          <p>You requested to reset your password. Click the button below to set a new password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p><small>This link will expire in 1 hour.</small></p>
          <p><small>If you didn't request this, please ignore this email.</small></p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}