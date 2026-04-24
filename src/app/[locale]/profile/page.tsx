import { ProfilePage as ProfilePageComponent } from "@/features/profile/components/profile-page";

export default async function ProfileRoute({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  return <ProfilePageComponent />;
}
