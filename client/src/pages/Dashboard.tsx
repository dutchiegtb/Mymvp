import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import ValuePickCard from "@/components/ValuePickCard";
import PaywallCard from "@/components/PaywallCard";
import OddsComparisonTable from "@/components/OddsComparisonTable";
import ParlayBuilder from "@/components/ParlayBuilder";
import TopPicksSection from "@/components/TopPicksSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Activity, Loader2, Trophy, Users, TrendingUp, Flame, Star, Heart, MessageCircle, Share2, Target, Award, Zap, Medal, Dribbble, CircleDot, Hexagon, Disc, PartyPopper, Eye, AlertTriangle, Settings, Bell, Moon, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ParlayLeg } from "@/components/ParlayBuilder";

interface EVPick {
  id: string;
  game: string;
  sport: string;
  sportKey: string;
  market: string;
  selection: string;
  point: number | null;
  bestBook: string;
  bestOdds: number;
  worstBook: string;
  worstOdds: number;
  evPercent: number;
  confidence: number;
  commenceTime: string;
  reasoning: string;
}

interface EVPicksResponse {
  picks: EVPick[];
  total: number;
  lastUpdated: string;
}

interface TopPicksResponse {
  picks: (EVPick & { rank: number })[];
  sport: string;
  lastUpdated: string;
}

interface UserStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: { current: number; longest: number; rewardAt: number };
  stats: { totalWins: number; totalLosses: number; winRate: number; totalProfit: number };
  badges: { id: string; name: string; icon: string; earned: boolean; earnedAt?: string; progress?: number }[];
  achievements: { name: string; progress: number; total: number; reward: string }[];
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  winRate: number;
  profit: number;
  level: number;
  streak: number;
}

interface SocialPost {
  id: string;
  username: string;
  level: number;
  action: string;
  content: string;
  metadata: Record<string, any>;
  likes: number;
  comments: number;
  timestamp: string;
}

interface ProfitData {
  summary: {
    totalPotentialProfit: number;
    totalPicksTracked: number;
    wins: number;
    losses: number;
    winRate: number;
    avgBetAmount: number;
  };
  bestDay: { date: string; profit: number; picks: number };
  worstDay: { date: string; profit: number; picks: number };
  currentMonth: { profit: number; wins: number; losses: number; roi: number };
  recentPicks: { date: string; game: string; selection: string; result: string; profit: number }[];
  chartData: { date: string; profit: number; cumulative: number }[];
}

const sportKeyMap: Record<string, string> = {
  'all': 'all',
  'nba': 'basketball_nba',
  'nfl': 'americanfootball_nfl',
  'mlb': 'baseball_mlb',
  'nhl': 'icehockey_nhl',
  'soccer': 'soccer_epl',
};

