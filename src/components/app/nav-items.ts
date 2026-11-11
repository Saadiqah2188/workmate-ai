import { LayoutDashboard, Mail, MessagesSquare, Search, Settings } from "lucide-react";

export const NAV_ITEMS = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Email Generator", url: "/email", icon: Mail },
  { title: "Research Assistant", url: "/research", icon: Search },
  { title: "AI Chatbot", url: "/chat", icon: MessagesSquare },
] as const;

export const SETTINGS_ITEM = { title: "Settings & API key", url: "/settings", icon: Settings } as const;
