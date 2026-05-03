// components/ui/CardShimmer.tsx
import { cn } from "@/lib/utils/utils";
import type { CSSProperties } from "react";
import "./CardShimmer.css";

type ShimmerRadius  = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
type ShimmerSpeed   = "slow" | "normal" | "fast";
type ShimmerVariant = "subtle" | "default" | "strong";

interface CardShimmerProps {
  width?        : string | number;
  height?       : string | number;
  /** Inline escape-hatch — overrides `radius` when passed */
  borderRadius? : string | number;
  radius?       : ShimmerRadius;
  speed?        : ShimmerSpeed;
  variant?      : ShimmerVariant;
  shimmer?      : boolean;
  className?    : string;
}

// ── Tailwind rounded-* classes ──────────────────────────────────────────────
const radiusMap: Record<ShimmerRadius, string> = {
  none : "rounded-none",
  sm   : "rounded-sm",
  md   : "rounded-md",
  lg   : "rounded-lg",
  xl   : "rounded-xl",
  "2xl": "rounded-2xl",
  full : "rounded-full",
};

// ── Maps to CSS custom property values injected inline ──────────────────────
const speedVar: Record<ShimmerSpeed, string> = {
  slow  : "2.8s",
  normal: "1.8s",
  fast  : "0.9s",
};

// shadcn uses hsl() channels — we compose rgba overlay from foreground token
const variantVar: Record<ShimmerVariant, string> = {
  subtle : "0.04",
  default: "0.08",
  strong : "0.18",
};

export function CardShimmer({
  width         = "100%",
  height        = "150px",
  borderRadius,
  radius        = "lg",
  speed         = "normal",
  variant       = "default",
  shimmer       = true,
  className,
}: CardShimmerProps) {
  const hasInlineRadius = borderRadius !== undefined;

  const containerStyle: CSSProperties = {
    width : typeof width  === "number" ? `${width}px`  : width,
    height: typeof height === "number" ? `${height}px` : height,
    ...(hasInlineRadius && {
      borderRadius:
        typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius,
    }),
  };

  // CSS vars consumed by the single .shimmer-wave class in globals.css
  const waveStyle: CSSProperties = {
    "--shimmer-duration": speedVar[speed],
    "--shimmer-opacity" : variantVar[variant],
  } as CSSProperties;

  return (
    <div
      aria-hidden="true"
      className={cn(
        // structure
        "relative overflow-hidden",
        // shadcn tokens
        "bg-muted border border-border",
        // radius — class only when no inline override
        !hasInlineRadius && radiusMap[radius],
        // pulse fallback when wave is off
        !shimmer && "animate-pulse",
        className,
      )}
      style={containerStyle}
    >
      {shimmer && (
        <div
          className="shimmer-wave absolute inset-0 w-full"
          style={waveStyle}
        />
      )}
    </div>
  );
}