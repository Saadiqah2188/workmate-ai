import { Link, useRouterState } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NAV_ITEMS, SETTINGS_ITEM } from "./nav-items";

export function AppHeader() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const current = [...NAV_ITEMS, SETTINGS_ITEM].find((i) => i.url === pathname);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface/85 px-3 backdrop-blur md:px-5">
      <SidebarTrigger className="size-9" />
      <div className="h-5 w-px bg-border" />
      <p className="truncate text-sm font-semibold text-foreground">{current?.title ?? "Workplace AI"}</p>
      <div className="ml-auto flex items-center gap-2">
        <Link
          to="/settings"
          className="hidden items-center gap-2 rounded-full border border-border bg-teal-soft px-3 py-1 text-xs font-semibold text-teal-strong sm:flex"
        >
          <span className="size-1.5 rounded-full bg-teal" />
          AI connected
        </Link>
      </div>
    </header>
  );
}
