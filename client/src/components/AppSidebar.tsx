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
import { Home, TrendingUp, Bell, MessageSquare, DollarSign, Settings, User, Users, BarChart3, Gamepad2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import SubscriptionBadge, { SubscriptionTier } from "./SubscriptionBadge";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Top Picks", url: "/dashboard#picks", icon: TrendingUp },
  { title: "Fantasy", url: "/fantasy", icon: Gamepad2 },
  { title: "Social", url: "/dashboard#social", icon: Users },
  { title: "Simulator", url: "/dashboard#simulator", icon: BarChart3 },
  { title: "Pricing", url: "/", icon: DollarSign, isExternal: true },
];

const bottomItems = [
  { title: "Settings", url: "/dashboard#settings", icon: Settings },
  { title: "Account", url: "/login", icon: User },
];

interface AppSidebarProps {
  userTier?: SubscriptionTier;
  isAdmin?: boolean;
  onTabChange?: (tab: string) => void;
  activeTab?: string;
}

export default function AppSidebar({ userTier = "free", isAdmin = false, onTabChange, activeTab }: AppSidebarProps) {
  const [location] = useLocation();

  const handleNavClick = (item: typeof navItems[0] & { isExternal?: boolean }) => {
    if (item.isExternal) {
      window.location.href = item.url + '#pricing';
      return;
    }
    if (item.url.includes('#')) {
      const hash = item.url.split('#')[1];
      if (onTabChange && hash) {
        onTabChange(hash);
      }
    }
  };

  const isActive = (item: typeof navItems[0]) => {
    if (item.url === '/dashboard' && !item.url.includes('#')) {
      return location === '/dashboard' && activeTab === 'picks';
    }
    if (item.url.includes('#')) {
      const hash = item.url.split('#')[1];
      return location === '/dashboard' && activeTab === hash;
    }
    return false;
  };

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
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item)}
                    onClick={() => handleNavClick(item)}
                  >
                    <Link 
                      href={item.isExternal ? '#' : (item.url.includes('#') ? '/dashboard' : item.url)} 
                      data-testid={`link-${item.title.toLowerCase().replace(' ', '-')}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {userTier === "free" && !isAdmin && (
          <SidebarGroup>
            <SidebarGroupContent className="px-4">
              <div className="space-y-2 p-4 rounded-md bg-primary/10 border border-primary/20">
                <p className="font-semibold text-sm">Upgrade to Pro</p>
                <p className="text-xs text-muted-foreground">Get unlimited access to all props and EV rankings</p>
                <a href="/#pricing">
                  <Button size="sm" className="w-full mt-2" data-testid="button-upgrade-sidebar">
                    Upgrade Now
                  </Button>
                </a>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {bottomItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild
                onClick={() => handleNavClick(item)}
              >
                <Link href={item.url.includes('#') ? '/dashboard' : item.url} data-testid={`link-${item.title.toLowerCase()}`}>
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
