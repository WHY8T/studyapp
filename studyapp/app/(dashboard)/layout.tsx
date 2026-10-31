import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/DashboardShell";
import FloatingChat from "@/components/chat/FloatingChat";
import FloatingPomodoro from "@/components/pomodoro/FloatingPomodoro";
import { SessionKeeper } from "@/components/providers/SessionKeeper";
import type { Profile } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // The Android app adds "NahdaApp" to its browser identity
  const ua = (await headers()).get("user-agent") ?? "";
  const isApp = ua.includes("NahdaApp");

  return (
    <DashboardShell
      profile={profile as Profile | null}
      isApp={isApp}
      floating={
        <>
          <FloatingChat />
          <FloatingPomodoro />
        </>
      }
    >
      <SessionKeeper />
      {children}
    </DashboardShell>
  );
}