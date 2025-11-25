import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import SportFilterBar from "@/components/SportFilterBar";
import ValuePickCard from "@/components/ValuePickCard";
import PaywallCard from "@/components/PaywallCard";
import OddsComparisonTable from "@/components/OddsComparisonTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

export default function Dashboard() {
  const style = {
    "--sidebar-width": "16rem",
  };

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

  const sportsbooks = ['FanDuel', 'DraftKings', 'BetMGM', 'PrizePicks'];

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

          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Top Value Picks Today</h1>
                <p className="text-muted-foreground">
                  Real-time odds analysis across all major sportsbooks
                </p>
              </div>

              <SportFilterBar />

              <Tabs defaultValue="picks" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="picks" data-testid="tab-picks">Value Picks</TabsTrigger>
                  <TabsTrigger value="comparison" data-testid="tab-comparison">Odds Comparison</TabsTrigger>
                  <TabsTrigger value="sharp" data-testid="tab-sharp">
                    <span>Sharp Picks</span>
                    <Badge className="ml-2 bg-warning text-warning-foreground no-default-hover-elevate no-default-active-elevate">Pro</Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="picks" className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {mockPicks.map((pick) => (
                      <ValuePickCard key={pick.id} pick={pick} />
                    ))}
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <PaywallCard
                      tierName="Pro"
                      price="$9.99/mo"
                      benefits={[
                        'All props & live data',
                        'EV rankings',
                        'Custom book filters',
                      ]}
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
                </TabsContent>

                <TabsContent value="comparison" className="space-y-4">
                  <OddsComparisonTable data={mockOddsData} sportsbooks={sportsbooks} />
                </TabsContent>

                <TabsContent value="sharp" className="space-y-4">
                  <PaywallCard
                    tierName="Premium"
                    price="$24.99/mo"
                    benefits={[
                      'Sharp picks from professionals',
                      'Advanced analytics',
                      'Priority support',
                    ]}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
