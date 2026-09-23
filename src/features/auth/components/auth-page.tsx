"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";

import { AuthShell, type AuthMode } from "@/features/auth/components/auth-shell";
import { useLogin, useRegister } from "@/features/auth/hooks";
import { ApiError } from "@/shared/lib/fetcher";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

interface AuthPageProps {
  mode: AuthMode;
  googleEnabled: boolean;
}

function describe(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message;
  return fallback;
}

function describeOAuthError(code: string | null): string | null {
  if (!code) return null;

  switch (code) {
    case "OAuthSignin":
    case "OAuthCallback":
    case "OAuthCreateAccount":
    case "Callback":
      return "Не удалось завершить вход через Google. Попробуйте ещё раз.";
    case "AccessDenied":
      return "Вход через Google был отменён или отклонён.";
    case "Configuration":
      return "Вход через Google временно недоступен.";
    default:
      return "Не удалось выполнить вход через Google.";
  }
}

export function AuthPage({ mode, googleEnabled }: AuthPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLogin = mode === "login";
  const login = useLogin();
  const register = useRegister();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const visibleError = error ?? describeOAuthError(searchParams.get("error"));
  const isLoading = login.isPending || register.isPending || isGoogleLoading;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      if (isLogin) {
        await login.mutateAsync({ email, password });
        toast.success("Добро пожаловать!");
      } else {
        await register.mutateAsync({ email, username, password, name });
        toast.success("Аккаунт создан. Добро пожаловать!");
      }
      router.replace("/");
    } catch (err) {
      setError(describe(err, "Не удалось выполнить запрос. Попробуйте ещё раз."));
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);

    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (err) {
      setError(describe(err, "Не удалось выполнить вход через Google."));
      setIsGoogleLoading(false);
    }
  };

  return (
    <AuthShell
      mode={mode}
      googleEnabled={googleEnabled}
      isGoogleLoading={isGoogleLoading}
      isBusy={isLoading}
      onGoogleSignIn={handleGoogleSignIn}
    >
      <form onSubmit={handleSubmit} className="space-y-5" aria-label={isLogin ? "Вход в TaskFocus" : "Регистрация в TaskFocus"}>
        {visibleError && (
          <Alert variant="destructive" role="alert" aria-live="polite" className="rounded-xl">
            <AlertDescription>{visibleError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor={`${mode}-email`} className="text-sm font-semibold">
            Email
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={`${mode}-email`}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 rounded-xl pl-10"
              required
            />
          </div>
        </div>

        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="register-username" className="text-sm font-semibold">
              Имя пользователя
            </Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="register-username"
                type="text"
                autoComplete="username"
                placeholder="например, focused-user"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="h-12 rounded-xl pl-10"
                minLength={3}
                required
              />
            </div>
            <p className="text-xs leading-5 text-muted-foreground">Минимум 3 символа. Это имя будет видно в профиле.</p>
          </div>
        )}

        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="register-name" className="text-sm font-semibold">
              Как к вам обращаться <span className="font-normal text-muted-foreground">— необязательно</span>
            </Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="register-name"
                type="text"
                autoComplete="name"
                placeholder="Иван"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-12 rounded-xl pl-10"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={`${mode}-password`} className="text-sm font-semibold">
              Пароль
            </Label>
            <span className="text-xs text-muted-foreground">Минимум 8 символов</span>
          </div>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={`${mode}-password`}
              type={showPassword ? "text" : "password"}
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder="Введите пароль"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 rounded-xl pl-10 pr-12"
              minLength={8}
              required
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="h-12 w-full rounded-xl bg-brand text-sm font-semibold text-brand-foreground shadow-[0_12px_24px_-12px_var(--brand)] transition-transform hover:bg-brand/90 active:scale-[0.99]"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLogin ? "Войти в TaskFocus" : "Создать аккаунт"}
        </Button>
      </form>
    </AuthShell>
  );
}
