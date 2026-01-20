import bcrypt from "bcryptjs";
import { authConfig } from "../config/auth";

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, authConfig.saltRounds);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
