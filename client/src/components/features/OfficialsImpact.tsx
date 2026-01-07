import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Gavel, TrendingUp, TrendingDown, Bell, Home, AlertTriangle } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { getFeatureAccessLevel, getPreviewLimit, type FeatureAccessLevel } from "@/lib/features";

interface Official {
  id: string;
  name: string;
  overUnderTendency: 'over' | 'under' | 'neutral';
  tendencyStrength: number;
  foulRate: 'high' | 'medium' | 'low';
  homeBias: number;
  gamesReffed: number;
}

interface OfficialsImpactProps {
  officials: Official[];
  gameId?: string;
}

const MOCK_OFFICIALS: Official[] = [
  {
    id: "1",
    name: "Scott Foster",
    overUnderTendency: 'over',
    tendencyStrength: 72,
    foulRate: 'high',
    homeBias: 54,
    gamesReffed: 1247,
  },
  {
    id: "2",
    name: "Tony Brothers",
    overUnderTendency: 'under',
    tendencyStrength: 65,
    foulRate: 'medium',
    homeBias: 51,
    gamesReffed: 1189,
  },
  {
    id: "3",
    name: "Marc Davis",
    overUnderTendency: 'neutral',
    tendencyStrength: 52,
    foulRate: 'low',
    homeBias: 48,
    gamesReffed: 987,
  },
];

function getTendencyIcon(tendency: 'over' | 'under' | 'neutral') {
  switch (tendency) {
    case 'over':
      return <TrendingUp className="h-4 w-4 text-[#00FF7F]" />;
    case 'under':
      return <TrendingDown className="h-4 w-4 text-[#00CFFF]" />;
    default:
      return <span className="h-4 w-4 text-muted-foreground">~</span>;
  }
}

function getTendencyLabel(tendency: 'over' | 'under' | 'neutral', strength: number): string {
  if (tendency === 'neutral') return 'Neutral';
  return `${tendency === 'over' ? 'Over' : 'Under'} (${strength}%)`;
}

function getFoulRateColor(rate: 'high' | 'medium' | 'low'): string {
  switch (rate) {
    case 'high':
      return 'text-[#FFCC00]';
    case 'medium':
      return 'text-foreground';
    case 'low':
      return 'text-[#00CFFF]';
    default:
      return 'text-muted-foreground';
  }
}

interface OfficialRowProps {
  official: Official;
  isLocked: boolean;
}

