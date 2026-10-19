"use client";

import { Heart, LayoutDashboard, LogOut, MessageSquareHeart, Palette, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/admin";
import { cx } from "./ui";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/guests", label: "Guests", icon: Users },
  { href: "/admin/customize", label: "Customize", icon: Palette },
  { href: "/admin/wishes", label: "Wishes", icon: MessageSquareHeart },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4">
        <Link href="/admin" className="mr-2 flex items-center gap-1.5 font-semibold text-rose-600">
          <Heart size={18} fill="currentColor" /> <span className="hidden sm:inline">Teabkar</span>
        </Link>
        <nav className="flex flex-1 gap-1 overflow-x-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? path === href : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cx(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm",
                  active ? "bg-rose-50 font-medium text-rose-700" : "text-neutral-600 hover:bg-neutral-100",
                )}
              >
                <Icon size={16} /> <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
        <form action={logout}>
          <button className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100" aria-label="Log out">
            <LogOut size={16} />
          </button>
        </form>
      </div>
    </header>
  );
}
