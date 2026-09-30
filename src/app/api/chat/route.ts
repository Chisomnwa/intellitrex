import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";

const MODE_PROMPTS: Record<string, string> = {
  "risk-averse": `You are the Intellitrex Bot in Risk-Averse Mode. You focus on low-risk, long-term cryptocurrency investment strategies. Emphasize established cryptocurrencies with stable performance. Provide conservative trading analytics. Always remind users this is not financial advice.`,
  "active-trader": `You are the Intellitrex Bot in Active Trader Mode. You help frequent traders with real-time market insights, technical analysis, and short-term trading strategies. Discuss indicators like RSI, Bollinger Bands, Moving Averages. Always remind users this is not financial advice.`,
  learning: `You are the Intellitrex Bot in Learning Mode. You explain cryptocurrency concepts, trading terminology, and market mechanics in simple terms. Be educational and patient. Use analogies. Always remind users this is not financial advice and suggest paper trading before real trading.`,
};

export async function POST(req: NextRequest) {
  try {
    if (!hasSupabaseConfig()) {
      return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Sign in to use the AI advisor." }, { status: 401 });
    }

    const { message, mode, history } = await req.json();
    if (typeof message !== "string" || !message.trim() || message.length > 5000) {
      return NextResponse.json({ error: "A message is required." }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tier, chat_count")
      .eq("id", user.id)
      .single();
    if (profileError || !profile) {
      return NextResponse.json({ error: "Your account profile could not be loaded." }, { status: 503 });
    }
    if (profile.tier !== "premium" && profile.chat_count >= 50) {
      return NextResponse.json({ error: "You have reached the free chat limit." }, { status: 429 });
    }

    const portfolioTerms = ["portfolio", "my holdings", "my coins", "my investment", "risk analysis", "my binance", "my account", "should i sell", "should i buy", "my position"];
    if (profile.tier !== "premium" && portfolioTerms.some((term) => message.toLowerCase().includes(term))) {
      return NextResponse.json({ error: "Portfolio questions require Premium." }, { status: 403 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI advisor is not configured yet. Set OPENAI_API_KEY to enable it." }, { status: 503 });
    }

    const systemPrompt =
      MODE_PROMPTS[mode] || MODE_PROMPTS["active-trader"];

    const safeHistory = Array.isArray(history)
      ? history.slice(-10).filter((item) =>
        item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string"
      ).map((item) => ({ role: item.role, content: item.content.slice(0, 5000) }))
      : [];
    const messages = [
      { role: "system", content: systemPrompt },
      ...safeHistory,
      { role: "user", content: message },
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "AI advisor request failed." }, { status: 502 });
    }

    const data = await res.json();
    const reply =
      data.choices?.[0]?.message?.content ||
      "I apologize, I could not generate a response. Please try again.";

    const { data: chatCount, error: usageError } = await supabase.rpc("consume_chat_credit");
    if (usageError) {
      return NextResponse.json({ error: "Could not update chat usage." }, { status: 503 });
    }
    if (chatCount < 0) {
      return NextResponse.json({ error: "You have reached the free chat limit." }, { status: 429 });
    }

    return NextResponse.json({ response: reply, chatCount });
  } catch {
    return NextResponse.json(
      { error: "Chat service unavailable" },
      { status: 500 }
    );
  }
}
