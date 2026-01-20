import dotenv from "dotenv";
dotenv.config();

export const authConfig = {
  // 🔴 FIX: Hardcode the secret temporarily. 
  // This ensures AuthController and Middleware match 100%.
  jwtSecret: "MY_SUPER_SECRET_DEBUG_KEY_12345", 

  // Keep the rest of your settings
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  emailVerificationExpires: process.env.EMAIL_VERIFICATION_EXPIRES || "24h",
  passwordResetExpires: process.env.PASSWORD_RESET_EXPIRES || "1h",
  saltRounds: 12,
};

if (!authConfig.jwtSecret) {
  throw new Error("JWT_SECRET is required");
}