import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "gradient-purple text-white hover:shadow-lg hover:shadow-violet-500/25 disabled:opacity-60 shadow-sm",
  secondary:
    "border-2 border-violet-600 text-violet-700 hover:bg-violet-600 hover:text-white disabled:opacity-60",
  ghost:
    "text-slate-700 hover:bg-violet-50 disabled:opacity-60",
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
