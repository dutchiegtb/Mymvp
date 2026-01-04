import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Users, DollarSign, Activity, RefreshCw, 
  MessageSquare, Gift, TrendingUp, Crown, Shield,
  BadgeDollarSign, History, CheckCircle2, Clock, XCircle, Plus
} from "lucide-react";
import { SiDiscord, SiTelegram } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { queryClient } from "@/lib/queryClient";

interface UserData {
  id: number;
  email: string;
  username?: string | null;
  isAdmin?: boolean;
  subscriptionTier: string;
  role?: string;
}

interface Ambassador {
  id: number;
  userId: number;
  referralCode: string;
  commissionPercent: string;
  totalEarnings: string;
  pendingPayout: string;
  user?: {
    email: string;
    username: string;
  };
}

interface Payout {
  id: number;
  ambassadorId: number;
  amount: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  payoutReference?: string;
  payoutMethod: string;
}

interface AdminStats {
  users: {
    total: number;
    premium: number;
    elite: number;
    basic: number;
    free: number;
  };
  revenue: {
    mrr: number;
    today: number;
  };
  bots: {
    discordConnected: number;
    telegramConnected: number;
  };
  api: {
    oddsRequests: number;
    lastRefresh: string;
  };
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery<UserData>({
    queryKey: ["/api/auth/me"],
  });

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/dashboard"],
    enabled: !!user?.isAdmin,
  });

  const refreshOdds = async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem("mvp_token");
      const response = await fetch("/api/admin/refresh-odds", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Success", description: `Refreshed ${data.picksCount} picks` });
        refetchStats();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to refresh odds", variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  if (userLoading) {
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

  if (!user.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access the admin dashboard.
            </p>
            <Button onClick={() => navigate("/dashboard")} data-testid="button-go-dashboard">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
                <Crown className="w-6 h-6 text-amber-400" />
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">System monitoring and management</p>
            </div>
          </div>
          <Button onClick={refreshOdds} disabled={refreshing} data-testid="button-refresh-odds">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Odds
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Users"
            value={stats?.users.total || 0}
            icon={<Users className="w-5 h-5" />}
            testId="card-stats-users"
          />
          <StatsCard
            title="Monthly Revenue"
            value={`$${stats?.revenue.mrr?.toLocaleString() || 0}`}
            icon={<DollarSign className="w-5 h-5" />}
            testId="card-stats-revenue"
          />
          <StatsCard
            title="Discord Connected"
            value={stats?.bots.discordConnected || 0}
            icon={<SiDiscord className="w-5 h-5" />}
            testId="card-stats-discord"
          />
          <StatsCard
            title="Telegram Connected"
            value={stats?.bots.telegramConnected || 0}
            icon={<SiTelegram className="w-5 h-5" />}
            testId="card-stats-telegram"
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
            <TabsTrigger value="promos" data-testid="tab-promos">Promo Codes</TabsTrigger>
            <TabsTrigger value="ambassadors" data-testid="tab-ambassadors">Ambassadors</TabsTrigger>
            <TabsTrigger value="bots" data-testid="tab-bots">Bot Status</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2">
              <Card data-testid="card-subscription-breakdown">
                <CardHeader>
                  <CardTitle className="text-lg">Subscription Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SubscriptionRow tier="Elite" count={stats?.users.elite || 0} color="text-amber-400" />
                  <SubscriptionRow tier="Premium" count={stats?.users.premium || 0} color="text-primary" />
                  <SubscriptionRow tier="Basic" count={stats?.users.basic || 0} color="text-blue-400" />
                  <SubscriptionRow tier="Free" count={stats?.users.free || 0} color="text-muted-foreground" />
                </CardContent>
              </Card>

              <Card data-testid="card-api-status">
                <CardHeader>
                  <CardTitle className="text-lg">API Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Odds API Requests Today</span>
                    <span className="font-medium">{stats?.api.oddsRequests || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last Cache Refresh</span>
                    <span className="font-medium">
                      {stats?.api.lastRefresh 
                        ? new Date(stats.api.lastRefresh).toLocaleTimeString()
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm text-green-400">All systems operational</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="promos">
            <PromoManagement />
          </TabsContent>

          <TabsContent value="ambassadors">
            <AmbassadorManagement />
          </TabsContent>

          <TabsContent value="bots">
            <BotManagement stats={stats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, testId }: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode;
  testId: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SubscriptionRow({ tier, count, color }: { tier: string; count: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className={color}>{tier}</span>
      <span className="font-medium">{count}</span>
    </div>
  );
}

function UserManagement() {
  const { toast } = useToast();
  const { data: currentUser } = useQuery<UserData>({
    queryKey: ["/api/auth/me"],
  });
  const { data: users, isLoading, refetch } = useQuery<UserData[]>({
    queryKey: ["/api/admin/users"],
  });
  const [updatingRole, setUpdatingRole] = useState<number | null>(null);
  
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const updateUserRole = async (userId: number, newRole: string) => {
    setUpdatingRole(userId);
    try {
      const token = localStorage.getItem("mvp_token");
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: "Success", description: `User role updated to ${newRole}` });
        refetch();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
    } finally {
      setUpdatingRole(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-500/20 text-red-400';
      case 'admin': return 'bg-green-500/20 text-green-400';
      case 'moderator': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading users...</div>;
  }

  const usersList = Array.isArray(users) ? users : [];

  return (
    <Card data-testid="card-user-management">
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          View and manage all registered users
          {isSuperAdmin && <span className="ml-2 text-green-400">(Super Admin - Can change roles)</span>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {usersList.length > 0 ? usersList.map((user: UserData, index: number) => (
            <div 
              key={user.id} 
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg gap-4 flex-wrap"
              data-testid={`row-user-${index}`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user.username || user.email}</p>
                <p className="text-sm text-muted-foreground truncate">{user.email} (ID: {user.id})</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getRoleBadgeColor(user.role || 'user')}`}>
                  {(user.role || 'user').toUpperCase()}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  user.subscriptionTier === 'elite' ? 'bg-amber-500/20 text-amber-400' :
                  user.subscriptionTier === 'premium' ? 'bg-primary/20 text-primary' :
                  user.subscriptionTier === 'web' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {user.subscriptionTier?.toUpperCase() || 'FREE'}
                </span>
                {isSuperAdmin && user.role !== 'super_admin' && (
                  <select
                    className="bg-background border border-border rounded px-2 py-1 text-xs"
                    value={user.role || 'user'}
                    onChange={(e) => updateUserRole(user.id, e.target.value)}
                    disabled={updatingRole === user.id}
                    data-testid={`select-role-${user.id}`}
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                )}
              </div>
            </div>
          )) : <p className="text-muted-foreground">No users found</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function PromoManagement() {
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("10");
  const { toast } = useToast();

  const createPromo = async () => {
    try {
      const token = localStorage.getItem("mvp_token");
      const response = await fetch("/api/admin/promo/create", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          code: code.toUpperCase(),
          discountType: "percentage",
          discountValue: parseInt(discount),
          maxUses: 100,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Created", description: `Promo ${data.promo.code} created` });
        setCode("");
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create promo", variant: "destructive" });
    }
  };

  return (
    <Card data-testid="card-promo-management">
      <CardHeader>
        <CardTitle>Promo Codes</CardTitle>
        <CardDescription>Create and manage promotional codes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Promo Code</Label>
            <Input 
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SUMMER2024"
              data-testid="input-promo-code"
            />
          </div>
          <div className="space-y-2">
            <Label>Discount %</Label>
            <Input 
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="10"
              data-testid="input-promo-discount"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={createPromo} disabled={!code} className="w-full" data-testid="button-create-promo">
              <Gift className="w-4 h-4 mr-2" />
              Create Promo
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AmbassadorCard({ 
  ambassador, 
  isSuperAdmin, 
  onRefresh 
}: { 
  ambassador: Ambassador; 
  isSuperAdmin: boolean; 
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const { data: referrals, refetch: refetchReferrals } = useQuery<any[]>({
    queryKey: ["/api/admin/ambassadors", ambassador.id, "referrals"],
    enabled: expanded,
  });

  const { data: payouts, refetch: refetchPayouts } = useQuery<Payout[]>({
    queryKey: ["/api/admin/ambassadors", ambassador.id, "payouts"],
    enabled: expanded,
  });

  const pendingAmount = parseFloat(ambassador.pendingPayout || '0');
  const totalEarnings = parseFloat(ambassador.totalEarnings || '0');

  const processPayout = async () => {
    if (!isSuperAdmin || pendingAmount <= 0) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem("mvp_token");
      const response = await fetch(`/api/admin/ambassadors/${ambassador.id}/payout`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ amount: pendingAmount, payoutMethod: 'manual' }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: "Success", description: `Payout of $${pendingAmount.toFixed(2)} initiated` });
        onRefresh();
        refetchPayouts();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to process payout", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const markPayoutComplete = async (payoutId: number) => {
    if (!isSuperAdmin) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem("mvp_token");
      const response = await fetch(`/api/admin/payouts/${payoutId}/complete`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ reference: `Manual-${Date.now()}` }),
      });
      if (response.ok) {
        toast({ title: "Success", description: "Payout marked as completed" });
        onRefresh();
        refetchPayouts();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to complete payout", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div 
      className={`p-4 rounded-lg border ${expanded ? 'border-primary bg-primary/5' : 'bg-muted/50'}`}
      data-testid={`card-ambassador-${ambassador.id}`}
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-medium">{ambassador.user?.email || `User #${ambassador.userId}`}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="font-mono bg-muted px-2 py-0.5 rounded">{ambassador.referralCode}</span>
            <span>{ambassador.commissionPercent}% commission</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Earned</p>
            <p className="font-semibold text-green-400">${totalEarnings.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="font-semibold text-amber-400">${pendingAmount.toFixed(2)}</p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            data-testid={`button-view-details-${ambassador.id}`}
          >
            {expanded ? 'Hide' : 'Details'}
          </Button>
          
          {isSuperAdmin && pendingAmount > 0 && (
            <Button
              size="sm"
              onClick={processPayout}
              disabled={processing}
              data-testid={`button-payout-${ambassador.id}`}
            >
              <DollarSign className="w-4 h-4 mr-1" />
              Pay ${pendingAmount.toFixed(2)}
            </Button>
          )}
        </div>
      </div>
      
      {expanded && (
        <div className="mt-4 pt-4 border-t space-y-4">
          <div>
            <h4 className="font-medium mb-2">Recent Referrals</h4>
            {referrals && referrals.length > 0 ? (
              <div className="space-y-2">
                {referrals.slice(0, 5).map((ref: any) => (
                  <div key={ref.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                    <span>{ref.referredUser?.email || `User #${ref.referredUserId}`}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">${parseFloat(ref.subscriptionAmount || '0').toFixed(2)} subscription</span>
                      <span className="text-green-400 font-medium">${parseFloat(ref.commissionEarned || '0').toFixed(2)} earned</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No referrals yet</p>
            )}
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Payout History</h4>
            {payouts && payouts.length > 0 ? (
              <div className="space-y-2">
                {payouts.slice(0, 5).map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        payout.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        payout.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {payout.status}
                      </span>
                      <span>${parseFloat(payout.amount).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {payout.createdAt ? new Date(payout.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                      {isSuperAdmin && payout.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markPayoutComplete(payout.id)}
                          disabled={processing}
                          data-testid={`button-complete-payout-${payout.id}`}
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No payouts yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AmbassadorManagement() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("10");
  const [processing, setProcessing] = useState(false);
  
  const { data: currentUser } = useQuery<UserData>({
    queryKey: ["/api/auth/me"],
  });
  
  const { data: ambassadors, isLoading, refetch } = useQuery<Ambassador[]>({
    queryKey: ["/api/admin/ambassadors"],
  });

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const createAmbassador = async () => {
    if (!email || !referralCode) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem("mvp_token");
      const response = await fetch("/api/admin/ambassador/create", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ email, referralCode, commissionPercent: parseInt(commissionPercent) }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: "Success", description: `Ambassador ${referralCode} created` });
        setEmail("");
        setReferralCode("");
        refetch();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create ambassador", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading ambassadors...</div>;
  }

  const ambassadorList = Array.isArray(ambassadors) ? ambassadors : [];

  return (
    <div className="space-y-6">
      <Card data-testid="card-create-ambassador">
        <CardHeader>
          <CardTitle>Create Ambassador</CardTitle>
          <CardDescription>Add a new ambassador to the program</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>User Email</Label>
              <Input 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                data-testid="input-ambassador-email"
              />
            </div>
            <div className="space-y-2">
              <Label>Referral Code</Label>
              <Input 
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="PARTNER25"
                data-testid="input-ambassador-code"
              />
            </div>
            <div className="space-y-2">
              <Label>Commission %</Label>
              <Input 
                type="number"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(e.target.value)}
                placeholder="10"
                data-testid="input-ambassador-commission"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={createAmbassador} 
                disabled={!email || !referralCode || processing}
                className="w-full"
                data-testid="button-create-ambassador"
              >
                Create Ambassador
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-ambassador-list">
        <CardHeader>
          <CardTitle>Ambassador Program</CardTitle>
          <CardDescription>
            Manage ambassadors and process payouts
            {isSuperAdmin && <span className="ml-2 text-green-400">(Super Admin - Can process payouts)</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ambassadorList.length > 0 ? ambassadorList.map((amb) => (
              <AmbassadorCard 
                key={amb.id} 
                ambassador={amb} 
                isSuperAdmin={isSuperAdmin} 
                onRefresh={refetch}
              />
            )) : (
              <p className="text-muted-foreground text-center py-8">No ambassadors yet. Create one above!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BotManagement({ stats }: { stats?: AdminStats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card data-testid="card-discord-status">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#5865F2]/20 rounded-lg">
              <SiDiscord className="w-5 h-5 text-[#5865F2]" />
            </div>
            <div>
              <CardTitle className="text-lg">Discord Bot</CardTitle>
              <CardDescription>Premium+ feature</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Connected Users</span>
            <span className="font-medium">{stats?.bots.discordConnected || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            {process.env.DISCORD_BOT_TOKEN ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-green-400">Bot online</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-sm text-amber-400">Token not configured</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-telegram-status">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0088cc]/20 rounded-lg">
              <SiTelegram className="w-5 h-5 text-[#0088cc]" />
            </div>
            <div>
              <CardTitle className="text-lg">Telegram AI Bot</CardTitle>
              <CardDescription>Elite only</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Connected Users</span>
            <span className="font-medium">{stats?.bots.telegramConnected || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            {process.env.TELEGRAM_BOT_TOKEN ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-green-400">Bot online</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-sm text-amber-400">Token not configured</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
