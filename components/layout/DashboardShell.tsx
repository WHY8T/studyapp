"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import type { Profile } from "@/types";

export function DashboardShell({
    profile,
    children,
}: {
    profile: Profile | null;
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-50 lg:static lg:block transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                    }`}
            >
                <Sidebar profile={profile} />
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <Header
                    profile={profile}
                    onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
                />
                <main className="flex-1 overflow-y-auto scrollbar-thin">
                    <div className="p-6 max-w-7xl mx-auto">{children}</div>
                </main>
            </div>
        </div>
    );
}