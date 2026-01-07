import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Users } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { getFeatureAccessLevel, type FeatureAccessLevel } from "@/lib/features";

interface PublicBettingPercentProps {
  team1: string;
  team2: string;
  team1Percent: number;
  team2Percent: number;
  showCard?: boolean;
}

function LockedView({ showCard }: { showCard: boolean }) {
  const content = (
    <div 
      className="relative overflow-hidden"
      data-testid="public-betting-locked"
    >
      <div className="absolute inset-0 backdrop-blur-sm bg-background/70 z-10 flex flex-col items-center justify-center gap-3 p-4">
        <Lock className="h-6 w-6 text-muted-foreground" />
        <div className="text-center">
          <p className="font-semibold text-foreground mb-1">Public Betting Data</p>
          <p className="text-sm text-muted-foreground mb-3">
            See where the public is betting
          </p>
          <Button 
            className="bg-[#00FF7F] text-black font-semibold border-[#00FF7F]"
            size="sm"
            data-testid="button-upgrade-public"
          >
            Upgrade to Premium
          </Button>
        </div>
      </div>
      
      <div className="opacity-20 p-4">
        <div className="flex items-center justify-between mb-2">
          <span>Team A</span>
          <span>??%</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-1/2 bg-muted-foreground" />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span>Team B</span>
          <span>??%</span>
        </div>
      </div>
    </div>
  );
  
  if (showCard) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-muted-foreground" />
            Public Betting
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {content}
        </CardContent>
      </Card>
    );
  }
  
  return content;
}

function PublicBettingBar({ team1, team2, team1Percent, team2Percent }: Omit<PublicBettingPercentProps, 'showCard'>) {
  const isPublicHeavy = team1Percent >= 70 || team2Percent >= 70;
  const heavySide = team1Percent > team2Percent ? 'team1' : 'team2';
  
  return (
    <div data-testid="public-betting-bar">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span 
            className={`font-medium ${
              isPublicHeavy && heavySide === 'team1' 
                ? 'text-muted-foreground' 
                : 'text-foreground'
            }`}
          >
            {team1}
          </span>
          <span 
            className={`font-mono font-bold ${
              isPublicHeavy && heavySide === 'team1'
                ? 'text-muted-foreground'
                : team1Percent > 50 
                  ? 'text-[#00CFFF]' 
                  : 'text-foreground'
            }`}
          >
            {team1Percent}%
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span 
            className={`font-mono font-bold ${
              isPublicHeavy && heavySide === 'team2'
                ? 'text-muted-foreground'
                : team2Percent > 50 
                  ? 'text-[#00CFFF]' 
                  : 'text-foreground'
            }`}
          >
            {team2Percent}%
          </span>
          <span 
            className={`font-medium ${
              isPublicHeavy && heavySide === 'team2' 
                ? 'text-muted-foreground' 
                : 'text-foreground'
            }`}
          >
            {team2}
          </span>
        </div>
      </div>
      
      <div className="h-3 rounded-full bg-muted overflow-hidden flex">
        <div 
          className={`h-full transition-all ${
            isPublicHeavy && heavySide === 'team1'
              ? 'bg-muted-foreground/50'
              : team1Percent > 50 
                ? 'bg-[#00CFFF]' 
                : 'bg-[#00CFFF]/60'
          }`}
          style={{ width: `${team1Percent}%` }}
        />
        <div 
          className={`h-full transition-all ${
            isPublicHeavy && heavySide === 'team2'
              ? 'bg-muted-foreground/50'
              : team2Percent > 50 
                ? 'bg-[#FFCC00]' 
                : 'bg-[#FFCC00]/60'
          }`}
          style={{ width: `${team2Percent}%` }}
        />
      </div>
      
      {isPublicHeavy && (
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <Users className="h-3 w-3" />
          Heavy public action on {heavySide === 'team1' ? team1 : team2}
        </p>
      )}
    </div>
  );
}

export default function PublicBettingPercent({ 
  team1, 
  team2, 
  team1Percent, 
  team2Percent,
  showCard = true 
}: PublicBettingPercentProps) {
  const { user } = useUser();
  const accessLevel: FeatureAccessLevel = getFeatureAccessLevel('public_betting', user);
  
  if (accessLevel === 'locked') {
    return <LockedView showCard={showCard} />;
  }
  
  if (showCard) {
    return (
      <Card data-testid="public-betting-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-[#00CFFF]" />
            Public Betting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PublicBettingBar 
            team1={team1} 
            team2={team2} 
            team1Percent={team1Percent} 
            team2Percent={team2Percent} 
          />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <PublicBettingBar 
      team1={team1} 
      team2={team2} 
      team1Percent={team1Percent} 
      team2Percent={team2Percent} 
    />
  );
}

export function PublicBettingCompact({ 
  team1, 
  team2, 
  team1Percent, 
  team2Percent 
}: Omit<PublicBettingPercentProps, 'showCard'>) {
  const { user } = useUser();
  const accessLevel: FeatureAccessLevel = getFeatureAccessLevel('public_betting', user);
  
  if (accessLevel === 'locked') {
    return (
      <div 
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
        data-testid="public-betting-compact-locked"
      >
        <Lock className="h-3.5 w-3.5" />
        <span>Public: ???</span>
      </div>
    );
  }
  
  const heavySide = team1Percent > team2Percent ? team1 : team2;
  const heavyPercent = Math.max(team1Percent, team2Percent);
  
  return (
    <div 
      className="inline-flex items-center gap-1.5 text-sm"
      data-testid="public-betting-compact"
    >
      <Users className="h-3.5 w-3.5 text-[#00CFFF]" />
      <span className="text-muted-foreground">Public:</span>
      <span className="font-mono font-semibold text-foreground">
        {heavyPercent}% {heavySide}
      </span>
    </div>
  );
}
