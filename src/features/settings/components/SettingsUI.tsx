import React from "react";
import { cn } from "@/lib/utils/utils";
import { LucideIcon, AlertTriangle } from "lucide-react";

/**
 * SettingsSection
 * Wraps a whole category of settings with a title and optional description.
 */
interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsSection({
  title,
  description,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground/80 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/**
 * SettingsCard
 * A container with a subtle background and border to group related settings.
 */
interface SettingsCardProps {
  children: React.ReactNode;
  className?: string;
}

export function SettingsCard({ children, className }: SettingsCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/40 bg-secondary/30 p-4 shadow-sm transition-all hover:bg-secondary/40",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * SettingsItem
 * A row-based layout with a Label+Description on the left and Control on the right.
 */
interface SettingsItemProps {
  label: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  col?: boolean;
}

export function SettingsItem({
  label,
  description,
  icon: Icon,
  children,
  className,
  col = false,
}: SettingsItemProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        !col && "sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex gap-3">
        {Icon && (
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border/20 shadow-sm text-primary">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="space-y-0.5">
          <label className="text-sm font-medium leading-none text-foreground">
            {label}
          </label>
          {description && (
            <p className="text-[12px] text-muted-foreground leading-snug">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className={cn("flex shrink-0 items-center gap-2", col && "w-full")}>{children}</div>
    </div>
  );
}

/**
 * SettingsDangerZone
 * Specialized card for destructive actions.
 */
interface SettingsDangerZoneProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsDangerZone({
  title,
  description,
  children,
  className,
}: SettingsDangerZoneProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-destructive/20 bg-destructive/5",
        className
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-semibold text-destructive">{title}</h4>
            <p className="text-[12px] text-destructive/70 leading-snug">
              {description}
            </p>
          </div>
        </div>
        <div className="shrink-0">{children}</div>
      </div>
    </div>
  );
}
