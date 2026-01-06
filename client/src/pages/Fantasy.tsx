import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, Trophy, TrendingUp, Flame, Star, Target, Award, Zap, 
  Crown, Users, DollarSign, ArrowUp, ArrowDown, Lock, AlertTriangle,
  Gamepad2, BarChart3, Layers, ChevronRight
} from "lucide-react";

interface ValuePlay {
  id: string;
  name: string;
  position: string;
  team: string;
  opponent: string;
  salary: number;
  projectedPoints: number;
  valueScore: number;
  matchupGrade: string;
  relatedPick?: {
    selection: string;
    evPercent: number;
  };
}

interface CorrelatedStack {
  id: string;
  name: string;
  players: {
    name: string;
    position: string;
    salary: number;
    team: string;
  }[];
  correlationBoost: number;
  relatedPick: {
    selection: string;
    evPercent: number;
    reasoning: string;
  };
}

interface FantasyData {
  valuePlays: ValuePlay[];
  correlatedStacks: CorrelatedStack[];
  avoidPlayers: {
    name: string;
    position: string;
    team: string;
    reason: string;
  }[];
  lastUpdated: string;
}

const SPORTS = [
  { key: "nfl", name: "NFL", icon: "🏈" },
  { key: "nba", name: "NBA", icon: "🏀" },
  { key: "mlb", name: "MLB", icon: "⚾" },
  { key: "nhl", name: "NHL", icon: "🏒" },
];

function getValueColor(score: number): string {
  if (score >= 90) return "text-green-500";
  if (score >= 80) return "text-emerald-500";
  if (score >= 70) return "text-yellow-500";
  return "text-muted-foreground";
}

function getMatchupColor(grade: string): string {
  if (grade === "A+" || grade === "A") return "bg-green-500/20 text-green-500";
  if (grade === "B+" || grade === "B") return "bg-emerald-500/20 text-emerald-500";
  if (grade === "C+" || grade === "C") return "bg-yellow-500/20 text-yellow-500";
  return "bg-red-500/20 text-red-500";
}

