import { SettingsPage } from "@/features/profile/components/settings-page";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";

export const metadata = {
  title: "Настройки — TaskFocus",
  description: "Внешний вид и управление аккаунтом TaskFocus.",
};

export default async function Page() {
  if (!(await getCurrentUser())) redirect("/login");
  return <SettingsPage />;
}
