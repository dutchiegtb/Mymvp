import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface ValuePick {
  id: string;
  playerName: string;
  statType: string;
  sport: string;
  book1: { name: string; line: number };
  book2: { name: string; line: number };
  ev: number;
  recommendation: string;
  timestamp: string;
}

interface ValuePickCardProps {
  pick: ValuePick;
  isLocked?: boolean;
}

export default function ValuePickCard({ pick, isLocked = false }: ValuePickCardProps) {
  const getEVBadgeColor = (ev: number) => {
    if (ev >= 10) return "bg-success text-success-foreground";
    if (ev >= 5) return "bg-warning text-warning-foreground";
    return "bg-muted text-muted-foreground";
  };

  const lineDiff = Math.abs(pick.book1.line - pick.book2.line);
  const isOver = pick.recommendation.toLowerCase().includes("over");

  return (
    <Card className={`${isLocked ? 'opacity-60' : ''} hover-elevate`} data-testid={`card-value-pick-${pick.id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
        <div className="flex-1">
          <h3 className="text-xl font-semibold" data-testid="text-player-name">{pick.playerName}</h3>
          <p className="text-sm text-muted-foreground">{pick.statType} • {pick.sport}</p>
        </div>
        <Badge className={`${getEVBadgeColor(pick.ev)} font-mono text-lg font-bold no-default-hover-elevate no-default-active-elevate`} data-testid="badge-ev">
          {pick.ev > 0 ? '+' : ''}{pick.ev}% EV
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{pick.book1.name}</p>
            <p className="font-mono text-xl font-semibold" data-testid="text-book1-line">{pick.book1.line}</p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-px w-8 bg-border"></div>
            <span className="text-xs font-medium">+{lineDiff.toFixed(1)}</span>
            <div className="h-px w-8 bg-border"></div>
          </div>
          <div className="flex-1 space-y-1 text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{pick.book2.name}</p>
            <p className="font-mono text-xl font-semibold" data-testid="text-book2-line">{pick.book2.line}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            {isOver ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
            <p className="font-semibold" data-testid="text-recommendation">{pick.recommendation}</p>
          </div>
          <p className="text-xs text-muted-foreground" data-testid="text-timestamp">{pick.timestamp}</p>
        </div>
      </CardContent>
    </Card>
  );
}
