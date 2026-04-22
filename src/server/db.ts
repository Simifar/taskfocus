import { PrismaClient } from "@prisma/client";

// In serverless (Vercel), each function instance has its own memory.
// The global singleton only matters in dev to prevent hot-reload from
// creating thousands of PrismaClient instances.
//
// For Neon: DATABASE_URL must include connection_limit=1 to prevent
// exhausting Neon's connection limit across concurrent function instances.
// Example: postgresql://user:pass@host/db?sslmode=require&connection_limit=1&connect_timeout=30

function buildDatasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  // Append Neon-recommended serverless parameters if not already present
  const sep = url.includes("?") ? "&" : "?";
  const extras: string[] = [];
  if (!url.includes("connection_limit")) extras.push("connection_limit=1");
  if (!url.includes("connect_timeout")) extras.push("connect_timeout=30");
  if (!url.includes("pool_timeout")) extras.push("pool_timeout=30");
  return extras.length ? `${url}${sep}${extras.join("&")}` : url;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
    datasourceUrl: buildDatasourceUrl(),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
