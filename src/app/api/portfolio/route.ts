import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";

const SUPPORTED_SYMBOLS = [
  "BTC", "ETH", "SOL", "XRP", "ARB", "DOT", "LINK", "KSM", "PYTH", "SUI",
];

const SYMBOL_TO_PAIR: Record<string, string> = {
  BTC: "XBTUSD",
  ETH: "ETHUSDT",
  SOL: "SOLUSDT",
  XRP: "XRPUSDT",
  ARB: "ARBUSD",
  DOT: "DOTUSDT",
  LINK: "LINKUSDT",
  KSM: "KSMUSD",
  PYTH: "PYTHUSD",
  SUI: "SUIUSD",
};

async function fetchForecast(pair: string, baseUrl: string) {
  try {
    const res = await fetch(
      `${baseUrl}/api/forecasts?pair=${pair}&model=ensemble`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!hasSupabaseConfig()) {
      return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Sign in to analyze a portfolio." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tier, portfolio_used")
      .eq("id", user.id)
      .single();
    if (profileError || !profile) {
      return NextResponse.json({ error: "Your account profile could not be loaded." }, { status: 503 });
    }
    if (profile.tier !== "premium" && profile.portfolio_used) {
      return NextResponse.json({ error: "Your free portfolio analysis has already been used." }, { status: 403 });
    }

    const { apiKey, apiSecret } = await req.json();

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "API key and secret are required" },
        { status: 400 }
      );
    }

    // Fetch Binance account info
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;

    // Create HMAC signature
    const encoder = new TextEncoder();
    const keyData = encoder.encode(apiSecret);
    const msgData = encoder.encode(queryString);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
    const sigHex = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const accountRes = await fetch(
      `https://api.binance.com/api/v3/account?${queryString}&signature=${sigHex}`,
      {
        headers: { "X-MBX-APIKEY": apiKey },
      }
    );

    if (!accountRes.ok) {
      const err = await accountRes.json();
      return NextResponse.json(
        { error: err.msg || "Failed to connect to Binance" },
        { status: accountRes.status }
      );
    }

    const account = await accountRes.json();

    // Filter non-zero balances and match with supported coins
    const holdings = account.balances
      .filter(
        (b: { asset: string; free: string; locked: string }) =>
          parseFloat(b.free) + parseFloat(b.locked) > 0
      )
      .map((b: { asset: string; free: string; locked: string }) => ({
        asset: b.asset,
        quantity: parseFloat(b.free) + parseFloat(b.locked),
        supported: SUPPORTED_SYMBOLS.includes(b.asset),
      }));

    // Fetch forecasts for supported holdings
    const baseUrl = req.nextUrl.origin;
    const analysisPromises = holdings
      .filter((h: { supported: boolean }) => h.supported)
      .map(async (h: { asset: string; quantity: number; supported: boolean }) => {
        const pair = SYMBOL_TO_PAIR[h.asset];
        if (!pair) return { ...h, forecast: null };
        const forecast = await fetchForecast(pair, baseUrl);
        return { ...h, pair, forecast };
      });

    const analysis = await Promise.all(analysisPromises);

    // Generate insights
    const insights = analysis.map(
      (a: {
        asset: string;
        quantity: number;
        pair?: string;
        forecast?: { forecasts?: { Close?: string; Predicted_Close?: string }[] } | null;
      }) => {
        if (!a.forecast || !a.forecast.forecasts || a.forecast.forecasts.length === 0) {
          return {
            asset: a.asset,
            quantity: a.quantity,
            insight: "Forecast data not available yet. Check back after the daily model run.",
            signal: "hold",
          };
        }

        const forecasts = a.forecast.forecasts;
        const firstPrice = parseFloat(
          forecasts[0].Close || forecasts[0].Predicted_Close || "0"
        );
        const lastPrice = parseFloat(
          forecasts[forecasts.length - 1].Close ||
            forecasts[forecasts.length - 1].Predicted_Close ||
            "0"
        );

        if (firstPrice === 0 || lastPrice === 0) {
          return {
            asset: a.asset,
            quantity: a.quantity,
            insight: "Unable to parse forecast data.",
            signal: "hold",
          };
        }

        const changePct = ((lastPrice - firstPrice) / firstPrice) * 100;

        let signal: string;
        let insight: string;
        if (changePct > 5) {
          signal = "bullish";
          insight = `Models predict ${changePct.toFixed(1)}% upside over 7 days. Your ${a.quantity} ${a.asset} position may benefit from holding.`;
        } else if (changePct < -5) {
          signal = "bearish";
          insight = `Models predict ${changePct.toFixed(1)}% downside over 7 days. Consider reviewing your ${a.quantity} ${a.asset} position.`;
        } else {
          signal = "neutral";
          insight = `Models predict ${changePct.toFixed(1)}% movement over 7 days. Your ${a.quantity} ${a.asset} position looks stable.`;
        }

        return {
          asset: a.asset,
          quantity: a.quantity,
          forecastedChange: changePct,
          signal,
          insight,
        };
      }
    );

    const snapshot = { holdings, insights, analyzedAt: Date.now() };
    const { data: saved, error: saveError } = await supabase.rpc("save_portfolio_snapshot", { snapshot });
    if (saveError) {
      return NextResponse.json({ error: "Could not save the portfolio analysis." }, { status: 503 });
    }
    if (!saved) {
      return NextResponse.json({ error: "Your free portfolio analysis has already been used." }, { status: 403 });
    }

    return NextResponse.json({
      totalAssets: holdings.length,
      supportedAssets: holdings.filter((h: { supported: boolean }) => h.supported).length,
      holdings,
      insights,
      analyzedAt: snapshot.analyzedAt,
    });
  } catch {
    return NextResponse.json(
      { error: "Portfolio analysis failed" },
      { status: 500 }
    );
  }
}
