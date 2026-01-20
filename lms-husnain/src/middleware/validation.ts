import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        ...req.body,
        ...req.params,
        ...req.query,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }));

        return res.status(400).json({
          error: "Validation failed",
          details: errors,
        });
      }

      return res.status(500).json({ error: "Internal server error" });
    }
  };
};


export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }));
        return res.status(400).json({
          error: "Invalid URL parameters",
          details: errors,
        });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  };
};
