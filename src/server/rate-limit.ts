// NOTE: This rate limiter uses in-memory state per Vercel function instance.
// On Vercel, concurrent requests may hit different instances, so limits are
// per-instance, not globally enforced. For production-grade rate limiting,
// use Vercel KV or Upstash Redis.
// For this app the main protection comes from bcrypt cost (login) and
// validation (all routes).

type Bucket = {
  count: number;
  resetAtMs: number;
};

const buckets = new Map<string, Bucket>();

// Periodically prune stale buckets to prevent memory leaks in long-running instances
let lastPruneMs = Date.now();
function pruneStale(now: number) {
  if (now - lastPruneMs < 60_000) return;
  lastPruneMs = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAtMs <= now) buckets.delete(key);
  }
}

export function checkRateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();
  pruneStale(now);

  const existing = buckets.get(opts.key);

  if (!existing || existing.resetAtMs <= now) {
    buckets.set(opts.key, { count: 1, resetAtMs: now + opts.windowMs });
    return { ok: true };
  }

  if (existing.count >= opts.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAtMs - now) / 1000));
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
