"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";

export type UserTier = "free" | "premium";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  mode: string;
  createdAt: number;
};

export type PortfolioSnapshot = {
  holdings: { asset: string; quantity: number; supported: boolean }[];
  insights: {
    asset: string;
    quantity: number;
    forecastedChange?: number;
    signal: string;
    insight: string;
  }[];
  analyzedAt: number;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  tier: UserTier;
  role: string;
  chatCount: number;
  chatSessions: ChatSession[];
  binanceConnected: boolean;
  portfolioSnapshot: PortfolioSnapshot | null;
  portfolioUsed: boolean;
  createdAt: number;
};

const FREE_CHAT_LIMIT = 50;
const PREMIUM_PRICE = "$99.99/month";
const LEGACY_USERS_KEY = "intellitrex-users";
const LEGACY_CURRENT_USER_KEY = "intellitrex-current-user";

type AuthContextType = {
  user: User | null;
  isLoggedIn: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  isReady: boolean;
  isConfigured: boolean;
  authError: string;
  chatCount: number;
  chatLimit: number;
  canChat: boolean;
  premiumPrice: string;
  signInWithGoogle: () => Promise<string | null>;
  signInWithEmail: (name: string, email: string) => Promise<string | null>;
  verifyEmailOtp: (email: string, token: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  saveChatSession: (session: ChatSession) => Promise<void>;
  loadChatSession: (sessionId: string) => ChatSession | null;
  getChatSessions: () => ChatSession[];
  unlinkBinance: () => Promise<void>;
  savePortfolioSnapshot: (snapshot: PortfolioSnapshot) => void;
  deleteAccount: () => Promise<string | null>;
  getAllUsers: () => Promise<User[]>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  isPremium: false,
  isAdmin: false,
  isReady: false,
  isConfigured: false,
  authError: "",
  chatCount: 0,
  chatLimit: FREE_CHAT_LIMIT,
  canChat: true,
  premiumPrice: PREMIUM_PRICE,
  signInWithGoogle: async () => "Authentication is not configured.",
  signInWithEmail: async () => "Authentication is not configured.",
  verifyEmailOtp: async () => "Authentication is not configured.",
  signOut: async () => {},
  refreshProfile: async () => {},
  saveChatSession: async () => {},
  loadChatSession: () => null,
  getChatSessions: () => [],
  unlinkBinance: async () => {},
  savePortfolioSnapshot: () => {},
  deleteAccount: async () => "Authentication is not configured.",
  getAllUsers: async () => [],
});

export function useAuth() {
  return useContext(AuthContext);
}

function mapProfile(authUser: SupabaseUser, profile: Record<string, unknown>, sessions: Record<string, unknown>[]): User {
  return {
    id: authUser.id,
    name: String(profile.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email || "User"),
    email: authUser.email || "",
    avatar: String(profile.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || ""),
    tier: profile.tier === "premium" ? "premium" : "free",
    role: String(authUser.app_metadata?.role || "user"),
    chatCount: Number(profile.chat_count || 0),
    chatSessions: sessions.map((session) => ({
      id: String(session.id),
      title: String(session.title || "Untitled"),
      messages: Array.isArray(session.messages) ? session.messages as ChatMessage[] : [],
      mode: String(session.mode || "active-trader"),
      createdAt: new Date(String(session.created_at)).getTime(),
    })),
    binanceConnected: Boolean(profile.binance_connected),
    portfolioSnapshot: profile.portfolio_snapshot as PortfolioSnapshot | null,
    portfolioUsed: Boolean(profile.portfolio_used),
    createdAt: new Date(String(profile.created_at || authUser.created_at)).getTime(),
  };
}

