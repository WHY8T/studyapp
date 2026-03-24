"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Mail,
  Lock,
  User,
  ArrowRight,
  Check,
  MailCheck,
} from "lucide-react";

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

    const { data: existing, error: usernameError } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", form.username.toLowerCase())
      .maybeSingle();

    if (usernameError) {
      toast({
        title: "Database error",
        description: usernameError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

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

    if (data.user && !data.session) {
      setSentTo(form.email);
      setEmailSent(true);
      setLoading(false);
      return;
    }

    if (data.session) {
      toast({
        title: "Welcome to Nahda.Edu! 🎓",
        description: "Your journey begins now. +100 XP for joining!",
      });
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setLoading(false);
  };

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
        </div>
        <Link href="/login" className="text-sm text-muted-foreground">
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
      <div className="space-y-2">
        <h1 className="font-display font-black text-3xl">Start your journey</h1>
        <p className="text-muted-foreground">
          Create your free account and earn 100 XP right away.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {perks.map((perk) => (
          <div key={perk} className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="w-3 h-3 text-lime" />
            {perk}
          </div>
        ))}
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <Input
          placeholder="Full Name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          required
        />
        <Input
          placeholder="Username"
          value={form.username}
          onChange={(e) =>
            setForm({
              ...form,
              username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
            })
          }
          required
        />
        <Input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-lime">
          Sign in →
        </Link>
      </p>
    </div>
  );
}