"use client";

import Link from "next/link";
import { ArrowLeft, Settings2, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { BrandLogo } from "@/shared/ui/brand-logo";

type AccountSection = "profile" | "settings";

interface AccountShellProps {
  section: AccountSection;
  title: string;
  description: string;
  children: ReactNode;
}

const sectionLink = {
  profile: { href: "/settings", label: "Настройки", icon: Settings2 },
  settings: { href: "/profile", label: "Профиль", icon: UserRound },
} as const;

export function AccountShell({ section, title, description, children }: AccountShellProps) {
  const nextPage = sectionLink[section];
  const NextIcon = nextPage.icon;

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-brand"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>К задачам</span>
          </Link>
          <BrandLogo className="w-[140px]" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-12 pt-7 sm:px-6 sm:pt-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand">
              {section === "profile" ? "Ваш аккаунт" : "Предпочтения и доступ"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
          </div>
          <Link
            href={nextPage.href}
            className="inline-flex min-h-10 w-fit shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <NextIcon className="size-4" aria-hidden="true" />
            {nextPage.label}
          </Link>
        </div>

        <div className="pt-6">{children}</div>
      </main>
    </div>
  );
}
