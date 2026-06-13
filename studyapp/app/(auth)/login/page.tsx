"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (searchParams.get("error") === "confirmation_failed") {
      toast({
        title: "Confirmation failed",
        description: "Your link may have expired. Please try registering again.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPasswordError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setPasswordError("Incorrect email or password. Please try again.");
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 lg:hidden">
        <div className="w-9 h-9 rounded-xl bg-lime flex items-center justify-center">
          <span className="font-display font-black text-[#0D0D18] text-base">N</span>
        </div>
        <span className="font-display font-bold text-xl">Nahda.Edu</span>
      </div>

      <div className="space-y-2">
        <h1 className="font-display font-black text-3xl">Welcome back</h1>
        <p className="text-muted-foreground">Continue your study journey. Your streak is waiting.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/80">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="you@student.edu"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setPasswordError(""); }}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground/80">Password</label>
            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-lime transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
              className={`pl-10 ${passwordError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              required
            />
          </div>
          {passwordError && (
            <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}
        </div>

        <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <><ArrowRight className="w-4 h-4" />Sign in</>}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New to Nahda.Edu?{" "}
        <Link href="/register" className="font-semibold text-lime hover:text-lime-300 transition-colors">
          Create your account →
        </Link>
      </p>

      <div className="rounded-xl border border-lime/20 bg-lime/5 p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-lime flex items-center justify-center shrink-0">
          <span className="text-[#0D0D18] font-bold text-sm">⚡</span>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-semibold">+20 XP</span> for logging in during an active streak day
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}