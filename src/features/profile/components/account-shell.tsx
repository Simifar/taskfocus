"use client";

import Link from "next/link";
import { ArrowLeft, Settings2, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { BrandLogo } from "@/shared/ui/brand-logo";
import { ThemeToggle } from "@/shared/ui/theme-toggle";

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
      <header className="sticky top-0 z-20 border-b border-border/80 bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-brand sm:gap-2 sm:px-2"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>К задачам</span>
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <BrandLogo className="w-[128px] sm:w-[140px]" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="workspace-enter mx-auto max-w-6xl px-4 pb-12 pt-7 sm:px-6 sm:pt-10">
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

        <nav aria-label="Разделы аккаунта" className="mt-7 flex gap-1 border-b border-border pb-3">
          {[
            { href: "/profile", label: "Профиль", key: "profile" },
            { href: "/settings", label: "Настройки", key: "settings" },
          ].map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={section === item.key ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-medium ${section === item.key ? "bg-brand-soft text-brand" : "text-muted-foreground hover:bg-muted"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="pt-6">{children}</div>
      </main>
    </div>
  );
}
