import { POST_CONSTRAINTS } from "@/shared/types/post-dto";

export const validateFiles = (newFiles: File[]): string | null => {
  if (newFiles.length > POST_CONSTRAINTS.MAX_FILES) {
    return `Maximum ${POST_CONSTRAINTS.MAX_FILES} files allowed.`;
  }

  const allowedTypes = [
    ...POST_CONSTRAINTS.ALLOWED_IMAGE_TYPES,
    ...POST_CONSTRAINTS.ALLOWED_VIDEO_TYPES,
  ];

  for (const file of newFiles) {
    if (!allowedTypes.includes(file.type as any)) {
      return `File "${file.name}" has an unsupported type.`;
    }
  }

  const totalSize = newFiles.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > POST_CONSTRAINTS.MAX_TOTAL_SIZE_BYTES) {
    return `Total file size exceeds ${POST_CONSTRAINTS.MAX_TOTAL_SIZE_MB}MB.`;
  }

  return null;
};
