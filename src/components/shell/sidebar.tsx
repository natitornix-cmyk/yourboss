"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sun,
  CalendarDays,
  BookOpen,
  ListChecks,
  Layers3,
  LayoutGrid,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/dashboard/nle1", label: "NLE1 map", icon: LayoutGrid },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-60 shrink-0 border-r border-border flex-col bg-background">
      <Link href="/today" className="px-5 h-14 flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-teal-500 flex items-center justify-center text-sm font-bold">
          Y
        </div>
        <span className="font-semibold tracking-tight">YourBOSS</span>
      </Link>
      <nav className="flex-1 px-2 py-2 space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground truncate">
        {email}
      </div>
    </aside>
  );
}
