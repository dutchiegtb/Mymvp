import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MessageSquare, Bot, Settings2, Crown } from "lucide-react";
import { SiDiscord, SiTelegram } from "react-icons/si";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UserData {
  id: number;
  email: string;
  username?: string;
  subscriptionTier: string;
  subscriptionStatus?: string;
  isAdmin?: boolean;
}

interface BotStatus {
  connected: boolean;
  discordUsername?: string;
  telegramUsername?: string;
  settings?: any;
}

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery<UserData>({
    queryKey: ["/api/auth/me"],
  });

  const canUseDiscord = user?.isAdmin || user?.subscriptionTier === "premium" || user?.subscriptionTier === "elite";
  const canUseTelegram = user?.isAdmin || user?.subscriptionTier === "elite";

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Settings</h1>
            <p className="text-muted-foreground">Manage your account and notifications</p>
          </div>
        </div>

        <div className="grid gap-6">
          <DiscordSettings userId={user.id} subscriptionTier={user.subscriptionTier} canUse={canUseDiscord} />
          <TelegramSettings userId={user.id} subscriptionTier={user.subscriptionTier} canUse={canUseTelegram} />
        </div>
      </div>
    </div>
  );
}

interface BotSettingsProps {
  userId: number;
  subscriptionTier: string;
  canUse: boolean;
}

function DiscordSettings({ userId, subscriptionTier, canUse }: BotSettingsProps) {
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
    } catch (error) {
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
    } catch (error) {
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
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
            Premium+
          </span>
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

function TelegramSettings({ userId, subscriptionTier, canUse }: BotSettingsProps) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
          <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-semibold flex items-center gap-1">
            <Crown className="w-3 h-3" /> Elite Only
          </span>
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
                    <p className="text-xs text-muted-foreground">
                      Only receive alerts for picks with {settings.minEV}%+ EV
                    </p>
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
                    <p className="text-xs text-muted-foreground">No notifications during these hours</p>
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
                    <li>"Best bankroll management strategy?"</li>
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
                        <li>Ask anything!</li>
                      </ol>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">Code expires in 10 minutes</p>
                  </div>
                )}

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-amber-200">
                    The AI Assistant is like having a professional bettor available 24/7. 
                    Ask questions, get bet analysis, and receive instant alerts.
                  </p>
                </div>
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
