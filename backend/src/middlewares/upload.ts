import multer from "multer";
import type { Request, Response, NextFunction } from "express";

// Constants for file upload limits
const MAX_PHOTO_COUNT = 5;
const MAX_FILES_COUNT = 5;
const MAX_VIDEO_COUNT = 2;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB per photo
const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB per video
const MAX_TOTAL_SIZE = 40 * 1024 * 1024; // 40MB total for all files

// Upload configuration for single profile photos
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

// Upload configuration for post media (photos and videos)
export const uploadPostMedia = multer({
  storage: multer.memoryStorage(),
  // limits: {
  //   files: MAX_FILES_COUNT, // Max 5 files (3 photos + 2 videos)
  // },
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/");

    if (!ok) return cb(new Error("Only images and videos are allowed"));
    cb(null, true);
  },
}).array("media");

// Validate post media limits with granular checks
export function validateTotalUploadSizeMb(maxMb: number) {
  const maxBytes = maxMb * 1024 * 1024;

  return (req: Request, res: Response, next: NextFunction) => {
    const files = ((req.files as Express.Multer.File[]) ||
      []) as Express.Multer.File[];

    const totalBytes = files.reduce((sum, f) => sum + (f?.size ?? 0), 0);

    if (totalBytes > maxBytes) {
      return res.status(413).json({
        message: `Total upload size exceeds ${maxMb}MB.`,
      });
    }

    next();
  };
}

// Legacy function - keeping for backwards compatibility
export function enforceTotalUploadSize(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const files = (req.files as Express.Multer.File[]) || [];
  const total = files.reduce((sum, f) => sum + (f.size ?? 0), 0);

  if (total > 50 * 1024 * 1024) {
    return res.status(413).json({
      message: `Total upload size exceeds 50MB. Received ${(total / (1024 * 1024)).toFixed(2)}MB.`,
    });
  }

  next();
}
