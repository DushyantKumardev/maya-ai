"use client";

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
import { API_ENDPOINTS } from "@/lib/constants/api";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Sparkles } from "lucide-react";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState("");

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "request" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setStep(2);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, action: "reset" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      alert("Password reset successful!");
      router.push("/login");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm animate-slide-in-from-bottom-4 rounded-3xl border-border/70 bg-card shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:shadow-none overflow-hidden">
      {/* Header section changes based on step */}
      <CardHeader className="space-y-2 relative pt-8">
        {step > 1 && step < 4 && (
          <button 
            onClick={() => setStep(step - 1)}
            className="absolute left-6 top-6 p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        
        <div className="flex justify-center max-w-50 mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            {step === 1 && <div className="text-xl font-bold">1</div>}
            {step === 2 && <Sparkles className="w-6 h-6 animate-pulse" />}
            {step === 3 && <div className="text-xl font-bold">3</div>}
          </div>
        </div>

        <CardTitle className="text-2xl text-center">
          {step === 1 && "Forgot Password"}
          {step === 2 && "Magic Verification"}
          {step === 3 && "Set New Password"}
        </CardTitle>
        <CardDescription className="text-center px-4">
          {step === 1 && "Enter your email address to receive recovery instructions."}
          {step === 2 && "We're performing some magic in the background to verify your account..."}
          {step === 3 && "Almost there! Create a strong new password for your account."}
        </CardDescription>
      </CardHeader>

      <div className="relative">
        {/* Step 1: Email Form */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="animate-in fade-in slide-in-from-right-4 duration-300">
            <CardContent className="grid gap-4 mt-2">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-xl h-11 border-border/60 focus:border-primary/50"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pb-8">
              <Button className="h-11 w-full rounded-xl" type="submit" disabled={loading}>
                {loading ? <><Spinner className="mr-2" /> Sending...</> : "Continue"}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Login
                </Link>
              </div>
            </CardFooter>
          </form>
        )}

        {/* Step 2: Magic Placeholder */}
        {step === 2 && (
          <div className="animate-in fade-in zoom-in-95 duration-500 py-6">
            <CardContent className="flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
              </div>
              <p className="text-sm font-medium text-center text-muted-foreground max-w-50">
                Validating your identity across our secure servers...
              </p>
            </CardContent>
            <CardFooter className="pb-8">
              <Button 
                onClick={() => setStep(3)} 
                variant="outline" 
                className="h-11 w-full rounded-xl border-dashed border-primary/30"
              >
                Skip Magic (Demo Only)
              </Button>
            </CardFooter>
          </div>
        )}

        {/* Step 3: New Password Form */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="animate-in fade-in slide-in-from-right-4 duration-300">
            <CardContent className="grid gap-4 mt-2">
              <div className="grid gap-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="rounded-xl h-11 border-border/60 focus:border-primary/50"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="rounded-xl h-11 border-border/60 focus:border-primary/50"
                />
              </div>
            </CardContent>
            <CardFooter className="pb-8">
              <Button className="h-11 w-full rounded-xl" type="submit" disabled={loading}>
                {loading ? <><Spinner className="mr-2" /> Saving...</> : "Reset Password"}
              </Button>
            </CardFooter>
          </form>
        )}
      </div>
    </Card>
  );
}
