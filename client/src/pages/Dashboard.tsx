import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import SportFilterBar from "@/components/SportFilterBar";
import ValuePickCard from "@/components/ValuePickCard";
import PaywallCard from "@/components/PaywallCard";
import OddsComparisonTable from "@/components/OddsComparisonTable";
import ParlayBuilder from "@/components/ParlayBuilder";
import TopPicksSection from "@/components/TopPicksSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Dashboard() {
  const style = {
    "--sidebar-width": "16rem",
  };

  const [selectedSport, setSelectedSport] = useState("all");

  // todo: remove mock functionality - Mock data for demonstration
  const mockPicks = [
    {
      id: '1',
      playerName: 'LeBron James',
      statType: 'Points',
      sport: 'NBA',
      book1: { name: 'FanDuel', line: 27.5 },
      book2: { name: 'PrizePicks', line: 29.5 },
      ev: 12.5,
      recommendation: 'OVER 27.5 @ FD',
      timestamp: '5 min ago',
    },
    {
      id: '2',
      playerName: 'Stephen Curry',
      statType: '3-Pointers',
      sport: 'NBA',
      book1: { name: 'DraftKings', line: 4.5 },
      book2: { name: 'Underdog', line: 5.5 },
      ev: 8.2,
      recommendation: 'UNDER 5.5 @ UD',
      timestamp: '12 min ago',
    },
    {
      id: '3',
      playerName: 'Patrick Mahomes',
      statType: 'Passing Yards',
      sport: 'NFL',
      book1: { name: 'BetMGM', line: 285.5 },
      book2: { name: 'FanDuel', line: 288.5 },
      ev: 5.7,
      recommendation: 'OVER 285.5 @ BetMGM',
      timestamp: '18 min ago',
    },
  ];

  const mockTopPicks = [
    {
      id: '1',
      rank: 1,
      player: 'LeBron James',
      stat: 'Points',
      sport: 'NBA',
      selection: 'OVER 27.5',
      ev: 18.2,
      confidence: 92,
      book: 'FanDuel',
      line: 27.5,
      reasoning: 'Matchup against bottom-5 defense. LeBron averaging 31.2 in last 5 games. Line 2 points below his season average.',
    },
    {
      id: '2',
      rank: 2,
      player: 'Patrick Mahomes',
      stat: 'Passing Yards',
      sport: 'NFL',
      selection: 'OVER 285.5',
      ev: 14.5,
      confidence: 87,
      book: 'BetMGM',
      line: 285.5,
      reasoning: 'Chiefs facing league-worst pass defense. Weather conditions favorable. Mahomes 8-2 on overs this season.',
    },
    {
      id: '3',
      rank: 3,
      player: 'Connor McDavid',
      stat: 'Points',
      sport: 'NHL',
      selection: 'OVER 1.5',
      ev: 11.8,
      confidence: 83,
      book: 'DraftKings',
      line: 1.5,
      reasoning: 'Hot streak with points in 12 straight games. Opponent allows 3.8 goals per game. Power play clicking at 28%.',
    },
  ];

  const mockOddsData = [
    {
      id: '1',
      player: 'LeBron James',
      stat: 'Points',
      sportsbooks: {
        FanDuel: { line: 27.5, trend: 'up' as const, isBest: true },
        DraftKings: { line: 28.0, trend: 'down' as const },
        BetMGM: { line: 28.5 },
        PrizePicks: { line: 29.0 },
      },
    },
    {
      id: '2',
      player: 'Stephen Curry',
      stat: 'Points',
      sportsbooks: {
        FanDuel: { line: 26.5 },
        DraftKings: { line: 26.0, isBest: true },
        BetMGM: { line: 27.0, trend: 'up' as const },
        PrizePicks: { line: 27.5 },
      },
    },
    {
      id: '3',
      player: 'Giannis Antetokounmpo',
      stat: 'Points',
      sportsbooks: {
        FanDuel: { line: 30.5, isBest: true },
        DraftKings: { line: 31.0 },
        BetMGM: { line: 31.5, trend: 'down' as const },
        PrizePicks: { line: 32.0 },
      },
    },
  ];

  const mockParlayLegs = [
    {
      id: '1',
      player: 'LeBron James',
      stat: 'Points',
      selection: 'OVER 27.5',
      odds: -110,
      book: 'FanDuel',
    },
    {
      id: '2',
      player: 'Stephen Curry',
      stat: '3-Pointers',
      selection: 'OVER 4.5',
      odds: 125,
      book: 'DraftKings',
    },
  ];

  const sportsbooks = ['FanDuel', 'DraftKings', 'BetMGM', 'PrizePicks'];

  const sports = [
    { id: 'all', label: 'All Sports', icon: '🏆' },
    { id: 'nba', label: 'NBA', icon: '🏀' },
    { id: 'nfl', label: 'NFL', icon: '🏈' },
    { id: 'mlb', label: 'MLB', icon: '⚾' },
    { id: 'nhl', label: 'NHL', icon: '🏒' },
    { id: 'soccer', label: 'Soccer', icon: '⚽' },
  ];

  // Filter picks by selected sport
  const filteredPicks = selectedSport === 'all' 
    ? mockPicks 
    : mockPicks.filter(pick => pick.sport.toLowerCase() === selectedSport);

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
                        <TopPicksSection picks={mockTopPicks} />

                        <SportFilterBar />

                        <div>
                          <h2 className="text-2xl font-bold mb-4">Value Picks</h2>
                          <div className="grid gap-6">
                            {filteredPicks.map((pick) => (
                              <ValuePickCard key={pick.id} pick={pick} />
                            ))}
                          </div>
                        </div>

                        <div>
                          <h2 className="text-2xl font-bold mb-4">Odds Comparison</h2>
                          <OddsComparisonTable data={mockOddsData} sportsbooks={sportsbooks} />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <ParlayBuilder legs={mockParlayLegs} />

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
