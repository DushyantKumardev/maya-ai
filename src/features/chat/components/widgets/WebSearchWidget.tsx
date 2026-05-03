"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import {
  Search,
  ExternalLink,
  MapPin,
  Star,
  Navigation,
  ArrowUpRight,
  Layers,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { API_ENDPOINTS } from "@/lib/constants/api";
import { WidgetProps } from "./index";
import { SearchResult, WebSearchResponse } from "@/server/agent/tools/definitions/web-search";
import { CardShimmer } from "@/components/ui/shimmer/CardShimmer";
import { useChatContext } from "@/features/chat/context/ChatContext";
import Favicon from "@/components/common/Favicon";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Helpers ────────────────────────────────────────────────────────────────

const isYoutubeChannel = (result: SearchResult) => {
  const isYoutube =
    result.url.includes("youtube.com") || result.url.includes("youtu.be");
  const isChannelPath = /youtube\.com\/(channel\/|user\/|c\/|@)/.test(
    result.url,
  );
  return isYoutube && (isChannelPath || result.title === "YouTube");
};

const getChannelId = (url: string) => {
  const channelMatch = url.match(/youtube\.com\/channel\/([^/?#]+)/);
  if (channelMatch) return { id: channelMatch[1], type: "id" };
  const userMatch = url.match(/youtube\.com\/user\/([^/?#]+)/);
  if (userMatch) return { id: userMatch[1], type: "user" };
  const handleMatch = url.match(/youtube\.com\/@([^/?#]+)/);
  if (handleMatch) return { id: handleMatch[1], type: "user" };
  return null;
};

const getHostname = (url: string) => {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
};

// ─── YouTube Channel Card ────────────────────────────────────────────────────

function YoutubeChannelCard({ url }: { url: string }) {
  const channelData = getChannelId(url);
  const [data, setData] = useState<{
    name: string;
    thumb: string;
    subCount: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelData) return;
    const fetchData = async () => {
      try {
        const targetUrl = `https://www.youtube.com/subscribe_embed?usegapi=1&${
          channelData.type === "id"
            ? `channelid=${channelData.id}`
            : `channel=${channelData.id}`
        }&layout=full&count=default`;
        const response = await fetch(
          `${API_ENDPOINTS.YOUTUBE.CHANNEL_INFO}?url=${encodeURIComponent(targetUrl)}`,
        );
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const name =
          doc.querySelector(".yt-username")?.textContent?.trim() || "";
        const thumb =
          doc
            .querySelector(".yt-thumb-clip img")
            ?.getAttribute("src") || "";
        const subCount =
          doc
            .querySelector(
              ".yt-subscription-button-subscriber-count-branded-horizontal",
            )
            ?.textContent?.trim() || "";
        if (name && thumb) setData({ name, thumb, subCount });
      } catch (e) {
        console.error("Failed to fetch YT channel data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [url, channelData]);

  if (!channelData) return null;

  if (loading) {
    return (
      <div className="shrink-0 aspect-video w-56 rounded-2xl border border-border bg-card flex flex-col items-center justify-center gap-3 p-4">
        <CardShimmer width={52} height={52} borderRadius="50%" />
        <div className="flex flex-col gap-2 items-center w-full">
          <CardShimmer width="55%" height={11} />
          <CardShimmer width="38%" height={10} />
          <CardShimmer width="26%" height={18} borderRadius={999} />
        </div>
      </div>
    );
  }

  if (!data) {
    // Fallback: render a minimal card using the URL hostname
    const hostname = getHostname(url);
    return (
      <motion.a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="shrink-0 aspect-video w-56 rounded-2xl border border-border bg-card flex flex-col items-center justify-center gap-3 p-4 hover:border-border/80 transition-colors group"
      >
        <div className="size-12 rounded-full bg-muted flex items-center justify-center">
          <Favicon url={url} size={20} />
        </div>
        <div className="text-center">
          <p className="text-[12px] font-semibold text-foreground truncate max-w-40">
            {hostname}
          </p>
          <div className="mt-2 flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-0.5 border border-red-500/20 w-fit mx-auto">
            <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">
              YouTube
            </span>
          </div>
        </div>
      </motion.a>
    );
  }

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="shrink-0 aspect-video w-56 rounded-2xl border border-border bg-card flex flex-col items-center justify-center gap-3 p-4 hover:border-border/80 transition-all group"
    >
      <div className="relative size-13 shrink-0 rounded-full overflow-hidden border border-border/50 bg-muted shadow-sm transition-transform group-hover:scale-105">
        <Image
          src={data.thumb}
          alt={data.name}
          width={52}
          height={52}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex flex-col items-center text-center min-w-0 gap-1">
        <p className="text-[12px] font-semibold text-foreground truncate max-w-40 group-hover:text-primary transition-colors">
          {data.name}
        </p>
        {data.subCount && (
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
            {data.subCount} Subscribers
          </p>
        )}
        <div className="mt-1 flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-0.5 border border-red-500/20">
          <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">
            YouTube
          </span>
        </div>
      </div>
    </motion.a>
  );
}

// ─── Shopping Card ───────────────────────────────────────────────────────────

function ShoppingGalleryCard({
  result,
  index,
}: {
  result: SearchResult;
  index: number;
}) {
  const [imgLoading, setImgLoading] = useState(true);
  const shopping = result.shopping;
  if (!shopping) return null;

  return (
    <motion.a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="shrink-0 group relative w-44 rounded-2xl overflow-hidden border border-border bg-card hover:border-border/80 transition-all flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-square w-full bg-secondary/40 flex items-center justify-center p-3">
        {imgLoading && (
          <CardShimmer
            width="100%"
            height="100%"
            borderRadius={0}
            className="absolute inset-0 z-10"
          />
        )}
        <Image
          src={result.imageUrl || ""}
          alt={result.title}
          width={176}
          height={176}
          className={cn(
            "w-full h-full object-contain transition-all duration-300 group-hover:scale-105",
            imgLoading ? "opacity-0" : "opacity-100",
          )}
          loading="lazy"
          onLoad={() => setImgLoading(false)}
        />
        {shopping.price && (
          <span className="absolute top-2 right-2 rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm z-20">
            {shopping.price}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-2.5 flex-1 bg-secondary/5">
        <p className="text-[11px] font-medium text-foreground line-clamp-2 leading-snug h-7">
          {result.title}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">
            {result.source || getHostname(result.url)}
          </span>
          {shopping.rating && (
            <div className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-500 shrink-0">
              <Star size={9} fill="currentColor" />
              {shopping.rating}
            </div>
          )}
        </div>
      </div>
    </motion.a>
  );
}

// ─── Place Card ──────────────────────────────────────────────────────────────

function PlaceGalleryCard({
  result,
  index,
}: {
  result: SearchResult;
  index: number;
}) {
  const place = result.place;
  if (!place) return null;

  return (
    <motion.a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="shrink-0 group w-52 rounded-2xl border border-border bg-card hover:border-border/80 transition-all flex flex-col p-3.5 gap-2.5"
    >
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <MapPin size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {result.title}
          </p>
          {place.category && (
            <Badge
              variant="secondary"
              className="mt-1 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0"
            >
              {place.category}
            </Badge>
          )}
        </div>
      </div>

      {/* Address */}
      {place.address && (
        <div className="flex items-start gap-1.5 pl-10.5">
          <Navigation size={10} className="mt-0.5 shrink-0 text-muted-foreground/60" />
          <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
            {place.address}
          </p>
        </div>
      )}

      {/* Rating */}
      {place.rating && (
        <div className="pl-10.5 flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 border border-amber-500/20">
            <Star size={10} fill="currentColor" className="text-amber-500" />
            <span className="text-[10px] font-bold text-amber-600">
              {place.rating}
            </span>
          </div>
        </div>
      )}
    </motion.a>
  );
}

// ─── Video Card ──────────────────────────────────────────────────────────────

function VideoGalleryCard({
  result,
  index,
}: {
  result: SearchResult;
  index: number;
}) {
  const [imgLoading, setImgLoading] = useState(true);
  const isChannel = isYoutubeChannel(result);

  if (isChannel) {
    return <YoutubeChannelCard url={result.url} />;
  }

  return (
    <motion.a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="shrink-0 group relative aspect-video w-56 rounded-2xl overflow-hidden border border-border bg-card hover:border-border/80 transition-all"
    >
      {imgLoading && (
        <CardShimmer
          width="100%"
          height="100%"
          borderRadius={0}
          className="absolute inset-0 z-10"
        />
      )}
      <Image
        src={result.imageUrl || ""}
        alt={result.title}
        width={224}
        height={126}
        className={cn(
          "w-full h-full object-cover transition-all duration-300 group-hover:scale-105",
          imgLoading ? "opacity-0" : "opacity-100",
        )}
        loading="lazy"
        onLoad={() => setImgLoading(false)}
      />

      {/* Play overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
        <div className="size-9 rounded-full flex items-center justify-center backdrop-blur-sm bg-white/20 border border-white/30 shadow-md transform group-hover:scale-110 transition-transform">
          <ExternalLink className="size-4 text-white" />
        </div>
      </div>

      {/* Title gradient */}
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 via-black/30 to-transparent p-2.5 pt-6">
        <p className="text-[10px] font-semibold text-white line-clamp-1">
          {result.title}
        </p>
      </div>
    </motion.a>
  );
}

// ─── Image Card ──────────────────────────────────────────────────────────────

function ImageGalleryCard({
  result,
  index,
  onError,
}: {
  result: SearchResult;
  index: number;
  onError: () => void;
}) {
  const [imgLoading, setImgLoading] = useState(true);

  return (
    <motion.a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      className="shrink-0 group relative aspect-square w-36 rounded-2xl overflow-hidden border border-border bg-muted/20 hover:border-border/80 transition-all"
    >
      {imgLoading && (
        <CardShimmer
          width="100%"
          height="100%"
          borderRadius={0}
          className="absolute inset-0 z-10"
        />
      )}
      <Image
        src={result.imageUrl || ""}
        alt={result.title}
        width={144}
        height={144}
        className={cn(
          "w-full h-full object-cover transition-all duration-300 group-hover:scale-105",
          imgLoading ? "opacity-0" : "opacity-100",
        )}
        loading="lazy"
        onLoad={() => setImgLoading(false)}
        onError={onError}
      />
    </motion.a>
  );
}

// ─── Result Card (inside Sheet) ──────────────────────────────────────────────

function ResultCard({
  result,
  index,
}: {
  result: SearchResult;
  index: number;
}) {
  const [hasError, setHasError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);

  const isVideo = !!result.video;
  const isPlace = !!result.place;
  const isShopping = !!result.shopping;
  const hasImage = !!result.imageUrl && !hasError && !isPlace;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035 }}
      className="group rounded-2xl border border-border bg-card/50 overflow-hidden hover:bg-card hover:border-border/80 transition-all duration-200"
    >
      <a
        href={result.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex p-4 gap-3.5"
      >
        {/* Thumbnail or place icon */}
        {hasImage && (
          <div className="relative size-18 shrink-0 overflow-hidden rounded-xl bg-muted/30">
            {imgLoading && (
              <CardShimmer
                width="100%"
                height="100%"
                borderRadius={0}
                className="absolute inset-0 z-10"
              />
            )}
            <Image
              src={result.imageUrl || ""}
              alt=""
              width={72}
              height={72}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-200",
                imgLoading ? "opacity-0" : "opacity-100",
              )}
              onLoad={() => setImgLoading(false)}
              onError={() => setHasError(true)}
            />
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                <div className="size-7 rounded-full flex items-center justify-center backdrop-blur-sm bg-white/20 border border-white/20">
                  <ExternalLink className="size-3.5 text-white" />
                </div>
              </div>
            )}
          </div>
        )}

        {isPlace && (
          <div className="size-18 shrink-0 flex items-center justify-center rounded-xl bg-primary/8 text-primary">
            <MapPin size={22} />
          </div>
        )}

        {/* Text content */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Favicon url={result.url} size={13} className="size-3.5 shrink-0" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">
              {result.source || getHostname(result.url)}
            </span>
          </div>

          <h4 className="text-[13px] font-semibold text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
            {result.title}
          </h4>

          {result.snippet && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
              {result.snippet}
            </p>
          )}

          {/* Meta row */}
          <div className="mt-2 flex items-center gap-2">
            {isPlace && result.place?.rating && (
              <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-500">
                <Star size={9} fill="currentColor" />
                {result.place.rating}
              </div>
            )}
            {isShopping && result.shopping?.price && (
              <span className="text-[10px] font-bold text-emerald-500">
                {result.shopping.price}
              </span>
            )}
            <div className="ml-auto items-center gap-1 text-[10px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity sm:flex hidden">
              View <ExternalLink size={9} />
            </div>
            {/* Always visible on touch */}
            <div className="ml-auto flex items-center gap-1 text-[10px] font-medium text-primary sm:hidden">
              View <ExternalLink size={9} />
            </div>
          </div>
        </div>
      </a>
    </motion.div>
  );
}

// ─── Main Widget ─────────────────────────────────────────────────────────────

export default function WebSearchWidget({ part }: WidgetProps) {
  const data = (part as any).data as WebSearchResponse;
  const [isOpen, setIsOpen] = useState(false);
  const { handleSubmit } = useChatContext();
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  if (!data || (!data.results?.length && !data.groups?.length)) return null;

  const groups =
    data.groups ||
    (data.results?.length
      ? [{ query: "Search Results", results: data.results }]
      : []);

  // Consolidate and deduplicate specialized results across all groups
  const allImageResults = Array.from(
    groups
      .flatMap((g) => g.results)
      .filter(
        (r) =>
          !!r.imageUrl &&
          !r.snippet &&
          !r.video &&
          !r.place &&
          !r.shopping &&
          !failedImages.has(r.imageUrl || ""),
      )
      .reduce((acc, current) => {
        const url = current.imageUrl!;
        if (!acc.has(url)) acc.set(url, current);
        return acc;
      }, new Map<string, SearchResult>())
      .values(),
  );

  const allVideoResults = Array.from(
    groups
      .flatMap((g) => g.results)
      .filter((r) => !!r.video)
      .reduce((acc, current) => {
        if (!acc.has(current.url)) acc.set(current.url, current);
        return acc;
      }, new Map<string, SearchResult>())
      .values(),
  );

  const allPlaceResults = Array.from(
    groups
      .flatMap((g) => g.results)
      .filter((r) => !!r.place)
      .reduce((acc, current) => {
        if (!acc.has(current.url)) acc.set(current.url, current);
        return acc;
      }, new Map<string, SearchResult>())
      .values(),
  );

  const allShoppingResults = Array.from(
    groups
      .flatMap((g) => g.results)
      .filter((r) => !!r.shopping)
      .reduce((acc, current) => {
        if (!acc.has(current.url)) acc.set(current.url, current);
        return acc;
      }, new Map<string, SearchResult>())
      .values(),
  );

  // General results are anything not in the specialized carousels
  const galleryIds = new Set([
    ...allImageResults.map((r) => r.url),
    ...allVideoResults.map((r) => r.url),
    ...allPlaceResults.map((r) => r.url),
    ...allShoppingResults.map((r) => r.url),
  ]);

  const generalGroups = groups
    .map((g) => ({
      ...g,
      results: g.results.filter((r) => !galleryIds.has(r.url)),
    }))
    .filter((g) => g.results.length > 0);

  const allGeneralResults = generalGroups.flatMap((g) => g.results);

  // Unique hostnames for favicon stack
  const uniqueHosts = Array.from(
    new Set(allGeneralResults.map((r) => getHostname(r.url))),
  ).slice(0, 4);

  const handleImageError = (url: string) => {
    setFailedImages((prev) => new Set(prev).add(url));
  };

  return (
    <div className="my-2 w-full max-w-4xl space-y-4">
      {/* ── Consolidated Images ── */}
      {allImageResults.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1.5 custom-scrollbar">
          {allImageResults.map((result, idx) => (
            <ImageGalleryCard
              key={result.imageUrl}
              result={result}
              index={idx}
              onError={() => handleImageError(result.imageUrl!)}
            />
          ))}
        </div>
      )}

      {/* ── Consolidated Videos ── */}
      {allVideoResults.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1.5 custom-scrollbar">
          {allVideoResults.map((result, idx) => (
            <VideoGalleryCard key={idx} result={result} index={idx} />
          ))}
        </div>
      )}

      {/* ── Consolidated Places ── */}
      {allPlaceResults.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1.5 custom-scrollbar">
          {allPlaceResults.map((result, idx) => (
            <PlaceGalleryCard key={idx} result={result} index={idx} />
          ))}
        </div>
      )}

      {/* ── Consolidated Shopping ── */}
      {allShoppingResults.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1.5 custom-scrollbar">
          {allShoppingResults.map((result, idx) => (
            <ShoppingGalleryCard key={idx} result={result} index={idx} />
          ))}
        </div>
      )}

      {/* ── General Results Chip ── */}
      {allGeneralResults.length > 0 && (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="flex w-fit items-center gap-2 rounded-full border border-border/50 bg-secondary/20 hover:bg-secondary/40 px-3 py-1.5 transition-all group"
            >
              {/* Favicon stack */}
              <div className="flex">
                {uniqueHosts.map((host, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "size-5 rounded-full border-[1.5px] border-background bg-muted overflow-hidden flex items-center justify-center shadow-sm",
                      idx > 0 && "-ml-1.5",
                    )}
                  >
                    <Favicon
                      url={host}
                      size={13}
                      className="size-3.5 object-contain"
                    />
                  </div>
                ))}
                {allGeneralResults.length > 4 && (
                  <div className="-ml-1.5 size-5 rounded-full border-[1.5px] border-background bg-secondary text-[8px] font-bold flex items-center justify-center shadow-sm text-muted-foreground">
                    +{allGeneralResults.length - 4}
                  </div>
                )}
              </div>

              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest group-hover:text-foreground transition-colors">
                {allGeneralResults.length} Sources
              </span>
              <ChevronRight className="size-3 text-muted-foreground/60 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </SheetTrigger>

          {/* ── Sheet Panel ── */}
          <SheetContent
            side="right"
            className="w-full sm:max-w-xl p-0 border-l border-border bg-background/95 backdrop-blur-xl"
          >
            <SheetHeader className="px-6 py-4 border-b border-border bg-background/60">
              <SheetTitle className="flex items-center gap-2.5 text-base font-semibold">
                <div className="size-8 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Search className="size-4" />
                </div>
                Research Sources
              </SheetTitle>
            </SheetHeader>

            <ScrollArea className="h-[calc(100vh-65px)]">
              <div className="p-6 space-y-8">
                {generalGroups.map((group, gIdx) => (
                  <div key={gIdx}>
                    <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.18em] text-primary/50 flex items-center gap-2">
                      <Layers size={11} />
                      {group.query}
                    </h3>
                    <div className="flex flex-col gap-3">
                      {group.results.map((result, rIdx) => (
                        <ResultCard key={rIdx} result={result} index={rIdx} />
                      ))}
                    </div>
                  </div>
                ))}

                {/* People Also Ask */}
                {data.peopleAlsoAsk && data.peopleAlsoAsk.length > 0 && (
                  <div className="pt-6 border-t border-border/50">
                    <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/60">
                      People also ask
                    </h3>
                    <div className="flex flex-col gap-2.5">
                      {data.peopleAlsoAsk.map((paa, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setIsOpen(false);
                            handleSubmit(null, null, paa.question);
                          }}
                          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/20 p-3 hover:bg-secondary/40 transition-colors group text-left w-full"
                        >
                          <span className="text-[12px] font-medium text-foreground">
                            {paa.question}
                          </span>
                          <ArrowUpRight
                            size={13}
                            className="text-muted-foreground group-hover:text-primary transition-colors shrink-0"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      )}

    </div>
  );
}