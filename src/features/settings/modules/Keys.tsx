"use client";

import React from "react";
import { AppSettings } from "@/features/settings/types";
import { SERVICES } from "@/lib/constants/services";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Key,
  ShieldCheck,
  Search,
  Zap,
  ExternalLink,
  Mail,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { SettingsSection, SettingsCard, SettingsItem } from "../components/SettingsUI";

interface ModuleProps {
  draftSettings: AppSettings;
  updateDraft: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

export default function KeysModule({ draftSettings, updateDraft }: ModuleProps) {

  const updateKey = (id: string, value: string) => {
    updateDraft("apiKeys", {
      ...draftSettings.apiKeys,
      [id]: value,
    });
  };

  const handleProviderSwitch = (provider: "gmail" | "resend") => {
    updateDraft("emailProvider", provider);
  };

  // Derived directly from draftSettings — no local state needed
  const isGmailConfigured = !!(
    draftSettings.gmailEmail &&
    draftSettings.apiKeys["gmail_app_password"]
  );
  const isResendConfigured = !!(
    draftSettings.apiKeys["resend_api_key"] &&
    draftSettings.resendEmail
  );

  const renderServiceGroup = ({
    category,
    title,
    description,
    Icon
  }:{
    category: "ai" | "search" | "tools";
    title: string;
    description: string;
    Icon: LucideIcon;
  }) => {
    const filteredServices = SERVICES.filter((s) => s.category === category);
    if (filteredServices.length === 0) return null;

    return (
      <SettingsSection title={title} description={description}>
        <SettingsCard className="space-y-6">
          {filteredServices.map((service) => {
            const hasKey = !!draftSettings.apiKeys[service.id];

            return (
              <SettingsItem
                key={service.id}
                label={service.name}
                description={service.description}
                icon={Icon}
              >
                <div className="flex flex-col gap-2 items-end">
                  <div className="flex items-center gap-2">
                    {service.link && (
                      <a
                        href={service.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-primary hover:underline flex items-center gap-1 font-medium"
                      >
                        Get Key
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    {hasKey && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                  </div>
                  <div className="relative group w-48 sm:w-64">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors">
                      <Key className="w-3.5 h-3.5" />
                    </div>
                    <Input
                      type="password"
                      placeholder={hasKey ? "••••••••••••••••" : "Enter API Key"}
                      value={draftSettings.apiKeys[service.id] ?? ""}
                      onChange={(e) => updateKey(service.id, e.target.value)}
                      className="pl-9 pr-9 h-8 bg-background/50 border-border/40 text-[12px] placeholder:text-muted-foreground/50"
                    />
                   
                  </div>
                </div>
              </SettingsItem>
            );
          })}
        </SettingsCard>
      </SettingsSection>
    );
  };

  return (
    <div className="space-y-10 pb-10 max-w-xl">
      {renderServiceGroup({
        category: "ai",
        title: "Inference Keys",
        description: "Configure API keys for external LLM providers to power Maya's reasoning.",
        Icon: Zap
      })}

      {renderServiceGroup({
        category: "search",
        title: "Search Keys",
        description: "Enable Maya to browse the live web and fetch real-time information.",
        Icon: Search
      })}

      <SettingsSection
        title="Email Services"
        description="Choose how Maya sends emails on your behalf."
      >
        <SettingsCard className="space-y-6">
          <SettingsItem
            label="Default Provider"
            description="Select between Gmail SMTP or Resend API."
            icon={Mail}
          >
            <div className="flex items-center gap-1 bg-background/50 p-1 rounded-lg border border-border/40">
              <button
                onClick={() => handleProviderSwitch("gmail")}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                  draftSettings.emailProvider === "gmail"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Gmail
                {isGmailConfigured && (
                  <ShieldCheck className="inline ml-1 w-3 h-3 text-emerald-400" />
                )}
              </button>
              <button
                onClick={() => handleProviderSwitch("resend")}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                  draftSettings.emailProvider === "resend"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Resend
                {isResendConfigured && (
                  <ShieldCheck className="inline ml-1 w-3 h-3 text-emerald-400" />
                )}
              </button>
            </div>
          </SettingsItem>

          {draftSettings.emailProvider === "gmail" && (
            <div className="space-y-4 pt-2 border-t border-border/10 animate-in fade-in slide-in-from-top-1">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                    Gmail Address
                  </Label>
                  <Input
                    type="email"
                    placeholder="you@gmail.com"
                    value={draftSettings.gmailEmail ?? ""}
                    onChange={(e) => updateDraft("gmailEmail", e.target.value)}
                    className="bg-background/50 text-xs h-9 border-border/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                    App Password
                  </Label>
                  <div className="relative">
                    <Input
                      type="password"
                      placeholder="••••••••••••••••"
                      value={draftSettings.apiKeys["gmail_app_password"] ?? ""}
                      onChange={(e) => updateKey("gmail_app_password", e.target.value)}
                      className="bg-background/50 text-xs h-9 border-border/40 pr-9"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {draftSettings.emailProvider === "resend" && (
            <div className="space-y-4 pt-2 border-t border-border/10 animate-in fade-in slide-in-from-top-1">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                    Sender Email
                  </Label>
                  <Input
                    type="email"
                    placeholder="maya@domain.com"
                    value={draftSettings.resendEmail ?? ""}
                    onChange={(e) => updateDraft("resendEmail", e.target.value)}
                    className="bg-background/50 text-xs h-9 border-border/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                    API Key
                  </Label>
                  <div className="relative">
                    <Input
                      type="password"
                      placeholder="re_••••••••••••"
                      value={draftSettings.apiKeys["resend_api_key"] ?? ""}
                      onChange={(e) => updateKey("resend_api_key", e.target.value)}
                      className="bg-background/50 text-xs h-9 border-border/40 pr-9"
                    />
                   
                  </div>
                </div>
              </div>
            </div>
          )}
        </SettingsCard>
      </SettingsSection>

      {renderServiceGroup({
        category: "tools",
        title: "External Integrations",
        description: "Connect other tools and platforms to extend Maya's functionality.",
        Icon: ExternalLink
      })}

      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex gap-4 items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary shadow-inner">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-sm font-semibold text-primary tracking-tight">
            Personal Data Security
          </h4>
          <p className="text-[11px] text-primary/70 leading-normal">
            Your keys are encrypted with AES-256 before storage. They are only decrypted
            in memory during active inference sessions.
          </p>
        </div>
      </div>
    </div>
  );
}