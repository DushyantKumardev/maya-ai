"use client";

import React from "react";
import { APP_NAME, APP_CURRENT_VERSION, APP_LOGO } from "@/lib/constants/app";
import Image from "next/image";
import { Github } from "lucide-react";

export default function AboutModule() {
  return (
    <div className="flex flex-col justify-center items-center pt-10 space-y-6">
      <div className="flex justify-center items-center mb-4 w-20 h-20 rounded-2xl bg-sidebar-accent border border-sidebar-border/40">
        <Image src={APP_LOGO.DARK} alt="Logo" width={44} height={44} className="hidden dark:block" priority />
        <Image src={APP_LOGO.LIGHT} alt="Logo" width={44} height={44} className="block dark:hidden" priority />
      </div>
      <div className="text-center">
        <h3 className="text-2xl font-bold text-foreground">{APP_NAME}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Version {APP_CURRENT_VERSION}
        </p>
      </div>
      <div className="max-w-sm text-sm leading-relaxed text-center text-muted-foreground">
        {APP_NAME} is your intelligent workspace companion, powered by advanced
        language models and local data connectors.
      </div>
      <div className="flex gap-4 pt-4">
        <button className="text-xs transition-all text-muted-foreground hover:text-foreground hover:underline">
        <Github className="inline-block h-4 w-4 mr-1" />  GitHub 
        </button>
       
      </div>
    </div>
  );
}
