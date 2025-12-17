import { Request, Response, NextFunction } from "express";

/**
 * Middleware to ensure request body exists
 */
export const validateBody = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      message: "Request body is required",
      error: "Invalid request: body is empty or undefined",
    });
  }
  next();
};

/**
 * Middleware to validate required fields in request body
 */
export const validateRequiredFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields: string[] = [];

    for (const field of fields) {
      if (!req.body[field] || req.body[field].trim() === "") {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Missing required fields or empty values",
        missingFields,
      });
    }

    next();
  };
};
