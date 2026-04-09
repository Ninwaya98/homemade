import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  as: Component = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return (
    <Component
      className={`rounded-2xl border border-stone-200 bg-white p-6 ${className}`}
    >
      {children}
    </Component>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-stone-600">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
      <p className="text-base font-medium text-stone-900">{title}</p>
      {body && <p className="mt-2 text-sm text-stone-600">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