export default function Dashboard() {
  const style = {
    "--sidebar-width": "16rem",
  };

  const [selectedSport, setSelectedSport] = useState("all");
  const [activeMainTab, setActiveMainTab] = useState<'picks' | 'social' | 'profits' | 'settings'>('picks');
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState('weekly');
  const [parlayLegs, setParlayLegs] = useState<ParlayLeg[]>([]);

  const sportApiKey = sportKeyMap[selectedSport] || 'all';

  const { data: evPicksData, isLoading: evLoading } = useQuery<EVPicksResponse>({
    queryKey: ['/api/picks/ev', { sport: sportApiKey }],
    queryFn: async () => {
      const res = await fetch(`/api/picks/ev?sport=${sportApiKey}`);
      if (!res.ok) throw new Error('Failed to fetch EV picks');
      return res.json();
    },
    refetchInterval: 60000,
  });

  const { data: topPicksData, isLoading: topPicksLoading } = useQuery<TopPicksResponse>({
    queryKey: ['/api/picks/top', { sport: sportApiKey }],
    queryFn: async () => {
      const res = await fetch(`/api/picks/top?sport=${sportApiKey}`);
      if (!res.ok) throw new Error('Failed to fetch top picks');
      return res.json();
    },
    refetchInterval: 60000,
  });

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ['/api/user/stats'],
  });

  const { data: leaderboardData } = useQuery<{ leaderboard: LeaderboardEntry[]; userRank: LeaderboardEntry }>({
    queryKey: ['/api/leaderboard', { timeframe: leaderboardTimeframe }],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard?timeframe=${leaderboardTimeframe}`);
      return res.json();
    },
  });

  const { data: socialData } = useQuery<{ feed: SocialPost[] }>({
    queryKey: ['/api/social/feed'],
  });

  const { data: profitData } = useQuery<ProfitData>({
    queryKey: ['/api/user/profit-tracker'],
  });

  const SportIcon = ({ sport }: { sport: string }) => {
    switch (sport) {
      case 'all': return <Trophy className="h-4 w-4" />;
      case 'nba': return <Dribbble className="h-4 w-4" />;
      case 'nfl': return <Hexagon className="h-4 w-4" />;
      case 'mlb': return <CircleDot className="h-4 w-4" />;
      case 'nhl': return <Disc className="h-4 w-4" />;
      case 'soccer': return <Target className="h-4 w-4" />;
      default: return <Trophy className="h-4 w-4" />;
    }
  };

  const sports = [
    { id: 'all', label: 'All Sports' },
    { id: 'nba', label: 'NBA' },
    { id: 'nfl', label: 'NFL' },
    { id: 'mlb', label: 'MLB' },
    { id: 'nhl', label: 'NHL' },
    { id: 'soccer', label: 'Soccer' },
  ];

  const evPicks = evPicksData?.picks || [];
  const topPicks = (topPicksData?.picks || []).map(pick => ({
    id: pick.id,
    rank: pick.rank,
    player: pick.selection,
    stat: pick.market,
    sport: pick.sport,
    selection: pick.point ? `${pick.selection} ${pick.point}` : pick.selection,
    ev: pick.evPercent,
    confidence: pick.confidence,
    book: pick.bestBook,
    line: pick.point || 0,
    reasoning: pick.reasoning,
  }));

  const valuePicks = evPicks.map(pick => ({
    id: pick.id,
    playerName: pick.selection,
    statType: pick.market,
    sport: pick.sport,
    book1: { name: pick.bestBook, line: pick.bestOdds },
    book2: { name: pick.worstBook, line: pick.worstOdds },
    ev: pick.evPercent,
    recommendation: `${pick.selection} @ ${pick.bestBook}`,
    timestamp: new Date(pick.commenceTime).toLocaleTimeString(),
  }));

  const mockOddsData = evPicks.slice(0, 5).map(pick => ({
    id: pick.id,
    player: pick.selection,
    stat: pick.market,
    sportsbooks: {
      [pick.bestBook]: { line: pick.bestOdds, isBest: true },
      [pick.worstBook]: { line: pick.worstOdds },
    },
  }));

  const sportsbooks = ['FanDuel', 'DraftKings', 'BetMGM', 'PrizePicks'];

  const handleAddToParlay = (pick: EVPick) => {
    if (parlayLegs.find(leg => leg.id === pick.id)) return;
    
    const newLeg: ParlayLeg = {
      id: pick.id,
      player: pick.selection,
      stat: pick.market,
      selection: pick.point ? `${pick.selection} ${pick.point}` : pick.selection,
      odds: pick.bestOdds,
      book: pick.bestBook,
    };
    setParlayLegs([...parlayLegs, newLeg]);
  };

  const handleRemoveLeg = (id: string) => {
    setParlayLegs(parlayLegs.filter(leg => leg.id !== id));
  };

  const handleClearParlay = () => {
    setParlayLegs([]);
  };

  const xpProgress = userStats ? (userStats.xp / userStats.xpToNextLevel) * 100 : 0;

  const handleSidebarTabChange = (tab: string) => {
    if (tab === 'picks' || tab === 'social' || tab === 'profits' || tab === 'settings') {
      setActiveMainTab(tab);
    }
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar userTier="free" onTabChange={handleSidebarTabChange} activeTab={activeMainTab} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 p-4 border-b">
            <div className="flex items-center gap-4 flex-wrap">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-success animate-pulse" />
                <span className="text-sm font-medium">LIVE</span>
              </div>
              {evPicksData?.lastUpdated && (
                <span className="text-xs text-muted-foreground">
                  Updated: {new Date(evPicksData.lastUpdated).toLocaleTimeString()}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              {userStats && (
                <>
                  <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-lg border" data-testid="user-level-display">
                    <Star className="h-4 w-4 text-warning" />
                    <span className="text-sm font-bold">Lvl {userStats.level}</span>
                    <div className="w-16 hidden sm:block">
                      <Progress value={xpProgress} className="h-1.5" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/50" data-testid="user-streak-display">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-bold text-orange-500">{userStats.streak.current}</span>
                  </div>
                </>
              )}
              <ThemeToggle />
            </div>
          </header>

          <div className="flex border-b px-4">
            <button
              onClick={() => setActiveMainTab('picks')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeMainTab === 'picks' 
                  ? 'border-primary text-primary font-semibold' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              data-testid="tab-main-picks"
            >
              <Target className="h-4 w-4" />
              <span>Picks</span>
            </button>
            <button
              onClick={() => setActiveMainTab('social')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeMainTab === 'social' 
                  ? 'border-primary text-primary font-semibold' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              data-testid="tab-main-social"
            >
              <Users className="h-4 w-4" />
              <span>Social</span>
            </button>
            <button
              onClick={() => setActiveMainTab('profits')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeMainTab === 'profits' 
                  ? 'border-primary text-primary font-semibold' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              data-testid="tab-main-profits"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Profits</span>
            </button>
          </div>

          <main className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="max-w-7xl mx-auto p-6 space-y-6">
                
                {activeMainTab === 'picks' && (
                  <>
                    <div>
                      <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
                        MVP Dashboard
                      </h1>
                      <p className="text-muted-foreground">
                        Real-time odds analysis across all major sportsbooks
                      </p>
                    </div>

                    <Tabs value={selectedSport} onValueChange={setSelectedSport} className="space-y-6">
                      <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-2 p-2">
                        {sports.map((sport) => (
                          <TabsTrigger
                            key={sport.id}
                            value={sport.id}
                            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                            data-testid={`tab-sport-${sport.id}`}
                          >
                            <SportIcon sport={sport.id} />
                            <span>{sport.label}</span>
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      <TabsContent value={selectedSport} className="space-y-6">
                        <div className="grid lg:grid-cols-3 gap-6">
                          <div className="lg:col-span-2 space-y-6">
                            {topPicksLoading ? (
                              <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                              </div>
                            ) : (
                              <TopPicksSection picks={topPicks.slice(0, 3)} />
                            )}

                            <div>
                              <div className="flex items-center justify-between gap-2 mb-4">
                                <h2 className="text-2xl font-bold">Value Picks</h2>
                                <Badge variant="outline" className="font-mono">
                                  {evPicks.length} picks found
                                </Badge>
                              </div>
                              {evLoading ? (
                                <div className="flex items-center justify-center py-12">
                                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                              ) : valuePicks.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                  <p>No value picks found for {selectedSport === 'all' ? 'any sport' : selectedSport.toUpperCase()}</p>
                                  <p className="text-sm mt-2">Check back when games are live!</p>
                                </div>
                              ) : (
                                <div className="grid gap-6">
                                  {valuePicks.map((pick, index) => (
                                    <div key={pick.id} onClick={() => handleAddToParlay(evPicks[index])} className="cursor-pointer">
                                      <ValuePickCard pick={pick} />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {mockOddsData.length > 0 && (
                              <div>
                                <h2 className="text-2xl font-bold mb-4">Odds Comparison</h2>
                                <OddsComparisonTable data={mockOddsData} sportsbooks={sportsbooks} />
                              </div>
                            )}
                          </div>

                          <div className="space-y-6">
                            <ParlayBuilder 
                              legs={parlayLegs} 
                              onRemoveLeg={handleRemoveLeg}
                              onClear={handleClearParlay}
                            />

                            <PaywallCard
                              tierName="Premium"
                              price="$24.99/mo"
                              benefits={[
                                'Sharp picks',
                                'Discord bot access',
                                'Line movement alerts',
                              ]}
                            />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </>
                )}

                {activeMainTab === 'social' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-3xl font-bold mb-2" data-testid="text-social-title">
                        Community
                      </h1>
                      <p className="text-muted-foreground">
                        See what top bettors are winning on
                      </p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                          <Zap className="h-5 w-5 text-warning" />
                          Live Feed
                        </h2>
                        
                        {socialData?.feed?.map((post) => (
                          <Card key={post.id} className="hover-elevate" data-testid={`social-post-${post.id}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold">
                                    {post.username.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold">{post.username}</span>
                                      <Badge variant="secondary" className="text-xs">Lvl {post.level}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(post.timestamp).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                
                                {post.action === 'parlay_win' && (
                                  <Badge className="bg-success text-success-foreground">Parlay Win</Badge>
                                )}
                                {post.action === 'big_win' && (
                                  <Badge className="bg-primary">Win</Badge>
                                )}
                                {post.action === 'streak_milestone' && (
                                  <Badge className="bg-orange-500">Streak</Badge>
                                )}
                              </div>
                              
                              <p className="mt-3 text-foreground">{post.content}</p>
                              
                              {post.metadata.profit && (
                                <div className="mt-2 p-2 bg-success/10 rounded-lg inline-block">
                                  <span className="text-success font-bold">+${post.metadata.profit}</span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                                <Button variant="ghost" size="sm" className="gap-1" data-testid={`button-like-${post.id}`}>
                                  <Heart className="h-4 w-4" />
                                  <span>{post.likes}</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="gap-1">
                                  <MessageCircle className="h-4 w-4" />
                                  <span>{post.comments}</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="gap-1">
                                  <Share2 className="h-4 w-4" />
                                  <span>Share</span>
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <div className="space-y-6">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2">
                              <Trophy className="h-5 w-5 text-warning" />
                              Leaderboard
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex gap-1 mb-4">
                              {['weekly', 'monthly', 'allTime'].map((tf) => (
                                <Button
                                  key={tf}
                                  variant={leaderboardTimeframe === tf ? 'default' : 'ghost'}
                                  size="sm"
                                  onClick={() => setLeaderboardTimeframe(tf)}
                                  data-testid={`button-leaderboard-${tf}`}
                                >
                                  {tf === 'allTime' ? 'All Time' : tf.charAt(0).toUpperCase() + tf.slice(1)}
                                </Button>
                              ))}
                            </div>
                            
                            <div className="space-y-2">
                              {leaderboardData?.leaderboard?.slice(0, 5).map((user, idx) => (
                                <div 
                                  key={user.username} 
                                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                                  data-testid={`leaderboard-row-${idx}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 flex justify-center font-bold">
                                      {user.rank === 1 ? <Medal className="h-4 w-4 text-yellow-500" /> : 
                                       user.rank === 2 ? <Medal className="h-4 w-4 text-gray-400" /> : 
                                       user.rank === 3 ? <Medal className="h-4 w-4 text-amber-600" /> : 
                                       `#${user.rank}`}
                                    </span>
                                    <span className="font-medium">{user.username}</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-success font-bold">${user.profit.toLocaleString()}</div>
                                    <div className="text-xs text-muted-foreground">{user.winRate}% win</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {leaderboardData?.userRank && (
                              <div className="mt-4 pt-4 border-t">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-primary/10 border border-primary/30">
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 text-center font-bold">#{leaderboardData.userRank.rank}</span>
                                    <span className="font-medium">You</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-success font-bold">${leaderboardData.userRank.profit}</div>
                                    <div className="text-xs text-muted-foreground">{leaderboardData.userRank.winRate}% win</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {userStats && (
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5 text-primary" />
                                Your Badges
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-3 gap-2">
                                {userStats.badges.map((badge) => (
                                  <div 
                                    key={badge.id}
                                    className={`p-3 rounded-lg text-center transition-all ${
                                      badge.earned 
                                        ? 'bg-primary/10 border border-primary/30' 
                                        : 'bg-muted/50 opacity-50'
                                    }`}
                                    title={badge.name}
                                    data-testid={`badge-${badge.id}`}
                                  >
                                    <div className="flex justify-center mb-1">
                                      {badge.id === 'first_win' && <PartyPopper className="h-6 w-6 text-primary" />}
                                      {badge.id === 'week_streak' && <Flame className="h-6 w-6 text-orange-500" />}
                                      {badge.id === 'high_roller' && <TrendingUp className="h-6 w-6 text-success" />}
                                      {badge.id === 'parlay_master' && <Target className="h-6 w-6 text-primary" />}
                                      {badge.id === 'sharp_eye' && <Eye className="h-6 w-6 text-primary" />}
                                    </div>
                                    <div className="text-xs font-medium truncate">{badge.name}</div>
                                    {!badge.earned && badge.progress && (
                                      <Progress value={badge.progress} className="h-1 mt-1" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeMainTab === 'profits' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-3xl font-bold mb-2" data-testid="text-profits-title">
                        Profit Tracker
                      </h1>
                      <p className="text-muted-foreground">
                        See what you would have won following our picks
                      </p>
                    </div>

                    {profitData && (
                      <>
                        <Card className="bg-gradient-to-br from-success/20 to-primary/20 border-2 border-success">
                          <CardContent className="p-8 text-center">
                            <p className="text-lg text-muted-foreground mb-2">Potential Profit This Month</p>
                            <p className="text-5xl font-bold text-success mb-2" data-testid="text-total-profit">
                              ${profitData.summary.totalPotentialProfit.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Based on ${profitData.summary.avgBetAmount} bets on each pick
                            </p>
                          </CardContent>
                        </Card>

                        <div className="grid md:grid-cols-4 gap-4">
                          <Card>
                            <CardContent className="p-4 text-center">
                              <p className="text-sm text-muted-foreground">Total Picks</p>
                              <p className="text-2xl font-bold">{profitData.summary.totalPicksTracked}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <p className="text-sm text-muted-foreground">Wins</p>
                              <p className="text-2xl font-bold text-success">{profitData.summary.wins}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <p className="text-sm text-muted-foreground">Losses</p>
                              <p className="text-2xl font-bold text-destructive">{profitData.summary.losses}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <p className="text-sm text-muted-foreground">Win Rate</p>
                              <p className="text-2xl font-bold text-primary">{profitData.summary.winRate}%</p>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <Card>
                            <CardHeader>
                              <CardTitle>Recent Picks</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {profitData.recentPicks.map((pick, idx) => (
                                  <div 
                                    key={idx} 
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                    data-testid={`recent-pick-${idx}`}
                                  >
                                    <div>
                                      <p className="font-medium">{pick.selection}</p>
                                      <p className="text-sm text-muted-foreground">{pick.game}</p>
                                    </div>
                                    <div className="text-right">
                                      <Badge variant={pick.result === 'win' ? 'default' : 'destructive'}>
                                        {pick.result.toUpperCase()}
                                      </Badge>
                                      <p className={`text-sm font-bold mt-1 ${pick.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                                        {pick.profit >= 0 ? '+' : ''}${pick.profit}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle>Performance Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="flex justify-between p-3 rounded-lg bg-success/10">
                                <span>Best Day</span>
                                <span className="font-bold text-success">+${profitData.bestDay.profit}</span>
                              </div>
                              <div className="flex justify-between p-3 rounded-lg bg-destructive/10">
                                <span>Worst Day</span>
                                <span className="font-bold text-destructive">${profitData.worstDay.profit}</span>
                              </div>
                              <div className="flex justify-between p-3 rounded-lg bg-primary/10">
                                <span>Monthly ROI</span>
                                <span className="font-bold text-primary">{profitData.currentMonth.roi}%</span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <Card>
                          <CardContent className="p-4">
                            <Button className="w-full" size="lg" data-testid="button-share-results">
                              <Share2 className="h-4 w-4 mr-2" />
                              Share My Results
                            </Button>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>
                )}

                {activeMainTab === 'settings' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-3xl font-bold mb-2" data-testid="text-settings-title">
                        Settings
                      </h1>
                      <p className="text-muted-foreground">
                        Manage your account preferences and notifications
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Account
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
                            <div>
                              <p className="font-medium">Email Notifications</p>
                              <p className="text-sm text-muted-foreground">Receive daily pick summaries</p>
                            </div>
                            <Button variant="outline" size="sm">Enable</Button>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
                            <div>
                              <p className="font-medium">Push Notifications</p>
                              <p className="text-sm text-muted-foreground">Get alerts for high-value picks</p>
                            </div>
                            <Button variant="outline" size="sm">Enable</Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Alerts
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
                            <div>
                              <p className="font-medium">EV Threshold</p>
                              <p className="text-sm text-muted-foreground">Minimum +EV% to alert</p>
                            </div>
                            <Badge>+5%</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
                            <div>
                              <p className="font-medium">Sports Filter</p>
                              <p className="text-sm text-muted-foreground">Sports you want alerts for</p>
                            </div>
                            <Badge>All Sports</Badge>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Moon className="h-5 w-5" />
                            Appearance
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
                            <div>
                              <p className="font-medium">Theme</p>
                              <p className="text-sm text-muted-foreground">Toggle dark/light mode</p>
                            </div>
                            <ThemeToggle />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Subscription
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
                            <div>
                              <p className="font-medium">Current Plan</p>
                              <p className="text-sm text-muted-foreground">Free tier</p>
                            </div>
                            <Badge variant="secondary">Free</Badge>
                          </div>
                          <Button className="w-full" data-testid="button-upgrade-settings">
                            Upgrade to Pro
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                <footer className="mt-12 pt-6 border-t" data-testid="legal-disclaimer-footer">
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 text-warning">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-semibold">Responsible Gambling</span>
                    </div>
                    <div className="text-center text-sm text-muted-foreground space-y-2 max-w-2xl">
                      <p>
                        <strong>Legal Disclaimer:</strong> MVP is for entertainment and informational purposes only. 
                        This platform does NOT facilitate real money betting. All data shown is for analysis purposes.
                      </p>
                      <p>
                        Past performance does not guarantee future results. Sports betting involves significant risk. 
                        Never bet more than you can afford to lose. This is NOT financial advice.
                      </p>
                      <p>
                        If you or someone you know has a gambling problem, call <strong>1-800-GAMBLER</strong> for help.
                        Must be 21+ to participate in sports betting in most jurisdictions.
                      </p>
                    </div>
                  </div>
                </footer>
              </div>
            </ScrollArea>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
