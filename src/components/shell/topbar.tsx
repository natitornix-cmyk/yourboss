"use client";

import * as React from "react";
import { Search, LogOut, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/lib/stores/ui-store";

export function Topbar({ email }: { email: string }) {
  const setOpen = useUiStore((s) => s.setCommandOpen);
  return (
    <header className="h-14 border-b border-border flex items-center px-4 md:px-6 gap-3 bg-background sticky top-0 z-30">
      <div className="md:hidden flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-teal-500 flex items-center justify-center text-sm font-bold">
          Y
        </div>
        <span className="font-semibold tracking-tight">YourBOSS</span>
      </div>
      <div className="flex-1" />
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 h-9 px-3 rounded-md border border-border text-sm text-muted-foreground hover:bg-secondary"
      >
        <Search className="h-4 w-4" />
        <span>Search…</span>
        <span className="ml-4 inline-flex items-center gap-1 rounded bg-secondary px-1.5 text-[10px]">
          <Command className="h-3 w-3" />K
        </span>
      </button>
      <form action="/api/auth/signout" method="post">
        <Button type="submit" variant="ghost" size="icon" title={`Sign out ${email}`}>
          <LogOut className="h-4 w-4" />
        </Button>
      </form>
    </header>
  );
}
