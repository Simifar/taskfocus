import React from "react";
import { cn } from "@/shared/lib/utils";
import { getInitials, getAvatarColor } from "@/shared/lib/avatar-utils";

interface AvatarFallbackProps {
  name?: string;
  email?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-12 w-12 text-lg",
  xl: "h-16 w-16 text-xl",
};

const textSizes = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
};

export function AvatarFallback({
  name,
  email,
  size = "md",
  className,
}: AvatarFallbackProps) {
  const initials = getInitials(name, email);
  const backgroundColor = getAvatarColor(name || email);

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium text-white",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor }}
    >
      <span className={textSizes[size]}>{initials}</span>
    </div>
  );
}
