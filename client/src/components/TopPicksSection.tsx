import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export interface TopPick {
  id: string;
  rank: number;
  player: string;
  stat: string;
  sport: string;
  selection: string;
  ev: number;
  confidence: number;
  book: string;
  line: number;
  reasoning: string;
}

interface TopPicksSectionProps {
  picks?: TopPick[];
}

export default function TopPicksSection({ picks = [] }: TopPicksSectionProps) {
  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-warning text-warning-foreground";
    if (rank === 2) return "bg-secondary text-secondary-foreground";
    if (rank === 3) return "bg-primary/70 text-primary-foreground";
    return "bg-muted text-muted-foreground";
  };

  return (
    <Card data-testid="card-top-picks">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-warning" />
          Top Picks of the Day
          <Badge className="ml-auto bg-success/20 text-success border-success/30" data-testid="badge-live">
            <Clock className="h-3 w-3 mr-1 animate-pulse" />
            LIVE
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {picks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Top picks will appear here when available</p>
          </div>
        ) : (
          picks.map((pick) => (
            <div key={pick.id} data-testid={`top-pick-${pick.id}`}>
              <div className="flex items-start gap-4">
                <Badge
                  className={`${getRankBadge(pick.rank)} h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 no-default-hover-elevate no-default-active-elevate`}
                  data-testid={`badge-rank-${pick.rank}`}
                >
                  {pick.rank}
                </Badge>

                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-lg" data-testid="text-player-name">
                        {pick.player}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {pick.stat} • {pick.sport}
                      </p>
                    </div>
                    <Badge className="bg-success text-success-foreground font-mono no-default-hover-elevate no-default-active-elevate" data-testid="badge-ev">
                      +{pick.ev}% EV
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <span className="font-semibold" data-testid="text-selection">{pick.selection}</span>
                    </div>
                    <div className="text-muted-foreground">
                      @ <span className="font-mono">{pick.line}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{pick.book}</Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-warning transition-all"
                        style={{ width: `${pick.confidence}%` }}
                        data-testid="progress-confidence"
                      ></div>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                      {pick.confidence}% Confidence
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {pick.reasoning}
                  </p>
                </div>
              </div>
              {pick.rank < picks.length && <Separator className="mt-4" />}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
