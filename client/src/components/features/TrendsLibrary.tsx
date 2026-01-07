import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, TrendingUp, Flame, BookOpen, ChevronRight, Target, Filter } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { getFeatureAccessLevel, getPreviewLimit, type FeatureAccessLevel } from "@/lib/features";

interface Trend {
  id: string;
  title: string;
  description: string;
  sport: string;
  category: 'situational' | 'team' | 'player' | 'official';
  winRate: number;
  sampleSize: number;
  roi: number;
  isHot?: boolean;
}

interface TrendsLibraryProps {
  trends?: Trend[];
  sport?: string;
  category?: string;
}

const MOCK_TRENDS: Trend[] = [
  {
    id: "1",
    title: "NBA Home Dogs After Loss",
    description: "NBA home underdogs that lost their previous game by 10+ points cover the spread at a high rate",
    sport: "NBA",
    category: "situational",
    winRate: 58.3,
    sampleSize: 127,
    roi: 12.4,
    isHot: true,
  },
  {
    id: "2",
    title: "NFL Thursday Night Unders",
    description: "Thursday Night Football games tend to go under the total due to short prep time",
    sport: "NFL",
    category: "situational",
    winRate: 55.8,
    sampleSize: 89,
    roi: 8.2,
  },
  {
    id: "3",
    title: "MLB First 5 Innings Favorites",
    description: "Heavy favorites (-200 or better) in first 5 innings bets have shown consistent value",
    sport: "MLB",
    category: "team",
    winRate: 61.2,
    sampleSize: 234,
    roi: 15.7,
    isHot: true,
  },
  {
    id: "4",
    title: "NHL Back-to-Back Unders",
    description: "Teams playing back-to-back games tend to produce lower scoring games",
    sport: "NHL",
    category: "team",
    winRate: 54.1,
    sampleSize: 156,
    roi: 5.8,
  },
  {
    id: "5",
    title: "Scott Foster NBA Overs",
    description: "Games officiated by Scott Foster consistently go over the total",
    sport: "NBA",
    category: "official",
    winRate: 72.0,
    sampleSize: 47,
    roi: 28.5,
    isHot: true,
  },
  {
    id: "6",
    title: "NFL Divisional Game Overs",
    description: "Divisional matchups late in the season tend to be higher scoring",
    sport: "NFL",
    category: "situational",
    winRate: 53.4,
    sampleSize: 112,
    roi: 4.2,
  },
];

