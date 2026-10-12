import { ChargilyClient } from "@chargily/chargily-pay";

export const chargily = new ChargilyClient({
    api_key: process.env.CHARGILY_API_KEY!,
    mode: (process.env.CHARGILY_MODE as "test" | "live") ?? "test",
});

export const MONTHLY_PRICE_DZD = 350; // 500 DZD/month — change to your price