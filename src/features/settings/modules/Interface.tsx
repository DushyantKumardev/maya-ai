"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppSettings } from "@/features/settings/types";

import { Palette, Languages } from "lucide-react";
import {
  SettingsSection,
  SettingsCard,
  SettingsItem,
} from "../components/SettingsUI";
import { useTheme } from "next-themes";

interface ModuleProps {
  draftSettings: AppSettings;
  updateDraft: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => void;
  showAdvanced?: boolean;
  setShowAdvanced?: (show: boolean) => void;
}

export default function InterfaceModule({
  draftSettings,
  updateDraft,
}: ModuleProps) {
  const { setTheme } = useTheme();

  const handleThemeChange = (v: "light" | "dark" | "system") => {
    updateDraft("theme", v);
    setTheme(v);
  };

  return (
    <div className="space-y-10 pb-10 max-w-xl">
      <SettingsSection
        title="Interface"
        description="Customize how Maya looks and feels on your device."
      >
        <SettingsCard className="space-y-6">
          <SettingsItem
            label="Appearance Theme"
            description="Switch between light, dark, or system-adaptive themes."
            icon={Palette}
          >
            <Select
              value={draftSettings.theme || "system"}
              onValueChange={handleThemeChange}
            >
              <SelectTrigger className="w-36 border-border/40 bg-background/50">
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </SettingsItem>

          <SettingsItem
            label="Language & Region"
            description="Set your primary language for the interface and AI responses."
            icon={Languages}
          >
            <Select
              value={draftSettings.locale || "en-US"}
              onValueChange={(v: any) => updateDraft("locale", v)}
            >
              <SelectTrigger className="w-36 border-border/40 bg-background/50">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="hi-IN">Hindi</SelectItem>
              </SelectContent>
            </Select>
          </SettingsItem>
        </SettingsCard>
      </SettingsSection>
    </div>
  );
}
