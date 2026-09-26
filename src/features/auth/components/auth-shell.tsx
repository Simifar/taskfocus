"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Check, Loader2 } from "lucide-react";

import { Button } from "@/shared/ui/button";

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
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

const steps = [
  { number: "01", title: "Соберите всё", text: "Запишите мысли во Входящие, не раскладывая их по полочкам." },
  { number: "02", title: "Оставьте главное", text: "Выберите до пяти задач на сегодня и уберите остальное с глаз." },
  { number: "03", title: "Начните с одной", text: "Откройте фокус-сессию и сохраните прогресс, когда закончите." },
];

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
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto grid min-h-svh w-full max-w-7xl gap-5 px-4 py-4 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)] lg:gap-8 lg:px-8">
        <div className="flex min-w-0 flex-col">
          <header className="flex items-center justify-between">
            <Link href="/login" className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand p-1.5">
                <Image src="/logo.svg" alt="" width={24} height={24} priority />
              </span>
              <span className="text-sm font-semibold tracking-tight">TaskFocus</span>
            </Link>
            <span className="hidden text-xs text-muted-foreground sm:block">Ваши задачи — в вашем ритме</span>
          </header>

          <div className="flex flex-1 items-center justify-center py-8 lg:py-12">
            <section className="w-full max-w-[440px]">
              <div className="mb-6 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                  {isLogin ? "Ваш план продолжается" : "Начните с простого"}
                </p>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">
                    {isLogin ? "С возвращением" : "Новый день — новый фокус"}
                  </h1>
                  <p className="max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
                    {isLogin
                      ? "Войдите, чтобы продолжить свой план на сегодня."
                      : "Создайте аккаунт и начните с небольшого плана на сегодня."}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                {googleEnabled && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full gap-3 rounded-lg bg-background text-sm font-medium shadow-none"
                      onClick={onGoogleSignIn}
                      disabled={isBusy}
                    >
                      {isGoogleLoading ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
                      Продолжить с Google
                    </Button>
                    <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="h-px flex-1 bg-border" />
                      или
                      <span className="h-px flex-1 bg-border" />
                    </div>
                  </>
                )}
                {children}
              </div>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                {isLogin ? "Впервые в TaskFocus?" : "Уже есть аккаунт?"}{" "}
                <Link
                  href={isLogin ? "/register" : "/login"}
                  className="font-semibold text-foreground underline decoration-brand/50 underline-offset-4 transition-colors hover:text-brand"
                >
                  {isLogin ? "Создать аккаунт" : "Войти"}
                  <ArrowUpRight className="ml-0.5 inline size-3.5" aria-hidden="true" />
                </Link>
              </p>
              <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                <Check className="size-3.5 shrink-0 text-brand" aria-hidden="true" />
                Небольшой план. Понятный следующий шаг.
              </p>
            </section>
          </div>
        </div>

        <aside className="relative hidden flex-col justify-between overflow-hidden rounded-3xl bg-auth-panel p-9 text-auth-panel-foreground lg:flex xl:p-12">
          <div className="relative z-10 max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-auth-panel-foreground/60">Спокойный рабочий ритм</p>
            <h2 className="mt-6 max-w-md text-4xl font-medium leading-[1.08] tracking-[-0.04em] xl:text-5xl">
              Меньше планировать. Больше делать.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-auth-panel-foreground/70">
              TaskFocus помогает освободить голову, выбрать важное и удержать внимание на одном следующем шаге.
            </p>
          </div>

          <ol className="relative z-10 mt-12 space-y-0">
            {steps.map((step) => (
              <li key={step.number} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-t border-auth-panel-foreground/15 py-4">
                <span className="pt-0.5 font-mono text-xs tabular-nums text-auth-panel-foreground/50">{step.number}</span>
                <div>
                  <h3 className="text-sm font-semibold text-auth-panel-foreground">{step.title}</h3>
                  <p className="mt-1 max-w-sm text-xs leading-5 text-auth-panel-foreground/65">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="relative z-10 mt-8 text-xs text-auth-panel-foreground/55">Без бесконечного списка. Без необходимости всё успеть.</p>
        </aside>
      </div>
    </main>
  );
}
