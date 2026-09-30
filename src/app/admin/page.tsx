"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import type { User } from "@/lib/auth-context";
import {
  Shield,
  Users,
  Crown,
  MessageSquare,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const { isAdmin, isLoggedIn, isReady, getAllUsers } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loadError, setLoadError] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    void getAllUsers().then(setUsers).catch(() => setLoadError("Could not load admin data."));
  }, [isAdmin, getAllUsers]);

  const totalUsers = users.length;
  const premiumUsers = users.filter((u) => u.tier === "premium").length;
  const totalChats = users.reduce((sum, u) => sum + u.chatCount, 0);
  const connectedBinance = users.filter((u) => u.binanceConnected).length;
  const selected = selectedUser ? users.find((u) => u.id === selectedUser) : null;

  if (!isReady) return <div className="px-6 py-16 text-center text-muted-foreground">Loading account…</div>;
  if (!isLoggedIn || !isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <Shield className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h1 className="text-2xl font-bold text-foreground">Admin access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in with an administrator account to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Manage users and monitor platform activity</p>
          </div>
        </div>

        {loadError && <div role="alert" className="mb-6 flex items-center gap-2 text-sm text-danger"><AlertCircle className="h-4 w-4" />{loadError}</div>}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: "Total Users", value: totalUsers, color: "text-primary" },
            { icon: Crown, label: "Premium Users", value: premiumUsers, color: "text-yellow-600" },
            { icon: MessageSquare, label: "Total Chats", value: totalChats, color: "text-accent" },
            { icon: Wallet, label: "Binance Connected", value: connectedBinance, color: "text-success" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn("w-4 h-4", stat.color)} />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* User List */}
          <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Registered Users</h2>
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No users registered yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">User</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Email</th>
                      <th className="text-center py-2 text-muted-foreground font-medium">Plan</th>
                      <th className="text-center py-2 text-muted-foreground font-medium">Chats</th>
                      <th className="text-center py-2 text-muted-foreground font-medium">Binance</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        onClick={() => setSelectedUser(u.id === selectedUser ? null : u.id)}
                        className={cn(
                          "border-b border-border/50 last:border-0 cursor-pointer transition-colors",
                          selectedUser === u.id ? "bg-primary/5" : "hover:bg-muted/50"
                        )}
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full" />
                            <span className="text-foreground font-medium">{u.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-muted-foreground">{u.email}</td>
                        <td className="py-3 text-center">
                          {u.tier === "premium" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 text-yellow-600 rounded-full text-xs font-medium">
                              <Crown className="w-3 h-3" /> Premium
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Free</span>
                          )}
                        </td>
                        <td className="py-3 text-center text-muted-foreground">{u.chatCount}</td>
                        <td className="py-3 text-center">
                          {u.binanceConnected ? (
                            <span className="text-success text-xs">Connected</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">No</span>
                          )}
                        </td>
                        <td className="py-3 text-right text-muted-foreground text-xs">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* User Detail */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">User Details</h2>
            {selected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <img src={selected.avatar} alt={selected.name} className="w-12 h-12 rounded-full" />
                  <div>
                    <p className="font-semibold text-foreground">{selected.name}</p>
                    <p className="text-xs text-muted-foreground">{selected.email}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="text-foreground font-medium capitalize">{selected.tier}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">Total Chats</span>
                    <span className="text-foreground font-medium">{selected.chatCount}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">Chat Sessions</span>
                    <span className="text-foreground font-medium">{selected.chatSessions.length}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">Binance</span>
                    <span className="text-foreground font-medium">{selected.binanceConnected ? "Connected" : "Not connected"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">Portfolio Analyzed</span>
                    <span className="text-foreground font-medium">{selected.portfolioUsed ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted-foreground">Joined</span>
                    <span className="text-foreground font-medium">{new Date(selected.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {selected.chatSessions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Recent Chats</h4>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {selected.chatSessions.slice(0, 10).map((s) => (
                        <div key={s.id} className="text-xs text-muted-foreground py-1.5 border-b border-border/50 last:border-0">
                          <span className="text-foreground">{s.title}</span>
                          <span className="ml-2">({s.messages.length} msgs, {s.mode})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">
                Click on a user to view details
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
