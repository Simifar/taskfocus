import { ProfilePage } from "@/features/profile/components/profile-page";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";

export const metadata = {
  title: "Профиль - TaskFocus",
  description: "Управление профилем пользователя",
};

export default async function Page() {
  if (!(await getCurrentUser())) redirect("/login");
  return <ProfilePage />;
}
