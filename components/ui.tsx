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
    <div className="flex items-start justify-between gap-4 mb-7">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink tracking-tight">{title}</h1>
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
        "bg-white/85 backdrop-blur-sm border border-border rounded-2xl shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

const STAT_THEMES = {
  primary: {
    icon: "bg-indigo-100 text-indigo-600",
    glow: "from-indigo-500 to-indigo-600",
    badge: "bg-indigo-50",
  },
  accent: {
    icon: "bg-pink-100 text-pink-600",
    glow: "from-pink-500 to-rose-500",
    badge: "bg-pink-50",
  },
  success: {
    icon: "bg-emerald-100 text-emerald-600",
    glow: "from-emerald-500 to-teal-500",
    badge: "bg-emerald-50",
  },
  danger: {
    icon: "bg-red-100 text-red-600",
    glow: "from-red-500 to-rose-600",
    badge: "bg-red-50",
  },
  neutral: {
    icon: "bg-gray-100 text-gray-500",
    glow: "from-gray-400 to-gray-500",
    badge: "bg-gray-50",
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: keyof typeof STAT_THEMES;
}) {
  const theme = STAT_THEMES[tone];
  return (
    <div className="stat-card-glow p-5 card-hover">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", theme.icon)}>
          <Icon className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
        </div>
        {/* Decorative gradient orb */}
        <div className={cn("w-8 h-8 rounded-full opacity-20 bg-gradient-to-br", theme.glow)} aria-hidden="true" />
      </div>
      <p className="text-2xl font-display font-bold text-ink tracking-tight">{value}</p>
      <p className="text-xs text-ink-soft mt-0.5 font-medium">{label}</p>
    </div>
  );
}

const BADGE_THEMES = {
  primary: "bg-indigo-100 text-indigo-700",
  accent:  "bg-pink-100 text-pink-700",
  success: "bg-emerald-100 text-emerald-700",
  danger:  "bg-red-100 text-red-700",
  warn:    "bg-amber-100 text-amber-700",
  neutral: "bg-gray-100 text-gray-600",
};

export function Badge({
  children,
  tone = "primary",
}: {
  children: React.ReactNode;
  tone?: keyof typeof BADGE_THEMES;
}) {
  return (
    <span className={cn("badge-pill", BADGE_THEMES[tone])}>
      {children}
    </span>
  );
}

const BTN_VARIANTS = {
  primary:   "btn-gradient text-white font-semibold",
  secondary: "bg-pink-500 hover:bg-pink-600 text-white font-semibold shadow-sm transition-colors",
  danger:    "bg-danger hover:opacity-90 text-white font-semibold shadow-sm transition-colors",
  ghost:     "bg-white/70 hover:bg-white text-ink border border-border font-medium transition-colors shadow-sm",
};

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BTN_VARIANTS;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        BTN_VARIANTS[variant],
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
  variant?: keyof typeof BTN_VARIANTS;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-all",
        BTN_VARIANTS[variant],
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
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl" aria-hidden="true">📭</span>
      </div>
      <p className="font-display font-bold text-ink mb-1">{title}</p>
      {description && (
        <p className="text-sm text-ink-soft mb-5 max-w-xs mx-auto">{description}</p>
      )}
      {action}
    </div>
  );
}

export function FormLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink mb-1.5">
      {children}
    </label>
  );
}

export function FormField({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  placeholder,
  hint,
  min,
  max,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  placeholder?: string;
  hint?: string;
  min?: number;
  max?: number;
  step?: number | string;
}) {
  return (
    <div>
      <FormLabel htmlFor={name}>{label}</FormLabel>
      <input
        id={name}
        type={type}
        name={name}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        aria-describedby={hint ? `${name}-hint` : undefined}
        className="input"
      />
      {hint && (
        <p id={`${name}-hint`} className="text-xs text-ink-soft mt-1.5">
          {hint}
        </p>
      )}
    </div>
  );
}

export function FormSelect({
  label,
  name,
  required,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <FormLabel htmlFor={name}>{label}</FormLabel>
      <select id={name} name={name} required={required} defaultValue={defaultValue} className="input">
        {children}
      </select>
    </div>
  );
}
