import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Home, TrendingUp, Bell, MessageSquare, DollarSign, Settings, User } from "lucide-react";
import { Link } from "wouter";
import SubscriptionBadge, { SubscriptionTier } from "./SubscriptionBadge";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Top Picks", url: "/picks", icon: TrendingUp },
  { title: "Alerts", url: "/alerts", icon: Bell },
  { title: "Discord Bot", url: "/discord", icon: MessageSquare },
  { title: "Pricing", url: "/pricing", icon: DollarSign },
];

const bottomItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Account", url: "/account", icon: User },
];

interface AppSidebarProps {
  userTier?: SubscriptionTier;
}

export default function AppSidebar({ userTier = "free" }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">MVP</span>
        </div>
        <div className="mt-4">
          <SubscriptionBadge tier={userTier} />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(' ', '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {userTier === "free" && (
          <SidebarGroup>
            <SidebarGroupContent className="px-4">
              <div className="space-y-2 p-4 rounded-md bg-primary/10 border border-primary/20">
                <p className="font-semibold text-sm">Upgrade to Pro</p>
                <p className="text-xs text-muted-foreground">Get unlimited access to all props and EV rankings</p>
                <Button size="sm" className="w-full mt-2" data-testid="button-upgrade-sidebar">
                  Upgrade Now
                </Button>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {bottomItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