async function migrateLegacyData(authUser: SupabaseUser, profile: Record<string, unknown>): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const migrationKey = `intellitrex-legacy-import-${authUser.id}`;
  if (localStorage.getItem(migrationKey)) return false;

  try {
    const users = JSON.parse(localStorage.getItem(LEGACY_USERS_KEY) || "[]") as Array<Record<string, unknown>>;
    const oldUserId = localStorage.getItem(LEGACY_CURRENT_USER_KEY);
    const oldUser = users.find((item) =>
      String(item.id) === oldUserId &&
      String(item.email || "").toLowerCase() === (authUser.email || "").toLowerCase()
    );
    if (!oldUser) {
      localStorage.setItem(migrationKey, "done");
      return false;
    }

    const supabase = createClient();
    const oldSessions = Array.isArray(oldUser.chatSessions) ? oldUser.chatSessions as Array<Record<string, unknown>> : [];
    if (oldSessions.length) {
      const { error: sessionsError } = await supabase.from("chat_sessions").upsert(
        oldSessions.map((session) => ({
          user_id: authUser.id,
          id: String(session.id),
          title: String(session.title || "Untitled"),
          messages: Array.isArray(session.messages) ? session.messages : [],
          mode: String(session.mode || "active-trader"),
          created_at: new Date(Number(session.createdAt) || Date.now()).toISOString(),
        })),
        { onConflict: "user_id,id", ignoreDuplicates: true }
      );
      if (sessionsError) throw sessionsError;
    }

    const oldSnapshot = oldUser.portfolioSnapshot as PortfolioSnapshot | null;
    if (oldSnapshot && !profile.portfolio_used) {
      const { error: portfolioError } = await supabase.rpc("save_portfolio_snapshot", { snapshot: oldSnapshot });
      if (portfolioError) throw portfolioError;
    }

    // Deliberately do not migrate locally stored API keys, fake tiers, or admin state.
    localStorage.setItem(migrationKey, "done");
    localStorage.removeItem(LEGACY_CURRENT_USER_KEY);
    localStorage.setItem(LEGACY_USERS_KEY, JSON.stringify(users.filter((item) => item !== oldUser)));
    return true;
  } catch {
    // A failed import can be retried after the Supabase schema is configured.
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isConfigured = hasSupabaseConfig();
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(() => !hasSupabaseConfig());
  const [authError, setAuthError] = useState("");

  const loadProfile = useCallback(async (authUser?: SupabaseUser | null) => {
    if (!isConfigured) {
      setUser(null);
      setIsReady(true);
      return;
    }

    const supabase = createClient();
    let currentAuthUser = authUser;
    if (currentAuthUser === undefined) {
      const { data, error } = await supabase.auth.getUser();
      if (error) setAuthError(error.message);
      currentAuthUser = data.user;
    }

    if (!currentAuthUser) {
      setUser(null);
      setAuthError("");
      setIsReady(true);
      return;
    }

    const [{ data: profile, error: profileError }, { data: sessions, error: sessionsError }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", currentAuthUser.id).single(),
      supabase.from("chat_sessions").select("*").eq("user_id", currentAuthUser.id).order("created_at", { ascending: false }).limit(100),
    ]);

    if (profileError || !profile) {
      setAuthError("Your account profile is unavailable. Confirm the IntelliTrex database migration has been applied.");
      setUser(null);
      setIsReady(true);
      return;
    }
    if (sessionsError) setAuthError("Chat history could not be loaded.");
    else setAuthError("");

    let currentProfile = profile;
    let currentSessions = sessions || [];
    if (await migrateLegacyData(currentAuthUser, profile)) {
      const [profileResult, sessionsResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", currentAuthUser.id).single(),
        supabase.from("chat_sessions").select("*").eq("user_id", currentAuthUser.id).order("created_at", { ascending: false }).limit(100),
      ]);
      if (profileResult.data) currentProfile = profileResult.data;
      if (sessionsResult.data) currentSessions = sessionsResult.data;
    }
    setUser(mapProfile(currentAuthUser, currentProfile, currentSessions));
    setIsReady(true);
  }, [isConfigured]);

  useEffect(() => {
    if (!isConfigured) return;

    const supabase = createClient();
    void supabase.auth.getUser().then(({ data, error }) => {
      if (error) setAuthError(error.message);
      return loadProfile(data.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadProfile(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, [isConfigured, loadProfile]);

  const signInWithEmail = useCallback(async (name: string, email: string) => {
    if (!isConfigured) return "Authentication is not configured yet. Add the Supabase settings from .env.example.";
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: { full_name: name.trim() },
      },
    });
    return error?.message || null;
  }, [isConfigured]);

  const verifyEmailOtp = useCallback(async (email: string, token: string) => {
    if (!isConfigured) return "Authentication is not configured yet.";
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (!error) await loadProfile();
    return error?.message || null;
  }, [isConfigured, loadProfile]);

  const signInWithGoogle = useCallback(async () => {
    if (!isConfigured) return "Authentication is not configured yet.";
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/profile` },
    });
    return error?.message || null;
  }, [isConfigured]);

  const signOut = useCallback(async () => {
    if (!isConfigured) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  }, [isConfigured]);

  const saveChatSession = useCallback(async (session: ChatSession) => {
    if (!user) return;
    const supabase = createClient();
    const { error } = await supabase.from("chat_sessions").upsert({
      user_id: user.id,
      id: session.id,
      title: session.title,
      messages: session.messages,
      mode: session.mode,
      created_at: new Date(session.createdAt).toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,id" });
    if (error) throw error;
    setUser((current) => current ? {
      ...current,
      chatSessions: [session, ...current.chatSessions.filter((item) => item.id !== session.id)].slice(0, 100),
    } : current);
  }, [user]);

  const unlinkBinance = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { error } = await supabase.rpc("unlink_binance_portfolio");
    if (error) throw error;
    setUser((current) => current ? { ...current, binanceConnected: false, portfolioSnapshot: null } : current);
  }, [user]);

  const savePortfolioSnapshot = useCallback((snapshot: PortfolioSnapshot) => {
    setUser((current) => current ? { ...current, portfolioSnapshot: snapshot, portfolioUsed: true, binanceConnected: true } : current);
  }, []);

  const deleteAccount = useCallback(async () => {
    const response = await fetch("/api/account", { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) return result.error || "Could not delete the account.";
    if (isConfigured) await createClient().auth.signOut();
    setUser(null);
    return null;
  }, [isConfigured]);

  const getAllUsers = useCallback(async () => {
    if (!user || user.role !== "admin") return [];
    const supabase = createClient();
    const [{ data: profiles, error }, { data: sessions }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("chat_sessions").select("user_id,id,title,mode,messages,created_at"),
    ]);
    if (error) throw error;
    return (profiles || []).map((profile) => ({
      id: profile.id,
      name: profile.full_name || "User",
      email: profile.email || "",
      avatar: profile.avatar_url || "",
      tier: profile.tier === "premium" ? "premium" as const : "free" as const,
      role: "user",
      chatCount: Number(profile.chat_count || 0),
      chatSessions: (sessions || []).filter((session) => session.user_id === profile.id).map((session) => ({
        id: session.id,
        title: session.title,
        messages: Array.isArray(session.messages) ? session.messages as ChatMessage[] : [],
        mode: session.mode,
        createdAt: new Date(session.created_at).getTime(),
      })),
      binanceConnected: Boolean(profile.binance_connected),
      portfolioSnapshot: profile.portfolio_snapshot as PortfolioSnapshot | null,
      portfolioUsed: Boolean(profile.portfolio_used),
      createdAt: new Date(profile.created_at).getTime(),
    }));
  }, [user]);

  const loadChatSession = useCallback((sessionId: string) =>
    user?.chatSessions.find((session) => session.id === sessionId) || null, [user]);
  const getChatSessions = useCallback(() => user?.chatSessions || [], [user]);
  const refreshProfile = useCallback(() => loadProfile(), [loadProfile]);

  const isPremium = user?.tier === "premium";
  const isAdmin = user?.role === "admin";
  const value = useMemo<AuthContextType>(() => ({
    user,
    isLoggedIn: !!user,
    isPremium,
    isAdmin,
    isReady,
    isConfigured,
    authError,
    chatCount: user?.chatCount ?? 0,
    chatLimit: FREE_CHAT_LIMIT,
    canChat: isPremium || (user?.chatCount ?? 0) < FREE_CHAT_LIMIT,
    premiumPrice: PREMIUM_PRICE,
    signInWithGoogle,
    signInWithEmail,
    verifyEmailOtp,
    signOut,
    refreshProfile,
    saveChatSession,
    loadChatSession,
    getChatSessions,
    unlinkBinance,
    savePortfolioSnapshot,
    deleteAccount,
    getAllUsers,
  }), [
    user, isPremium, isAdmin, isReady, isConfigured, authError, signInWithGoogle,
    signInWithEmail, verifyEmailOtp, signOut, refreshProfile, saveChatSession,
    loadChatSession, getChatSessions, unlinkBinance,
    savePortfolioSnapshot, deleteAccount, getAllUsers,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
