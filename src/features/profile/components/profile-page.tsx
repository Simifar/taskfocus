"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser, useLogout, useUpdateProfile } from "@/features/auth/hooks";
import { ApiError } from "@/shared/lib/fetcher";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";
import { toast } from "sonner";
import {
  User as UserIcon,
  Mail,
  ArrowLeft,
  Loader2,
  Trash2,
  AlertTriangle,
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

export function ProfilePage() {
  const router = useRouter();
  const { data: user, isLoading: isLoadingUser } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const logout = useLogout();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({ name: "", avatar: "" });
  const [originalData, setOriginalData] = useState({ name: "", avatar: "" });

  useEffect(() => {
    if (user) {
      const next = { name: user.name ?? "", avatar: user.avatar ?? "" };
      setFormData(next);
      setOriginalData(next);
    }
  }, [user]);

  const hasChanges =
    formData.name !== originalData.name || formData.avatar !== originalData.avatar;

  const handleSaveProfile = async () => {
    if (!hasChanges) {
      toast.info("Нет изменений");
      return;
    }
    try {
      const updated = await updateProfile.mutateAsync({
        name: formData.name,
        avatar: formData.avatar,
      });
      setOriginalData({ name: updated.name ?? "", avatar: updated.avatar ?? "" });
      toast.success("Профиль обновлен");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Ошибка соединения";
      toast.error(message);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await logout.mutateAsync();
      toast.success("Аккаунт удален");
      router.push("/");
    } catch {
      toast.error("Ошибка удаления аккаунта");
    }
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Профиль</h1>
            <p className="text-muted-foreground">Управление данными аккаунта</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Основная информация
            </CardTitle>
            <CardDescription>Информация о вашем аккаунте</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input value={user.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">
                Email не может быть изменен
              </p>
            </div>

            <div>
              <Label className="mb-2">Username</Label>
              <Input value={user.username} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">
                Имя пользователя не может быть изменено
              </p>
            </div>

            <Separator />

            <div>
              <Label htmlFor="name" className="mb-2">
                Имя (Отображаемое имя)
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Введите ваше имя"
              />
            </div>

            <div>
              <Label htmlFor="avatar" className="mb-2">
                Аватар (URL)
              </Label>
              <Input
                id="avatar"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
                type="url"
              />
              {formData.avatar && (
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.avatar}
                    alt="Avatar preview"
                    className="h-16 w-16 rounded-full object-cover"
                    onError={() => toast.error("Не удается загрузить изображение")}
                  />
                </div>
              )}
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button
                onClick={handleSaveProfile}
                disabled={!hasChanges || updateProfile.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {updateProfile.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  "Сохранить изменения"
                )}
              </Button>
              {hasChanges && (
                <Button variant="outline" onClick={() => setFormData(originalData)}>
                  Отменить
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Опасная зона
            </CardTitle>
            <CardDescription>Необратимые действия</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md mb-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                Удаление аккаунта приведет к удалению всех ваших данных и задач.
                Это действие не может быть отменено.
              </p>
            </div>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить аккаунт
            </Button>
          </CardContent>
        </Card>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие удалит ваш аккаунт и все связанные данные. Это не может быть отменено.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogCancel>Отменить</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={logout.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {logout.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Удаляю...
                </>
              ) : (
                "Удалить аккаунт"
              )}
            </AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
