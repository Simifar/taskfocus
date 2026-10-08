import Image from "next/image";

import { cn } from "@/shared/lib/utils";

interface BrandLogoProps {
  variant?: "horizontal" | "symbol";
  className?: string;
  decorative?: boolean;
  priority?: boolean;
}

/** Brand Kit SVGs are kept intact; CSS follows the existing next-themes class. */
export function BrandLogo({
  variant = "horizontal",
  className,
  decorative = false,
  priority = false,
}: BrandLogoProps) {
  const symbol = variant === "symbol";
  const imageProps = {
    width: symbol ? 120 : 522.57,
    height: symbol ? 120 : 128,
    priority,
    unoptimized: true,
  };

  return (
    <span
      className={cn(
        "inline-flex shrink-0 p-1",
        symbol ? "w-10" : "w-[188px]",
        className,
      )}
    >
      <Image
        {...imageProps}
        alt={decorative ? "" : "TaskFocus"}
        src={`/brand/${variant}-primary.svg`}
        className="block h-auto w-full dark:hidden"
      />
      <Image
        {...imageProps}
        alt={decorative ? "" : "TaskFocus"}
        src={`/brand/${variant}-inverse.svg`}
        className="hidden h-auto w-full dark:block"
      />
    </span>
  );
}
