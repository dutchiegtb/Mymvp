import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import ValuePickCard from "@/components/ValuePickCard";
import OddsComparisonTable from "@/components/OddsComparisonTable";
import ParlayBuilder from "@/components/ParlayBuilder";
import TopPicksSection from "@/components/TopPicksSection";
import ThemeToggle from "@/components/ThemeToggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Activity, Loader2, TrendingUp, Search, ChevronDown, Dribbble, CircleDot, Hexagon, Disc, Target, MoreHorizontal } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SPORTS_BY_CATEGORY } from "@shared/schema";
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

const categoryIcons: Record<string, JSX.Element> = {
  basketball: <Dribbble className="h-4 w-4" />,
  football: <Hexagon className="h-4 w-4" />,
  baseball: <CircleDot className="h-4 w-4" />,
  hockey: <Disc className="h-4 w-4" />,
  soccer: <Target className="h-4 w-4" />,
};

const categoryLabels: Record<string, string> = {
  basketball: "Basketball",
  football: "Football",
  baseball: "Baseball",
  hockey: "Hockey",
  soccer: "Soccer",
};

export default function Dashboard() {
  const [selectedSport, setSelectedSport] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [parlayLegs, setParlayLegs] = useState<ParlayLeg[]>([]);
  const [activeTab, setActiveTab] = useState<"picks" | "top" | "parlay">("picks");

  // Fetch EV picks
  const { data: evPicksData, isLoading: evLoading } = useQuery<EVPicksResponse>({
    queryKey: ["/api/picks/ev", { sport: selectedSport }],
    queryFn: async () => {
      const res = await fetch(`/api/picks/ev?sport=${selectedSport}&minEV=3`);
      return res.json();
    },
    refetchInterval: 60000,
  });

  // Fetch top picks
  const { data: topPicksData, isLoading: topPicksLoading } = useQuery<TopPicksResponse>({
    queryKey: ["/api/picks/top", { sport: selectedSport }],
    queryFn: async () => {
      const res = await fetch(`/api/picks/top?sport=${selectedSport}&limit=10`);
      return res.json();
    },
    refetchInterval: 60000,
  });

  // Filter picks by search
  const filteredPicks = useMemo(() => {
    if (!evPicksData?.picks) return [];
    if (!searchQuery.trim()) return evPicksData.picks;
    const q = searchQuery.toLowerCase();
    return evPicksData.picks.filter(
      (p) =>
        p.game.toLowerCase().includes(q) ||
        p.selection.toLowerCase().includes(q) ||
        p.bestBook.toLowerCase().includes(q) ||
        p.sport.toLowerCase().includes(q)
    );
  }, [evPicksData?.picks, searchQuery]);

  const addToParlay = (pick: EVPick) => {
    if (parlayLegs.find((l) => l.id === pick.id)) return;
    setParlayLegs((prev) => [
      ...prev,
      {
        id: pick.id,
        player: pick.selection,
        stat: pick.market,
        selection: pick.game,
        odds: pick.bestOdds,
        book: pick.bestBook,
      },
    ]);
  };

  const removeFromParlay = (id: string) => {
    setParlayLegs((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold">MVP</span>
              </Link>

              <Badge variant="outline" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                {evPicksData?.total ?? 0} picks
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search picks..."
                  className="pl-9 w-64 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Sport Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={selectedSport === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSport("all")}
          >
            All Sports
          </Button>
          {Object.entries(SPORTS_BY_CATEGORY).map(([category, sports]) => (
            <DropdownMenu key={category}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={sports.some((s) => s.key === selectedSport) ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5"
                >
                  {categoryIcons[category] || <MoreHorizontal className="h-4 w-4" />}
                  {categoryLabels[category] || category}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {sports.map((sport) => (
                  <DropdownMenuItem
                    key={sport.key}
                    onClick={() => setSelectedSport(sport.key)}
                  >
                    {sport.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <TabsList>
            <TabsTrigger value="picks">EV Picks</TabsTrigger>
            <TabsTrigger value="top">Top Picks</TabsTrigger>
            <TabsTrigger value="parlay">
              Parlay Builder
              {parlayLegs.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {parlayLegs.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* EV Picks Tab */}
          <TabsContent value="picks" className="space-y-4">
            {evLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Scanning sportsbooks...</span>
              </div>
            ) : filteredPicks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Picks Found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "Try adjusting your search query"
                      : "No EV opportunities detected right now. Check back soon!"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredPicks.length} picks · Last updated{" "}
                    {evPicksData?.lastUpdated
                      ? new Date(evPicksData.lastUpdated).toLocaleTimeString()
                      : "—"}
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredPicks.map((pick) => (
                    <ValuePickCard
                      key={pick.id}
                      pick={pick}
                      onAddToParlay={() => addToParlay(pick)}
                      isInParlay={parlayLegs.some((l) => l.id === pick.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Top Picks Tab */}
          <TabsContent value="top">
            <TopPicksSection
              picks={topPicksData?.picks || []}
              isLoading={topPicksLoading}
              onAddToParlay={addToParlay}
              parlayIds={parlayLegs.map((l) => l.id)}
            />
          </TabsContent>

          {/* Parlay Builder Tab */}
          <TabsContent value="parlay">
            <ParlayBuilder
              legs={parlayLegs}
              onRemoveLeg={removeFromParlay}
              onClearAll={() => setParlayLegs([])}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
