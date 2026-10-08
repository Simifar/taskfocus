import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F6FF" },
    { media: "(prefers-color-scheme: dark)", color: "#172C62" },
  ],
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  || process.env.NEXTAUTH_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
const title = "TaskFocus — план задач на сегодня";
const description = "Персональный менеджер задач с Inbox, мягкими диапазонами дат и ограничением дневного плана.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "TaskFocus",
  manifest: "/manifest.webmanifest",
  keywords: ["TaskFocus", "менеджер задач", "планирование", "task manager"],
  authors: [{ name: "TaskFocus Team" }],
  icons: {
    icon: [
      { url: "/icons/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/favicon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, title: "TaskFocus", statusBarStyle: "default" },
  openGraph: {
    type: "website",
    siteName: "TaskFocus",
    locale: "ru_RU",
    title,
    description,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "TaskFocus — выбирай главное, двигайся дальше" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [{ url: "/og-image.png", alt: "TaskFocus — выбирай главное, двигайся дальше" }],
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
            <a href="#main" className="sr-only fixed top-3 left-3 z-[100] rounded-xl bg-card px-4 py-3 text-sm font-semibold shadow-lg focus:not-sr-only">Перейти к содержимому</a>
            {children}
            <Toaster position="top-center" />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
