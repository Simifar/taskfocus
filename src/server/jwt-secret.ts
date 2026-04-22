export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET env var is missing or too short (need 32+ chars)");
  }
  return new TextEncoder().encode(secret);
}
