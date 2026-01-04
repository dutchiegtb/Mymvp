import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Activity, Loader2, Trophy, Users, TrendingUp, Flame, Star, Heart, MessageCircle, Share2, Target, Award, Zap, Medal, Dribbble, CircleDot, Hexagon, Disc, PartyPopper, Eye, AlertTriangle, Settings, Bell, Moon, User, Shield, Phone, BarChart3, Info, Search, ChevronDown, ExternalLink, Gamepad2, Swords, Circle, Crown } from "lucide-react";
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

interface UserStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: { current: number; longest: number; rewardAt: number };
  stats: { totalHits: number; totalMisses: number; hitRate: number; totalHypotheticalGain: number };
  badges: { id: string; name: string; icon: string; earned: boolean; earnedAt?: string; progress?: number }[];
  achievements: { name: string; progress: number; total: number; reward: string }[];
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  hitRate: number;
  hypotheticalGain: number;
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

interface SimulatorData {
  summary: {
    totalHypotheticalGain: number;
    totalPicksTracked: number;
    hits: number;
    misses: number;
    hitRate: number;
    avgBetAmount: number;
  };
  bestDay: { date: string; hypotheticalGain: number; picks: number };
  worstDay: { date: string; hypotheticalGain: number; picks: number };
  currentMonth: { hypotheticalGain: number; hits: number; misses: number; roi: number };
  recentPicks: { date: string; game: string; selection: string; result: string; hypotheticalGain: number }[];
  chartData: { date: string; hypotheticalGain: number; cumulative: number }[];
}

interface PolymarketMarket {
  id: string;
  question: string;
  description?: string;
  outcomes: { name: string; price: number }[];
  volume: number;
  liquidity?: number;
  endDate?: string;
  category?: string;
  url: string;
}

