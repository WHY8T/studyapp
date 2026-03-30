import { NextRequest, NextResponse } from "next/server";
import { chargily, MONTHLY_PRICE_DZD } from "@/lib/chargily";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet: { name: string; value: string; options?: any }[]) =>
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    ),
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, is_pro")
        .eq("id", user.id)
        .single();

    if (profile?.is_pro) {
        return NextResponse.json({ error: "Already subscribed" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    try {
        const product = await chargily.createProduct({
            name: "Nahda.Edu Pro — Monthly",
            description: "Unlimited AI quiz generation",
            metadata: { user_id: user.id },
        });

        const price = await chargily.createPrice({
            amount: MONTHLY_PRICE_DZD * 100,
            currency: "dzd",
            product_id: product.id,
            metadata: { user_id: user.id },
        });

        const checkout = await chargily.createCheckout({
            items: [{ price: price.id, quantity: 1 }],
            success_url: `${appUrl}/dashboard?payment=success`,
            failure_url: `${appUrl}/quiz?payment=failed`,
            locale: "ar",
            metadata: {
                user_id: user.id,
                user_email: user.email,
            },
        });

        return NextResponse.json({ checkout_url: checkout.checkout_url });
    } catch (error: any) {
        console.error("Chargily checkout error:", error);
        return NextResponse.json({ error: error.message ?? "Payment error" }, { status: 500 });
    }
}