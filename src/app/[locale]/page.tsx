import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth-options";

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  
  // Redirect authenticated users to dashboard
  if (session) {
    redirect(`/${locale}/dashboard`);
  }
  
  // Redirect unauthenticated users to auth page
  redirect(`/${locale}/auth`);
}
