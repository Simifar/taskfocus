import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/shared/ui/brand-logo";
import { ThemeToggle } from "@/shared/ui/theme-toggle";

/** Shared frame for recovery, errors and missing pages. */
export function StatusShell({ children }: { children: ReactNode }) {
  return (
    <main id="main" tabIndex={-1} className="flex min-h-svh flex-col bg-background px-4 py-5">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
        <Link href="/" aria-label="TaskFocus — к задачам"><BrandLogo /></Link>
        <ThemeToggle />
      </header>
      <div className="flex flex-1 items-center justify-center py-10">
        <section className="workspace-panel workspace-enter w-full max-w-md p-6 text-center sm:p-8">
          {children}
        </section>
      </div>
    </main>
  );
}
