"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BrainCircuit, Check, Loader2, Search, ChevronDown } from "lucide-react";
import { useSettings } from "@/features/settings/context/SettingsContext";
import { cn } from "@/lib/utils/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { API_ENDPOINTS } from "@/lib/constants/api";

// Desktop: Popover
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

// Mobile: Sheet
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import { SYSTEM_PROVIDERS } from "@/lib/constants/services";

// Shared model list UI — used by both desktop popover and mobile sheet
interface ModelListProps {
  models: string[];
  isLoading: boolean;
  activeModel: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelect: (model: string) => void;
  availableProviders: { name: string; value: string }[];
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
}

function ModelList({
  models,
  isLoading,
  activeModel,
  searchQuery,
  onSearchChange,
  onSelect,
  availableProviders,
  selectedProvider,
  onProviderChange,
}: ModelListProps) {
  const filtered = searchQuery
    ? models.filter((m) => m.toLowerCase().includes(searchQuery.toLowerCase()))
    : models;

  return (
    <div className="flex flex-col gap-3">
      {/* Provider Selector */}
      <div className="flex flex-col gap-1.5 px-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Provider
        </label>
        <div className="flex flex-wrap gap-1">
          {availableProviders.map((p) => (
            <button
              key={p.value}
              onClick={() => onProviderChange(p.value)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition-all",
                selectedProvider === p.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-1 h-px bg-border/40" />

      {/* Search */}
      <div className="relative px-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={`Search ${selectedProvider} models…`}
          className="w-full rounded-md bg-secondary/60 py-1.5 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* List */}
      <div className="flex flex-col gap-1">
        <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Available Models
        </div>
        
        <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-0.5">
          {isLoading ? (
            <div className="flex gap-2 justify-center items-center py-6 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading models…
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-2 py-4 text-xs text-center text-muted-foreground">
              {searchQuery ? "No models match your search" : "No models found"}
            </div>
          ) : (
            filtered.map((model) => {
              const isActive = model === activeModel;
              return (
                <button
                  key={model}
                  onClick={() => onSelect(model)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent",
                    isActive && "bg-accent/60 font-medium",
                  )}
                >
                  <span className="flex-1 truncate">{model}</span>
                  {isActive && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Renders as a Popover on desktop and a bottom Sheet on mobile devices.
 * Integrates with the settings context to persist the user's choice.
 */
export default function ModelSelector() {
  const modelRoute = API_ENDPOINTS.MODELS.BASE;
  const { settings, updateEngine } = useSettings();
  const sessionStorageKey = `models-${settings.provider}`;
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();

  // Aggregate providers (System)
  const availableProviders = [...SYSTEM_PROVIDERS];

  const fetchModels = useCallback(async (provider: string) => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(sessionStorageKey);
      if (cached) {
        setModels(JSON.parse(cached) as string[]);
        return;
      }
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${modelRoute}?provider=${provider}`);
      if (res.ok) {
        const data = await res.json();
        const modelIds = data.map((m: { id: string }) => m.id);
        setModels(modelIds);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(sessionStorageKey, JSON.stringify(modelIds));
        }
      } else {
        setModels([]);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(sessionStorageKey, JSON.stringify([]));
        }
      }
    } catch (err) {
      console.error("Failed to fetch models:", err);
      setModels([]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionStorageKey, modelRoute]);

  // Fetch models whenever the selector opens OR the global provider changes
  useEffect(() => {
    if (!open) return;
    fetchModels(settings.provider);
  }, [open, settings.provider, fetchModels]);

  const handleSelect = useCallback(
    (model: string) => {
      updateEngine({ modelId: model });
      toast.success(`Model changed to ${model}`);
      setOpen(false);
    },
    [updateEngine],
  );

  const handleProviderChange = useCallback(
    async (p: string) => {
      setModels([]); // Reset list for visual feedback
      if (p !== settings.provider) {
        await updateEngine({ provider: p });
      } else {
        // If it's the same provider, just trigger a re-fetch manually
        fetchModels(p);
      }
    },
    [settings.provider, updateEngine, fetchModels],
  );

  // Reset search when closing
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  // ---- Shared trigger button ----
  const triggerButton = (
  <Button
    type="button"
    variant="outline"
    className="flex h-8 items-center gap-2 rounded-md px-2.5 text-sm 
               bg-background hover:bg-accent w-auto max-w-50"
  >
    <BrainCircuit className="w-4 h-4 shrink-0 text-muted-foreground" />
    <div className="flex flex-col items-start min-w-0 flex-1">
      <span className="text-[10px] uppercase tracking-wide font-semibold 
                       text-muted-foreground leading-none mb-0.5">
        {availableProviders.find(p => p.value === settings.provider)?.name ?? settings.provider}
      </span>
      <span className="text-xs font-medium truncate leading-none max-w-32.5">
        {settings.modelId ?? "Select model"}
      </span>
    </div>
    <ChevronDown className="h-3.5 w-3.5 opacity-40 shrink-0 ml-auto" />
  </Button>
);

  // ---- Shared list props ----
  const listProps: ModelListProps = {
    models,
    isLoading,
    activeModel: settings.modelId,
    searchQuery,
    onSearchChange: setSearchQuery,
    onSelect: handleSelect,
    selectedProvider: settings.provider,
    availableProviders,
    onProviderChange: handleProviderChange,
  };

  // ===========================================================================
  // Mobile → bottom Sheet
  // ===========================================================================
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <div onClick={() => setOpen(true)}>{triggerButton}</div>

        <SheetContent side="bottom" className="flex flex-col rounded-t-2xl">
          <SheetHeader className="shrink-0">
            <SheetTitle className="flex gap-2 items-center text-base font-bold">
              <BrainCircuit className="w-4 h-4 text-primary" />
              Switch Intelligence
            </SheetTitle>
            <SheetDescription className="text-xs">
              Change the AI provider and model for this conversation.
            </SheetDescription>
          </SheetHeader>

          <div className="overflow-y-auto flex-1 px-4 py-4 min-h-0">
            <ModelList {...listProps} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop → Popover
  return (
    <Popover open={open} onOpenChange={setOpen} >
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>

      <PopoverContent
        side="top"
        align="start"
        className="p-3 w-80 shadow-xl border-accent/20"
      >
        <ModelList {...listProps} />
      </PopoverContent>
    </Popover>
  );
}