interface PolymarketResponse {
  markets: PolymarketMarket[];
  total: number;
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

const categoryIcons: Record<string, JSX.Element> = {
  basketball: <Dribbble className="h-4 w-4" />,
  football: <Hexagon className="h-4 w-4" />,
  baseball: <CircleDot className="h-4 w-4" />,
  hockey: <Disc className="h-4 w-4" />,
  soccer: <Target className="h-4 w-4" />,
  combat: <Swords className="h-4 w-4" />,
  tennis: <Circle className="h-4 w-4" />,
  golf: <Circle className="h-4 w-4" />,
  esports: <Gamepad2 className="h-4 w-4" />,
  other: <Trophy className="h-4 w-4" />,
};

const categoryLabels: Record<string, string> = {
  basketball: "Basketball",
  football: "Football",
  baseball: "Baseball",
  hockey: "Hockey",
  soccer: "Soccer",
  combat: "Combat",
  tennis: "Tennis",
  golf: "Golf",
  esports: "Esports",
  other: "Other",
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

function AgeGateModal({ open, onComplete }: { open: boolean; onComplete: () => void }) {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const canProceed = ageConfirmed && disclaimerAccepted;

  const handleProceed = () => {
    if (canProceed) {
      localStorage.setItem('mvp_onboarded', 'true');
      onComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg border-2 border-[#00FF7F]/50 bg-background" data-testid="age-gate-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-6 w-6 text-[#00FF7F]" />
            <span>Welcome to MVP</span>
          </DialogTitle>
          <DialogDescription className="text-base">
            Before accessing the dashboard, please confirm the following:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-3 p-4 rounded-lg border border-[#00FF7F]/30 bg-[#00FF7F]/5">
            <Checkbox
              id="age-confirm"
              checked={ageConfirmed}
              onCheckedChange={(checked) => setAgeConfirmed(checked as boolean)}
              className="mt-0.5 border-[#00FF7F] data-[state=checked]:bg-[#00FF7F] data-[state=checked]:border-[#00FF7F]"
              data-testid="checkbox-age-confirm"
            />
            <label htmlFor="age-confirm" className="text-sm font-medium cursor-pointer">
              I am 21 years of age or older
            </label>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg border border-[#00FF7F]/30 bg-[#00FF7F]/5">
            <Checkbox
              id="disclaimer-accept"
              checked={disclaimerAccepted}
              onCheckedChange={(checked) => setDisclaimerAccepted(checked as boolean)}
              className="mt-0.5 border-[#00FF7F] data-[state=checked]:bg-[#00FF7F] data-[state=checked]:border-[#00FF7F]"
              data-testid="checkbox-disclaimer-accept"
            />
            <div className="space-y-2">
              <label htmlFor="disclaimer-accept" className="text-sm font-medium cursor-pointer">
                I understand and accept the following:
              </label>
              <ul className="text-sm text-muted-foreground space-y-1.5 ml-2">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                  <span>MVP does NOT accept bets, wagers, or hold any funds</span>
                </li>
                <li className="flex items-start gap-2">
                  <BarChart3 className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                  <span>All performance tracking shows hypothetical results only</span>
                </li>
                <li className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                  <span>Confidence scores reflect model strength, not outcome certainty</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                  <span>This platform is for entertainment and informational purposes only</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={handleProceed} 
            disabled={!canProceed}
            className="w-full bg-[#00FF7F] hover:bg-[#00FF7F]/80 text-black font-semibold"
            data-testid="button-proceed"
          >
            Enter Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const SPORTSBOOK_OPTIONS = [
  { id: 'draftkings', name: 'DraftKings', color: '#00C06B' },
  { id: 'fanduel', name: 'FanDuel', color: '#1493FF' },
  { id: 'betmgm', name: 'BetMGM', color: '#BFA868' },
  { id: 'caesars', name: 'Caesars', color: '#0A3F24' },
  { id: 'pointsbet', name: 'PointsBet', color: '#ED1C24' },
  { id: 'bet365', name: 'Bet365', color: '#027B5B' },
  { id: 'barstool', name: 'ESPN BET', color: '#FFCC00' },
  { id: 'betrivers', name: 'BetRivers', color: '#FF6B00' },
  { id: 'unibet', name: 'Unibet', color: '#14805E' },
  { id: 'hard_rock', name: 'Hard Rock Bet', color: '#000000' },
  { id: 'prizepicks', name: 'PrizePicks', color: '#8B5CF6' },
  { id: 'underdog', name: 'Underdog', color: '#FF4500' },
  { id: 'sleeper', name: 'Sleeper', color: '#1A1A2E' },
  { id: 'other', name: 'Other', color: '#666666' },
];

function OnboardingTutorial({ open, onComplete }: { open: boolean; onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [selectedSportsbooks, setSelectedSportsbooks] = useState<string[]>([]);
  
  const toggleSportsbook = (id: string) => {
    setSelectedSportsbooks(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const saveSportsbookPreferences = async () => {
    if (selectedSportsbooks.length > 0) {
      try {
        const token = localStorage.getItem('mvp_token');
        await fetch('/api/user/sportsbook-preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ sportsbooks: selectedSportsbooks }),
        });
      } catch (error) {
        console.error('Failed to save sportsbook preferences:', error);
      }
    }
  };
  
  const steps = [
    {
      title: "Welcome to MVP!",
      icon: <Trophy className="h-12 w-12 text-[#00FF7F]" />,
      description: "Your edge in sports betting starts here. MVP scans 30+ sportsbooks in real-time to find +EV (positive expected value) betting opportunities.",
      details: [
        "Compare odds across all major sportsbooks instantly",
        "Identify value picks with our proprietary EV algorithm",
        "Build smarter parlays with calculated risk metrics",
      ],
      type: 'info' as const,
    },
    {
      title: "Which sportsbooks do you use?",
      icon: <Award className="h-12 w-12 text-[#FFCC00]" />,
      description: "Help us personalize your experience. Select all the sportsbooks where you have accounts.",
      details: [],
      type: 'sportsbooks' as const,
    },
    {
      title: "Picks Tab",
      icon: <Target className="h-12 w-12 text-primary" />,
      description: "Browse value picks sorted by expected value. Each pick shows the best book, odds comparison, and EV percentage.",
      details: [
        "Click any pick to add it to your parlay builder",
        "Filter by sport to focus on what you know",
        "Higher EV% means more potential value",
      ],
      type: 'info' as const,
    },
    {
      title: "Polymarket Tab",
      icon: <TrendingUp className="h-12 w-12 text-[#00CFFF]" />,
      description: "Explore prediction markets beyond traditional sports betting. Track markets on politics, economics, entertainment, and more.",
      details: [
        "See real-time prices and trading volume",
        "Track market sentiment on current events",
        "Quick links to trade on Polymarket",
      ],
      type: 'info' as const,
    },
    {
      title: "Social & Gamification",
      icon: <Users className="h-12 w-12 text-warning" />,
      description: "Join our community of sharp bettors. Earn badges, track your streak, and compete on the leaderboard.",
      details: [
        "Earn XP and level up by tracking picks",
        "Build daily streaks for bonus rewards",
        "See what winning bettors are tracking",
      ],
      type: 'info' as const,
    },
    {
      title: "You're Ready!",
      icon: <PartyPopper className="h-12 w-12 text-[#00FF7F]" />,
      description: "You're all set to find value. Remember: MVP is for entertainment and education only. Always bet responsibly.",
      details: [
        "Start exploring today's top picks",
        "Check back often - odds update in real-time",
        "Good luck and have fun!",
      ],
      type: 'info' as const,
    },
  ];

  const handleNext = async () => {
    if (step === 1) {
      await saveSportsbookPreferences();
    }
    
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem('mvp_tutorial_complete', 'true');
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('mvp_tutorial_complete', 'true');
    onComplete();
  };

  const currentStep = steps[step];

  const handleDismiss = (open: boolean) => {
    if (!open) {
      localStorage.setItem('mvp_tutorial_complete', 'true');
      onComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-md border-2 border-primary/50 bg-background" data-testid="onboarding-modal">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            {currentStep.icon}
          </div>
          <DialogTitle className="text-2xl font-bold">
            {currentStep.title}
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            {currentStep.description}
          </DialogDescription>
        </DialogHeader>
        
        {currentStep.type === 'sportsbooks' ? (
          <div className="py-4">
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {SPORTSBOOK_OPTIONS.map((book) => (
                <button
                  key={book.id}
                  onClick={() => toggleSportsbook(book.id)}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                    selectedSportsbooks.includes(book.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                  }`}
                  data-testid={`sportsbook-${book.id}`}
                >
                  <div 
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: book.color }}
                  />
                  <span className="text-sm font-medium truncate">{book.name}</span>
                  {selectedSportsbooks.includes(book.id) && (
                    <div className="ml-auto text-primary">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            {selectedSportsbooks.length > 0 && (
              <p className="text-sm text-muted-foreground mt-3 text-center">
                {selectedSportsbooks.length} sportsbook{selectedSportsbooks.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3 py-4">
            {currentStep.details.map((detail, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {idx + 1}
                </div>
                <span className="text-sm">{detail}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center gap-1.5 py-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === step ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
              data-testid={`tutorial-dot-${idx}`}
            />
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button 
            onClick={handleNext}
            className="w-full bg-[#00FF7F] hover:bg-[#00FF7F]/80 text-black font-semibold"
            data-testid="button-tutorial-next"
          >
            {step === steps.length - 1 ? "Get Started" : step === 1 ? (selectedSportsbooks.length > 0 ? "Continue" : "Skip This Step") : "Next"}
          </Button>
          {step < steps.length - 1 && (
            <Button 
              variant="ghost"
              onClick={handleSkip}
              className="w-full"
              data-testid="button-tutorial-skip"
            >
              Skip Tutorial
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Dashboard() {
  const style = {
    "--sidebar-width": "16rem",
  };

  const [showAgeGate, setShowAgeGate] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [selectedSport, setSelectedSport] = useState("all");
  const [activeMainTab, setActiveMainTab] = useState<'picks' | 'polymarket' | 'social' | 'simulator' | 'settings'>('picks');
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState('weekly');
  const [parlayLegs, setParlayLegs] = useState<ParlayLeg[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: currentUser } = useQuery<{
    id: number;
    email: string;
    username?: string;
    subscriptionTier: string;
    isAdmin?: boolean;
  }>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const token = localStorage.getItem('mvp_token');
      if (!token) return null;
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  const userTier = currentUser?.subscriptionTier === 'premium' ? 'tier2' 
    : currentUser?.subscriptionTier === 'elite' ? 'tier3'
    : currentUser?.subscriptionTier === 'web' ? 'tier1'
    : 'free';
  const isAdmin = currentUser?.isAdmin || false;

  useEffect(() => {
    const onboarded = localStorage.getItem('mvp_onboarded');
    if (!onboarded) {
      setShowAgeGate(true);
    } else {
      const tutorialComplete = localStorage.getItem('mvp_tutorial_complete');
      if (!tutorialComplete) {
        setShowTutorial(true);
      }
    }
  }, []);

  const handleAgeGateComplete = () => {
    setShowAgeGate(false);
    const tutorialComplete = localStorage.getItem('mvp_tutorial_complete');
    if (!tutorialComplete) {
      setShowTutorial(true);
    }
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
  };

  const sportApiKey = sportKeyMap[selectedSport] || selectedSport;

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

  const { data: polymarketData, isLoading: polymarketLoading } = useQuery<PolymarketResponse>({
    queryKey: ['/api/polymarket/markets'],
    queryFn: async () => {
      const res = await fetch('/api/polymarket/markets');
      if (!res.ok) throw new Error('Failed to fetch Polymarket data');
      return res.json();
    },
    refetchInterval: 120000,
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

  const { data: simulatorData } = useQuery<SimulatorData>({
    queryKey: ['/api/user/performance-simulator'],
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

  const filteredPicks = useMemo(() => {
    if (!debouncedSearch.trim()) return evPicks;
    
    const searchLower = debouncedSearch.toLowerCase();
    return evPicks.filter(pick => 
      pick.game.toLowerCase().includes(searchLower) ||
      pick.selection.toLowerCase().includes(searchLower) ||
      pick.market.toLowerCase().includes(searchLower) ||
      pick.sport.toLowerCase().includes(searchLower) ||
      pick.bestBook.toLowerCase().includes(searchLower)
    );
  }, [evPicks, debouncedSearch]);

  const valuePicks = filteredPicks.map(pick => ({
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

  const mockOddsData = filteredPicks.slice(0, 5).map(pick => ({
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
    if (tab === 'picks' || tab === 'polymarket' || tab === 'social' || tab === 'simulator' || tab === 'settings') {
      setActiveMainTab(tab);
    }
  };

  const handleSportSelect = useCallback((sportKey: string) => {
    setSelectedSport(sportKey);
  }, []);

  return (
    <>
      <AgeGateModal open={showAgeGate} onComplete={handleAgeGateComplete} />
      <OnboardingTutorial open={showTutorial} onComplete={handleTutorialComplete} />
      
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar userTier={userTier as any} isAdmin={isAdmin} onTabChange={handleSidebarTabChange} activeTab={activeMainTab} />
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

              <div className="flex-1 max-w-md mx-4 hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search picks by game, player, team..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4"
                    data-testid="input-search"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      data-testid="button-clear-search"
                    >
                      x
                    </button>
                  )}
                </div>
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
                onClick={() => setActiveMainTab('polymarket')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeMainTab === 'polymarket' 
                    ? 'border-primary text-primary font-semibold' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                data-testid="tab-main-polymarket"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Polymarket</span>
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
                onClick={() => setActiveMainTab('simulator')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeMainTab === 'simulator' 
                    ? 'border-primary text-primary font-semibold' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                data-testid="tab-main-simulator"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Simulator</span>
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

                      <div className="md:hidden mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Search picks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4"
                            data-testid="input-search-mobile"
                          />
                        </div>
                      </div>

                      <div className="overflow-x-auto pb-2">
                        <div className="flex items-center gap-2 min-w-max">
                          <Button
                            variant={selectedSport === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleSportSelect('all')}
                            className="gap-2"
                            data-testid="button-sport-all"
                          >
                            <Trophy className="h-4 w-4" />
                            All Sports
                          </Button>
                          
                          {Object.entries(SPORTS_BY_CATEGORY).map(([category, sports]) => (
                            <DropdownMenu key={category}>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant={sports.some(s => s.key === selectedSport) ? 'default' : 'outline'}
                                  size="sm"
                                  className="gap-2"
                                  data-testid={`dropdown-category-${category}`}
                                >
                                  {categoryIcons[category]}
                                  {categoryLabels[category]}
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" data-testid={`dropdown-content-${category}`}>
                                {sports.map((sport) => (
                                  <DropdownMenuItem
                                    key={sport.key}
                                    onClick={() => handleSportSelect(sport.key)}
                                    className={selectedSport === sport.key ? 'bg-primary/10' : ''}
                                    data-testid={`menu-item-${sport.key}`}
                                  >
                                    {sport.name}
                                    {selectedSport === sport.key && (
                                      <Badge variant="secondary" className="ml-2 text-xs">Active</Badge>
                                    )}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ))}
                        </div>
                      </div>

                      {debouncedSearch && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-normal">
                            Search: "{debouncedSearch}"
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {filteredPicks.length} result{filteredPicks.length !== 1 ? 's' : ''}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSearchQuery("")}
                            data-testid="button-clear-search-badge"
                          >
                            Clear
                          </Button>
                        </div>
                      )}

                      <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                          {!debouncedSearch && (
                            topPicksLoading ? (
                              <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                              </div>
                            ) : (
                              <TopPicksSection picks={topPicks.slice(0, 3)} />
                            )
                          )}

                          <div>
                            <div className="flex items-center justify-between gap-2 mb-4">
                              <h2 className="text-2xl font-bold">Value Picks</h2>
                              <Badge variant="outline" className="font-mono">
                                {filteredPicks.length} picks found
                              </Badge>
                            </div>
                            {evLoading ? (
                              <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                              </div>
                            ) : valuePicks.length === 0 ? (
                              <div className="text-center py-12 text-muted-foreground">
                                {debouncedSearch ? (
                                  <>
                                    <p>No picks found matching "{debouncedSearch}"</p>
                                    <p className="text-sm mt-2">Try a different search term</p>
                                  </>
                                ) : (
                                  <>
                                    <p>No value picks found for {selectedSport === 'all' ? 'any sport' : selectedSport}</p>
                                    <p className="text-sm mt-2">Check back when games are live!</p>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="grid gap-6">
                                {valuePicks.map((pick, index) => (
                                  <div key={pick.id} onClick={() => handleAddToParlay(filteredPicks[index])} className="cursor-pointer">
                                    <ValuePickCard pick={pick} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {mockOddsData.length > 0 && !debouncedSearch && (
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
                    </>
                  )}

                  {activeMainTab === 'polymarket' && (
                    <div className="space-y-6">
                      <div>
                        <h1 className="text-3xl font-bold mb-2" data-testid="text-polymarket-title">
                          Prediction Markets
                        </h1>
                        <p className="text-muted-foreground">
                          Real-time prediction markets from Polymarket
                        </p>
                      </div>

                      {polymarketLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : !polymarketData?.markets?.length ? (
                        <Card className="p-8 text-center">
                          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="text-lg font-semibold mb-2">No Markets Available</h3>
                          <p className="text-muted-foreground">
                            Prediction markets will appear here once data is available.
                          </p>
                        </Card>
                      ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {polymarketData.markets.map((market) => (
                            <Card key={market.id} className="hover-elevate" data-testid={`polymarket-card-${market.id}`}>
                              <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-2">
                                  <CardTitle className="text-base font-medium line-clamp-2">
                                    {market.question}
                                  </CardTitle>
                                  {market.category && (
                                    <Badge variant="secondary" className="shrink-0 text-xs">
                                      {market.category}
                                    </Badge>
                                  )}
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="space-y-2">
                                  {market.outcomes.slice(0, 2).map((outcome, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                      <span className="text-sm font-medium">{outcome.name}</span>
                                      <span className={`text-sm font-bold ${
                                        outcome.price > 0.5 ? 'text-success' : 'text-muted-foreground'
                                      }`}>
                                        {(outcome.price * 100).toFixed(0)}%
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                  <span>Volume: ${market.volume.toLocaleString()}</span>
                                  {market.endDate && (
                                    <span>Ends: {new Date(market.endDate).toLocaleDateString()}</span>
                                  )}
                                </div>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full gap-2"
                                  onClick={() => window.open(market.url, '_blank')}
                                  data-testid={`button-polymarket-${market.id}`}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  View on Polymarket
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeMainTab === 'social' && (
                    <div className="space-y-6">
                      <div>
                        <h1 className="text-3xl font-bold mb-2" data-testid="text-social-title">
                          Community
                        </h1>
                        <p className="text-muted-foreground">
                          See what top users are tracking
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
                                  
                                  {post.action === 'parlay_hit' && (
                                    <Badge className="bg-success text-success-foreground">Parlay Hit</Badge>
                                  )}
                                  {post.action === 'model_hit' && (
                                    <Badge className="bg-primary">Model Hit</Badge>
                                  )}
                                  {post.action === 'streak_milestone' && (
                                    <Badge className="bg-orange-500">Streak</Badge>
                                  )}
                                </div>
                                
                                <p className="mt-3 text-foreground">{post.content}</p>
                                
                                {post.metadata.hypotheticalGain && (
                                  <div className="mt-2 p-2 bg-success/10 rounded-lg inline-block">
                                    <span className="text-success font-bold">+${post.metadata.hypotheticalGain} (hypothetical)</span>
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
                                      <div className="text-success font-bold">${user.hypotheticalGain?.toLocaleString() ?? 0}</div>
                                      <div className="text-xs text-muted-foreground">{user.hitRate}% hit rate</div>
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
                                      <div className="text-success font-bold">${leaderboardData.userRank.hypotheticalGain ?? 0}</div>
                                      <div className="text-xs text-muted-foreground">{leaderboardData.userRank.hitRate}% hit rate</div>
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

                  {activeMainTab === 'simulator' && (
                    <div className="space-y-6">
                      <div>
                        <h1 className="text-3xl font-bold mb-2" data-testid="text-simulator-title">
                          Performance Simulator
                        </h1>
                        <p className="text-muted-foreground">
                          Track hypothetical results based on our model picks
                        </p>
                      </div>

                      <Card className="bg-yellow-500/10 border-yellow-500/50">
                        <CardContent className="p-4 flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
                          <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                            Simulation Only: All results shown are hypothetical. MVP does not accept bets or hold funds. Past simulated performance does not guarantee future results.
                          </p>
                        </CardContent>
                      </Card>

                      {simulatorData && (
                        <>
                          <Card className="bg-gradient-to-br from-success/20 to-primary/20 border-2 border-success">
                            <CardContent className="p-8 text-center">
                              <p className="text-lg text-muted-foreground mb-2">Hypothetical Gain This Month</p>
                              <p className="text-5xl font-bold text-success mb-2" data-testid="text-total-hypothetical-gain">
                                ${simulatorData.summary.totalHypotheticalGain.toLocaleString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Based on simulated ${simulatorData.summary.avgBetAmount} bets on each pick
                              </p>
                              <Badge variant="outline" className="mt-2 text-yellow-500 border-yellow-500">
                                Hypothetical Results Only
                              </Badge>
                            </CardContent>
                          </Card>

                          <div className="grid md:grid-cols-4 gap-4">
                            <Card>
                              <CardContent className="p-4 text-center">
                                <p className="text-sm text-muted-foreground">Total Picks</p>
                                <p className="text-2xl font-bold">{simulatorData.summary.totalPicksTracked}</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4 text-center">
                                <p className="text-sm text-muted-foreground">Hits</p>
                                <p className="text-2xl font-bold text-success">{simulatorData.summary.hits}</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4 text-center">
                                <p className="text-sm text-muted-foreground">Misses</p>
                                <p className="text-2xl font-bold text-destructive">{simulatorData.summary.misses}</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4 text-center">
                                <p className="text-sm text-muted-foreground">Hit Rate</p>
                                <p className="text-2xl font-bold text-primary">{simulatorData.summary.hitRate}%</p>
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
                                  {simulatorData.recentPicks.map((pick, idx) => (
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
                                        <Badge variant={pick.result === 'hit' ? 'default' : 'destructive'}>
                                          {pick.result === 'hit' ? 'HIT' : 'MISS'}
                                        </Badge>
                                        <p className={`text-sm font-bold mt-1 ${pick.hypotheticalGain >= 0 ? 'text-success' : 'text-destructive'}`}>
                                          {pick.hypotheticalGain >= 0 ? '+' : ''}${pick.hypotheticalGain} (simulated)
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
                                  <span>Best Day (Simulated)</span>
                                  <span className="font-bold text-success">+${simulatorData.bestDay.hypotheticalGain}</span>
                                </div>
                                <div className="flex justify-between p-3 rounded-lg bg-destructive/10">
                                  <span>Worst Day (Simulated)</span>
                                  <span className="font-bold text-destructive">${simulatorData.worstDay.hypotheticalGain}</span>
                                </div>
                                <div className="flex justify-between p-3 rounded-lg bg-primary/10">
                                  <span>Monthly ROI (Simulated)</span>
                                  <span className="font-bold text-primary">{simulatorData.currentMonth.roi}%</span>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          <Card>
                            <CardContent className="p-4">
                              <Button className="w-full" size="lg" data-testid="button-share-results">
                                <Share2 className="h-4 w-4 mr-2" />
                                Share My Simulated Results
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
                            <div className="pt-2 border-t">
                              <Link href="/ambassador">
                                <Button variant="outline" className="w-full border-amber-500/50 text-amber-400 hover:bg-amber-500/10" data-testid="button-become-ambassador">
                                  <Crown className="h-4 w-4 mr-2" />
                                  Become Ambassador - $749
                                </Button>
                              </Link>
                              <p className="text-xs text-muted-foreground text-center mt-2">
                                Lifetime Elite + 20% recurring commission
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="md:col-span-2">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Phone className="h-5 w-5" />
                              Connected Apps
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-[#5865F2]/20 flex items-center justify-center">
                                    <span className="text-[#5865F2] font-bold">D</span>
                                  </div>
                                  <div>
                                    <p className="font-medium">Discord</p>
                                    <p className="text-sm text-muted-foreground">Not connected</p>
                                  </div>
                                </div>
                                <Button variant="outline" size="sm" data-testid="button-connect-discord">Connect</Button>
                              </div>
                              <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-[#0088cc]/20 flex items-center justify-center">
                                    <span className="text-[#0088cc] font-bold">T</span>
                                  </div>
                                  <div>
                                    <p className="font-medium">Telegram</p>
                                    <p className="text-sm text-muted-foreground">Not connected</p>
                                  </div>
                                </div>
                                <Button variant="outline" size="sm" data-testid="button-connect-telegram">Connect</Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                </div>
              </ScrollArea>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
}
