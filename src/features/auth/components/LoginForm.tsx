"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Mail, Lock } from "lucide-react";

export function LoginForm() {
  // --- Navigation & State Hooks ---
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  // --- Submission Handler ---
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      toast.error("Invalid email or password");
    } else {
      toast.success("Welcome back!");
      router.push("/c");
    }
    setLoading(false);
  };

  return (
    <Card className="w-full rounded-[24px] border border-border/80 bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none p-1.5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl font-semibold text-card-foreground">
          Sign In
        </CardTitle>
        <CardDescription className="text-muted-foreground text-xs">
          Enter your registered email and password to log in.
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4 pb-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-muted-foreground text-xs font-medium">
              Email Address
            </Label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@domain.com"
                className="pl-11 rounded-xl h-11 border-input bg-background/50 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-ring transition-all"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-muted-foreground text-xs font-medium">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-[11px] text-muted-foreground hover:text-primary transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="pl-11 rounded-xl h-11 border-input bg-background/50 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-ring transition-all"
                required
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pb-4">
          <Button 
            className="h-11 w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-sm" 
            type="submit" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner className="w-4 h-4 border-primary-foreground/30 border-t-primary-foreground" /> Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </Button>
          
          <div className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link 
              href="/register" 
              className="text-primary hover:underline font-medium transition-colors underline-offset-4"
            >
              Create one
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