function getCategoryColor(category: string): string {
  switch (category) {
    case 'situational':
      return 'bg-[#00CFFF]/10 text-[#00CFFF] border-[#00CFFF]/30';
    case 'team':
      return 'bg-[#FFCC00]/10 text-[#FFCC00] border-[#FFCC00]/30';
    case 'player':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    case 'official':
      return 'bg-[#00FF7F]/10 text-[#00FF7F] border-[#00FF7F]/30';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function getROIColor(roi: number): string {
  if (roi >= 15) return 'text-[#00FF7F]';
  if (roi >= 8) return 'text-[#00CFFF]';
  if (roi >= 0) return 'text-[#FFCC00]';
  return 'text-red-400';
}

interface TrendRowProps {
  trend: Trend;
  isLocked: boolean;
}

function TrendRow({ trend, isLocked }: TrendRowProps) {
  if (isLocked) {
    return (
      <div 
        className="relative p-4 rounded-lg border border-muted bg-muted/30 overflow-hidden"
        data-testid={`trend-locked-${trend.id}`}
      >
        <div className="absolute inset-0 backdrop-blur-sm bg-background/60 z-10 flex items-center justify-center">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="opacity-30">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">???</Badge>
            <span className="font-semibold">Trend hidden</span>
          </div>
          <p className="text-sm text-muted-foreground">Upgrade to view this trend</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="p-4 rounded-lg border border-muted bg-card hover-elevate transition-all cursor-pointer group"
      data-testid={`trend-row-${trend.id}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">{trend.sport}</Badge>
          <Badge className={`text-xs capitalize ${getCategoryColor(trend.category)}`}>
            {trend.category}
          </Badge>
          {trend.isHot && (
            <Badge className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/30 gap-1">
              <Flame className="h-3 w-3" />
              Hot
            </Badge>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
      </div>
      
      <h3 className="font-semibold text-foreground mb-2 group-hover:text-[#00CFFF] transition-colors">
        {trend.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">{trend.description}</p>
      
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-md bg-muted/50">
          <p className="text-xs text-muted-foreground">Win Rate</p>
          <p className={`font-mono font-bold ${trend.winRate >= 55 ? 'text-[#00FF7F]' : 'text-foreground'}`}>
            {trend.winRate.toFixed(1)}%
          </p>
        </div>
        <div className="p-2 rounded-md bg-muted/50">
          <p className="text-xs text-muted-foreground">Sample</p>
          <p className="font-mono font-semibold text-foreground">{trend.sampleSize}</p>
        </div>
        <div className="p-2 rounded-md bg-muted/50">
          <p className="text-xs text-muted-foreground">ROI</p>
          <p className={`font-mono font-bold ${getROIColor(trend.roi)}`}>
            +{trend.roi.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TrendsLibrary({ 
  trends = MOCK_TRENDS,
  sport,
  category 
}: TrendsLibraryProps) {
  const { user } = useUser();
  const accessLevel: FeatureAccessLevel = getFeatureAccessLevel('trends', user);
  const previewLimit = getPreviewLimit('trends', user);
  
  let filteredTrends = trends;
  if (sport && sport !== 'all') {
    filteredTrends = trends.filter(t => t.sport.toLowerCase() === sport.toLowerCase());
  }
  if (category && category !== 'all') {
    filteredTrends = filteredTrends.filter(t => t.category === category);
  }
  
  const visibleTrends = filteredTrends.slice(0, accessLevel === 'full' ? filteredTrends.length : previewLimit);
  const lockedTrends = filteredTrends.slice(previewLimit);
  const showUpgradePrompt = accessLevel !== 'full' && lockedTrends.length > 0;
  
  const hotTrends = trends.filter(t => t.isHot).length;

  return (
    <Card data-testid="trends-library">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#00CFFF]" />
          Trends Library
        </CardTitle>
        <div className="flex items-center gap-2">
          {hotTrends > 0 && (
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 gap-1">
              <Flame className="h-3 w-3" />
              {hotTrends} Hot
            </Badge>
          )}
          <Badge variant="outline" className="font-mono">
            {filteredTrends.length} trends
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {visibleTrends.map((trend) => (
          <TrendRow key={trend.id} trend={trend} isLocked={false} />
        ))}
        
        {accessLevel !== 'full' && lockedTrends.slice(0, 2).map((trend) => (
          <TrendRow key={trend.id} trend={trend} isLocked={true} />
        ))}
        
        {showUpgradePrompt && (
          <div 
            className="p-4 rounded-lg border-2 border-dashed border-[#00CFFF]/30 bg-[#00CFFF]/5 text-center"
            data-testid="trends-upgrade-prompt"
          >
            <Lock className="h-6 w-6 text-[#00CFFF] mx-auto mb-2" />
            <p className="font-semibold text-foreground mb-1">
              Unlock {lockedTrends.length} More Trends
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              Get access to our full trends library with Premium
            </p>
            <Button 
              className="bg-[#00CFFF] text-black font-semibold border-[#00CFFF]"
              data-testid="button-upgrade-trends"
            >
              Upgrade to Premium
            </Button>
          </div>
        )}
        
        {visibleTrends.length === 0 && accessLevel === 'locked' && (
          <div className="text-center py-8">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-semibold text-foreground mb-2">Trends Library Locked</p>
            <p className="text-sm text-muted-foreground mb-4">
              Access historical betting trends with a Basic subscription
            </p>
            <Button 
              className="bg-[#00FF7F] text-black font-semibold border-[#00FF7F]"
              data-testid="button-upgrade-trends-locked"
            >
              Upgrade Now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TrendsCompact({ trends = MOCK_TRENDS }: { trends?: Trend[] }) {
  const { user } = useUser();
  const accessLevel: FeatureAccessLevel = getFeatureAccessLevel('trends', user);
  
  const hotTrends = trends.filter(t => t.isHot);
  
  if (accessLevel === 'locked' || hotTrends.length === 0) {
    return (
      <div 
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
        data-testid="trends-compact-locked"
      >
        <Lock className="h-3.5 w-3.5" />
        <span>Trends: Locked</span>
      </div>
    );
  }
  
  return (
    <div 
      className="inline-flex items-center gap-2 text-sm"
      data-testid="trends-compact"
    >
      <Flame className="h-3.5 w-3.5 text-orange-400" />
      <span className="text-muted-foreground">{hotTrends.length} hot trend{hotTrends.length !== 1 ? 's' : ''}</span>
      {accessLevel === 'preview' && (
        <Badge variant="outline" className="text-xs">Preview</Badge>
      )}
    </div>
  );
}
