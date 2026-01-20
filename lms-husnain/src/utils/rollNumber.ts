import { db } from "../config/database";
import { usersTable } from "../db/schema";
import { eq } from "drizzle-orm";

export const generateUniqueRollNumber = async (): Promise<string> => {
  const maxAttempts = 10;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const rollNumber = generateRollNumber();

    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.rollNumber, rollNumber));

    if (existingUser.length === 0) {
      return rollNumber;
    }

    attempts++;
  }

  throw new Error(
    "Unable to generate unique roll number after maximum attempts"
  );
};

const generateRollNumber = (): string => {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const randomNumber = Math.floor(Math.random() * 9000) + 1000; // 4-digit random number
  return `RN${currentYear}${randomNumber}`;
};
