"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/utils";
import {CardShimmer} from "@/components/ui/shimmer/CardShimmer";

interface MessageImageProps {
  src: string;
  alt?: string;
  className?: string;
}

/**
 * Renders an image with a skeleton loader to prevent layout shifts.
 * Reserves space based on a standard chat attachment size.
 */
export function MessageImage({ src, alt = "Attached image", className }: MessageImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!src) return null;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border border-border/40 bg-muted/30",
      "w-full max-w-sm min-h-40 flex items-center justify-center",
      className
    )}>
      {/* Skeleton placeholder shown while loading */}
      {!isLoaded && (
        <CardShimmer width="100%" height={400} borderRadius={12} />
      )}
      
      <Image
        src={src}
        alt={alt}
        width={500}
        height={400}
        unoptimized
        className={cn(
          "transition-opacity duration-500 ease-in-out object-cover w-full h-auto max-h-80",
          isLoaded ? "opacity-100" : "opacity-0 invisible"
        )}
        onLoad={() => setIsLoaded(true)}
        priority={false}
      />
    </div>
  );
}
