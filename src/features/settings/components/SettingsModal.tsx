"use client";

import {
  MonitorCheck,
  Wrench,
  User,
  MessageSquare,
  Info,
  X,
  Link2,
  History,
} from "lucide-react";
import { useSettings } from "@/features/settings/context/SettingsContext";
import { AppSettings } from "@/features/settings/types";
import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// Modules
import InterfaceModule from "../modules/Interface";
import EngineModule from "../modules/Engine";
import PersonaModule from "../modules/Persona";
import ToolsModule from "../modules/Tools";
import KeysModule from "../modules/Keys";
import MemoryModule from "../modules/Memory";
import SystemModule from "../modules/System";

const sidebarItems = [
  { id: "interface", label: "Interface", icon: MonitorCheck },
  { id: "persona", label: "Persona", icon: User },
  { id: "engine", label: "Engine", icon: MessageSquare },
  { id: "memory", label: "Memory", icon: History },
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "keys", label: "Keys", icon: Link2 },
  { id: "system", label: "System", icon: Info },
];

export function SettingsModal() {
  const {
    settings,
    syncSettings,
    isLoading,
    isSettingsModalOpen,
    setSettingsModalOpen,
    refetchSettings,
  } = useSettings();

  // Refetch settings when modal opens to pick up background updates
  // We use a ref to ensure we only fetch once per "open" session
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (isSettingsModalOpen && !hasFetchedRef.current) {
      refetchSettings();
      hasFetchedRef.current = true;
    } else if (!isSettingsModalOpen) {
      hasFetchedRef.current = false;
    }
  }, [isSettingsModalOpen, refetchSettings]);

  const [activeSection, setActiveSection] = useState("interface");
  const [draftSettings, setDraftSettings] = useState<AppSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sync draft when global settings load or modal opens
  useEffect(() => {
    if (isSettingsModalOpen && !isLoading) {
      setDraftSettings(settings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSettingsModalOpen, isLoading]);

  // Handle hash routing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#settings")) {
        setSettingsModalOpen(true);
        const section = hash.split("/")[1];
        if (section && sidebarItems.some((item) => item.id === section)) {
          setActiveSection(section);
        } else {
          setActiveSection("interface");
        }
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [setSettingsModalOpen]);

  // Track changes
  useEffect(() => {
    if (!isLoading && settings && draftSettings) {
      const hasDeepChanges =
        JSON.stringify(settings) !== JSON.stringify(draftSettings);
      setHasChanges(hasDeepChanges);
    }
  }, [draftSettings, settings, isLoading]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await syncSettings(draftSettings);
      toast.success("Settings saved successfully");
      setHasChanges(false);
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const updateDraft = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setDraftSettings((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const { setTheme } = useTheme();

  const handleClose = (open: boolean) => {
    if (!open) {
      if (hasChanges) {
        if (confirm("You have unsaved changes. Discard anyway?")) {
          // Reset theme if discarded
          setTheme(settings.theme);
          setSettingsModalOpen(false);
          window.history.replaceState(null, "", window.location.pathname);
        }
      } else {
        setSettingsModalOpen(false);
        window.history.replaceState(null, "", window.location.pathname);
      }
    } else {
      setSettingsModalOpen(true);
    }
  };

  const renderContent = () => {
    const commonProps = {
      draftSettings,
      updateDraft,
    };

    switch (activeSection) {
      case "interface":
        return (
          <InterfaceModule
            {...commonProps}
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
          />
        );
      case "engine":
        return (
          <EngineModule {...commonProps} setDraftSettings={setDraftSettings} />
        );
      case "persona":
        return <PersonaModule {...commonProps} />;
      case "tools":
        return (
          <ToolsModule
            {...commonProps}
            setDraftSettings={setDraftSettings}
          />
        );
      case "memory":
        return <MemoryModule {...commonProps} />;
      case "keys":
        return <KeysModule {...commonProps} />;
      case "system":
        return <SystemModule />;
      default:
        return (
          <InterfaceModule
            {...commonProps}
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
          />
        );
    }
  };

  return (
    <Dialog open={isSettingsModalOpen} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="h-full max-h-[60vh] w-full sm:h-200 sm:max-w-250 p-0 overflow-hidden bg-background border-border/40 text-foreground flex flex-col sm:flex-row gap-0 sm:rounded-2xl"
        aria-describedby="settings-modal-content"
      >
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogHeader className="sr-only">Settings Modal</DialogHeader>

        {/* Sidebar */}
        <div className="w-full sm:w-60 shrink-0 bg-sidebar border-b sm:border-b-0 sm:border-r border-border/40 flex flex-col overflow-hidden">
          <div className="hidden gap-2 items-center px-6 py-8 sm:flex">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Settings</h2>
          </div>

          <div className="flex overflow-x-auto flex-row flex-1 gap-1 p-2 sm:flex-col sm:overflow-y-auto custom-scrollbar sm:p-4">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  window.history.replaceState(null, "", `#settings/${item.id}`);
                }}
                className={cn(
                  "flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all text-left whitespace-nowrap sm:whitespace-normal",
                  activeSection === item.id
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex relative flex-col flex-1 min-h-0 bg-background/50">
          {/* Header/Close */}
          <button
            onClick={() => handleClose(false)}
            className="absolute top-4 right-4 z-10 p-1 transition-colors sm:top-6 sm:right-6 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>

          <div 
            key={activeSection}
            className="overflow-y-auto flex-1 p-4 sm:p-8 sm:pt-10 custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            {renderContent()}
          </div>

          <div className="flex sticky bottom-0 justify-end p-4 border-t backdrop-blur-sm sm:p-6 border-border/20 bg-background/80">
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="px-8 py-2 w-full font-semibold rounded-full transition-all sm:w-auto"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
