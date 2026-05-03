import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import Image from "next/image";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface ImagePreviewProps {
  imagePreview: string | null;
  onRemove: () => void;
}

/**
 * Displays an image thumbnail with a remove button.
 * Clicking the thumbnail opens a fullscreen preview dialog.
 */
export function ImagePreview({ imagePreview, onRemove }: ImagePreviewProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!imagePreview) return null;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <div className="relative mb-1 w-fit">
        <button
          type="button"
          className="transition-transform"
          onClick={() => setIsDialogOpen(true)}
        >
          <Image
            src={imagePreview}
            alt="Image preview"
            width={100}
            height={100}
            className="rounded-lg object-cover"
            style={{ width: "auto", height: "100px" }}
          />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-2 top-2 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-background/50 text-foreground transition-colors hover:bg-accent"
          aria-label="Remove image"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <DialogContent className="max-w-[90vw] md:max-w-200 border-none bg-transparent p-0 shadow-none">
        <VisuallyHidden>
          <DialogTitle>Image Preview</DialogTitle>
          <DialogDescription>Full screen view of the attached image.</DialogDescription>
        </VisuallyHidden>
        <Image
          src={imagePreview}
          alt="Full size preview"
          width={800}
          height={800}
          className="rounded-2xl"
          style={{ width: "100%", height: "auto" }}
        />
      </DialogContent>
    </Dialog>
  );
}
