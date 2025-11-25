import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus, TrendingUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export interface ParlayLeg {
  id: string;
  player: string;
  stat: string;
  selection: string;
  odds: number;
  book: string;
}

interface ParlayBuilderProps {
  legs?: ParlayLeg[];
  onAddLeg?: () => void;
  onRemoveLeg?: (id: string) => void;
  onClear?: () => void;
}

export default function ParlayBuilder({ 
  legs = [], 
  onAddLeg = () => console.log('Add leg clicked'),
  onRemoveLeg = () => console.log('Remove leg clicked'),
  onClear = () => console.log('Clear parlay clicked')
}: ParlayBuilderProps) {
  const [localLegs, setLocalLegs] = useState<ParlayLeg[]>(legs);

  const handleRemove = (id: string) => {
    setLocalLegs(localLegs.filter(leg => leg.id !== id));
    onRemoveLeg(id);
  };

  const handleClear = () => {
    setLocalLegs([]);
    onClear();
  };

  const calculateParlay = () => {
    if (localLegs.length === 0) return { totalOdds: 0, payout: 0 };
    
    const decimalOdds = localLegs.map(leg => {
      if (leg.odds > 0) {
        return (leg.odds / 100) + 1;
      } else {
        return (100 / Math.abs(leg.odds)) + 1;
      }
    });

    const totalDecimal = decimalOdds.reduce((acc, odds) => acc * odds, 1);
    const americanOdds = totalDecimal >= 2 
      ? Math.round((totalDecimal - 1) * 100)
      : Math.round(-100 / (totalDecimal - 1));
    
    const payout = totalDecimal * 100;

    return { totalOdds: americanOdds, payout: Math.round(payout) };
  };

  const { totalOdds, payout } = calculateParlay();

  return (
    <Card data-testid="card-parlay-builder">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Parlay Builder
        </CardTitle>
        <Badge variant="secondary" className="font-mono" data-testid="badge-leg-count">
          {localLegs.length} {localLegs.length === 1 ? 'Leg' : 'Legs'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {localLegs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-4">No picks added yet</p>
            <Button onClick={onAddLeg} variant="outline" className="gap-2" data-testid="button-add-first-leg">
              <Plus className="h-4 w-4" />
              Add Pick to Parlay
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {localLegs.map((leg) => (
                <div
                  key={leg.id}
                  className="flex items-start justify-between gap-4 p-3 rounded-md bg-muted/50 border"
                  data-testid={`parlay-leg-${leg.id}`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{leg.player}</p>
                      <Badge variant="outline" className="text-xs">{leg.book}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {leg.selection} • {leg.stat}
                    </p>
                    <p className="text-xs font-mono text-success">
                      {leg.odds > 0 ? '+' : ''}{leg.odds}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemove(leg.id)}
                    className="h-8 w-8"
                    data-testid={`button-remove-${leg.id}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Odds:</span>
                <span className="font-mono font-bold text-lg text-primary" data-testid="text-total-odds">
                  {totalOdds > 0 ? '+' : ''}{totalOdds}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payout (on $100):</span>
                <span className="font-mono font-bold text-lg text-success" data-testid="text-payout">
                  ${payout}
                </span>
              </div>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button className="flex-1 gap-2" data-testid="button-place-parlay">
                Place Parlay
                <TrendingUp className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleClear} data-testid="button-clear-parlay">
                Clear
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