export default function Fantasy() {
  const [, setLocation] = useLocation();
  const [selectedSport, setSelectedSport] = useState("nfl");

  const { data: userData, isLoading: userLoading } = useQuery<{
    id: number;
    email: string;
    username: string;
    subscriptionTier: string;
    subscriptionStatus: string;
    isAdmin: boolean;
    role: string;
  }>({
    queryKey: ['/api/auth/me'],
  });

  const isPremiumPlus = userData?.isAdmin || 
    ['premium', 'elite', 'lifetime'].includes(userData?.subscriptionTier || '');

  const { data: fantasyData, isLoading: fantasyLoading } = useQuery<FantasyData>({
    queryKey: ['/api/fantasy/data', selectedSport],
    enabled: isPremiumPlus,
  });

  useEffect(() => {
    const token = localStorage.getItem('mvp_token');
    if (!token && !userLoading) {
      setLocation('/login');
    }
  }, [userLoading, setLocation]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const mockValuePlays: ValuePlay[] = [
    {
      id: "vp-1",
      name: "Patrick Mahomes",
      position: "QB",
      team: "KC",
      opponent: "@ LV",
      salary: 8500,
      projectedPoints: 24.3,
      valueScore: 92,
      matchupGrade: "A",
      relatedPick: { selection: "Over 2.5 TD Passes", evPercent: 4.2 },
    },
    {
      id: "vp-2",
      name: "Ja'Marr Chase",
      position: "WR",
      team: "CIN",
      opponent: "vs BAL",
      salary: 7800,
      projectedPoints: 21.5,
      valueScore: 88,
      matchupGrade: "B+",
      relatedPick: { selection: "Over 85.5 Rec Yards", evPercent: 3.8 },
    },
    {
      id: "vp-3",
      name: "Saquon Barkley",
      position: "RB",
      team: "PHI",
      opponent: "vs DAL",
      salary: 8200,
      projectedPoints: 22.8,
      valueScore: 85,
      matchupGrade: "A-",
      relatedPick: { selection: "Anytime TD Scorer", evPercent: 5.1 },
    },
    {
      id: "vp-4",
      name: "Travis Kelce",
      position: "TE",
      team: "KC",
      opponent: "@ LV",
      salary: 7200,
      projectedPoints: 16.4,
      valueScore: 83,
      matchupGrade: "B+",
    },
    {
      id: "vp-5",
      name: "CeeDee Lamb",
      position: "WR",
      team: "DAL",
      opponent: "@ PHI",
      salary: 8100,
      projectedPoints: 20.2,
      valueScore: 78,
      matchupGrade: "B",
      relatedPick: { selection: "Over 6.5 Receptions", evPercent: 2.9 },
    },
  ];

  const mockCorrelatedStacks: CorrelatedStack[] = [
    {
      id: "cs-1",
      name: "Chiefs Stack",
      players: [
        { name: "Patrick Mahomes", position: "QB", salary: 8500, team: "KC" },
        { name: "Travis Kelce", position: "TE", salary: 7200, team: "KC" },
      ],
      correlationBoost: 12,
      relatedPick: {
        selection: "Mahomes Over 2.5 TD Passes",
        evPercent: 4.2,
        reasoning: "When Mahomes throws TDs, Kelce is the primary red zone target. Our +EV bet suggests high-scoring game script likely.",
      },
    },
    {
      id: "cs-2",
      name: "Bengals Stack",
      players: [
        { name: "Joe Burrow", position: "QB", salary: 7600, team: "CIN" },
        { name: "Ja'Marr Chase", position: "WR", salary: 7800, team: "CIN" },
      ],
      correlationBoost: 15,
      relatedPick: {
        selection: "Chase Over 85.5 Rec Yards",
        evPercent: 3.8,
        reasoning: "Chase averages 28% target share. If he hits yardage, Burrow likely has a big day passing.",
      },
    },
    {
      id: "cs-3",
      name: "Eagles Game Stack",
      players: [
        { name: "Jalen Hurts", position: "QB", salary: 7900, team: "PHI" },
        { name: "Saquon Barkley", position: "RB", salary: 8200, team: "PHI" },
        { name: "CeeDee Lamb", position: "WR", salary: 8100, team: "DAL" },
      ],
      correlationBoost: 8,
      relatedPick: {
        selection: "PHI vs DAL Over 48.5",
        evPercent: 3.2,
        reasoning: "High-scoring rivalry game expected. Stack both offenses for maximum upside.",
      },
    },
  ];

  const mockAvoidPlayers = [
    { name: "Derrick Henry", position: "RB", team: "BAL", reason: "Tough matchup vs elite run D, our model projects under on rushing" },
    { name: "Stefon Diggs", position: "WR", team: "HOU", reason: "Shadowed by top CB, low target share expected" },
    { name: "Alvin Kamara", position: "RB", team: "NO", reason: "Game script favors passing, limited goal-line work" },
  ];

  const displayValuePlays = fantasyData?.valuePlays || mockValuePlays;
  const displayStacks = fantasyData?.correlatedStacks || mockCorrelatedStacks;
  const displayAvoid = fantasyData?.avoidPlayers || mockAvoidPlayers;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center gap-4 px-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="flex-1">
                <h1 className="text-lg font-semibold">DFS Lineup Optimizer</h1>
              </div>
              <Select value={selectedSport} onValueChange={setSelectedSport}>
                <SelectTrigger className="w-32" data-testid="select-sport">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS.map((sport) => (
                    <SelectItem key={sport.key} value={sport.key}>
                      <span className="flex items-center gap-2">
                        <span>{sport.icon}</span>
                        <span>{sport.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ThemeToggle />
            </div>
          </header>

          <ScrollArea className="flex-1">
            <div className="container py-6 space-y-6">
              {!isPremiumPlus ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                    <h2 className="text-xl font-bold mb-2">Premium Feature</h2>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      DFS Lineup Optimizer is available to Premium+ subscribers. 
                      Get value plays, correlated stacks, and player recommendations 
                      based on our +EV betting picks.
                    </p>
                    <Button asChild data-testid="button-upgrade">
                      <Link href="/settings">Upgrade to Premium</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold" data-testid="text-fantasy-title">
                        DFS Lineup Optimizer
                      </h2>
                      <p className="text-muted-foreground">
                        Find value plays and optimal stacks based on our +EV betting picks
                      </p>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <Gamepad2 className="h-3 w-3" />
                      {SPORTS.find(s => s.key === selectedSport)?.name} DFS
                    </Badge>
                  </div>

                  <Tabs defaultValue="value" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="value" data-testid="tab-value-plays">
                        <Flame className="h-4 w-4 mr-2" />
                        Value Plays
                      </TabsTrigger>
                      <TabsTrigger value="stacks" data-testid="tab-stacks">
                        <Layers className="h-4 w-4 mr-2" />
                        Correlated Stacks
                      </TabsTrigger>
                      <TabsTrigger value="avoid" data-testid="tab-avoid">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Avoid
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="value" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Today's Value Plays
                          </CardTitle>
                          <CardDescription>
                            Underpriced players with high projections based on our betting analysis
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {fantasyLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {displayValuePlays.map((player, idx) => (
                                <div
                                  key={player.id}
                                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover-elevate"
                                  data-testid={`value-play-${player.id}`}
                                >
                                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold">{player.name}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {player.position}
                                      </Badge>
                                      <span className="text-muted-foreground text-sm">
                                        {player.team} {player.opponent}
                                      </span>
                                    </div>
                                    {player.relatedPick && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <Badge variant="secondary" className="gap-1">
                                          <TrendingUp className="h-3 w-3" />
                                          +{player.relatedPick.evPercent}% EV
                                        </Badge>
                                        <span className="text-muted-foreground">
                                          {player.relatedPick.selection}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground text-sm">
                                        ${player.salary.toLocaleString()}
                                      </span>
                                      <span className="font-medium">
                                        {player.projectedPoints} pts
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                      <Badge className={getMatchupColor(player.matchupGrade)}>
                                        {player.matchupGrade}
                                      </Badge>
                                      <span className={`font-bold ${getValueColor(player.valueScore)}`}>
                                        <Flame className="h-4 w-4 inline mr-1" />
                                        {player.valueScore}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="stacks" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-primary" />
                            Correlated Stacks
                          </CardTitle>
                          <CardDescription>
                            Player combinations that correlate with our +EV betting picks
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {displayStacks.map((stack) => (
                            <div
                              key={stack.id}
                              className="p-4 rounded-lg border bg-card"
                              data-testid={`stack-${stack.id}`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold flex items-center gap-2">
                                  <Crown className="h-4 w-4 text-yellow-500" />
                                  {stack.name}
                                </h3>
                                <Badge variant="secondary" className="gap-1">
                                  <ArrowUp className="h-3 w-3 text-green-500" />
                                  +{stack.correlationBoost}% correlation boost
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                {stack.players.map((player, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                                  >
                                    <Badge variant="outline">{player.position}</Badge>
                                    <div className="flex-1">
                                      <div className="font-medium">{player.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {player.team}
                                      </div>
                                    </div>
                                    <div className="text-right text-sm font-medium">
                                      ${player.salary.toLocaleString()}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                                <div className="flex items-center gap-2 mb-2">
                                  <Target className="h-4 w-4 text-primary" />
                                  <span className="font-medium">Related Pick:</span>
                                  <Badge className="bg-green-500/20 text-green-500">
                                    +{stack.relatedPick.evPercent}% EV
                                  </Badge>
                                </div>
                                <p className="text-sm font-medium mb-1">
                                  {stack.relatedPick.selection}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {stack.relatedPick.reasoning}
                                </p>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="avoid" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Players to Avoid
                          </CardTitle>
                          <CardDescription>
                            Players in tough matchups or games we're betting against
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {displayAvoid.map((player, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-4 p-4 rounded-lg bg-destructive/5 border border-destructive/10"
                                data-testid={`avoid-player-${idx}`}
                              >
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive/10 text-destructive">
                                  <ArrowDown className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold">{player.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {player.position}
                                    </Badge>
                                    <span className="text-muted-foreground text-sm">
                                      {player.team}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {player.reason}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>

                  <Card className="bg-muted/30">
                    <CardContent className="flex items-center gap-4 py-4">
                      <BarChart3 className="h-8 w-8 text-muted-foreground" />
                      <div className="flex-1">
                        <h3 className="font-semibold">Full Lineup Builder Coming Soon</h3>
                        <p className="text-sm text-muted-foreground">
                          Optimal lineup generation with salary constraints and contest-specific settings
                        </p>
                      </div>
                      <Badge variant="secondary">Phase 2</Badge>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </ScrollArea>
        </main>
      </div>
    </SidebarProvider>
  );
}
