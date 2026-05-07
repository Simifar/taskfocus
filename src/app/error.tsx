"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/shared/ui/button";

export default function Error({
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
        label: "AppErrorBoundary",
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

        <h1 className="text-xl font-semibold mb-2">Что-то пошло не так</h1>

        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Произошла неожиданная ошибка. Попробуйте обновить страницу — обычно
          это помогает.
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
            <Home className="h-4 w-4" />
            На главную
          </Button>
        </div>
      </div>
    </div>
  );
}
