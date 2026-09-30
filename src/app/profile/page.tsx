"use client";

import { useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  Link2,
  Crown,
  MessageSquare,
  Lock,
  CreditCard,
  Check,
  Trash2,
  Unlink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const SIGNAL_CONFIG: Record<string, { icon: typeof TrendingUp; color: string; bg: string; label: string }> = {
  bullish: { icon: TrendingUp, color: "text-success", bg: "bg-success/10", label: "Bullish" },
  bearish: { icon: TrendingDown, color: "text-danger", bg: "bg-danger/10", label: "Bearish" },
  neutral: { icon: Minus, color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Neutral" },
  hold: { icon: Minus, color: "text-muted-foreground", bg: "bg-muted", label: "Hold" },
};

const PREMIUM_FEATURES = [
  "Unlimited AI chatbot conversations",
  "Binance portfolio integration & analysis",
  "Personalized investment insights with forecasts",
  "Access to Ensemble model (best accuracy)",
  "Unlimited risk analysis refreshes",
  "Chat history across sessions",
];

function PremiumUpgradeCard() {
  const { premiumPrice } = useAuth();

  return (
    <div className="bg-gradient-to-br from-primary/10 via-card to-yellow-500/5 rounded-2xl border border-primary/20 p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
          <Crown className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Intellitrex Premium</h3>
          <p className="text-sm text-muted-foreground">Unlock the full trading experience</p>
        </div>
      </div>
      <div className="mb-6">
        <span className="text-4xl font-bold text-foreground">{premiumPrice.replace("/month", "")}</span>
        <span className="text-muted-foreground">/month</span>
      </div>
      <ul className="space-y-3 mb-8">
        {PREMIUM_FEATURES.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-foreground">
            <Check className="w-4 h-4 text-success flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <button
        disabled
        className="w-full py-3.5 rounded-xl bg-muted text-muted-foreground font-semibold cursor-not-allowed flex items-center justify-center gap-2"
      >
        <CreditCard className="w-4 h-4" /> Payments are not connected yet
      </button>
      <p className="text-xs text-muted-foreground text-center mt-3">Premium purchases are unavailable until a verified billing integration is configured.</p>
    </div>
  );
}

function SignInForm() {
  const { signInWithEmail, verifyEmailOtp, signInWithGoogle, isConfigured, isReady, authError } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    const message = await signInWithEmail(name.trim(), email.trim());
    if (message) setError(message);
    else setCodeSent(true);
    setBusy(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the six-digit code from your email.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    const message = await verifyEmailOtp(email.trim(), code.trim());
    if (message) setError("That code could not be verified. Check it and try again, or request a new code.");
    setBusy(false);
  };

  const handleGoogle = async () => {
    setBusy(true);
    const message = await signInWithGoogle();
    if (message) {
      setError(message);
      setBusy(false);
    }
  };

  const handleResendCode = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    const message = await signInWithEmail(name.trim(), email.trim());
    if (message) setError(message);
    else setNotice("A new code has been sent to your email.");
    setBusy(false);
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-primary/[0.06] via-background to-background px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto grid min-h-[560px] max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-primary/5 md:grid-cols-[0.9fr_1.1fr]">
        <section className="relative flex flex-col justify-between overflow-hidden bg-slate-950 p-7 text-white sm:p-10 md:p-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="relative">
            <div className="mb-12 flex items-center gap-3 md:mb-20">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-bold">I</div>
              <span className="text-lg font-semibold tracking-tight">Intellitrex</span>
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">Your trading workspace</p>
            <h2 className="max-w-sm text-3xl font-bold leading-tight sm:text-4xl">Make more of every market moment.</h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
              Keep your conversations, portfolio insights, and account preferences together in one place.
            </p>
          </div>
          <div className="relative mt-12 rounded-2xl border border-white/10 bg-white/[0.06] p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4 text-emerald-400" />
              Verified account access
            </div>
            <p className="text-xs leading-5 text-slate-300">Sign in securely to keep your profile and workspace data available across sessions.</p>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 md:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Lock className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{codeSent ? "Check your email" : "Welcome back"}</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {codeSent ? `Enter the six-digit code sent to ${email}.` : "Sign in to access your Intellitrex profile."}
              </p>
            </div>

            <div className="mb-6 flex gap-3 rounded-xl border border-primary/15 bg-primary/[0.05] p-4 text-sm text-foreground">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>{isConfigured ? "Email codes verify that you own the address before an account session is created." : "Authentication setup is required. Follow docs/auth-setup.md to connect Supabase before signing in."}</p>
            </div>

            {!codeSent ? (
              <>
                <button type="button" onClick={handleGoogle} disabled={!isConfigured || !isReady || busy}
                  className="mb-5 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card py-3 font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="font-bold text-lg text-primary">G</span>}
                  Continue with Google
                </button>

                <div className="relative mb-5 flex items-center justify-center text-xs text-muted-foreground">
                  <span className="absolute inset-x-0 border-t border-border" />
                  <span className="relative bg-card px-3">or continue with email</span>
                </div>

                <form id="email-form" onSubmit={handleSubmit} className="space-y-4 text-left">
                  <div>
                    <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium text-foreground">Name</label>
                    <input id="profile-name" type="text" value={name}
                      onChange={(e) => { setName(e.target.value); setError(""); }} placeholder="Your full name"
                      autoComplete="name" disabled={!isConfigured || busy}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-50" />
                  </div>
                  <div>
                    <label htmlFor="profile-email" className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                    <input id="profile-email" type="email" value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="you@example.com"
                      autoComplete="email" disabled={!isConfigured || busy}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-50" />
                  </div>
                  <button type="submit" disabled={!isConfigured || !isReady || busy}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />} Send one-time code
                  </button>
                </form>
              </>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4 text-left">
                <div>
                  <label htmlFor="email-code" className="mb-1.5 block text-sm font-medium text-foreground">Email code</label>
                  <input id="email-code" type="text" inputMode="numeric" autoComplete="one-time-code"
                    pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
                    placeholder="000000" disabled={busy} autoFocus
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center font-mono text-xl tracking-[0.5em] text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" />
                </div>
                <button type="submit" disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:opacity-50">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} Verify and continue
                </button>
                <button type="button" disabled={busy} onClick={() => { setCodeSent(false); setCode(""); setError(""); }}
                  className="w-full py-2 text-sm font-medium text-primary hover:underline disabled:opacity-50">Use a different email</button>
                <button type="button" disabled={busy} onClick={() => void handleResendCode()}
                  className="w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50">Resend code</button>
              </form>
            )}

            {notice && <p role="status" className="mt-4 text-center text-sm text-success">{notice}</p>}
            {(error || authError) && (
              <div role="alert" className="mt-4 flex items-center gap-2 text-sm text-danger">
                <AlertCircle className="h-4 w-4 shrink-0" />{error || authError}
              </div>
            )}

          <p className="mt-6 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
            Free tier includes 50 AI chatbot responses and 1 portfolio analysis. Upgrade for unlimited access.
          </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  const {
    user, isLoggedIn, isPremium, isReady, chatCount, chatLimit,
    getChatSessions, unlinkBinance,
    savePortfolioSnapshot, deleteAccount, premiumPrice,
  } = useAuth();

  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "portfolio" | "subscription" | "settings">("overview");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const chatSessions = getChatSessions();
  const portfolioSnapshot = user?.portfolioSnapshot;
  const portfolioLocked = !isPremium && user?.portfolioUsed && !!portfolioSnapshot;

  const connectBinance = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      setError("Both API Key and Secret are required");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, apiSecret }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to connect to Binance");
        setLoading(false);
        return;
      }
      savePortfolioSnapshot({
        holdings: data.holdings,
        insights: data.insights,
        analyzedAt: data.analyzedAt,
      });
    } catch {
      setError("Connection failed. Please check your credentials.");
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    const deleteError = await deleteAccount();
    if (deleteError) {
      setError(deleteError);
      setConfirmDelete(false);
    }
  };

  const handleUnlinkBinance = async () => {
    try {
      await unlinkBinance();
      setError("");
    } catch {
      setError("Could not unlink the Binance account. Please try again.");
    }
  };

  if (!isReady) return <div className="px-6 py-16 text-center text-muted-foreground">Loading account…</div>;
  if (!isLoggedIn) return <SignInForm />;

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center gap-4">
            {user?.avatar && <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full" />}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">{user?.name}</h1>
                {isPremium && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 text-yellow-600 rounded-full text-xs font-medium">
                    <Crown className="w-3 h-3" /> Premium
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          {!isPremium && (
            <div className="mt-4 p-4 bg-muted rounded-xl">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Chat usage: {chatCount}/{chatLimit}</span>
                <span className="text-primary text-xs font-medium">{Math.max(chatLimit - chatCount, 0)} remaining</span>
              </div>
              <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min((chatCount / chatLimit) * 100, 100)}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {([
            { id: "overview" as const, label: "Overview", icon: MessageSquare },
            { id: "history" as const, label: "Chat History", icon: MessageSquare },
            { id: "portfolio" as const, label: "Portfolio", icon: Wallet },
            { id: "subscription" as const, label: "Subscription", icon: Crown },
            { id: "settings" as const, label: "Settings", icon: Shield },
          ]).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap",
                  activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />{tab.label}
              </button>
            );
          })}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6 text-center">
              <p className="text-3xl font-bold text-foreground">{chatCount}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Chats</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 text-center">
              <p className="text-3xl font-bold text-foreground">{chatSessions.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Chat Sessions</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 text-center">
              <p className="text-3xl font-bold text-foreground capitalize">{user?.tier}</p>
              <p className="text-sm text-muted-foreground mt-1">Current Plan</p>
            </div>
          </div>
        )}

        {/* Chat History */}
        {activeTab === "history" && (
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Chat History</h3>
            {chatSessions.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No chat history yet. Start a conversation in the <a href="/consultancy" className="text-primary hover:underline">Consultancy</a> page.
              </p>
            ) : (
              <div className="space-y-3">
                {chatSessions.map((session) => (
                  <a
                    key={session.id}
                    href={`/consultancy?session=${session.id}`}
                    className="block rounded-xl border border-border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-medium text-foreground">{session.title || "Untitled"}</h4>
                      <span className="text-xs text-muted-foreground">{new Date(session.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {session.messages.length} messages &middot; {session.mode}
                    </p>
                    {session.messages.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        Last: {session.messages[session.messages.length - 1].content.slice(0, 80)}...
                      </p>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Portfolio */}
        {activeTab === "portfolio" && (
          <>
            {!user?.binanceConnected && !portfolioSnapshot && (!user?.portfolioUsed || isPremium) ? (
              /* Connect form */
              <div className="bg-card rounded-2xl border border-border p-8 max-w-lg mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Link2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Connect Binance</h2>
                    <p className="text-xs text-muted-foreground">
                      {isPremium ? "Unlimited analysis with Premium" : "One free analysis — then upgrade for more"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">API Key</label>
                    <input type="text" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Binance API Key" className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">API Secret</label>
                    <div className="relative">
                      <input type={showSecret ? "text" : "password"} value={apiSecret} onChange={(e) => setApiSecret(e.target.value)}
                        placeholder="Binance API Secret" className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-muted text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-primary" />
                      <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {error && <div className="flex items-center gap-2 text-danger text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}
                  <button onClick={connectBinance} disabled={loading}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Wallet className="w-4 h-4" /> Connect & Analyze</>}
                  </button>
                </div>
                <div className="mt-6 p-4 bg-muted rounded-xl">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium mb-1">Security</p>
                      <ul className="space-y-1">
                        <li>Use a read-only API key (no trading permissions)</li>
                        <li>Credentials are never stored on our servers</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : portfolioSnapshot ? (
              /* Portfolio results */
              <div className="space-y-6">
                <div className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <h2 className="text-lg font-semibold text-foreground">Portfolio Analysis</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        Analyzed {new Date(portfolioSnapshot.analyzedAt).toLocaleDateString()}
                      </span>
                      {user?.binanceConnected && (
                        <button onClick={() => void handleUnlinkBinance()} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-danger transition-colors">
                          <Unlink className="w-3 h-3" /> Unlink
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Locked overlay for free users */}
                  {portfolioLocked && (
                    <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                      <div className="flex items-center gap-2 text-yellow-600 text-sm font-medium mb-1">
                        <Lock className="w-4 h-4" /> Analysis Locked
                      </div>
                      <p className="text-xs text-muted-foreground">
                        You&apos;ve used your free analysis. Upgrade to Premium for unlimited refreshes and detailed insights.
                      </p>
                      <a href="/profile?tab=subscription" onClick={() => setActiveTab("subscription")}
                        className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline">
                        <Crown className="w-3 h-3" /> Upgrade to Premium
                      </a>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{portfolioSnapshot.holdings.length}</p>
                      <p className="text-xs text-muted-foreground">Assets</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{portfolioSnapshot.insights.length}</p>
                      <p className="text-xs text-muted-foreground">Insights</p>
                    </div>
                  </div>
                </div>

                {/* Insights */}
                {portfolioSnapshot.insights.length > 0 && (
                  <div className={cn("bg-card rounded-2xl border border-border p-6 relative", portfolioLocked && "select-none")}>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Investment Insights</h3>
                    <div className={cn("space-y-4", portfolioLocked && "blur-sm pointer-events-none")}>
                      {portfolioSnapshot.insights.map((insight, i) => {
                        const config = SIGNAL_CONFIG[insight.signal] || SIGNAL_CONFIG.hold;
                        const Icon = config.icon;
                        return (
                          <div key={i} className="rounded-xl border border-border p-5">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-foreground">{insight.asset}</span>
                                <span className="text-sm text-muted-foreground">{insight.quantity} held</span>
                              </div>
                              <span className={cn("flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium", config.bg, config.color)}>
                                <Icon className="w-3.5 h-3.5" />{config.label}
                                {insight.forecastedChange !== undefined && ` (${insight.forecastedChange > 0 ? "+" : ""}${insight.forecastedChange.toFixed(1)}%)`}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{insight.insight}</p>
                          </div>
                        );
                      })}
                    </div>
                    {portfolioLocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button onClick={() => setActiveTab("subscription")}
                          className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium flex items-center gap-2 shadow-lg">
                          <Crown className="w-4 h-4" /> Unlock with Premium
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Holdings table */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Holdings</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-muted-foreground font-medium">Asset</th>
                        <th className="text-right py-2 text-muted-foreground font-medium">Quantity</th>
                        <th className="text-right py-2 text-muted-foreground font-medium">Forecast</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioSnapshot.holdings.map((h, i) => (
                        <tr key={i} className="border-b border-border/50 last:border-0">
                          <td className="py-2.5 text-foreground font-medium">{h.asset}</td>
                          <td className="text-right py-2.5 text-muted-foreground">{h.quantity.toFixed(6)}</td>
                          <td className="text-right py-2.5">
                            {h.supported ? <span className="text-success text-xs">Available</span> : <span className="text-muted-foreground text-xs">N/A</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border p-6 text-center">
                <h2 className="text-lg font-semibold text-foreground">Free analysis already used</h2>
                <p className="mt-2 text-sm text-muted-foreground">Your free portfolio analysis has been used. Upgrade to Premium for another analysis.</p>
              </div>
            )}
          </>
        )}

        {/* Subscription */}
        {activeTab === "subscription" && (
          <div className="max-w-lg mx-auto">
            {isPremium ? (
              <div className="bg-card rounded-2xl border border-border p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">You&apos;re on Premium!</h3>
                <p className="text-muted-foreground text-sm mb-6">Enjoy unlimited AI conversations, portfolio analysis, and all premium features.</p>
                <div className="bg-muted rounded-xl p-4 text-sm space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="text-foreground font-medium">Premium</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span className="text-foreground font-medium">{premiumPrice}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Chat Limit</span><span className="text-foreground font-medium">Unlimited</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Portfolio Analysis</span><span className="text-foreground font-medium">Unlimited</span></div>
                </div>
              </div>
            ) : (
              <PremiumUpgradeCard />
            )}
          </div>
        )}

        {/* Settings */}
        {activeTab === "settings" && (
          <div className="max-w-lg mx-auto space-y-6">
            {user?.binanceConnected && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Binance Connection</h3>
                <p className="text-sm text-muted-foreground mb-4">Your Binance account is connected for portfolio analysis.</p>
                <button onClick={() => void handleUnlinkBinance()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-danger hover:border-danger transition-colors">
                  <Unlink className="w-4 h-4" /> Unlink Binance Account
                </button>
              </div>
            )}

            {error && <div role="alert" className="flex items-center gap-2 text-sm text-danger"><AlertCircle className="h-4 w-4" />{error}</div>}

            <div className="bg-card rounded-2xl border border-danger/20 p-6">
              <h3 className="text-lg font-semibold text-danger mb-2">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-danger text-sm text-danger hover:bg-danger/10 transition-colors">
                  <Trash2 className="w-4 h-4" /> Delete Account
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={() => void handleDeleteAccount()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-danger text-white text-sm font-medium hover:opacity-90">
                    <Trash2 className="w-4 h-4" /> Yes, Delete Everything
                  </button>
                  <button onClick={() => setConfirmDelete(false)}
                    className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            This platform is for informational purposes only. Trading cryptocurrency involves substantial risk.
          </p>
        </div>
      </div>
    </div>
  );
}
