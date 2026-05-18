"use client";

import React from "react";
import {
  APP_NAME,
  APP_CURRENT_VERSION,
  APP_LOGO,
  APP_GITHUB_URL,
  APP_GITHUB_DOCS_URL,
  APP_DEVELOPER,
} from "@/lib/constants/app";
import Image from "next/image";
import {
  Book,
  ExternalLink,
  Github,
  User,
  Cpu,
  Database,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const SYSTEM_SPECS = [
  { icon: Cpu, label: "Engine", value: "Next.js" },
  { icon: Database, label: "Database", value: "MongoDB" },
  { icon: Shield, label: "Security", value: "NextAuth" },
  { icon: User, label: "AI Interface", value: "Multi-LLM Support" },
];

export default function AboutModule() {
  return (
    <div className="space-y-8 pb-10 max-w-xl select-none animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Brand Header */}
      <div className="flex items-center gap-4 py-2">
        <div className="flex justify-center items-center w-16 h-16 rounded-xl bg-sidebar-accent border border-sidebar-border/40 shrink-0">
          <Image
            src={APP_LOGO.DARK}
            alt="Logo"
            width={36}
            height={36}
            className="hidden dark:block"
            priority
          />
          <Image
            src={APP_LOGO.LIGHT}
            alt="Logo"
            width={36}
            height={36}
            className="block dark:hidden"
            priority
          />
        </div>
        <div className="flex flex-col">
          <h4 className="text-xl font-bold text-foreground leading-tight">
            {APP_NAME}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Version {APP_CURRENT_VERSION}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed text-muted-foreground max-w-lg">
        {APP_NAME} is your advanced workspace companion, bridging powerful Large
        Language Models with local data connectors for an intelligent,
        context-aware experience.
      </p>

      {/* Tech Specifications Grid */}
      <div className="space-y-3">
        <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
          System Specifications
        </h5>
        <div className="grid grid-cols-2 gap-3">
          {SYSTEM_SPECS.map((spec, idx) => {
            const Icon = spec.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-2.5 p-3 rounded-lg border border-border/40 bg-secondary/20"
              >
                <Icon className="h-4 w-4 text-primary" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider leading-none mb-1">
                    {spec.label}
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {spec.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons & Credits */}
      <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border/40">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs border-border/40 bg-background/50 hover:bg-muted"
          onClick={() => window.open(APP_GITHUB_URL, "_blank")}
        >
          <Github className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
          GitHub Repository
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs border-border/40 bg-background/50 hover:bg-muted"
          onClick={() => window.open(APP_GITHUB_DOCS_URL, "_blank")}
        >
          <Book className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
          Docs
        </Button>

        <span className="text-xs text-muted-foreground mx-1">|</span>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs hover:bg-muted gap-1.5 px-2"
          onClick={() => window.open(APP_DEVELOPER.github, "_blank")}
        >
          <div className="relative size-4 rounded-full overflow-hidden border border-border/40 bg-muted flex items-center justify-center shrink-0">
            <Image
              src={`https://github.com/DushyantKumardev.png`}
              alt={APP_DEVELOPER.name}
              width={16}
              height={16}
              className="h-full w-full object-cover"
              unoptimized
            />
          </div>
          <span className="text-muted-foreground">Developed by</span>
          <span className="font-semibold text-foreground hover:text-primary transition-colors">
            {APP_DEVELOPER.name}
          </span>
          <ExternalLink className="h-3 w-3 text-muted-foreground/60" />
        </Button>
      </div>
    </div>
  );
}
