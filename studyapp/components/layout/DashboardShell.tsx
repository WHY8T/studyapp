"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import type { Profile } from "@/types";
import { usePushNotifications } from "@/hooks/usePushNotifications";
export function DashboardShell({
    profile,
    children,
}: {
    profile: Profile | null;
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    usePushNotifications();

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Desktop sidebar */}
            <div className="hidden lg:block shrink-0">
                <Sidebar profile={profile} />
            </div>

            {/* Mobile sidebar + backdrop */}
            {sidebarOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/60 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
                        <Sidebar profile={profile} onClose={() => setSidebarOpen(false)} />
                    </div>
                </>
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <Header
                    profile={profile}
                    onMenuToggle={() => setSidebarOpen(true)}
                />
                <main className="flex-1 overflow-y-auto scrollbar-thin">
                    <div className="p-4 lg:p-6 max-w-7xl mx-auto">{children}</div>
                </main>
            </div>
        </div>
    );
}