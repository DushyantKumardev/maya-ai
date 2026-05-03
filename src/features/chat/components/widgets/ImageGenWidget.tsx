"use client";

import React from "react";
import Image from "next/image";
import { WidgetProps } from "./index";
import { Download, Maximize2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImageResult {
  url: string;
  prompt: string;
}

export default function ImageGenWidget({ part }: WidgetProps) {
  const result = (part as any).data;
  const images: ImageResult[] = result?.images || [];
  const modelName = result?.model || "AI";
  const providerName = result?.provider || "Model";

  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  if (images.length === 0) return null;

  const handleDownload = (url: string, index: number) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `generated-${modelName.toLowerCase()}-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Image download started");
  };

  const copyPrompt = (prompt: string, index: number) => {
    navigator.clipboard.writeText(prompt);
    setCopiedIndex(index);
    toast.success("Prompt copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const isSingle = images.length === 1;
  const activeImage = selectedIndex !== null ? images[selectedIndex] : null;

  return (
    <div className="space-y-4 mt-3">
      <div
        className={cn("grid gap-4", isSingle ? "grid-cols-1" : "grid-cols-2")}
      >
        <AnimatePresence mode="popLayout">
          {images.map((img, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                delay: idx * 0.1,
                type: "spring",
                damping: 20,
                stiffness: 100,
              }}
              onClick={() => setSelectedIndex(idx)}
              className={cn(
                "group relative overflow-hidden rounded-3xl border border-border bg-card transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 cursor-zoom-in",
                isSingle && "max-w-sm w-full",
              )}
            >
              <div className="relative aspect-square w-full overflow-hidden bg-muted/20">
                <Image
                  src={img.url}
                  alt={img.prompt}
                  width={512}
                  height={512}
                  className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.03]"
                  loading="lazy"
                />

                {/* Subtle hint on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                  <Maximize2 className="size-6 text-white opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 shadow-lg" />
                </div>
              </div>

              {images.length > 1 && (
                <div className="absolute top-4 left-4 h-6 w-6 flex items-center justify-center rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white">
                  {idx + 1}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Lightbox Dialog */}
      <Dialog
        open={selectedIndex !== null}
        onOpenChange={(open) => !open && setSelectedIndex(null)}
      >
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background/80 backdrop-blur-2xl border-border/40 shadow-2xl rounded-4xl">
          {activeImage && (
            <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
              {/* Image Preview */}
              <div className="flex-1 bg-black/20 flex items-center justify-center overflow-hidden relative min-h-[50vh]">
                <Image
                  src={activeImage.url}
                  alt="Full preview"
                  fill
                  className="object-contain"
                />
              </div>

              {/* Action Sidebar / Details */}
              <div className="w-full md:w-80 p-6 flex flex-col gap-6 bg-card/50 border-l border-border/20">
                <div className="space-y-4">
                  <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/30 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {providerName} • {modelName}
                      </div>
                    </div>
                    <DialogTitle className="text-sm font-semibold text-foreground/90 leading-tight">
                      Generation Details
                    </DialogTitle>
                  </DialogHeader>

                  <div className="p-4 rounded-2xl bg-secondary/40 border border-border/50">
                    <p className="text-xs text-foreground/80 leading-relaxed italic font-medium">
                      &quot;{activeImage.prompt}&quot;
                    </p>
                  </div>
                </div>

                <div className="mt-auto space-y-3">
                  <Button
                    size="lg"
                    className="w-full rounded-2xl font-bold text-[13px] gap-2 shadow-lg shadow-primary/20"
                    onClick={() =>
                      copyPrompt(activeImage.prompt, selectedIndex!)
                    }
                  >
                    {copiedIndex === selectedIndex ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedIndex === selectedIndex
                      ? "Copied Prompt"
                      : "Copy Prompt"}
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-2xl font-semibold gap-2"
                      onClick={() =>
                        handleDownload(activeImage.url, selectedIndex!)
                      }
                    >
                      <Download className="h-4 w-4" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-2xl font-semibold gap-2"
                      onClick={() => window.open(activeImage.url, "_blank")}
                    >
                      <Maximize2 className="h-4 w-4" />
                      Original
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
