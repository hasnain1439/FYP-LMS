import crypto from "crypto";
import bcrypt from "bcryptjs";
import { authConfig } from "../config/auth";

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, authConfig.saltRounds);
}

export async function compareToken(
  token: string,
  hashedToken: string
): Promise<boolean> {
  return bcrypt.compare(token, hashedToken);
}

export function getExpirationDate(duration: string): Date {
  const now = new Date();
  const match = duration.match(/^(\d+)([smhd])$/);

  if (!match) {
    throw new Error("Invalid duration format");
  }

  const [, amount, unit] = match;
  const value = parseInt(amount);

  switch (unit) {
    case "s":
      return new Date(now.getTime() + value * 1000);
    case "m":
      return new Date(now.getTime() + value * 60 * 1000);
    case "h":
      return new Date(now.getTime() + value * 60 * 60 * 1000);
    case "d":
      return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
    default:
      throw new Error("Invalid duration unit");
  }
}
