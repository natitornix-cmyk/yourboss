"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SettingsForm({
  email,
  displayName,
  preferredLanguage,
  hasGeminiKey,
}: {
  email: string;
  displayName: string;
  preferredLanguage: string;
  hasGeminiKey: boolean;
}) {
  const [name, setName] = React.useState(displayName);
  const [lang, setLang] = React.useState(preferredLanguage);
  const [key, setKey] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const router = useRouter();

  async function save() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: name, preferredLanguage: lang, geminiApiKey: key || undefined }),
    });
    setSaving(false);
    setKey("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>{email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Display name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Preferred language</Label>
            <div className="flex gap-2">
              {(["en", "th"] as const).map((code) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  className={`px-3 py-1.5 rounded-md text-sm border ${
                    lang === code
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent border-border hover:bg-secondary"
                  }`}
                >
                  {code === "en" ? "English" : "ภาษาไทย"}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gemini API key</CardTitle>
          <CardDescription>
            {hasGeminiKey
              ? "A key is on file. Enter a new one to replace it."
              : "Optional. Falls back to the server-configured key."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="password"
            placeholder="AIza…"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Dark mode is the default and only mode for now.</CardDescription>
        </CardHeader>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
