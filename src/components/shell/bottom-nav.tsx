"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Layers3, ListChecks, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/courses", label: "Decks", icon: Layers3 },
  { href: "/dashboard/nle1", label: "Quizzes", icon: ListChecks },
  { href: "/settings", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-background border-t border-border grid grid-cols-4 z-40">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-xs",
              active ? "text-teal-400" : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
