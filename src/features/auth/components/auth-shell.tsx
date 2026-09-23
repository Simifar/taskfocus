"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Check, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export type AuthMode = "login" | "register";

interface AuthShellProps {
  mode: AuthMode;
  googleEnabled: boolean;
  isGoogleLoading: boolean;
  isBusy: boolean;
  onGoogleSignIn: () => void;
  children: ReactNode;
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function AuthShell({
  mode,
  googleEnabled,
  isGoogleLoading,
  isBusy,
  onGoogleSignIn,
  children,
}: AuthShellProps) {
  const isLogin = mode === "login";

  return (
    <main className="relative min-h-svh overflow-hidden bg-[#f4f8f5] text-foreground dark:bg-[#09110d]">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-[-5rem] h-[28rem] w-[28rem] rounded-full bg-emerald-300/15 blur-3xl dark:bg-emerald-900/20" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="relative mx-auto flex min-h-svh w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-10">
        <header className="flex items-center justify-between">
          <Link href="/login" className="group inline-flex items-center gap-2.5 rounded-full focus-visible:outline-none">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground p-1.5 shadow-sm transition-transform group-hover:-rotate-3 dark:bg-white">
              <Image src="/logo.svg" alt="" width={24} height={24} priority />
            </span>
            <span className="text-sm font-semibold tracking-tight">TaskFocus</span>
          </Link>

          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Ваши задачи — в вашем ритме
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center py-10 lg:justify-start lg:pl-[10%]">
          <section className="w-full max-w-[460px]">
            <div className="mb-7 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand dark:bg-brand/15">
                <Sparkles className="h-3.5 w-3.5" />
                {isLogin ? "Фокус продолжается" : "Начните с простого"}
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                  {isLogin ? "С возвращением" : "Новый день — новый фокус"}
                </h1>
                <p className="max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
                  {isLogin
                    ? "Войдите, чтобы продолжить свой план на сегодня."
                    : "Создайте аккаунт и начните с небольшого плана на сегодня."}
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border/80 bg-card/90 p-4 shadow-[0_24px_80px_-32px_rgba(16,64,38,0.45)] backdrop-blur-xl sm:p-6 dark:bg-card/80">
              {googleEnabled && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full gap-3 rounded-xl border-border/80 bg-background/70 text-sm font-semibold shadow-none hover:border-brand/40 hover:bg-brand/5"
                    onClick={onGoogleSignIn}
                    disabled={isBusy}
                  >
                    {isGoogleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                    Продолжить с Google
                  </Button>

                  <div className="my-5 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />
                    или
                    <span className="h-px flex-1 bg-border" />
                  </div>
                </>
              )}

              {children}
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isLogin ? "Впервые в TaskFocus?" : "Уже есть аккаунт?"}{" "}
              <Link
                href={isLogin ? "/register" : "/login"}
                className="font-semibold text-foreground underline decoration-brand/40 underline-offset-4 transition-colors hover:text-brand"
              >
                {isLogin ? "Создать аккаунт" : "Войти"}
                <ArrowUpRight className="ml-0.5 inline h-3.5 w-3.5" />
              </Link>
            </p>

            <div className="mt-8 flex items-center justify-center gap-2 text-center text-[11px] leading-5 text-muted-foreground/80">
              <Check className="h-3.5 w-3.5 text-brand" />
              Небольшой план. Понятный следующий шаг.
            </div>
          </section>
        </div>

        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute right-[7%] top-1/2 hidden w-64 -translate-y-1/2 rotate-2 xl:block",
            isLogin ? "opacity-95" : "opacity-80",
          )}
        >
          <div className="rounded-[2rem] border border-white/80 bg-white/65 p-4 shadow-[0_30px_90px_-36px_rgba(16,64,38,0.6)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Сегодня</p>
                <p className="mt-1 text-lg font-semibold tracking-tight">Ваш фокус</p>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Sparkles className="h-4 w-4" />
              </span>
            </div>
            <div className="space-y-2.5">
              {["Главное дело дня", "Небольшой следующий шаг", "Оставить место для себя"].map((item, index) => (
                <div key={item} className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-background/60 px-3 py-2.5 dark:bg-background/20">
                  <span className={cn("h-2 w-2 rounded-full", index === 0 ? "bg-brand" : "bg-muted-foreground/30")} />
                  <span className="truncate text-xs font-medium">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[42%] rounded-full bg-brand" />
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">42% спокойного прогресса</p>
          </div>
        </div>
      </div>
    </main>
  );
}
