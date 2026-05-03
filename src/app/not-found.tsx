"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground flex items-center justify-center overflow-hidden">
      <div className="relative flex flex-col items-center justify-center px-4 text-center max-w-2xl w-full">
        
        {/* Animated Logo */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.1 
          }}
          className="mb-8"
        >
          <div className="relative group">
            <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-colors" />
            <Image
              src="/logo-dark.svg"
              alt="Maya AI"
              width={80}
              height={80}
              className="relative object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </motion.div>

        {/* 404 Text with Premium Gradient */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-8xl md:text-9xl font-black tracking-tighter bg-linear-to-b from-primary via-primary/80 to-muted-foreground/30 bg-clip-text text-transparent select-none"
        >
          404
        </motion.h1>

        {/* Title & Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-4"
        >
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Lost in the Digital Void
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto leading-relaxed">
            The page you&apos;re looking for has drifted beyond our reach. Let&apos;s get you back to the system core.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 flex flex-col sm:flex-row gap-4"
        >
          <Button asChild size="lg" className="rounded-full px-8 h-12 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            <Link href="/" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Return Home
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="rounded-full px-8 h-12 hover:bg-accent/50 transition-all active:scale-95"
            onClick={() => window.history.back()}
          >
            <span className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </span>
          </Button>
        </motion.div>

        {/* Premium Background Effects */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          {/* Main Glow */}
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-150 w-150 rounded-full bg-primary/20 blur-[120px]" 
          />
          
          {/* Secondary Glow */}
          <motion.div 
            animate={{ 
              x: [0, 30, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 right-0 h-100 w-100 rounded-full bg-chart-1/10 blur-[100px]" 
          />

          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[44px_44px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>
      </div>
    </div>
  );
}