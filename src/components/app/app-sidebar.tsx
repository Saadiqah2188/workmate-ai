import { Link, useRouterState } from "@tanstack/react-router";
import { KeyRound, ShieldCheck } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAiSettings } from "@/lib/ai/settings";
import { PROVIDERS } from "@/lib/ai/providers";
import { BrandMark } from "./brand-mark";
import { NAV_ITEMS, SETTINGS_ITEM } from "./nav-items";

export function AppSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const settings = useAiSettings();
  const connected = Boolean(settings.apiKey);

  const close = () => setOpenMobile(false);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <Link to="/" onClick={close} className="flex items-center gap-3">
          <BrandMark />
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-bold text-foreground">Workplace AI</p>
              <p className="truncate text-xs text-muted-foreground">Productivity Assistant</p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                    className="h-10 rounded-lg font-medium data-[active=true]:font-semibold"
                  >
                    <Link to={item.url} onClick={close}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === SETTINGS_ITEM.url}
                  tooltip={SETTINGS_ITEM.title}
                  className="h-10 rounded-lg font-medium data-[active=true]:font-semibold"
                >
                  <Link to={SETTINGS_ITEM.url} onClick={close}>
                    <SETTINGS_ITEM.icon />
                    <span>{SETTINGS_ITEM.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {!collapsed && (
        <SidebarFooter className="p-3">
          <Link
            to="/settings"
            onClick={close}
            className="flex items-center gap-3 rounded-xl border border-border bg-gradient-soft p-3 transition-shadow hover:shadow-card"
          >
            <div
              className={
                connected
                  ? "grid size-8 place-items-center rounded-lg bg-teal-soft text-teal-strong"
                  : "grid size-8 place-items-center rounded-lg bg-warning-soft text-warning-foreground"
              }
            >
              {connected ? <ShieldCheck className="size-4" /> : <KeyRound className="size-4" />}
            </div>
            <div className="min-w-0 text-xs">
              <p className="font-semibold text-foreground">
                {connected ? PROVIDERS[settings.provider].label : "No API key yet"}
              </p>
              <p className="truncate text-muted-foreground">
                {connected ? settings.model : "Add a key to start"}
              </p>
            </div>
          </Link>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
