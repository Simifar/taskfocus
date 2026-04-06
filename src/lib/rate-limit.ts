type Bucket = {
  count: number;
  resetAtMs: number;
};

const buckets = new Map<string, Bucket>();

export function checkRateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = buckets.get(opts.key);

  if (!existing || existing.resetAtMs <= now) {
    buckets.set(opts.key, { count: 1, resetAtMs: now + opts.windowMs });
    return { ok: true };
  }

  if (existing.count >= opts.limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.resetAtMs - now) / 1000)
    );
    return { ok: false, retryAfterSeconds };
  }

  existing.count += 1;
  return { ok: true };
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

