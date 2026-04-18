import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/shared/ui/sonner";
import { ThemeProvider } from "@/shared/ui/theme-provider";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskFocus - Интеллектуальный менеджер задач",
  description: "Менеджер задач для пользователей с СДВГ. Ограничение 5 активных задач на сегодня, учёт энергии, мягкие дедлайны.",
  keywords: ["TaskFocus", "СДВГ", "менеджер задач", "продуктивность", "ADHD", "task manager"],
  authors: [{ name: "TaskFocus Team" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>
            {children}
            <Toaster position="top-right" />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
