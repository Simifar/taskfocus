"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Settings2, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

const accountLinks = [
  { href: "/profile", label: "Профиль", icon: UserRound },
  { href: "/settings", label: "Настройки", icon: Settings2 },
] as const;

interface AccountShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function AccountShell({ title, description, children }: AccountShellProps) {
  const pathname = usePathname();

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
          <span className="text-xs font-medium text-muted-foreground">TaskFocus</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-12 pt-7 sm:px-6 sm:pt-10">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand">Ваш аккаунт</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
        </div>

        <nav aria-label="Настройки аккаунта" className="mt-7 border-b border-border">
          <div className="flex gap-1 overflow-x-auto">
            {accountLinks.map(({ href, label, icon: Icon }) => {
              const isCurrent = pathname === href;

              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand",
                    isCurrent && "border-brand text-foreground",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="pt-6">{children}</div>
      </main>
    </div>
  );
}
