"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Download, ExternalLink, Check, Copy, CopyCheck } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { WidgetProps } from "./index";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Thumbnail {
  quality: string;
  label: string;
  url: string;
  width: number;
  height: number;
}

interface YTResult {
  videoId: string;
  title: string | null;
  channelName: string | null;
  thumbnails: Thumbnail[];
}

const QUALITY_LABELS: Record<string, string> = {
  maxresdefault: "Max HD",
  sddefault: "SD",
  hqdefault: "HQ",
  mqdefault: "MQ",
  default: "LQ",
};

export default function YtThumbnailWidget({ part }: WidgetProps) {
  const result: YTResult | undefined = (part as any).data;
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [imgSrc, setImgSrc] = useState((result?.thumbnails?.[0]?.url || "") as string);
  const [fading, setFading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!result?.thumbnails?.length) return null;

  const selected = result.thumbnails[selectedIdx];
  const videoUrl = `https://www.youtube.com/watch?v=${result.videoId}`;

  const handleQualityChange = (idx: number) => {
    if (idx === selectedIdx) return;
    setFading(true);
    setSelectedIdx(idx);
    setTimeout(() => {
      setImgSrc(result.thumbnails[idx].url);
      setFading(false);
    }, 150);
  };

  const handleCopy = async () => {
    try {
      const res = await fetch(selected.url);
      const blob = await res.blob();
      const img = new Image();
      img.crossOrigin = "anonymous";
      const blobUrl = URL.createObjectURL(blob);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = blobUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");
      ctx.drawImage(img, 0, 0);
      const pngBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!pngBlob) throw new Error("toBlob failed");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
      URL.revokeObjectURL(blobUrl);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed — browser may be blocking this.");
    }
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(selected.url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${result.title}_thumbnail-${result.videoId}-${selected.quality}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      setDownloaded(true);
      toast.success("Downloaded");
      setTimeout(() => setDownloaded(false), 2000);
    } catch {
      toast.error("Download failed.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="my-2 w-full max-w-sm"
    >
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Thumbnail Image */}
        <div className="relative w-full aspect-video bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={result.title ?? "YouTube thumbnail"}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-150",
              fading ? "opacity-0" : "opacity-100",
            )}
            loading="lazy"
          />
        </div>

        <div className="p-3 space-y-3">
          {/* Title + link */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {result.title && (
                <p className="text-sm font-medium text-foreground truncate leading-snug">
                  {result.title}
                </p>
              )}
              {result.channelName && (
                <p className="text-xs text-muted-foreground truncate">
                  {result.channelName}
                </p>
              )}
            </div>
            <a
              href={videoUrl}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink size={13} />
            </a>
          </div>

          <Separator />

          {/* Quality selector */}
          {result.thumbnails.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {result.thumbnails.map((thumb, idx) => (
                <button
                  key={thumb.quality}
                  onClick={() => handleQualityChange(idx)}
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-medium border transition-colors",
                    selectedIdx === idx
                      ? "bg-secondary text-foreground border-border"
                      : "text-muted-foreground border-transparent hover:border-border hover:text-foreground",
                  )}
                >
                  {QUALITY_LABELS[thumb.quality] ?? thumb.quality}
                  <span className="ml-1 text-[10px] opacity-60">{thumb.width}p</span>
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 gap-1.5"
              onClick={handleDownload}
              variant={downloaded ? "secondary" : "default"}
            >
              {downloaded ? <Check size={13} /> : <Download size={13} />}
              {downloaded ? "Downloaded" : "Download"}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className={cn(copied && "text-emerald-500 border-emerald-500/30")}
            >
              {copied ? <CopyCheck size={13} /> : <Copy size={13} />}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}