import React from "react";
import Image from "next/image";
import { cn } from "@/shared/lib/utils";
import { AvatarFallback } from "./avatar-fallback";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  email?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackClassName?: string;
  priority?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

export function Avatar({
  src,
  alt = "Avatar",
  name,
  email,
  size = "md",
  className,
  fallbackClassName,
  priority = false,
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setImageError(false);
    setIsLoading(true);
  }, [src]);

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // Показываем фоллбэк если нет src или произошла ошибка
  if (!src || imageError) {
    return (
      <AvatarFallback
        name={name}
        email={email}
        size={size}
        className={cn(sizeClasses[size], className, fallbackClassName)}
      />
    );
  }

  return (
    <div className={cn("relative inline-block", sizeClasses[size], className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-full" />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        className={cn(
          "rounded-full object-cover",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        onError={handleImageError}
        onLoad={handleImageLoad}
        priority={priority}
        sizes="(max-width: 768px) 32px, 40px"
      />
    </div>
  );
}
