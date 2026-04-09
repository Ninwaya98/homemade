import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-60 shadow-sm",
  secondary:
    "border-2 border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white disabled:opacity-60",
  ghost:
    "text-stone-700 hover:bg-stone-100 disabled:opacity-60",
  danger:
    "bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 shadow-sm",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-full",
  md: "px-5 py-2.5 text-base rounded-full",
  lg: "px-6 py-3 text-base rounded-full",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className = "",
  children,
  ...rest
}: CommonProps & ComponentProps<"button">) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center font-medium transition ${variantClasses[variant]} ${sizeClasses[size]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  fullWidth,
  className = "",
  children,
  href,
  ...rest
}: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link
      {...rest}
      href={href}
      className={`inline-flex items-center justify-center font-medium transition ${variantClasses[variant]} ${sizeClasses[size]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
    >
      {children}
    </Link>
  );
}
