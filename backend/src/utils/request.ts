/**
 * Safely extracts a string value from req.params, req.query, or req.body.
 * Handles the case where Express (or a proxy) may return an array.
 */
export function getString(value: unknown): string | undefined {
  if (Array.isArray(value)) return value[0];
  if (typeof value === "string") return value;
  return undefined;
}

/**
 * Safely extracts a boolean value from req.body.
 * Accepts actual booleans and the strings "true" / "false".
 */
export function getBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

/**
 * Safely extracts a numeric value from req.query or req.body.
 * Returns undefined if the value cannot be converted to a finite number.
 */
export function getNumber(value: unknown): number | undefined {
  const n = Number(value);
  return isFinite(n) ? n : undefined;
}
