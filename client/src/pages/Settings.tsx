import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, MessageSquare, Bot, Settings2, Crown, Star, Check, Shield, 
  ExternalLink, User, Bell, Lock, DollarSign, BarChart3, Zap, Users,
  Gift, Download, Wallet, TrendingUp
} from "lucide-react";
import { SiDiscord, SiTelegram } from "react-icons/si";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { canAccessFeature, isUserAdmin, isUserSuperAdmin, getUpgradePrompt } from "@/lib/features";

interface UserData {
  id: number;
  email: string;
  username?: string;
  subscriptionTier: string;
  subscriptionStatus?: string;
  isAdmin?: boolean;
  role?: string;
  isLifetime?: boolean;
}

interface Ambassador {
  id: number;
  referralCode: string;
  commissionPercent: string;
  totalEarnings: string;
  pendingPayout: string;
  tier: string;
  totalReferrals: number;
}

const tierDisplay: Record<string, { name: string; colorClass: string; icon: typeof Crown }> = {
  free: { name: "Free", colorClass: "text-muted-foreground", icon: Check },
  basic: { name: "Basic", colorClass: "text-blue-400", icon: Check },
  web: { name: "Basic", colorClass: "text-blue-400", icon: Check },
  premium: { name: "Premium", colorClass: "text-purple-400", icon: Star },
  elite: { name: "Elite", colorClass: "text-amber-400", icon: Crown },
  ambassador: { name: "Ambassador", colorClass: "text-green-400", icon: Gift },
  lifetime_elite: { name: "Lifetime Elite", colorClass: "text-amber-400", icon: Crown },
};

const roleDisplay: Record<string, string> = {
  user: "User",
  moderator: "Moderator",
  admin: "Admin",
  super_admin: "Super Admin",
};

