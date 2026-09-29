"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarCheck,
  Check,
  Laptop,
  Loader2,
  Mail,
  Moon,
  Sun,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { useCurrentUser, useDeleteAccount } from "@/features/auth/hooks";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { AccountShell } from "./account-shell";
import { cn } from "@/shared/lib/utils";

const themeOptions = [
  { value: "system", label: "Как в системе", description: "Следовать настройке устройства", icon: Laptop },
  { value: "light", label: "Светлая", description: "Светлый фон и спокойные акценты", icon: Sun },
  { value: "dark", label: "Тёмная", description: "Тёмная тема для низкой освещённости", icon: Moon },
] as const;

const subscribeToNothing = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribeToNothing, getClientSnapshot, getServerSnapshot);

  return (
    <Card className="gap-0 overflow-hidden rounded-2xl shadow-none">
      <CardHeader className="border-b border-border px-5 py-4 sm:px-6">
        <CardTitle className="text-base">Внешний вид</CardTitle>
        <p className="text-sm text-muted-foreground">Выберите тему для рабочего пространства.</p>
      </CardHeader>
      <CardContent className="px-5 py-5 sm:px-6">
        <fieldset>
          <legend className="sr-only">Тема приложения</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {themeOptions.map(({ value, label, description, icon: Icon }) => {
              const isSelected = mounted && theme === value;

              return (
                <label key={value} className="group relative min-w-0 cursor-pointer">
                  <input
                    type="radio"
                    name="appearance-theme"
                    value={value}
                    checked={isSelected}
                    disabled={!mounted}
                    onChange={() => setTheme(value)}
                    className="peer sr-only"
                  />
                  <span className="flex min-h-[118px] flex-col rounded-xl border border-border bg-background p-3.5 transition-colors peer-checked:border-brand peer-checked:bg-brand/5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand group-hover:bg-muted/60 sm:p-4">
                    <span className="flex items-center justify-between gap-2">
                      <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                      <Check
                        className={cn("size-4 text-brand", isSelected ? "opacity-100" : "opacity-0")}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="mt-4 text-sm font-semibold">{label}</span>
                    <span className="mt-1 text-xs leading-4 text-muted-foreground">{description}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Выбор применяется сразу и сохраняется в этом браузере.
        </p>
      </CardContent>
    </Card>
  );
}

function AccountInformation() {
  const userQuery = useCurrentUser();
  const user = userQuery.data;

  return (
    <Card className="gap-0 overflow-hidden rounded-2xl shadow-none">
      <CardHeader className="border-b border-border px-5 py-4 sm:px-6">
        <CardTitle className="text-base">Данные для входа</CardTitle>
        <p className="text-sm text-muted-foreground">Идентификаторы аккаунта.</p>
      </CardHeader>
      <CardContent className="divide-y divide-border px-5 sm:px-6">
        <div className="flex min-w-0 items-start gap-3 py-4">
          <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Электронная почта</p>
            <p className="mt-1 break-all text-sm font-medium">{userQuery.isLoading ? "Загрузка…" : user?.email ?? "—"}</p>
          </div>
        </div>
        <div className="flex min-w-0 items-start gap-3 py-4">
          <UserRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Имя пользователя</p>
            <p className="mt-1 break-all text-sm font-medium">{userQuery.isLoading ? "Загрузка…" : user?.username ? `@${user.username}` : "—"}</p>
          </div>
        </div>
        {userQuery.isError ? (
          <div role="alert" className="py-3 text-sm text-destructive">
            Не удалось загрузить данные аккаунта. <button type="button" onClick={() => void userQuery.refetch()} className="underline underline-offset-4">Повторить</button>
          </div>
        ) : null}
        <Link href="/profile" className="flex min-h-11 items-center justify-between gap-2 py-2 text-sm font-medium text-brand hover:underline">
          Управлять профилем
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}

function DailyPlanRule() {
  return (
    <Card className="gap-0 overflow-hidden rounded-2xl shadow-none">
      <CardHeader className="border-b border-border px-5 py-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarCheck className="size-4 text-brand" aria-hidden="true" />
          План на день
        </CardTitle>
        <p className="text-sm text-muted-foreground">Главное правило TaskFocus</p>
      </CardHeader>
      <CardContent className="px-5 py-5 sm:px-6">
        <p className="text-sm leading-6">
          На сегодня можно выбрать не больше пяти активных задач. Остальные остаются во Входящих или ждут своего дня в плане.
        </p>
        <Link href="/" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand">
          Открыть план на сегодня
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}

function DeleteAccount() {
  const router = useRouter();
  const deleteAccount = useDeleteAccount();
  const [dialogOpen, setDialogOpen] = useState(false);

  const confirmDelete = async () => {
    try {
      await deleteAccount.mutateAsync();
      setDialogOpen(false);
      toast.success("Аккаунт удалён");
      router.push("/login");
    } catch {
      toast.error("Не удалось удалить аккаунт");
    }
  };

  return (
    <>
      <Card className="gap-0 overflow-hidden rounded-2xl border-destructive/30 shadow-none">
        <CardHeader className="border-b border-destructive/15 px-5 py-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <AlertTriangle className="size-4" aria-hidden="true" />
            Удаление аккаунта
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4 sm:px-6">
          <p className="text-sm leading-5 text-muted-foreground">
            Удалятся аккаунт и связанные с ним задачи. Восстановить их будет нельзя.
          </p>
          <Button variant="destructive" size="sm" className="mt-4" onClick={() => setDialogOpen(true)}>
            <Trash2 className="size-4" aria-hidden="true" />
            Удалить аккаунт
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить аккаунт и задачи?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Все данные аккаунта будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAccount.isPending}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
              disabled={deleteAccount.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAccount.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Удалить без возможности восстановления
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function SettingsPage() {
  return (
    <AccountShell
      title="Настройки"
      description="Настройте внешний вид и управляйте своим аккаунтом."
    >
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(290px,0.58fr)]">
        <div className="space-y-5">
          <AppearanceSettings />
          <DailyPlanRule />
        </div>
        <aside className="space-y-5" aria-label="Аккаунт и безопасность">
          <AccountInformation />
          <DeleteAccount />
        </aside>
      </div>
    </AccountShell>
  );
}
