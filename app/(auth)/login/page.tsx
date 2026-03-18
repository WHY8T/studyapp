"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* Mobile logo */}
      <div className="flex items-center gap-3 lg:hidden">
        <div className="w-9 h-9 rounded-xl bg-lime flex items-center justify-center">
          <span className="font-display font-black text-[#0D0D18] text-base">S</span>
        </div>
        <span className="font-display font-bold text-xl">StudyFlow</span>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-display font-black text-3xl">Welcome back</h1>
        <p className="text-muted-foreground">
          Continue your study journey. Your streak is waiting.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4">
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground/80">Password</label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-lime transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              Sign in
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-background text-muted-foreground">or</span>
        </div>
      </div>

      {/* Register link */}
      <p className="text-center text-sm text-muted-foreground">
        New to StudyFlow?{" "}
        <Link
          href="/register"
          className="font-semibold text-lime hover:text-lime-300 transition-colors"
        >
          Create your account →
        </Link>
      </p>

      {/* XP incentive */}
      <div className="rounded-xl border border-lime/20 bg-lime/5 p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-lime flex items-center justify-center shrink-0">
          <span className="text-[#0D0D18] font-bold text-sm">⚡</span>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-semibold">+20 XP</span> for logging in
          during an active streak day
        </p>
      </div>
    </div>
  );
}