interface BotStatus {
  connected: boolean;
  discordUsername?: string;
  telegramUsername?: string;
  settings?: Record<string, unknown>;
}

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery<UserData>({
    queryKey: ["/api/auth/me"],
  });

  const isAdmin = isUserAdmin(user);
  const isSuperAdmin = isUserSuperAdmin(user);
  const canUseDiscord = canAccessFeature(user, 'discord_bot');
  const canUseTelegram = canAccessFeature(user, 'telegram_ai');
  const canUseParlay = canAccessFeature(user, 'parlay_settings');
  const canUseAdvancedAnalytics = canAccessFeature(user, 'advanced_analytics');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  // Determine which tabs to show based on tier
  const showAmbassadorTab = user.subscriptionTier === 'ambassador' || isAdmin;
  const showAdminTab = isAdmin;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Settings</h1>
            <p className="text-muted-foreground">Manage your account, notifications, and integrations</p>
          </div>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1">
            <TabsTrigger value="account" data-testid="tab-account">
              <User className="w-4 h-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="integrations" data-testid="tab-integrations">
              <Zap className="w-4 h-4 mr-2" />
              Integrations
            </TabsTrigger>
            {showAmbassadorTab && (
              <TabsTrigger value="ambassador" data-testid="tab-ambassador">
                <Gift className="w-4 h-4 mr-2" />
                Ambassador
              </TabsTrigger>
            )}
            {showAdminTab && (
              <TabsTrigger value="admin" data-testid="tab-admin">
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="account" className="space-y-6">
            <AccountSection user={user} isAdmin={isAdmin} />
            {canUseParlay && <ParlayPreferences />}
            {!canUseParlay && <LockedFeatureCard feature="parlay_settings" />}
            {canUseAdvancedAnalytics && <AnalyticsPreferences />}
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationSettings user={user} />
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <DiscordSettings userId={user.id} canUse={canUseDiscord} />
            <TelegramSettings userId={user.id} canUse={canUseTelegram} />
          </TabsContent>

          {showAmbassadorTab && (
            <TabsContent value="ambassador" className="space-y-6">
              <AmbassadorDashboard userId={user.id} />
            </TabsContent>
          )}

          {showAdminTab && (
            <TabsContent value="admin" className="space-y-6">
              <AdminSection role={user.role || 'user'} isSuperAdmin={isSuperAdmin} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

function AccountSection({ user, isAdmin }: { user: UserData; isAdmin: boolean }) {
  const [, navigate] = useLocation();
  const tier = tierDisplay[user.subscriptionTier?.toLowerCase()] || tierDisplay.free;
  const TierIcon = tier.icon;
  const isStaff = user.role === 'admin' || user.role === 'super_admin' || user.role === 'moderator';

  return (
    <Card data-testid="card-account-overview">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Account Overview</CardTitle>
            <CardDescription>Your profile and subscription</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium" data-testid="text-user-email">{user.email}</p>
          </div>
          {user.username && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Username</p>
              <p className="font-medium" data-testid="text-username">@{user.username}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <TierIcon className={`w-5 h-5 ${tier.colorClass}`} />
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <p className={`font-semibold ${tier.colorClass}`} data-testid="text-subscription-tier">
                {tier.name}
                {user.isLifetime && <span className="ml-1 text-xs">(Lifetime)</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isStaff && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {roleDisplay[user.role || 'user']}
              </Badge>
            )}
            {isAdmin && (
              <Badge className="bg-green-500/20 text-green-400">
                Full Access
              </Badge>
            )}
          </div>
        </div>

        {!isAdmin && user.subscriptionTier?.toLowerCase() !== 'elite' && user.subscriptionTier !== 'ambassador' && (
          <Button 
            className="w-full" 
            onClick={() => navigate("/dashboard?tab=pricing")}
            data-testid="button-upgrade-plan"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Plan
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ParlayPreferences() {
  const [settings, setSettings] = useState({
    defaultBetAmount: 100,
    maxLegs: 6,
    autoSave: true,
  });

  return (
    <Card data-testid="card-parlay-preferences">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Parlay Preferences</CardTitle>
            <CardDescription>Customize your parlay builder experience</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Default Bet Amount: ${settings.defaultBetAmount}</Label>
          <Slider
            value={[settings.defaultBetAmount]}
            onValueChange={([val]) => setSettings({ ...settings, defaultBetAmount: val })}
            min={10}
            max={1000}
            step={10}
            data-testid="slider-bet-amount"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Max Parlay Legs: {settings.maxLegs}</Label>
          <Slider
            value={[settings.maxLegs]}
            onValueChange={([val]) => setSettings({ ...settings, maxLegs: val })}
            min={2}
            max={12}
            step={1}
            data-testid="slider-max-legs"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Auto-save Parlays</Label>
            <p className="text-xs text-muted-foreground">Automatically save parlays to your history</p>
          </div>
          <Switch
            checked={settings.autoSave}
            onCheckedChange={(val) => setSettings({ ...settings, autoSave: val })}
            data-testid="switch-auto-save"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsPreferences() {
  const [settings, setSettings] = useState({
    trackPerformance: true,
    showAdvancedStats: true,
    exportFormat: 'csv',
  });

  return (
    <Card data-testid="card-analytics-preferences">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <BarChart3 className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Advanced Analytics
              <Badge variant="outline" className="text-amber-500">Elite</Badge>
            </CardTitle>
            <CardDescription>Performance tracking and insights</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Track Performance</Label>
            <p className="text-xs text-muted-foreground">Monitor your pick accuracy over time</p>
          </div>
          <Switch
            checked={settings.trackPerformance}
            onCheckedChange={(val) => setSettings({ ...settings, trackPerformance: val })}
            data-testid="switch-track-performance"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Show Advanced Stats</Label>
            <p className="text-xs text-muted-foreground">ROI, CLV, and edge analysis</p>
          </div>
          <Switch
            checked={settings.showAdvancedStats}
            onCheckedChange={(val) => setSettings({ ...settings, showAdvancedStats: val })}
            data-testid="switch-advanced-stats"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationSettings({ user }: { user: UserData }) {
  const [settings, setSettings] = useState({
    emailAlerts: true,
    pickAlerts: true,
    weeklyDigest: true,
    promotions: false,
  });

  return (
    <Card data-testid="card-notification-settings">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Notification Preferences</CardTitle>
            <CardDescription>Control how you receive updates</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Email Alerts</Label>
            <p className="text-xs text-muted-foreground">Important account notifications</p>
          </div>
          <Switch
            checked={settings.emailAlerts}
            onCheckedChange={(val) => setSettings({ ...settings, emailAlerts: val })}
            data-testid="switch-email-alerts"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>High-EV Pick Alerts</Label>
            <p className="text-xs text-muted-foreground">Get notified for top picks</p>
          </div>
          <Switch
            checked={settings.pickAlerts}
            onCheckedChange={(val) => setSettings({ ...settings, pickAlerts: val })}
            data-testid="switch-pick-alerts"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Weekly Digest</Label>
            <p className="text-xs text-muted-foreground">Summary of weekly performance</p>
          </div>
          <Switch
            checked={settings.weeklyDigest}
            onCheckedChange={(val) => setSettings({ ...settings, weeklyDigest: val })}
            data-testid="switch-weekly-digest"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Promotional Emails</Label>
            <p className="text-xs text-muted-foreground">Special offers and updates</p>
          </div>
          <Switch
            checked={settings.promotions}
            onCheckedChange={(val) => setSettings({ ...settings, promotions: val })}
            data-testid="switch-promotions"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function LockedFeatureCard({ feature }: { feature: string }) {
  const [, navigate] = useLocation();
  const { tier, message } = getUpgradePrompt(feature);

  return (
    <Card className="border-dashed opacity-75" data-testid={`card-locked-${feature}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Lock className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Feature Locked</p>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard?tab=pricing")} data-testid={`button-upgrade-${feature}`}>
            Upgrade to {tier}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface BotSettingsProps {
  userId: number;
  canUse: boolean;
}

function DiscordSettings({ userId, canUse }: BotSettingsProps) {
  const [linkingCode, setLinkingCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: status } = useQuery<BotStatus>({
    queryKey: ["/api/discord/status"],
    enabled: canUse,
  });

  const generateCode = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("mvp_token");
      const response = await fetch("/api/discord/generate-code", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
      });
      const data = await response.json();
      if (data.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      } else {
        setLinkingCode(data.code);
      }
    } catch {
      toast({ title: "Error", description: "Failed to generate code", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const unlinkDiscord = async () => {
    try {
      const token = localStorage.getItem("mvp_token");
      await fetch("/api/discord/unlink", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
      queryClient.invalidateQueries({ queryKey: ["/api/discord/status"] });
      toast({ title: "Disconnected", description: "Discord has been unlinked" });
    } catch {
      toast({ title: "Error", description: "Failed to unlink", variant: "destructive" });
    }
  };

  return (
    <Card data-testid="card-discord-settings">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#5865F2]/10">
            <SiDiscord className="w-5 h-5 text-[#5865F2]" />
          </div>
          <div>
            <CardTitle className="text-lg">Discord Bot</CardTitle>
            <CardDescription>
              {canUse ? "Get real-time picks in Discord DMs" : "Available with Premium or Elite"}
            </CardDescription>
          </div>
        </div>
        {!canUse && (
          <Badge variant="outline" className="text-purple-400">Premium+</Badge>
        )}
      </CardHeader>
      <CardContent>
        {canUse ? (
          <>
            {status?.connected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div>
                    <span className="text-green-400 font-medium">Connected</span>
                    {status.discordUsername && (
                      <p className="text-sm text-muted-foreground">@{status.discordUsername}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={unlinkDiscord} data-testid="button-discord-disconnect">
                    Disconnect
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  You will receive EV picks and alerts directly in Discord DMs.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Button onClick={generateCode} disabled={loading} className="w-full" data-testid="button-discord-connect">
                  {loading ? "Generating..." : "Connect Discord"}
                </Button>

                {linkingCode && (
                  <div className="p-4 bg-card border rounded-lg space-y-3">
                    <p className="text-sm text-muted-foreground">Your linking code:</p>
                    <code className="text-xl font-mono text-primary block" data-testid="text-discord-code">{linkingCode}</code>
                    
                    <div className="text-sm space-y-1">
                      <p className="font-medium">Steps to connect:</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Open Discord and DM @EV Scanner Bot</li>
                        <li>Type: <code className="bg-muted px-2 py-0.5 rounded">/link code:{linkingCode}</code></li>
                        <li>Done! You will receive picks in DMs</li>
                      </ol>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">Code expires in 10 minutes</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <Button variant="outline" onClick={() => navigate("/dashboard?tab=pricing")} data-testid="button-discord-upgrade">
            Upgrade to Premium
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function TelegramSettings({ userId, canUse }: BotSettingsProps) {
  const [linkingCode, setLinkingCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    minEV: 5,
    quietHours: { start: "22:00", end: "08:00" },
    instantAlerts: true,
  });
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: status } = useQuery<BotStatus>({
    queryKey: ["/api/telegram/status"],
    enabled: canUse,
  });

  const generateCode = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("mvp_token");
      const response = await fetch("/api/telegram/generate-code", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
      });
      const data = await response.json();
      if (data.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      } else {
        setLinkingCode(data.code);
      }
    } catch {
      toast({ title: "Error", description: "Failed to generate code", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const unlinkTelegram = async () => {
    try {
      const token = localStorage.getItem("mvp_token");
      await fetch("/api/telegram/unlink", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
      queryClient.invalidateQueries({ queryKey: ["/api/telegram/status"] });
      toast({ title: "Disconnected", description: "Telegram has been unlinked" });
    } catch {
      toast({ title: "Error", description: "Failed to unlink", variant: "destructive" });
    }
  };

  const saveSettings = async () => {
    try {
      const token = localStorage.getItem("mvp_token");
      await fetch("/api/telegram/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(settings),
      });
      toast({ title: "Saved", description: "Settings updated" });
    } catch {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    }
  };

  return (
    <Card data-testid="card-telegram-settings">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#0088cc]/10">
            <SiTelegram className="w-5 h-5 text-[#0088cc]" />
          </div>
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Telegram AI Assistant
              <Bot className="w-4 h-4" />
            </CardTitle>
            <CardDescription>
              {canUse ? "Your personal AI betting advisor" : "Exclusive to Elite members"}
            </CardDescription>
          </div>
        </div>
        {!canUse && (
          <Badge variant="outline" className="text-amber-500 flex items-center gap-1">
            <Crown className="w-3 h-3" /> Elite Only
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {canUse ? (
          <>
            {status?.connected ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div>
                    <span className="text-green-400 font-medium">Connected</span>
                    {status.telegramUsername && (
                      <p className="text-sm text-muted-foreground">@{status.telegramUsername}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={unlinkTelegram} data-testid="button-telegram-disconnect">
                    Disconnect
                  </Button>
                </div>

                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium">Notification Settings</h4>
                  
                  <div className="space-y-2">
                    <Label>Minimum EV for alerts: {settings.minEV}%</Label>
                    <Slider
                      value={[settings.minEV]}
                      onValueChange={([val]) => setSettings({ ...settings, minEV: val })}
                      min={3}
                      max={10}
                      step={1}
                      data-testid="slider-min-ev"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Instant alerts for high-EV picks</Label>
                      <p className="text-xs text-muted-foreground">Get notified immediately</p>
                    </div>
                    <Switch
                      checked={settings.instantAlerts}
                      onCheckedChange={(val) => setSettings({ ...settings, instantAlerts: val })}
                      data-testid="switch-instant-alerts"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Quiet Hours</Label>
                    <div className="flex gap-4">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Start</span>
                        <Input
                          type="time"
                          value={settings.quietHours.start}
                          onChange={(e) => setSettings({
                            ...settings,
                            quietHours: { ...settings.quietHours, start: e.target.value }
                          })}
                          data-testid="input-quiet-start"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">End</span>
                        <Input
                          type="time"
                          value={settings.quietHours.end}
                          onChange={(e) => setSettings({
                            ...settings,
                            quietHours: { ...settings.quietHours, end: e.target.value }
                          })}
                          data-testid="input-quiet-end"
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={saveSettings} className="w-full" data-testid="button-save-settings">
                    Save Settings
                  </Button>
                </div>

                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm font-medium text-primary mb-2">Try asking your AI:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>"What are today's best NBA picks?"</li>
                    <li>"Should I bet this 4-leg parlay?"</li>
                    <li>"Why is this pick +EV?"</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Button onClick={generateCode} disabled={loading} className="w-full" data-testid="button-telegram-connect">
                  {loading ? "Generating..." : "Connect Telegram AI"}
                </Button>

                {linkingCode && (
                  <div className="p-4 bg-card border rounded-lg space-y-3">
                    <p className="text-sm text-muted-foreground">Your linking code:</p>
                    <code className="text-xl font-mono text-primary block" data-testid="text-telegram-code">{linkingCode}</code>
                    
                    <div className="text-sm space-y-1">
                      <p className="font-medium">Steps to connect:</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Open Telegram app</li>
                        <li>Search for <code className="bg-muted px-2 py-0.5 rounded">@EVScannerBot</code></li>
                        <li>Click "Start" or type /start</li>
                        <li>Send this code: <code className="bg-muted px-2 py-0.5 rounded">{linkingCode}</code></li>
                      </ol>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">Code expires in 10 minutes</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <Button variant="outline" onClick={() => navigate("/dashboard?tab=pricing")} data-testid="button-telegram-upgrade">
            Upgrade to Elite
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function AmbassadorDashboard({ userId }: { userId: number }) {
  const [, navigate] = useLocation();
  
  const { data: ambassador, isLoading } = useQuery<Ambassador>({
    queryKey: ["/api/ambassador/me"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!ambassador) {
    return (
      <Card data-testid="card-become-ambassador">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-green-400" />
            Become an Ambassador
          </CardTitle>
          <CardDescription>
            Earn 20% lifetime commission on all referrals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/ambassador")} className="w-full" data-testid="button-join-program">
            Join Ambassador Program - $749
          </Button>
        </CardContent>
      </Card>
    );
  }

  const pendingAmount = parseFloat(ambassador.pendingPayout || '0');
  const totalEarned = parseFloat(ambassador.totalEarnings || '0');

  return (
    <div className="space-y-6">
      <Card data-testid="card-ambassador-earnings">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Earnings Overview</CardTitle>
              <CardDescription>Your commission dashboard</CardDescription>
            </div>
          </div>
          <Badge className="bg-green-500/20 text-green-400 capitalize">
            {ambassador.tier} Ambassador
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Total Earned</p>
              <p className="text-2xl font-bold text-green-400">${totalEarned.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Pending Payout</p>
              <p className="text-2xl font-bold text-amber-400">${pendingAmount.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Total Referrals</p>
              <p className="text-2xl font-bold">{ambassador.totalReferrals || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-referral-code">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Your Referral Code</CardTitle>
              <CardDescription>Share this code to earn commission</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 bg-muted rounded-lg text-lg font-mono" data-testid="text-referral-code">
              {ambassador.referralCode}
            </code>
            <Button 
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(ambassador.referralCode);
              }}
              data-testid="button-copy-code"
            >
              Copy
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Earn {ambassador.commissionPercent}% on every subscription from users who sign up with your code
          </p>
        </CardContent>
      </Card>

      <Card data-testid="card-marketing-assets">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Download className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Marketing Assets</CardTitle>
              <CardDescription>Download promotional materials</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            <Button variant="outline" className="justify-start" data-testid="button-download-banners">
              <Download className="w-4 h-4 mr-2" />
              Banner Images
            </Button>
            <Button variant="outline" className="justify-start" data-testid="button-download-social">
              <Download className="w-4 h-4 mr-2" />
              Social Media Kit
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-payout-settings">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Wallet className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Payout Settings</CardTitle>
              <CardDescription>Configure how you receive payments</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Payout Schedule</p>
            <p className="font-medium">Weekly (Every Monday)</p>
            <p className="text-xs text-muted-foreground mt-1">Minimum payout: $25</p>
          </div>
          <Button variant="outline" className="w-full" data-testid="button-update-payout">
            Update Payout Method
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminSection({ role, isSuperAdmin }: { role: string; isSuperAdmin: boolean }) {
  const [, navigate] = useLocation();

  return (
    <div className="space-y-6">
      <Card data-testid="card-admin-access">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Shield className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Admin Access</CardTitle>
              <CardDescription>You have {roleDisplay[role]} privileges</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-amber-500">
            {roleDisplay[role]}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2"
            onClick={() => navigate("/admin")}
            data-testid="button-admin-dashboard"
          >
            <Settings2 className="w-4 h-4" />
            Open Admin Dashboard
            <ExternalLink className="w-4 h-4" />
          </Button>

          <div className="grid gap-2 md:grid-cols-2">
            <Button variant="outline" className="justify-start" onClick={() => navigate("/admin?tab=users")} data-testid="button-user-management">
              <Users className="w-4 h-4 mr-2" />
              User Management
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => navigate("/admin?tab=promos")} data-testid="button-promo-management">
              <Gift className="w-4 h-4 mr-2" />
              Promo Codes
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => navigate("/admin?tab=ambassadors")} data-testid="button-ambassador-management">
              <DollarSign className="w-4 h-4 mr-2" />
              Ambassadors
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => navigate("/admin?tab=bots")} data-testid="button-bot-status">
              <MessageSquare className="w-4 h-4 mr-2" />
              Bot Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {isSuperAdmin && (
        <Card data-testid="card-super-admin">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Crown className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Super Admin Controls</CardTitle>
                <CardDescription>Full system access and management</CardDescription>
              </div>
            </div>
            <Badge className="bg-red-500/20 text-red-400">Super Admin</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-200">
                As a Super Admin, you have full access to:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Grant/revoke admin access to any user</li>
                <li>• Change user subscription tiers</li>
                <li>• Process ambassador payouts</li>
                <li>• System configuration and settings</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
