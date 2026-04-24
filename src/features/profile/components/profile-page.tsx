"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser, useUpdateProfile, useDeleteAccount } from "@/features/auth/hooks";
import { useStats } from "@/features/stats/hooks";
import { ApiError } from "@/shared/lib/fetcher";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Archive,
  Zap,
  Shield,
  UserIcon,
  Mail,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { cn } from "@/shared/lib/utils";

function Sk({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-white/20 rounded", className)} />;
}

function SkLight({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-muted rounded", className)} />;
}

function getInitials(name?: string | null, username?: string | null, email?: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0][0].toUpperCase();
  }
  if (username) return username[0].toUpperCase();
  if (email) return email[0].toUpperCase();
  return "U";
}

function ProfileEditor({
  initialName,
  isLoadingUser,
  updateProfile,
}: {
  initialName: string;
  isLoadingUser: boolean;
  updateProfile: ReturnType<typeof useUpdateProfile>;
}) {
  const [nameValue, setNameValue] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName);
  const hasChanges = nameValue !== savedName;

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ name: nameValue });
      setSavedName(nameValue);
      toast.success("Профиль обновлён");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Ошибка соединения");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <UserIcon className="h-4 w-4" />
          Редактировать профиль
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="display-name">Отображаемое имя</Label>
          {isLoadingUser ? (
            <SkLight className="h-10 w-full" />
          ) : (
            <Input
              id="display-name"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              placeholder="Ваше имя"
            />
          )}
          <p className="text-xs text-muted-foreground">
            Это имя отображается в приложении
          </p>
        </div>

        {hasChanges && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateProfile.isPending}
              className="bg-brand hover:bg-brand/90"
            >
              {updateProfile.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : "Сохранить"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setNameValue(savedName)}
            >
              Отменить
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ProfilePage() {
  const router = useRouter();
  const { data: user, isLoading: isLoadingUser } = useCurrentUser();
  const { data: stats } = useStats();
  const updateProfile = useUpdateProfile();
  const deleteAccount = useDeleteAccount();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount.mutateAsync();
      toast.success("Аккаунт удалён");
      router.push("/");
    } catch {
      toast.error("Ошибка удаления аккаунта");
    }
  };

  const initials = getInitials(user?.name, user?.username, user?.email);
  const displayName = user?.name || user?.username || user?.email || "";

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky top nav */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="font-semibold">Профиль</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Hero card */}
        <div className="bg-brand rounded-2xl p-6 text-brand-foreground">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            {isLoadingUser ? (
              <Sk className="w-16 h-16 rounded-full shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-2xl font-bold shrink-0 select-none">
                {initials}
              </div>
            )}

            {/* Name / username */}
            <div className="min-w-0 flex-1">
              {isLoadingUser ? (
                <>
                  <Sk className="h-5 w-36 mb-2" />
                  <Sk className="h-4 w-24" />
                </>
              ) : (
                <>
                  <p className="font-bold text-lg leading-tight truncate">{displayName}</p>
                  {user?.username && (
                    <p className="text-brand-foreground/70 text-sm mt-0.5">@{user.username}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {([
            { label: "Активных", value: stats?.activeTasks, icon: <Zap className="h-4 w-4 text-yellow-500" /> },
            { label: "Выполнено", value: stats?.completedTasks, icon: <CheckCircle2 className="h-4 w-4 text-brand" /> },
            { label: "В архиве", value: stats?.archivedTasks, icon: <Archive className="h-4 w-4 text-muted-foreground" /> },
          ] as const).map(({ label, value, icon }) => (
            <Card key={label} className="text-center">
              <CardContent className="p-4">
                <div className="flex justify-center mb-2">{icon}</div>
                {value === undefined ? (
                  <SkLight className="h-7 w-10 mx-auto mb-1" />
                ) : (
                  <p className="text-2xl font-bold leading-none mb-1">{value}</p>
                )}
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit profile */}
        <ProfileEditor
          key={user?.id ?? "loading"}
          initialName={user?.name ?? ""}
          isLoadingUser={isLoadingUser}
          updateProfile={updateProfile}
        />

        {/* Account info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Данные аккаунта
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-3 px-3 py-2.5 bg-muted/50 rounded-lg">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Email</p>
                {isLoadingUser
                  ? <SkLight className="h-4 w-40 mt-0.5" />
                  : <p className="text-sm font-medium truncate">{user?.email}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3 px-3 py-2.5 bg-muted/50 rounded-lg">
              <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Имя пользователя</p>
                {isLoadingUser
                  ? <SkLight className="h-4 w-32 mt-0.5" />
                  : <p className="text-sm font-medium">@{user?.username}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Опасная зона
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Удаление аккаунта приведёт к удалению всех задач и данных. Это действие необратимо.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить аккаунт
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить аккаунт?</AlertDialogTitle>
            <AlertDialogDescription>
              Все задачи и данные будут удалены. Это невозможно отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Отменить</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={deleteAccount.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteAccount.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Удалить
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
