import multer from "multer";
import type { Request, Response, NextFunction } from "express";

const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50MB max (videos)
const MAX_FILES = 3;

export const uploadSingle = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype.startsWith("image/");

    if (!ok) return cb(new Error("Only images are allowed"));
    cb(null, true);
  },
});

export const uploadManyOrAny = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: MAX_FILES,
  },
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/");

    if (!ok) return cb(new Error("Only images and videos are allowed"));
    cb(null, true);
  },
}).array("media", MAX_FILES);

// Enforce TOTAL size across all files
export function enforceTotalUploadSize(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const files = (req.files as Express.Multer.File[]) || [];
  const total = files.reduce((sum, f) => sum + (f.size ?? 0), 0);

  if (total > MAX_TOTAL_BYTES) {
    return res.status(413).json({
      message: `Total upload size exceeds 50MB. Received ${(total / (1024 * 1024)).toFixed(2)}MB.`,
    });
  }

  next();
}
