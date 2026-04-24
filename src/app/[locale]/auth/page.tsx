import { AuthPage as AuthPageComponent } from "@/features/auth/components/auth-page";

export default async function AuthRoute({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  return <AuthPageComponent />;
}
