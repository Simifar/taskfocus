import React, { useRef, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Progress } from "@/shared/ui/progress";
import { toast } from "sonner";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface AvatarUploadProps {
  currentAvatar?: string | null;
  name?: string;
  email?: string;
  onAvatarChange?: (avatarUrl: string | null) => void;
  className?: string;
}

export function AvatarUpload({
  currentAvatar,
  name,
  email,
  onAvatarChange,
  className,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Валидация на клиенте
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      toast.error("Разрешены только JPG, PNG, WebP, GIF файлы");
      return;
    }

    if (file.size > maxSize) {
      toast.error("Максимальный размер файла - 5MB");
      return;
    }

    // Создаем превью
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Загружаем файл
    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Имитация прогресса загрузки
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const response = await fetch("/api/auth/avatar", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка загрузки");
      }

      const data = await response.json();
      onAvatarChange?.(data.data.avatar);
      toast.success("Аватар успешно загружен");
      setPreview(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка загрузки аватара");
      setPreview(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const response = await fetch("/api/auth/avatar", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Ошибка удаления аватара");
      }

      onAvatarChange?.(null);
      toast.success("Аватар удален");
      setPreview(null);
    } catch (error) {
      toast.error("Ошибка удаления аватара");
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <Label className="mb-2 block">Аватар</Label>
        
        {/* Текущий аватар или превью */}
        <div className="flex items-center gap-4 mb-4">
          {(preview || currentAvatar) && (
            <div className="relative">
              <img
                src={preview || currentAvatar || ""}
                alt="Avatar preview"
                className="h-16 w-16 rounded-full object-cover"
              />
              {!isUploading && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={handleRemoveAvatar}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
          
          {!preview && !currentAvatar && (
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Кнопка загрузки */}
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Загрузка...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Выбрать файл
            </>
          )}
        </Button>

        {/* Скрытый input для файла */}
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Прогресс загрузки */}
        {isUploading && (
          <div className="mt-2">
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Информация */}
        <p className="text-xs text-muted-foreground mt-2">
          Разрешены JPG, PNG, WebP, GIF файлы до 5MB
        </p>
      </div>
    </div>
  );
}
