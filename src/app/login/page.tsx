"use client";

import { Suspense } from "react";

import { AuthPage } from "@/features/auth/components/auth-page";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AuthPage />
    </Suspense>
  );
}
