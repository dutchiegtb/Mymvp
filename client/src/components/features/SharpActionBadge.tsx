import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, TrendingUp, Zap, ArrowRightLeft, DollarSign } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { getFeatureAccessLevel, type FeatureAccessLevel } from "@/lib/features";

export type SharpIndicatorType = 'reverse_line' | 'steam_move' | 'money_divergence';

interface SharpActionBadgeProps {
  indicatorType: SharpIndicatorType;
  sharpPercentage: number;
  showUpgradePrompt?: boolean;
}

function getIndicatorIcon(type: SharpIndicatorType) {
  switch (type) {
    case 'reverse_line':
      return <ArrowRightLeft className="h-3.5 w-3.5" />;
    case 'steam_move':
      return <Zap className="h-3.5 w-3.5" />;
    case 'money_divergence':
      return <DollarSign className="h-3.5 w-3.5" />;
    default:
      return <TrendingUp className="h-3.5 w-3.5" />;
  }
}

function getIndicatorLabel(type: SharpIndicatorType): string {
  switch (type) {
    case 'reverse_line':
      return 'Reverse Line';
    case 'steam_move':
      return 'Steam Move';
    case 'money_divergence':
      return 'Money Divergence';
    default:
      return 'Sharp Action';
  }
}

function LockedBadge({ showUpgradePrompt }: { showUpgradePrompt?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2" data-testid="sharp-action-locked">
      <Badge 
        variant="outline" 
        className="bg-muted/50 text-muted-foreground border-muted gap-1.5"
      >
        <Lock className="h-3 w-3" />
        <span>Sharp Action</span>
      </Badge>
      {showUpgradePrompt && (
        <Button 
          variant="ghost" 
          size="sm"
          className="h-6 text-xs text-[#00FF7F]"
          data-testid="button-upgrade-sharp"
        >
          Upgrade
        </Button>
      )}
    </div>
  );
}

function SharpBadge({ indicatorType, sharpPercentage }: { 
  indicatorType: SharpIndicatorType; 
  sharpPercentage: number;
}) {
  const isHighSharp = sharpPercentage >= 70;
  
  return (
    <div 
      className="inline-flex items-center gap-2"
      data-testid="sharp-action-badge"
    >
      <Badge 
        className={`
          gap-1.5 font-semibold
          ${isHighSharp 
            ? 'bg-[#00FF7F]/20 text-[#00FF7F] border-[#00FF7F]/50 shadow-[0_0_10px_rgba(0,255,127,0.3)]' 
            : 'bg-[#00CFFF]/20 text-[#00CFFF] border-[#00CFFF]/50'
          }
        `}
      >
        {getIndicatorIcon(indicatorType)}
        <span>{sharpPercentage}% Sharp</span>
      </Badge>
      <Badge 
        variant="outline"
        className="text-xs text-muted-foreground"
      >
        {getIndicatorLabel(indicatorType)}
      </Badge>
    </div>
  );
}

export default function SharpActionBadge({ 
  indicatorType, 
  sharpPercentage,
  showUpgradePrompt = true 
}: SharpActionBadgeProps) {
  const { user } = useUser();
  const accessLevel: FeatureAccessLevel = getFeatureAccessLevel('sharp_action', user);
  
  if (accessLevel === 'locked') {
    return <LockedBadge showUpgradePrompt={showUpgradePrompt} />;
  }
  
  return (
    <SharpBadge 
      indicatorType={indicatorType} 
      sharpPercentage={sharpPercentage} 
    />
  );
}

export function SharpActionIndicator({
  indicatorType,
  sharpPercentage,
  lineMovement,
}: {
  indicatorType: SharpIndicatorType;
  sharpPercentage: number;
  lineMovement?: number;
}) {
  const { user } = useUser();
  const accessLevel: FeatureAccessLevel = getFeatureAccessLevel('sharp_action', user);
  
  if (accessLevel === 'locked') {
    return (
      <div 
        className="flex items-center gap-2 p-3 rounded-lg border border-muted bg-muted/30"
        data-testid="sharp-indicator-locked"
      >
        <div className="relative">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Sharp Action Data</p>
          <p className="text-xs text-muted-foreground">Upgrade to Premium</p>
        </div>
      </div>
    );
  }
  
  const isHighSharp = sharpPercentage >= 70;
  
  return (
    <div 
      className={`
        flex items-center gap-3 p-3 rounded-lg border 
        ${isHighSharp 
          ? 'border-[#00FF7F]/30 bg-[#00FF7F]/5 shadow-[0_0_15px_rgba(0,255,127,0.15)]' 
          : 'border-muted bg-card'
        }
      `}
      data-testid="sharp-indicator"
    >
      <div className="relative">
        <div 
          className={`
            h-10 w-10 rounded-full flex items-center justify-center
            ${isHighSharp ? 'bg-[#00FF7F]/20' : 'bg-[#00CFFF]/20'}
          `}
        >
          {getIndicatorIcon(indicatorType)}
        </div>
        {isHighSharp && (
          <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#00FF7F] animate-pulse" />
        )}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span 
            className={`font-mono font-bold ${isHighSharp ? 'text-[#00FF7F]' : 'text-[#00CFFF]'}`}
          >
            {sharpPercentage}%
          </span>
          <span className="text-sm text-foreground font-medium">Sharp Money</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{getIndicatorLabel(indicatorType)}</span>
          {lineMovement && (
            <>
              <span className="text-muted-foreground/50">|</span>
              <span className={lineMovement > 0 ? 'text-[#00FF7F]' : 'text-red-400'}>
                {lineMovement > 0 ? '+' : ''}{lineMovement.toFixed(1)} pts
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
