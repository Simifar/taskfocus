import { access, cp, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const standaloneRoot = join(projectRoot, ".next", "standalone");
const serverPath = join(standaloneRoot, "server.js");
const staticSource = join(projectRoot, ".next", "static");
const envFiles = [".env", ".env.production", ".env.local", ".env.production.local"];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(serverPath)) || !(await exists(staticSource))) {
  console.error("Production build not found. Run `npm run build` before `npm run start`.");
  process.exitCode = 1;
} else {
  const standaloneNext = join(standaloneRoot, ".next");
  await mkdir(standaloneNext, { recursive: true });
  await cp(staticSource, join(standaloneNext, "static"), { recursive: true, force: true });

  const publicSource = join(projectRoot, "public");
  if (await exists(publicSource)) {
    await cp(publicSource, join(standaloneRoot, "public"), { recursive: true, force: true });
  }

  const envArguments = [];
  for (const envFile of envFiles) {
    const envFilePath = join(projectRoot, envFile);
    if (await exists(envFilePath)) envArguments.push(`--env-file=${envFilePath}`);
  }

  const server = spawn(process.execPath, [...envArguments, serverPath], {
    cwd: standaloneRoot,
    env: process.env,
    stdio: "inherit",
    windowsHide: true,
  });

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      if (!server.killed) server.kill(signal);
    });
  }

  server.on("error", (error) => {
    console.error("Could not start the standalone server:", error);
    process.exitCode = 1;
  });

  server.on("exit", (code, signal) => {
    process.exitCode = code ?? (signal === "SIGINT" ? 0 : 1);
  });
}