function OfficialRow({ official, isLocked }: OfficialRowProps) {
  if (isLocked) {
    return (
      <div 
        className="relative p-3 rounded-lg border border-muted bg-muted/30 overflow-hidden"
        data-testid={`official-locked-${official.id}`}
      >
        <div className="absolute inset-0 backdrop-blur-sm bg-background/60 z-10 flex items-center justify-center">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="opacity-30 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted" />
          <div>
            <p className="font-medium">Official Name</p>
            <p className="text-sm text-muted-foreground">Stats hidden</p>
          </div>
        </div>
      </div>
    );
  }
  
  const hasHomeBias = official.homeBias >= 55;
  
  return (
    <div 
      className="p-3 rounded-lg border border-muted bg-card hover-elevate transition-all"
      data-testid={`official-row-${official.id}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <Gavel className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{official.name}</p>
            <p className="text-xs text-muted-foreground">{official.gamesReffed} games</p>
          </div>
        </div>
        
        {hasHomeBias && (
          <Badge variant="outline" className="text-xs gap-1 text-[#FFCC00] border-[#FFCC00]/30">
            <Home className="h-3 w-3" />
            Home Bias
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="flex flex-col items-center p-2 rounded-md bg-muted/50">
          {getTendencyIcon(official.overUnderTendency)}
          <span className="text-xs text-muted-foreground mt-1">O/U</span>
          <span className="font-mono text-xs font-semibold">
            {getTendencyLabel(official.overUnderTendency, official.tendencyStrength)}
          </span>
        </div>
        
        <div className="flex flex-col items-center p-2 rounded-md bg-muted/50">
          <AlertTriangle className={`h-4 w-4 ${getFoulRateColor(official.foulRate)}`} />
          <span className="text-xs text-muted-foreground mt-1">Fouls</span>
          <span className={`font-mono text-xs font-semibold capitalize ${getFoulRateColor(official.foulRate)}`}>
            {official.foulRate}
          </span>
        </div>
        
        <div className="flex flex-col items-center p-2 rounded-md bg-muted/50">
          <Home className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground mt-1">Home</span>
          <span className={`font-mono text-xs font-semibold ${hasHomeBias ? 'text-[#FFCC00]' : ''}`}>
            {official.homeBias}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default function OfficialsImpact({ officials = MOCK_OFFICIALS }: OfficialsImpactProps) {
  const { user } = useUser();
  const accessLevel: FeatureAccessLevel = getFeatureAccessLevel('officials_basic', user);
  const eliteAccess: FeatureAccessLevel = getFeatureAccessLevel('officials_auto', user);
  const previewLimit = getPreviewLimit('officials_basic', user);
  
  const visibleOfficials = officials.slice(0, accessLevel === 'full' ? officials.length : previewLimit);
  const lockedOfficials = officials.slice(previewLimit);
  const showUpgradePrompt = accessLevel !== 'full' && lockedOfficials.length > 0;
  const canEnableNotifications = eliteAccess === 'full';

  return (
    <Card data-testid="officials-impact">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Gavel className="h-5 w-5 text-[#FFCC00]" />
          Officials Impact
        </CardTitle>
        {canEnableNotifications && (
          <Button 
            variant="outline" 
            size="sm"
            className="gap-1.5 text-xs"
            data-testid="button-notify-officials"
          >
            <Bell className="h-3.5 w-3.5 text-[#00FF7F]" />
            Auto Notify
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleOfficials.map((official) => (
          <OfficialRow key={official.id} official={official} isLocked={false} />
        ))}
        
        {accessLevel !== 'full' && lockedOfficials.map((official) => (
          <OfficialRow key={official.id} official={official} isLocked={true} />
        ))}
        
        {showUpgradePrompt && (
          <div 
            className="p-4 rounded-lg border-2 border-dashed border-[#FFCC00]/30 bg-[#FFCC00]/5 text-center"
            data-testid="officials-upgrade-prompt"
          >
            <Lock className="h-6 w-6 text-[#FFCC00] mx-auto mb-2" />
            <p className="font-semibold text-foreground mb-1">
              Full Officials Data
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              Upgrade to Premium for complete referee analytics
            </p>
            <Button 
              className="bg-[#FFCC00] text-black font-semibold border-[#FFCC00]"
              data-testid="button-upgrade-officials"
            >
              Upgrade to Premium
            </Button>
          </div>
        )}
        
        {accessLevel === 'full' && !canEnableNotifications && (
          <div 
            className="p-3 rounded-lg border border-muted bg-muted/30 text-center"
            data-testid="elite-upsell"
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Auto Notifications</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Get alerted when favorable refs are assigned
            </p>
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs"
              data-testid="button-upgrade-elite"
            >
              Upgrade to Elite
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function OfficialsCompact({ officials = MOCK_OFFICIALS }: { officials?: Official[] }) {
  const { user } = useUser();
  const accessLevel: FeatureAccessLevel = getFeatureAccessLevel('officials_basic', user);
  
  if (accessLevel === 'locked' || officials.length === 0) {
    return (
      <div 
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
        data-testid="officials-compact-locked"
      >
        <Lock className="h-3.5 w-3.5" />
        <span>Officials: Locked</span>
      </div>
    );
  }
  
  const primaryOfficial = officials[0];
  
  return (
    <div 
      className="inline-flex items-center gap-1.5 text-sm"
      data-testid="officials-compact"
    >
      <Gavel className="h-3.5 w-3.5 text-[#FFCC00]" />
      <span className="text-muted-foreground">Ref:</span>
      <span className="font-medium text-foreground">{primaryOfficial.name}</span>
      <span className="text-muted-foreground">|</span>
      <span className="font-mono text-xs">
        {primaryOfficial.overUnderTendency === 'over' && (
          <span className="text-[#00FF7F]">O+{primaryOfficial.tendencyStrength}%</span>
        )}
        {primaryOfficial.overUnderTendency === 'under' && (
          <span className="text-[#00CFFF]">U+{primaryOfficial.tendencyStrength}%</span>
        )}
        {primaryOfficial.overUnderTendency === 'neutral' && (
          <span className="text-muted-foreground">Neutral</span>
        )}
      </span>
      {accessLevel === 'preview' && officials.length > 1 && (
        <Badge variant="outline" className="text-xs ml-1">
          +{officials.length - 1} more
        </Badge>
      )}
    </div>
  );
}
