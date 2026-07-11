import { cn } from "@/lib/utils";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary">{title}</h1>
        {description && (
          <p className="text-sm text-ink-soft mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "primary" | "accent" | "success" | "danger";
}) {
  const toneMap = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent-soft text-accent",
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger",
  };
  return (
    <Card className="p-5 relative overflow-hidden">
      <div
        className={cn(
          "absolute top-0 right-0 w-16 h-16 rounded-bl-2xl",
          toneMap[tone]
        )}
      />
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center mb-3 relative",
          toneMap[tone]
        )}
      >
        <Icon className="w-4.5 h-4.5" strokeWidth={2} />
      </div>
      <p className="text-2xl font-display font-bold text-primary">{value}</p>
      <p className="text-xs text-ink-soft mt-0.5">{label}</p>
    </Card>
  );
}

export function Badge({
  children,
  tone = "primary",
}: {
  children: React.ReactNode;
  tone?: "primary" | "accent" | "success" | "danger" | "warn" | "neutral";
}) {
  const toneMap = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent-soft text-accent",
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger",
    warn: "bg-warn-soft text-warn",
    neutral: "bg-border text-ink-soft",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneMap[tone]
      )}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const variantMap = {
    primary: "bg-primary text-white hover:bg-primary-soft",
    secondary: "bg-accent text-white hover:opacity-90",
    danger: "bg-danger text-white hover:opacity-90",
    ghost: "bg-transparent text-ink-soft hover:bg-border/50 border border-border",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
        variantMap[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const variantMap = {
    primary: "bg-primary text-white hover:bg-primary-soft",
    secondary: "bg-accent text-white hover:opacity-90",
    ghost: "bg-transparent text-ink-soft hover:bg-border/50 border border-border",
  };
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        variantMap[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-16 px-6">
      <p className="font-display font-semibold text-ink mb-1">{title}</p>
      {description && (
        <p className="text-sm text-ink-soft mb-4 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
