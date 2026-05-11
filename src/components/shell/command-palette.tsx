"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Sun,
  BookOpen,
  LayoutGrid,
  Settings,
  Search,
  Brain,
  ListChecks,
} from "lucide-react";
import { useUiStore } from "@/lib/stores/ui-store";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type DeckHit = { id: string; title: string; courseId: string };

export function CommandPalette() {
  const open = useUiStore((s) => s.commandOpen);
  const setOpen = useUiStore((s) => s.setCommandOpen);
  const router = useRouter();
  const [decks, setDecks] = React.useState<DeckHit[]>([]);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  React.useEffect(() => {
    if (!open) return;
    fetch("/api/search?q=" + encodeURIComponent(search))
      .then((r) => r.ok ? r.json() : { decks: [] })
      .then((d) => setDecks(d.decks ?? []))
      .catch(() => setDecks([]));
  }, [open, search]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 max-w-xl overflow-hidden">
        <Command className="bg-card">
          <div className="flex items-center px-3 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Command.Input
              placeholder="Search decks, jump to pages…"
              value={search}
              onValueChange={setSearch}
              className="flex h-12 w-full bg-transparent px-3 text-sm placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results.
            </Command.Empty>
            <Command.Group heading="Navigation" className="text-xs text-muted-foreground px-2 py-1">
              <Item icon={<Sun className="h-4 w-4" />} label="Today" onSelect={() => go("/today")} />
              <Item icon={<BookOpen className="h-4 w-4" />} label="Courses" onSelect={() => go("/courses")} />
              <Item icon={<LayoutGrid className="h-4 w-4" />} label="NLE1 dashboard" onSelect={() => go("/dashboard/nle1")} />
              <Item icon={<Settings className="h-4 w-4" />} label="Settings" onSelect={() => go("/settings")} />
            </Command.Group>
            {decks.length > 0 && (
              <Command.Group heading="Decks" className="text-xs text-muted-foreground px-2 py-1">
                {decks.map((d) => (
                  <Item
                    key={d.id}
                    icon={<Brain className="h-4 w-4" />}
                    label={d.title}
                    onSelect={() => go(`/decks/${d.id}`)}
                  />
                ))}
              </Command.Group>
            )}
            <Command.Group heading="Sessions" className="text-xs text-muted-foreground px-2 py-1">
              {decks.slice(0, 3).map((d) => (
                <Item
                  key={"q-" + d.id}
                  icon={<ListChecks className="h-4 w-4" />}
                  label={`Quiz: ${d.title}`}
                  onSelect={() => go(`/decks/${d.id}/quiz`)}
                />
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function Item({
  icon,
  label,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer aria-selected:bg-secondary text-sm"
    >
      {icon}
      <span>{label}</span>
    </Command.Item>
  );
}
