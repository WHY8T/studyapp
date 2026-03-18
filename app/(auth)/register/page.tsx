"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, ArrowRight, Check, MailCheck } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (form.password.length < 8) {
      toast({
        title: "Weak password",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // Check username availability
    const { data: existing } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", form.username.toLowerCase())
      .maybeSingle();

    if (existing) {
      toast({
        title: "Username taken",
        description: "Choose a different username.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          username: form.username.toLowerCase(),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Email confirmation required — session is null until confirmed
    if (data.user && !data.session) {
      setSentTo(form.email);
      setEmailSent(true);
      setLoading(false);
      return;
    }

    // Email confirmation disabled — session is immediately available
    if (data.session) {
      toast({
        title: "Welcome to StudyFlow! 🎉",
        description: "Your journey begins now. +100 XP for joining!",
      });
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setLoading(false);
  };

  // ── Waiting for email confirmation ──
  if (emailSent) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-lime/10 flex items-center justify-center">
          <MailCheck className="w-10 h-10 text-lime" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display font-black text-2xl">Check your email</h1>
          <p className="text-muted-foreground">
            We sent a confirmation link to{" "}
            <span className="text-foreground font-semibold">{sentTo}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Click the link to activate your account and start earning XP!
          </p>
        </div>

        <div className="rounded-xl border border-lime/20 bg-lime/5 p-4 text-sm text-left space-y-1">
          <p className="font-semibold text-foreground">Didn&apos;t receive it?</p>
          <p className="text-muted-foreground">
            Check your spam folder, or{" "}
            <button
              onClick={() => setEmailSent(false)}
              className="text-lime underline underline-offset-2"
            >
              try again
            </button>
          </p>
        </div>

        <Link
          href="/login"
          className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Already confirmed? Sign in →
        </Link>
      </div>
    );
  }

  const perks = [
    "Unlimited Pomodoro sessions",
    "AI-powered quiz generation",
    "XP, levels & achievements",
    "Study with friends",
  ];

  return (
    <div className="space-y-8">
      {/* Mobile logo */}
      <div className="flex items-center gap-3 lg:hidden">
        <div className="w-9 h-9 rounded-xl bg-lime flex items-center justify-center">
          <span className="font-display font-black text-[#0D0D18] text-base">S</span>
        </div>
        <span className="font-display font-bold text-xl">StudyFlow</span>
      </div>

      <div className="space-y-2">
        <h1 className="font-display font-black text-3xl">Start your journey</h1>
        <p className="text-muted-foreground">
          Create your free account and earn 100 XP right away.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {perks.map((perk) => (
          <div key={perk} className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-4 h-4 rounded-full bg-lime/20 flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 text-lime" />
            </div>
            {perk}
          </div>
        ))}
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="John Doe"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                @
              </span>
              <Input
                placeholder="coolstudent"
                value={form.username}
                onChange={(e) =>
                  setForm({
                    ...form,
                    username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                  })
                }
                className="pl-8"
                required
                minLength={3}
                maxLength={20}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/80">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="you@student.edu"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/80">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="pl-10"
              required
              minLength={8}
            />
          </div>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-colors duration-300"
                style={{
                  background:
                    form.password.length >= i * 2
                      ? i <= 1
                        ? "#FF6B6B"
                        : i <= 2
                        ? "#FFB347"
                        : i <= 3
                        ? "#4ECDC4"
                        : "#00b7ff"
                      : "hsl(var(--muted))",
                }}
              />
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              Create account & earn 100 XP
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          By registering, you agree to our Terms and Privacy Policy.
        </p>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-lime hover:text-lime-300 transition-colors"
        >
          Sign in →
        </Link>
      </p>
    </div>
  );
}
