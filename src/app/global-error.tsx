"use client";

import { useEffect } from "react";

export default function GlobalError({
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
        label: "GlobalErrorBoundary",
        message: error.message,
        digest: error.digest,
        ts: new Date().toISOString(),
      }),
    );
  }, [error]);

  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#f9fafb",
          color: "#111827",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420, padding: "2rem" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
              fontSize: "1.75rem",
            }}
          >
            ⚠️
          </div>

          <h1
            style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}
          >
            Критическая ошибка
          </h1>

          <p
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
              marginBottom: "1.5rem",
              lineHeight: 1.6,
            }}
          >
            Приложение столкнулось с неожиданной ошибкой и не смогло
            восстановиться автоматически.
          </p>

          {error.digest && (
            <p
              style={{
                fontSize: "0.75rem",
                color: "#9ca3af",
                fontFamily: "monospace",
                marginBottom: "1.5rem",
              }}
            >
              Код: {error.digest}
            </p>
          )}

          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1.25rem",
              background: "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Перезагрузить приложение
          </button>
        </div>
      </body>
    </html>
  );
}
