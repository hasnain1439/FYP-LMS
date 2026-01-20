import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "teacher"], {
    errorMap: () => ({ message: "Role must be student or teacher" }),
  }),
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
});

export const loginSchema = z
  .object({
    email: z.string().email().optional(),
    rollNumber: z.string().optional(),
    password: z.string().min(1, "Password is required").optional(),
  })
  .refine((data) => data.email || data.rollNumber, {
    message: "Either email or rollNumber is required",
    path: ["email"],
  })
  .refine((data) => data.password || data.email || data.rollNumber, {
    message: "Password is required for credential-based login",
    path: ["password"],
  });

export const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(1, "First name cannot be empty").optional(),
  lastName: z.string().trim().min(1, "Last name cannot be empty").optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const resendVerificationSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
