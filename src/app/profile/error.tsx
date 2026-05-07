"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/shared/ui/button";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        level: "error",
        label: "ProfileErrorBoundary",
        message: error.message,
        digest: error.digest,
        ts: new Date().toISOString(),
      }),
    );
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md w-full">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <AlertTriangle className="h-8 w-8 text-red-500 dark:text-red-400" />
        </div>

        <h1 className="text-xl font-semibold mb-2">Ошибка загрузки профиля</h1>

        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Не удалось загрузить страницу профиля. Попробуйте снова или вернитесь
          к задачам.
        </p>

        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono mb-6">
            Код ошибки: {error.digest}
          </p>
        )}

        <div className="flex gap-3 justify-center flex-wrap">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Попробовать снова
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => (window.location.href = "/")}
          >
            <ArrowLeft className="h-4 w-4" />
            К задачам
          </Button>
        </div>
      </div>
    </div>
  );
}
