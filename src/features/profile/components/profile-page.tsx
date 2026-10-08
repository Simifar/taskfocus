"use client";

import { useState, type FormEvent } from "react";
import { Archive, Check, CircleCheck, ListTodo, Loader2, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";

import { useCurrentUser, useUpdateProfile } from "@/features/auth/hooks";
import { useStats } from "@/features/stats/hooks";
import { ApiError } from "@/shared/lib/fetcher";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { AccountShell } from "./account-shell";

function initials(name?: string | null, username?: string | null, email?: string) {
  const source = name?.trim() || username?.trim() || email?.trim() || "TF";
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("ru-RU"))
    .join("");
}

function ProfileEditor({ initialName, disabled }: { initialName: string; disabled: boolean }) {
  const [nameValue, setNameValue] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName);
  const updateProfile = useUpdateProfile();
  const hasChanges = nameValue !== savedName;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = nameValue.trim();

    try {
      await updateProfile.mutateAsync({ name: nextName || null });
      setNameValue(nextName);
      setSavedName(nextName);
      toast.success("Изменения профиля сохранены");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Не удалось сохранить профиль");
    }
  };

  const handleCancel = () => setNameValue(savedName);

  return (
    <Card className="gap-0 overflow-hidden rounded-2xl shadow-none">
      <CardHeader className="border-b border-border px-5 py-4 sm:px-6">
        <CardTitle className="text-base">Личные данные</CardTitle>
        <p className="text-sm text-muted-foreground">Имя видно только в вашем рабочем пространстве.</p>
      </CardHeader>
      <CardContent className="px-5 py-5 sm:px-6">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="display-name">Отображаемое имя</Label>
            <Input
              id="display-name"
              autoComplete="name"
              maxLength={100}
              value={nameValue}
              disabled={disabled || updateProfile.isPending}
              onChange={(event) => setNameValue(event.target.value)}
              placeholder={disabled ? "Данные пока недоступны" : "Как к вам обращаться"}
              aria-describedby="display-name-help"
              className="h-11"
            />
            <p id="display-name-help" className="text-xs leading-5 text-muted-foreground">
              Можно оставить поле пустым — тогда будет показано имя пользователя.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={disabled || !hasChanges || updateProfile.isPending}>
              {updateProfile.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Сохранить изменения
            </Button>
            {hasChanges ? (
              <Button type="button" variant="ghost" onClick={handleCancel} disabled={disabled || updateProfile.isPending}>
                Отменить
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check className="size-3.5 text-brand" aria-hidden="true" />
                Сохранено
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ListTodo;
  label: string;
  value: number | undefined;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-brand-soft/40 p-3 sm:p-4">
      <div className="flex size-7 items-center justify-center rounded-lg bg-card text-brand">
        <Icon className="size-4 shrink-0" aria-hidden="true" />
      </div>
      <p className="mt-2 text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
        {value === undefined ? <span className="inline-block h-7 w-10 animate-pulse rounded bg-muted-foreground/15" /> : value}
      </p>
    </div>
  );
}

export function ProfilePage() {
  const userQuery = useCurrentUser();
  const statsQuery = useStats();
  const user = userQuery.data;
  const displayName = user?.name?.trim() || user?.username || "Пользователь";

  return (
    <AccountShell
      section="profile"
      title="Профиль"
      description="Имя, данные аккаунта и актуальная сводка по вашим задачам."
    >
      {userQuery.isError ? (
        <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <span>Не удалось загрузить профиль.</span>
          <Button variant="outline" size="sm" onClick={() => void userQuery.refetch()}>Повторить</Button>
        </div>
      ) : null}

      <section aria-label="Пользователь" className="flex min-w-0 items-center gap-4 rounded-3xl border border-brand/20 bg-brand-soft/60 p-5 sm:gap-5 sm:p-6">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-lg font-semibold text-brand sm:size-16 sm:text-xl" aria-hidden="true">
          {user ? initials(user.name, user.username, user.email) : <span className="size-7 animate-pulse rounded-full bg-brand/15" />}
        </div>
        <div className="min-w-0">
          {userQuery.isLoading ? (
            <div className="space-y-2" aria-label="Загрузка профиля">
              <div className="h-5 w-40 animate-pulse rounded bg-muted" />
              <div className="h-4 w-52 max-w-full animate-pulse rounded bg-muted" />
            </div>
          ) : (
            <>
              <h2 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{displayName}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Личный профиль TaskFocus</p>
            </>
          )}
        </div>
      </section>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <ProfileEditor
          key={user?.id ?? "profile-loading"}
          initialName={user?.name ?? ""}
          disabled={userQuery.isLoading || userQuery.isError || !user}
        />

        <Card className="gap-0 overflow-hidden rounded-2xl shadow-none">
          <CardHeader className="border-b border-border px-5 py-4 sm:px-6">
            <CardTitle className="text-base">Ваши задачи</CardTitle>
            <p className="text-sm text-muted-foreground">Текущая сводка по рабочему пространству.</p>
          </CardHeader>
          <CardContent className="space-y-3 px-5 py-5 sm:px-6">
            {statsQuery.isError ? (
              <div role="status" className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm">
                <p>Сводка временно недоступна.</p>
                <Button variant="link" size="sm" className="mt-1 h-auto p-0" onClick={() => void statsQuery.refetch()}>
                  Загрузить ещё раз
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <Metric icon={ListTodo} label="В работе" value={statsQuery.data?.activeTasks} />
                <Metric icon={CircleCheck} label="Готово" value={statsQuery.data?.completedTasks} />
                <Metric icon={Archive} label="Архив" value={statsQuery.data?.archivedTasks} />
              </div>
            )}
            <div className="flex items-start gap-2.5 rounded-xl border border-border px-3.5 py-3 text-xs leading-5 text-muted-foreground">
              <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>Адрес почты и имя пользователя используются для входа и не редактируются здесь.</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5 gap-0 overflow-hidden rounded-2xl shadow-none">
        <CardHeader className="border-b border-border px-5 py-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="size-4 text-muted-foreground" aria-hidden="true" />
            Данные аккаунта
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-0 divide-y divide-border px-5 sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:px-6">
          <div className="flex min-w-0 items-start justify-between gap-4 py-4 sm:pr-6">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Электронная почта</p>
              <p className="mt-1 break-all text-sm font-medium">{userQuery.isLoading ? "Загрузка…" : user?.email ?? "—"}</p>
            </div>
            <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="flex min-w-0 items-start justify-between gap-4 py-4 sm:pl-6">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Имя пользователя</p>
              <p className="mt-1 break-all text-sm font-medium">{userQuery.isLoading ? "Загрузка…" : user?.username ? `@${user.username}` : "—"}</p>
            </div>
            <UserRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </div>
        </CardContent>
      </Card>
    </AccountShell>
  );
}
