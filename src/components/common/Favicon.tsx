"use client";

import React, { useState, memo } from "react";
import { getFaviconByDomainUrl } from "@/lib/utils";
import { cn } from "@/lib/utils/utils";

interface FaviconProps {
  url: string;
  className?: string;
  size?: number;
}

const FAVICON_FALLBACK = `https://www.google.com/s2/favicons?domain=google.com&sz=64`;

/**
 * A highly optimized Favicon component using a plain <img> tag
 * to avoid Next.js image proxy overhead for external dynamic assets.
 */
const Favicon = memo(({ url, className, size = 16 }: FaviconProps) => {
  const [errored, setErrored] = useState(false);
  const faviconUrl = getFaviconByDomainUrl(url);

  // Don't render at all if there's no valid favicon URL (e.g. partial URL during streaming)
  if (!faviconUrl && !errored) return null;

  const src = errored || !faviconUrl ? FAVICON_FALLBACK : faviconUrl;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 inline-block rounded-sm", className)}
      style={{ width: size, height: size }}
      onError={() => setErrored(true)}
    />
  );
});

Favicon.displayName = "Favicon";

export default Favicon;
