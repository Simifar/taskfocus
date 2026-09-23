import { Suspense } from "react";

import { AuthPage } from "@/features/auth/components/auth-page";

export default function RegisterPage() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <Suspense fallback={<div className="min-h-svh bg-[#f4f8f5] dark:bg-[#09110d]" />}>
      <AuthPage mode="register" googleEnabled={googleEnabled} />
    </Suspense>
  );
}
