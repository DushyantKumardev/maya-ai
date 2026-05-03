"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/features/settings/context/SettingsContext";
import { type ModelConfig } from "@/features/settings/types";
import { DEFAULT_MODEL_CONFIG } from "@/lib/constants";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * ============================================================================
 * Parameter definition — drives the entire form UI.
 * ============================================================================
 */
interface ParamDef {
  key: keyof ModelConfig;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  decimals: number;
}

const PARAMS: ParamDef[] = [
  {
    key: "temperature",
    label: "Temperature",
    description:
      "Controls randomness. Lower = more focused, higher = more creative.",
    min: 0,
    max: 2,
    step: 0.05,
    decimals: 2,
  },
  {
    key: "topP",
    label: "Top P",
    description: "Nucleus sampling. Lower = narrower token pool.",
    min: 0,
    max: 1,
    step: 0.05,
    decimals: 2,
  },
  {
    key: "topK",
    label: "Top K",
    description:
      "Limits tokens considered per step. Lower = more deterministic.",
    min: 1,
    max: 100,
    step: 1,
    decimals: 0,
  },
  {
    key: "maxTokens",
    label: "Max Tokens",
    description: "Maximum length of the response.",
    min: 256,
    max: 32768,
    step: 256,
    decimals: 0,
  },
  {
    key: "frequencyPenalty",
    label: "Frequency Penalty",
    description: "Penalises repeated tokens. Higher = less repetition.",
    min: -2,
    max: 2,
    step: 0.1,
    decimals: 1,
  },
];

/**
 * QuickSettingsSheet
 * - Mobile (<640px): slides up as a bottom drawer (max 85dvh)
 * - Desktop (≥640px): slides in from the right
 */
export function QuickSettingsSheet() {
  const { settings, updateEngine } = useSettings();
  const hasMounted = useHasMounted();

  const [draft, setDraft] = useState<ModelConfig>(
    settings.config ?? { ...DEFAULT_MODEL_CONFIG },
  );
  const [open, setOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const isMobile = useIsMobile();
 
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setDraft(settings.config ?? { ...DEFAULT_MODEL_CONFIG });
      setHasChanges(false);
    }
  };

  const updateDraft = (key: keyof ModelConfig, value: number) => {
    setDraft((prev: ModelConfig) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    setDraft({ ...DEFAULT_MODEL_CONFIG });
    setHasChanges(true);
  };

  const handleSave = async () => {
    await updateEngine({ config: draft });
    setHasChanges(false);
    setOpen(false);
  };

  // Return a simple button placeholder during SSR to avoid Radix UI hydration mismatches
  // with auto-generated IDs and aria-controls.
  if (!hasMounted) {
    return (
      <Button
          className="flex gap-2 items-center text-sm transition-colors text-foreground hover:bg-accent focus-visible:outline-none"
          aria-label="Quick model settings (loading)"
          variant={"outline"}
          disabled
        >
        <SlidersHorizontal className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          className="flex gap-2 items-center text-sm transition-colors text-foreground hover:bg-accent focus-visible:outline-none"
          aria-label="Quick model settings"
          variant={"outline"}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "flex flex-col rounded-t-2xl max-h-[85dvh]"
            : "flex flex-col sm:max-w-sm"
        }
      >
        {/* Header */}
        <SheetHeader className="shrink-0">
          <SheetTitle className="flex gap-2 items-center text-base sm:text-lg">
            <SlidersHorizontal className="w-4 h-4 sm:h-5 sm:w-5 text-muted-foreground" />
            Model Configuration
          </SheetTitle>
          <SheetDescription className="text-xs sm:text-sm">
            Fine-tune how the model generates responses.
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable parameter list */}
        <div className="overflow-y-auto flex-1 px-4 min-h-0 custom-scrollbar">
          <div className="pb-2 space-y-5">
            {PARAMS.map((param) => (
              <div key={param.key as string} className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground">
                    {param.label}
                  </label>
                  <span className="tabular-nums text-xs sm:text-sm font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded-md min-w-12 text-center">
                    {draft[param.key].toFixed(param.decimals)}
                  </span>
                </div>

                <Slider
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  value={[draft[param.key]]}
                  onValueChange={([v]) => updateDraft(param.key, v)}
                  className="w-full"
                />

                <p className="text-xs leading-relaxed text-muted-foreground">
                  {param.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <SheetFooter className="flex-row gap-2 pt-4 border-t shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            className="gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex-1"
          >
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
