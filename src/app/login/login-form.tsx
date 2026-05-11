"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [mode, setMode] = React.useState<"magic" | "password">("magic");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const supabase = createClient();

    if (mode === "magic") {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/today`,
        },
      });
      if (error) {
        setStatus("error");
        setError(error.message);
      } else {
        setStatus("sent");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus("error");
        setError(error.message);
      } else {
        router.push("/today");
        router.refresh();
      }
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="text-sm">Check your inbox for the sign-in link.</div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          autoFocus
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {mode === "password" && (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      )}
      <Button type="submit" className="w-full" disabled={status === "sending"}>
        {status === "sending"
          ? mode === "magic"
            ? "Sending…"
            : "Signing in…"
          : mode === "magic"
            ? "Send magic link"
            : "Sign in"}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="button"
        onClick={() => {
          setMode(mode === "magic" ? "password" : "magic");
          setError(null);
        }}
        className="text-xs text-muted-foreground hover:text-foreground w-full text-center"
      >
        {mode === "magic" ? "Sign in with a password instead" : "Use a magic link instead"}
      </button>
    </form>
  );
}
