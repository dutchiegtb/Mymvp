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
import { Activity, Loader2 } from "lucide-react";
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
  const [parlayLegs, setParlayLegs] = useState<ParlayLeg[]>([]);

  const sportApiKey = sportKeyMap[selectedSport] || 'all';

  const { data: evPicksData, isLoading: evLoading } = useQuery<EVPicksResponse>({
    queryKey: ['/api/picks/ev', sportApiKey],
    refetchInterval: 60000,
  });

  const { data: topPicksData, isLoading: topPicksLoading } = useQuery<TopPicksResponse>({
    queryKey: ['/api/picks/top', sportApiKey],
    refetchInterval: 60000,
  });

  const sports = [
    { id: 'all', label: 'All Sports', icon: '🏆' },
    { id: 'nba', label: 'NBA', icon: '🏀' },
    { id: 'nfl', label: 'NFL', icon: '🏈' },
    { id: 'mlb', label: 'MLB', icon: '⚾' },
    { id: 'nhl', label: 'NHL', icon: '🏒' },
    { id: 'soccer', label: 'Soccer', icon: '⚽' },
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

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar userTier="free" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 p-4 border-b">
            <div className="flex items-center gap-4">
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
            <ThemeToggle />
          </header>

          <main className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="max-w-7xl mx-auto p-6 space-y-6">
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
                        <span>{sport.icon}</span>
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
                          <div className="flex items-center justify-between mb-4">
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
              </div>
            </ScrollArea>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
