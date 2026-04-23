import React from "react";
import { Avatar } from "./avatar";
import { getAvatarUrl } from "@/shared/lib/avatar-utils";

interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string;
  email?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  priority?: boolean;
}

export function UserAvatar({
  avatarUrl,
  name,
  email,
  size = "md",
  className,
  priority = false,
}: UserAvatarProps) {
  // Получаем URL аватара с приоритетом: пользовательский > Gravatar
  const finalAvatarUrl = React.useMemo(() => {
    return getAvatarUrl(avatarUrl, email, size === "xl" ? 128 : size === "lg" ? 96 : size === "md" ? 64 : 32);
  }, [avatarUrl, email, size]);

  return (
    <Avatar
      src={finalAvatarUrl}
      name={name}
      email={email}
      size={size}
      className={className}
      priority={priority}
    />
  );
}
