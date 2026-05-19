"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_ENDPOINTS } from "@/lib/constants/api";
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
import { User, Mail, Lock, AlertCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import {
  validatePassword,
  PasswordValidationResult,
} from "@/lib/utils/password-validator";
import { validateEmail } from "@/lib/utils/email-validator";

export function RegisterForm() {
  // --- Hooks & Router ---
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // --- Form State ---
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // --- Validation States ---
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null);
  const [strength, setStrength] = useState<PasswordValidationResult>({
    isValid: false,
    score: 0,
    feedback: null,
    checks: {
      hasMinLength: false,
      hasMixedCase: false,
      hasNumber: false,
      hasSpecial: false,
      isNotCommon: false,
      doesNotContainEmail: false,
    },
  });

  // --- Input Change Handler ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --- Side Effects for Real-Time Validation ---
  useEffect(() => {
    if (formData.email) {
      const emailResult = validateEmail(formData.email);
      setEmailFeedback(emailResult.feedback);
    } else {
      setEmailFeedback(null);
    }
  }, [formData.email]);

  useEffect(() => {
    setStrength(validatePassword(formData.password, formData.email));
  }, [formData.password, formData.email]);

  // --- Submission Handler ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const emailResult = validateEmail(formData.email);
    if (!emailResult.isValid) {
      setError(emailResult.feedback || "Please select a valid email address");
      setLoading(false);
      return;
    }

    if (!strength.isValid) {
      setError(strength.feedback || "Please select a more secure password");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (res.ok) {
        toast.success("Account created successfully!");
        router.push("/login");
      } else {
        const data = await res.json();
        setError(data.error || "Registration failed");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full rounded-[24px] border border-border/80 bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none p-1.5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl font-semibold text-card-foreground">
          Sign Up
        </CardTitle>
        <CardDescription className="text-muted-foreground text-xs">
          Set up your profile to start chatting.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleRegister}>
        <CardContent className="space-y-3.5 pb-3">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs font-medium text-destructive animate-in fade-in duration-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Name Field */}
          <div className="space-y-1.5">
            <Label
              htmlFor="name"
              className="text-muted-foreground text-xs font-medium"
            >
              Full Name
            </Label>
            <div className="relative group">
              <User className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                className="pl-11 rounded-xl h-11 border-input bg-background/50 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-ring transition-all"
                required
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-muted-foreground text-xs font-medium"
            >
              Email Address
            </Label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@domain.com"
                value={formData.email}
                onChange={handleChange}
                className="pl-11 rounded-xl h-11 border-input bg-background/50 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-ring transition-all"
                required
              />
            </div>
            {emailFeedback && (
              <p className="text-[10px] text-destructive leading-none font-medium mt-1 animate-in fade-in duration-300">
                {emailFeedback}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="text-muted-foreground text-xs font-medium"
            >
              Password
            </Label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="pl-11 rounded-xl h-11 border-input bg-background/50 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-ring transition-all"
                required
              />
            </div>

            {formData.password && (
              <div className="space-y-1.5 mt-2 animate-in fade-in duration-300">
                <div className="flex gap-1 h-1">
                  {[1, 2, 3, 4].map((index) => (
                    <div
                      key={index}
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        index <= strength.score
                          ? strength.score === 1
                            ? "bg-destructive"
                            : strength.score === 2
                              ? "bg-amber-500"
                              : strength.score === 3
                                ? "bg-primary/50"
                                : "bg-primary"
                          : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                {strength.feedback && (
                  <p className="text-[10px] text-muted-foreground leading-none font-medium">
                    {strength.feedback}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1.5">
            <Label
              htmlFor="confirmPassword"
              className="text-muted-foreground text-xs font-medium"
            >
              Confirm Password
            </Label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
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
                <Spinner className="w-4 h-4 border-primary-foreground/30 border-t-primary-foreground" />{" "}
                Creating Profile...
              </span>
            ) : (
              "Sign Up"
            )}
          </Button>

          <div className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium transition-colors underline-offset-4"
            >
              Log in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
