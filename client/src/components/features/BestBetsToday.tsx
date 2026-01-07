import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, TrendingUp, Star, Zap } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { getFeatureAccessLevel, getPreviewLimit, type FeatureAccessLevel } from "@/lib/features";

interface BestBet {
  id: string;
  game: string;
  pick: string;
  evPercent: number;
  confidence: number;
  reasoning: string;
  sport: string;
  bestBook: string;
}

const MOCK_BETS: BestBet[] = [
  {
    id: "1",
    game: "Lakers vs Celtics",
    pick: "Lakers +4.5",
    evPercent: 8.2,
    confidence: 85,
    reasoning: "Sharp money on Lakers, line moved from +6 to +4.5",
    sport: "NBA",
    bestBook: "DraftKings",
  },
  {
    id: "2",
    game: "Chiefs vs Bills",
    pick: "Over 48.5",
    evPercent: 6.5,
    confidence: 78,
    reasoning: "Both teams averaging 30+ points in last 5 games",
    sport: "NFL",
    bestBook: "FanDuel",
  },
  {
    id: "3",
    game: "Yankees vs Red Sox",
    pick: "Yankees ML",
    evPercent: 5.8,
    confidence: 72,
    reasoning: "Ace pitcher starting, strong recent record vs opponent",
    sport: "MLB",
    bestBook: "BetMGM",
  },
  {
    id: "4",
    game: "Bruins vs Rangers",
    pick: "Under 5.5",
    evPercent: 4.9,
    confidence: 68,
    reasoning: "Both goalies hot, defensive matchup favors under",
    sport: "NHL",
    bestBook: "Caesars",
  },
  {
    id: "5",
    game: "Warriors vs Suns",
    pick: "Suns -2.5",
    evPercent: 4.2,
    confidence: 65,
    reasoning: "Home court advantage, Warriors missing key player",
    sport: "NBA",
    bestBook: "DraftKings",
  },
  {
    id: "6",
    game: "Eagles vs Cowboys",
    pick: "Eagles -3",
    evPercent: 3.8,
    confidence: 62,
    reasoning: "Strong divisional record, Cowboys struggling on road",
    sport: "NFL",
    bestBook: "BetRivers",
  },
];

function getEVColor(ev: number): string {
  if (ev >= 6) return "text-[#00FF7F]";
  if (ev >= 4) return "text-[#FFCC00]";
  return "text-muted-foreground";
}

function getConfidenceBadgeVariant(confidence: number): "default" | "secondary" | "outline" {
  if (confidence >= 80) return "default";
  if (confidence >= 65) return "secondary";
  return "outline";
}

interface BetCardProps {
  bet: BestBet;
  isLocked: boolean;
  index: number;
}

function BetCard({ bet, isLocked, index }: BetCardProps) {
  if (isLocked) {
    return (
      <div 
        className="relative p-4 rounded-lg border border-muted bg-muted/30 overflow-hidden"
        data-testid={`bet-card-locked-${index}`}
      >
        <div className="absolute inset-0 backdrop-blur-sm bg-background/60 z-10 flex flex-col items-center justify-center gap-2">
          <Lock className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-medium">Premium Feature</span>
        </div>
        <div className="opacity-30">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline">{bet.sport}</Badge>
            <span className="text-lg font-mono font-bold">+?.?%</span>
          </div>
          <p className="font-semibold">{bet.game}</p>
          <p className="text-sm text-muted-foreground">Pick hidden</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="p-4 rounded-lg border border-muted bg-card hover-elevate transition-all"
      data-testid={`bet-card-${bet.id}`}
    >
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">{bet.sport}</Badge>
          <Badge variant="outline" className="text-xs">{bet.bestBook}</Badge>
        </div>
        <span className={`text-lg font-mono font-bold ${getEVColor(bet.evPercent)}`}>
          +{bet.evPercent.toFixed(1)}% EV
        </span>
      </div>
      
      <p className="font-semibold text-foreground mb-1">{bet.game}</p>
      
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-4 w-4 text-[#00FF7F]" />
        <span className="font-mono font-semibold text-[#00CFFF]">{bet.pick}</span>
      </div>
      
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <Badge variant={getConfidenceBadgeVariant(bet.confidence)}>
          {bet.confidence}% Confidence
        </Badge>
        {bet.confidence >= 80 && (
          <div className="flex items-center gap-1 text-[#FFCC00]">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-xs font-semibold">Top Pick</span>
          </div>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground">{bet.reasoning}</p>
    </div>
  );
}

export default function BestBetsToday() {
  const { user } = useUser();
  const accessLevel: FeatureAccessLevel = getFeatureAccessLevel('best_bets', user);
  const previewLimit = getPreviewLimit('best_bets', user);
  
  const visibleBets = MOCK_BETS.slice(0, accessLevel === 'full' ? MOCK_BETS.length : previewLimit);
  const lockedBets = MOCK_BETS.slice(previewLimit);
  const showUpgradePrompt = accessLevel !== 'full' && lockedBets.length > 0;

  return (
    <Card data-testid="best-bets-today">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#00FF7F]" />
          Best Bets Today
        </CardTitle>
        <Badge variant="secondary" className="bg-[#00FF7F]/10 text-[#00FF7F] border-[#00FF7F]/30">
          {MOCK_BETS.length} Picks
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {visibleBets.map((bet, index) => (
          <BetCard key={bet.id} bet={bet} isLocked={false} index={index} />
        ))}
        
        {accessLevel !== 'full' && lockedBets.slice(0, 2).map((bet, index) => (
          <BetCard 
            key={bet.id} 
            bet={bet} 
            isLocked={true} 
            index={visibleBets.length + index} 
          />
        ))}
        
        {showUpgradePrompt && (
          <div 
            className="p-4 rounded-lg border-2 border-dashed border-[#00FF7F]/30 bg-[#00FF7F]/5 text-center"
            data-testid="upgrade-prompt"
          >
            <Lock className="h-8 w-8 text-[#00FF7F] mx-auto mb-2" />
            <p className="font-semibold text-foreground mb-1">
              Unlock {lockedBets.length} More Picks
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              Upgrade to Premium for full access to all daily picks
            </p>
            <Button 
              className="bg-[#00FF7F] text-black font-semibold border-[#00FF7F]"
              data-testid="button-upgrade-bets"
            >
              Upgrade to Premium
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
