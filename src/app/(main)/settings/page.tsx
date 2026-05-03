"use client";

import { useEffect, useState, useCallback } from "react";
import { Settings, MonitorCheck, Wrench, User, MessageSquare, Info } from "lucide-react";
import { useSettings } from "@/features/settings/context/SettingsContext";
import type { AppSettings } from "@/features/settings/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import Loader from "@/components/common/Loader";
import { toast } from "sonner";

// Modules
import InterfaceModule from "@/features/settings/modules/Interface";
import EngineModule from "@/features/settings/modules/Engine";
import PersonaModule from "@/features/settings/modules/Persona";
import ToolsModule from "@/features/settings/modules/Tools";
import KeysModule from "@/features/settings/modules/Keys";
import SystemModule from "@/features/settings/modules/System";

const sidebarItems = [
  { id: "interface", label: "Interface", icon: MonitorCheck },
  { id: "engine", label: "Engine", icon: MessageSquare },
  { id: "persona", label: "Persona", icon: User },
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "keys", label: "Keys", icon: Settings },
  { id: "system", label: "System", icon: Info },
];

export default function SettingsPage() {
  const { 
    settings, 
    syncSettings, 
    isLoading 
  } = useSettings();
  
  const [activeSection, setActiveSection] = useState("appearance");
  const [draftSettings, setDraftSettings] = useState<AppSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sync draft with global settings when loaded
  useEffect(() => {
    if (!isLoading) {
      setDraftSettings(settings);
    }
  }, [settings, isLoading]);

  // Hash routing
  useEffect(() => {
    const readHash = () => {
      const hash = window.location.hash.replace("#", "").split("/")[0];
      if (hash && sidebarItems.some((s) => s.id === hash)) {
        setActiveSection(hash);
      } else {
        // Default to interface if no valid hash
        setActiveSection("interface");
        if (window.location.hash) {
           window.history.replaceState(null, "", window.location.pathname);
        }
      }
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  // Track changes between settings and draft
  useEffect(() => {
    if (!isLoading && settings && draftSettings) {
      const hasDeepChanges = JSON.stringify(settings) !== JSON.stringify(draftSettings);
      setHasChanges(hasDeepChanges);
    }
  }, [draftSettings, settings, isLoading]);

  const navigateTo = (id: string) => {
    setActiveSection(id);
    window.history.replaceState(null, "", `#${id}`);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await syncSettings(draftSettings);
      setHasChanges(false);
      toast.success("Settings saved successfully");
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const updateDraft = useCallback(<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    setDraftSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

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
          <EngineModule
            {...commonProps}
            setDraftSettings={setDraftSettings}
          />
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
      case "keys":
        return <KeysModule {...commonProps} />;
      case "system":
        return <SystemModule />;
      default:
        // Fallback to interface if something goes wrong
        return (
          <InterfaceModule
            {...commonProps}
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
          />
        );
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="flex h-full overflow-hidden bg-[#131313] text-gray-100">
      {/* Sidebar Navigation */}
      <nav className="w-64 shrink-0 border-r border-border/20 bg-[#0f0f0f]/50 p-6 flex flex-col gap-1">
        <div className="flex items-center gap-3 px-3 py-2 mb-6">
          <Settings className="h-6 w-6 text-foreground" />
          <h1 className="font-bold text-xl tracking-tight">Settings</h1>
        </div>
        
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigateTo(item.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all cursor-pointer text-left font-medium",
              activeSection === item.id
                ? "bg-[#262626] text-white shadow-sm"
                : "text-muted-foreground hover:bg-[#262626]/50 hover:text-gray-200",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}

        <div className="mt-auto pt-6 border-t border-border/10">
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="w-full bg-white text-black hover:bg-gray-200 font-semibold rounded-full py-6"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </nav>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-12 custom-scrollbar min-h-screen">
        <div 
          key={activeSection}
          className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
