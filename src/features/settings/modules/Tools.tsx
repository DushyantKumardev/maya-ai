"use client";

import {
  Globe,
  CloudSun,
  Mail,
  Music,
  Eye,
  ImagePlus,
  Brain,
  ShieldCheck,
  AlertCircle,
  Youtube,
  FileText,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils/utils";
import type { AppSettings } from "@/features/settings/types";

import { SettingsSection } from "../components/SettingsUI";

interface ModuleProps {
  draftSettings: AppSettings;
  setDraftSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  updateDraft: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => void;
}

export default function ToolsModule({
  draftSettings,
  updateDraft,
}: ModuleProps) {
  const toggleTool = (toolId: string) => {
    const currentTool = draftSettings.tools[toolId] || {
      enabled: false,
    };
    updateDraft("tools", {
      ...draftSettings.tools,
      [toolId]: { ...currentTool, enabled: !currentTool.enabled },
    });
  };

  const checkDependency = (
    id: string,
  ): { status: "ready" | "missing"; message?: string } => {
    const { apiKeys } = draftSettings;

    switch (id) {
      case "webSearch":
        return apiKeys?.serper
          ? { status: "ready" }
          : { status: "missing", message: "Serper Key" };
      case "imageGen":
        return apiKeys?.gemini
          ? { status: "ready" }
          : { status: "missing", message: "Gemini Key" };
      case "mailSender":
        return apiKeys?.gmail_email && apiKeys?.gmail_app_password
          ? { status: "ready" }
          : { status: "missing", message: "Gmail Setup" };
      default:
        return { status: "ready" };
    }
  };

  const capabilities = [
    {
      id: "webSearch",
      name: "Web Search",
      icon: Globe,
      description: "Search the internet for real-time information.",
    },
    {
      id: "weather",
      name: "Weather",
      icon: CloudSun,
      description: "Get current weather and forecasts.",
    },
    {
      id: "mailSender",
      name: "Mail Sender",
      icon: Mail,
      description: "Compose and send emails via connected accounts.",
    },
    {
      id: "tunelink",
      name: "Tunelink",
      icon: Music,
      description: "Search and stream music from JioSaavn.",
    },
    {
      id: "imageAnalyze",
      name: "Image Analyze",
      icon: Eye,
      description: "Analyze and describe the content of images.",
    },
    {
      id: "imageGen",
      name: "Image Gen",
      icon: ImagePlus,
      description: "Create stunning AI images from text prompts.",
    },
    {
      id: "docReader",
      name: "Document Reader",
      icon: FileText,
      description: "Read and analyze content from uploaded documents.",
    },
    {
      id: "memoryStore",
      name: "Memory Store",
      icon: Brain,
      description: "Manage and recall long-term user preferences.",
    },
    {
      id: "ytThumbnail",
      name: "YT Thumbnail",
      icon: Youtube,
      description: "Download YouTube thumbnails in various qualities.",
    },
  ] as const;

  return (
    <div className="space-y-10 pb-10 max-w-xl">
      <SettingsSection 
        title="Tools" 
        description="Enable specialized modules that Maya can use to perform actions and fetch external data."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {capabilities.map((tool) => {
            const isEnabled =
              draftSettings.tools[tool.id]?.enabled ?? false;
            const { status, message } = checkDependency(tool.id);

            return (
              <div
                key={tool.id}
                className={cn(
                  "group flex flex-col gap-3 p-4 rounded-2xl border transition-all cursor-pointer relative",
                  isEnabled
                    ? "border-primary/20 bg-primary/5 shadow-sm shadow-primary/5"
                    : "border-border/40 bg-secondary/30 hover:bg-secondary/40",
                )}
                onClick={() => toggleTool(tool.id)}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "p-2 rounded-xl border transition-colors",
                      isEnabled
                        ? "bg-primary/10 border-primary/20 shadow-sm"
                        : "bg-background border-border/20",
                    )}
                  >
                    <tool.icon
                      className={cn(
                        "w-4 h-4 transition-colors",
                        isEnabled
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-primary",
                      )}
                    />
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => toggleTool(tool.id)}
                    className="data-[state=checked]:bg-primary scale-75 origin-right"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div className="space-y-1 min-w-0">
                  <Label className="text-sm font-bold cursor-pointer tracking-tight">
                    {tool.name}
                  </Label>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 pr-2">
                    {tool.description}
                  </p>
                </div>

                {isEnabled && (
                  <div className="pt-1 flex items-center gap-2">
                    {status === "ready" ? (
                      <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        <span>Ready</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[9px] font-bold text-amber-500 uppercase tracking-tighter bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                        <AlertCircle className="w-2.5 h-2.5" />
                        <span>{message}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SettingsSection>
    </div>
  );
}
