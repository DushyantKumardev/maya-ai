import React from "react";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground px-4 py-12 select-none font-sans">
      {/* 1. Subtle minimalist grid pattern supporting light & dark themes */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, currentColor 1.5px, transparent 0)
          `,
          backgroundSize: "24px 24px",
        }}
      />

      {/* 2. Soft, neutral ambient glow behind the card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/[0.02] dark:bg-primary/3 blur-3xl pointer-events-none" />

      {/* 3. Simple & elegant brand typography */}
      <div className="relative z-10 flex flex-col items-center gap-1.5 mb-6 animate-in fade-in slide-in-from-top-3 duration-500">
        <h1 className="text-xl font-bold tracking-widest text-foreground uppercase">
          {APP_NAME}
        </h1>
      </div>

      {/* 4. Center-stage card container */}
      <div className="relative z-10 w-full max-w-sm flex items-center justify-center">
        {children}
      </div>

      {/* 5. Footer copyright */}
      <div className="relative z-10 mt-8 text-[10px] uppercase tracking-widest text-muted-foreground/60 transition-colors pointer-events-none">
        &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
      </div>
    </div>
  );
}
