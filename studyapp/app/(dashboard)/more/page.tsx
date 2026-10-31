import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MoreScreen } from "@/components/app/MoreScreen";

export default async function MorePage() {
    const ua = (await headers()).get("user-agent") ?? "";
    if (!ua.includes("NahdaApp")) redirect("/dashboard");
    return <MoreScreen />;
}