"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

// ─── Password strength logic ───────────────────────────────────────────────
function getPasswordStrength(password: string): {
  score: number;       // 0–4
  label: string;
  color: string;
  barColor: string;
  width: string;
  tips: string[];
} {
  if (!password) return { score: 0, label: "", color: "", barColor: "", width: "0%", tips: [] };

  let score = 0;
  const tips: string[] = [];

  if (password.length >= 8) score++; else tips.push("At least 8 characters");
  if (/[A-Z]/.test(password)) score++; else tips.push("One uppercase letter");
  if (/[0-9]/.test(password)) score++; else tips.push("One number");
  if (/[^A-Za-z0-9]/.test(password)) score++; else tips.push("One special character (!@#$...)");

  const levels = [
    { label: "", color: "text-transparent", barColor: "bg-transparent", width: "0%" },
    { label: "Weak", color: "text-red-500", barColor: "bg-red-500", width: "25%" },
    { label: "Fair", color: "text-orange-400", barColor: "bg-orange-400", width: "50%" },
    { label: "Good", color: "text-yellow-400", barColor: "bg-yellow-400", width: "75%" },
    { label: "Strong", color: "text-green-400", barColor: "bg-green-400", width: "100%" },
  ];

  return { score, tips, ...levels[score] };
}

// ─── Password strength bar component ──────────────────────────────────────
function PasswordStrengthBar({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      {/* Bar */}
      <div className="flex gap-1 h-1.5">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="flex-1 rounded-full bg-white/10 overflow-hidden"
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${strength.score >= level ? strength.barColor : "bg-transparent"
                }`}
            />
          </div>
        ))}
      </div>

      {/* Label + tips */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold ${strength.color}`}>
          {strength.label}
        </span>
        {strength.tips.length > 0 && strength.score < 4 && (
          <span className="text-xs text-muted-foreground">
            Missing: {strength.tips[0]}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main register form ────────────────────────────────────────────────────
export default function RegisterPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [done, setDone] = useState(false);

  const strength = getPasswordStrength(password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (strength.score < 2) {
      newErrors.password = "Please choose a stronger password.";
    }
    if (password !== confirmPassword) {
      newErrors.confirm = "Passwords don't match.";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    console.log("Supabase signup error:", error);

    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  };

  // ── Success state ──────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-lime" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display font-black text-3xl">Check your inbox</h1>
          <p className="text-muted-foreground">
            We sent a confirmation link to <span className="text-foreground font-medium">{email}</span>.
            Click it to activate your account.
          </p>
        </div>
        <Link href="/login" className="text-sm text-lime hover:text-lime-300 transition-colors font-semibold">
          Back to sign in →
        </Link>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 lg:hidden">
        <div className="w-9 h-9 rounded-xl bg-lime flex items-center justify-center">
          <span className="font-display font-black text-[#0D0D18] text-base">N</span>
        </div>
        <span className="font-display font-bold text-xl">Nahda.Edu</span>
      </div>

      <div className="space-y-2">
        <h1 className="font-display font-black text-3xl">Create your account</h1>
        <p className="text-muted-foreground">Join thousands of students leveling up their studies.</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        {/* Full name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/80">Full name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Youcef Benali"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/80">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="you@student.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        {/* Password + strength bar */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/80">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              className={`pl-10 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              required
            />
          </div>

          {/* Strength bar — shows as user types */}
          <PasswordStrengthBar password={password} />

          {errors.password && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.password}</span>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/80">Confirm password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((prev) => ({ ...prev, confirm: undefined }));
              }}
              className={`pl-10 ${errors.confirm ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              required
            />
          </div>
          {errors.confirm && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.confirm}</span>
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-base"
          disabled={loading || strength.score < 1}
        >
          {loading ? <Loader2 className="animate-spin" /> : <><ArrowRight className="w-4 h-4" />Create account</>}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-lime hover:text-lime-300 transition-colors">
          Sign in →
        </Link>
      </p>
    </div>
  );
}