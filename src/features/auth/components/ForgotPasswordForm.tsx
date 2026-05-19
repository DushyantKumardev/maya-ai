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
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import React from "react";
import { API_ENDPOINTS } from "@/lib/constants/api";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowLeft,
  Sparkles,
  Mail,
  Check,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import {
  validatePassword,
  PasswordValidationResult,
} from "@/lib/utils/password-validator";
import { validateEmail } from "@/lib/utils/email-validator";

export function ForgotPasswordForm() {
  // --- Navigation & Routing Hooks ---
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- UI Screen Step State ---
  const [screen, setScreen] = React.useState<
    "REQUEST" | "VERIFYING" | "VERIFIED" | "RESET" | "CHECK_EMAIL"
  >("REQUEST");

  // --- Operation & Async States ---
  const [loading, setLoading] = React.useState(false);
  const [token, setToken] = React.useState("");
  const [resendStatus, setResendStatus] = React.useState<
    "idle" | "sending" | "sent"
  >("idle");
  const [timer, setTimer] = React.useState(60);

  // --- Form Inputs State ---
  const [formData, setFormData] = React.useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });

  // --- Real-time Verification Feedback ---
  const [emailFeedback, setEmailFeedback] = React.useState<string | null>(null);
  const [strength, setStrength] = React.useState<PasswordValidationResult>({
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

  // --- Unified Change Handler ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --- Real-time Validation Effects ---
  React.useEffect(() => {
    if (formData.email) {
      const emailResult = validateEmail(formData.email);
      setEmailFeedback(emailResult.feedback);
    } else {
      setEmailFeedback(null);
    }
  }, [formData.email]);

  React.useEffect(() => {
    setStrength(validatePassword(formData.newPassword, formData.email));
  }, [formData.newPassword, formData.email]);

  // --- Resend Dispatch Handler ---
  const handleResend = async () => {
    setResendStatus("sending");
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, action: "request" }),
      });

      if (!response.ok) {
        throw new Error("Failed to resend");
      }

      setResendStatus("sent");
      setTimer(60);
      toast.success("Magic link sent!");
      setTimeout(() => setResendStatus("idle"), 3000);
    } catch (error: any) {
      toast.error(error.message || "Failed to resend recovery email");
      setResendStatus("idle");
    }
  };

  // --- Magic Link Countdown Timer ---
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (screen === "CHECK_EMAIL" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [screen, timer]);

  // --- Verification Link Param Matcher ---
  React.useEffect(() => {
    const urlToken = searchParams.get("token");
    const urlEmail = searchParams.get("email");

    if (urlToken && urlEmail) {
      setFormData((prev) => ({
        ...prev,
        email: urlEmail,
      }));
      setToken(urlToken);
      setScreen("VERIFYING");

      const verifyToken = async () => {
        setLoading(true);
        try {
          const response = await fetch(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: urlEmail,
              token: urlToken,
              action: "verify",
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            toast.error(data.error || "Token verification failed");
            throw new Error(data.error || "Token verification failed");
          }

          setScreen("VERIFIED");
          setLoading(false);
          setTimeout(() => {
            setScreen("RESET");
          }, 1800);
        } catch (error: any) {
          toast.error(error.message || "Invalid or expired recovery link");
          setScreen("REQUEST");
          setLoading(false);
        }
      };

      verifyToken();
    }
  }, [searchParams]);

  // --- Recovery Dispatch Form Handler ---
  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const emailResult = validateEmail(formData.email);
    if (!emailResult.isValid) {
      toast.error(
        emailResult.feedback || "Please select a valid email address",
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, action: "request" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setTimer(60);
      setScreen("CHECK_EMAIL");
      toast.success("Verification email dispatched!");
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // --- Password Reset Operation Handler ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!strength.isValid) {
      toast.error(strength.feedback || "Please select a more secure password");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.newPassword,
          token,
          action: "reset",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      toast.success("Password updated successfully!");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message || "Could not update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full rounded-[24px] border border-border/80 bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none p-1.5 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      <CardHeader className="space-y-2 relative pt-8 pb-5">
        {screen !== "REQUEST" &&
          screen !== "VERIFYING" &&
          screen !== "VERIFIED" && (
            <button
              onClick={() => {
                setScreen("REQUEST");
              }}
              className="absolute left-5 top-5 p-2 rounded-full border border-border/60 bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}

        <div className="flex justify-center max-w-50 mx-auto mb-1">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm border ${
              screen === "VERIFIED"
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-background text-primary border-border"
            }`}
          >
            {screen === "REQUEST" && (
              <ShieldAlert className="w-5 h-5 text-muted-foreground" />
            )}
            {screen === "VERIFYING" && (
              <Sparkles className="w-5 h-5 animate-pulse text-primary" />
            )}
            {screen === "VERIFIED" && (
              <Check className="w-5 h-5 text-primary" />
            )}
            {screen === "RESET" && (
              <Lock className="w-5 h-5 text-muted-foreground" />
            )}
            {screen === "CHECK_EMAIL" && (
              <Mail className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>

        <CardTitle className="text-xl font-semibold text-center text-card-foreground">
          {screen === "REQUEST" && "Recover Account"}
          {screen === "VERIFYING" && "Checking Credentials"}
          {screen === "VERIFIED" && "Access Approved!"}
          {screen === "RESET" && "New Password"}
          {screen === "CHECK_EMAIL" && "Check Your Inbox"}
        </CardTitle>
        <CardDescription className="text-center text-[11px] text-muted-foreground px-4 leading-relaxed">
          {screen === "REQUEST" &&
            "Enter your email address and we will mail you a secure recovery link."}
          {screen === "VERIFYING" &&
            "Checking database cryptographic tokens in background..."}
          {screen === "VERIFIED" &&
            "Success! Magic link verified. Opening password configuration..."}
          {screen === "RESET" &&
            "Create a highly secure new password for your account access."}
          {screen === "CHECK_EMAIL" &&
            `A security link has been sent to ${formData.email || "your inbox"}.`}
        </CardDescription>
      </CardHeader>

      <div className="relative">
        {/* REQUEST Screen: Email Link */}
        {screen === "REQUEST" && (
          <form
            onSubmit={handleNextStep}
            className="animate-in fade-in slide-in-from-right-4 duration-300"
          >
            <CardContent className="space-y-3.5 pb-4 mt-1">
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
                    required
                    className="pl-11 rounded-xl h-11 border-input bg-background/50 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-ring transition-all"
                  />
                </div>
                {emailFeedback && (
                  <p className="text-[10px] text-destructive leading-none font-medium mt-1 animate-in fade-in duration-300">
                    {emailFeedback}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pb-4">
              <Button
                className="h-11 w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-sm"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="w-4 h-4 border-primary-foreground/30 border-t-primary-foreground" />{" "}
                    Dispatching...
                  </span>
                ) : (
                  "Continue"
                )}
              </Button>
              <div className="text-center text-xs text-muted-foreground">
                Remembered your password?{" "}
                <Link
                  href="/login"
                  className="text-primary hover:underline font-medium transition-colors underline-offset-4"
                >
                  Login
                </Link>
              </div>
            </CardFooter>
          </form>
        )}

        {/* VERIFYING Screen: Magic Param Verifier */}
        {screen === "VERIFYING" && (
          <div className="animate-in fade-in zoom-in-95 duration-500 py-6">
            <CardContent className="flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-[3px] border-primary/10 border-t-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                </div>
              </div>
              <p className="text-xs font-semibold text-center text-muted-foreground max-w-50 tracking-wider uppercase animate-pulse">
                Verifying link...
              </p>
            </CardContent>
          </div>
        )}

        {/* VERIFIED Screen: Successful magic link verification */}
        {screen === "VERIFIED" && (
          <div className="animate-in fade-in zoom-in-95 duration-500 py-10 flex flex-col items-center justify-center">
            <CardContent className="flex flex-col items-center justify-center gap-6">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-24 h-24 bg-primary/10 rounded-full animate-ping opacity-75 duration-1000" />
                <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary relative z-10 animate-bounce shadow-sm">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
              </div>
              <p className="text-xs font-bold text-center text-primary tracking-widest uppercase">
                Success Confirmed!
              </p>
            </CardContent>
          </div>
        )}

        {/* RESET Screen: New Password Fields */}
        {screen === "RESET" && (
          <form
            onSubmit={handleResetPassword}
            className="animate-in fade-in slide-in-from-right-4 duration-300"
          >
            <CardContent className="space-y-3.5 pb-4 mt-1">
              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-muted-foreground text-xs font-medium"
                >
                  New Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
                  <Input
                    id="password"
                    name="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    className="pl-11 rounded-xl h-11 border-input bg-background/50 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-ring transition-all"
                  />
                </div>

                {formData.newPassword && (
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
                    required
                    className="pl-11 rounded-xl h-11 border-input bg-background/50 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-ring transition-all"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="pb-4">
              <Button
                className="h-11 w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-sm"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="w-4 h-4 border-primary-foreground/30 border-t-primary-foreground" />{" "}
                    Saving Password...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </CardFooter>
          </form>
        )}

        {/* CHECK_EMAIL Screen: Magic Link Resend controls */}
        {screen === "CHECK_EMAIL" && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <CardContent className="flex flex-col items-center justify-center gap-6 py-4">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-20 h-20 bg-primary/5 rounded-full animate-ping opacity-75 pointer-events-none" />
                <div className="w-16 h-16 rounded-full bg-primary/5 border border-border flex items-center justify-center text-primary relative z-10">
                  <Mail className="w-6 h-6 animate-pulse" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pb-4 pt-2">
              <Button
                onClick={() => router.push("/login")}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-sm"
              >
                Back to Login
              </Button>
              <Button
                type="button"
                onClick={handleResend}
                disabled={resendStatus !== "idle" || timer > 0}
                variant="outline"
                className="w-full h-11 rounded-xl text-[11px] border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
              >
                {resendStatus === "sending" && "Resending Link..."}
                {resendStatus === "sent" && "Link Resent! check email"}
                {resendStatus === "idle" && timer === 0
                  ? "Resend Magic Link"
                  : `Request resend in ${timer}s`}
              </Button>
            </CardFooter>
          </div>
        )}
      </div>
    </Card>
  );
}
