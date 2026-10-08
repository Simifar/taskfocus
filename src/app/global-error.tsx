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
      <head><title>TaskFocus — ошибка приложения</title><style>{`:root{--status-bg:#F3F6FF;--status-fg:#172C62;--status-muted:#536382} @media(prefers-color-scheme:dark){:root{--status-bg:#0C1430;--status-fg:#F2F5FF;--status-muted:#ADBADA}} button:focus-visible{outline:3px solid #85A4FF;outline-offset:4px}`}</style></head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "var(--status-bg)",
          color: "var(--status-fg)",
        }}
      >
        <main id="main" style={{ textAlign: "center", maxWidth: 420, padding: "2rem" }}>
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
              color: "var(--status-muted)",
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
                color: "var(--status-muted)",
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
              padding: "0.875rem 1.25rem",
              background: "#3156CA",
              color: "#fff",
              border: "none",
              borderRadius: "0.75rem",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Перезагрузить приложение
          </button>
        </main>
      </body>
    </html>
  );
}
