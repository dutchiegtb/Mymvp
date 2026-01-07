import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Lock, Calculator, Percent, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { getFeatureAccessLevel, type FeatureAccessLevel } from "@/lib/features";

interface HoldCalculatorProps {
  defaultOdds1?: number;
  defaultOdds2?: number;
}

function americanToDecimal(american: number): number {
  if (american > 0) {
    return (american / 100) + 1;
  } else {
    return (100 / Math.abs(american)) + 1;
  }
}

function calculateImpliedProbability(american: number): number {
  if (american > 0) {
    return 100 / (american + 100) * 100;
  } else {
    return Math.abs(american) / (Math.abs(american) + 100) * 100;
  }
}

function calculateHold(odds1: number, odds2: number): { 
  hold: number; 
  noVigOdds1: number; 
  noVigOdds2: number;
  fairProb1: number;
  fairProb2: number;
} {
  const prob1 = calculateImpliedProbability(odds1);
  const prob2 = calculateImpliedProbability(odds2);
  const totalProb = prob1 + prob2;
  const hold = totalProb - 100;
  
  const fairProb1 = (prob1 / totalProb) * 100;
  const fairProb2 = (prob2 / totalProb) * 100;
  
  const decimalFair1 = 100 / fairProb1;
  const decimalFair2 = 100 / fairProb2;
  
  const noVigOdds1 = fairProb1 >= 50 
    ? -(100 * fairProb1 / (100 - fairProb1)) 
    : ((100 - fairProb1) / fairProb1) * 100;
  
  const noVigOdds2 = fairProb2 >= 50 
    ? -(100 * fairProb2 / (100 - fairProb2)) 
    : ((100 - fairProb2) / fairProb2) * 100;
  
  return { hold, noVigOdds1, noVigOdds2, fairProb1, fairProb2 };
}

function getHoldQuality(hold: number): { label: string; color: string; icon: typeof CheckCircle } {
  if (hold <= 2) {
    return { label: 'Excellent', color: 'text-[#00FF7F]', icon: CheckCircle };
  } else if (hold <= 4) {
    return { label: 'Good', color: 'text-[#00CFFF]', icon: CheckCircle };
  } else if (hold <= 6) {
    return { label: 'Average', color: 'text-[#FFCC00]', icon: AlertTriangle };
  } else {
    return { label: 'High', color: 'text-red-400', icon: AlertTriangle };
  }
}

function formatOdds(odds: number): string {
  return odds >= 0 ? `+${Math.round(odds)}` : `${Math.round(odds)}`;
}

function LockedView() {
  return (
    <Card data-testid="hold-calculator-locked">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-4 w-4 text-muted-foreground" />
          Hold Calculator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-hidden rounded-lg">
          <div className="absolute inset-0 backdrop-blur-sm bg-background/70 z-10 flex flex-col items-center justify-center gap-3 p-6">
            <Lock className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="font-semibold text-foreground">Hold Calculator</p>
              <p className="text-sm text-muted-foreground mb-3">
                Calculate sportsbook vig and find fair odds
              </p>
              <Button 
                className="bg-[#00FF7F] text-black font-semibold border-[#00FF7F]"
                size="sm"
                data-testid="button-upgrade-hold"
              >
                Upgrade to Premium
              </Button>
            </div>
          </div>
          <div className="opacity-20 space-y-4 p-4">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HoldCalculator({ 
  defaultOdds1 = -110, 
  defaultOdds2 = -110 
}: HoldCalculatorProps) {
  const { user } = useUser();
  const accessLevel: FeatureAccessLevel = getFeatureAccessLevel('hold_calculator', user);
  
  const [odds1, setOdds1] = useState(defaultOdds1.toString());
  const [odds2, setOdds2] = useState(defaultOdds2.toString());
  
  if (accessLevel === 'locked') {
    return <LockedView />;
  }
  
  const numOdds1 = parseInt(odds1) || -110;
  const numOdds2 = parseInt(odds2) || -110;
  const result = calculateHold(numOdds1, numOdds2);
  const quality = getHoldQuality(result.hold);
  const QualityIcon = quality.icon;

  return (
    <Card data-testid="hold-calculator">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-4 w-4 text-[#00CFFF]" />
          Hold Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="odds1" className="text-sm text-muted-foreground">
              Side 1 Odds
            </Label>
            <Input
              id="odds1"
              type="number"
              value={odds1}
              onChange={(e) => setOdds1(e.target.value)}
              placeholder="-110"
              className="font-mono"
              data-testid="input-odds-1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="odds2" className="text-sm text-muted-foreground">
              Side 2 Odds
            </Label>
            <Input
              id="odds2"
              type="number"
              value={odds2}
              onChange={(e) => setOdds2(e.target.value)}
              placeholder="-110"
              className="font-mono"
              data-testid="input-odds-2"
            />
          </div>
        </div>
        
        <div className="p-4 rounded-lg border border-muted bg-muted/30 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Hold/Vig:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-mono font-bold ${quality.color}`}>
                {result.hold.toFixed(2)}%
              </span>
              <Badge className={`${quality.color} bg-transparent border border-current`}>
                <QualityIcon className="h-3 w-3 mr-1" />
                {quality.label}
              </Badge>
            </div>
          </div>
          
          <div className="border-t border-muted pt-4">
            <p className="text-xs text-muted-foreground mb-3">No-Vig Fair Odds:</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-md bg-card text-center">
                <p className="text-xs text-muted-foreground mb-1">Side 1</p>
                <p className="font-mono font-bold text-[#00CFFF]">
                  {formatOdds(result.noVigOdds1)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {result.fairProb1.toFixed(1)}% fair
                </p>
              </div>
              <div className="p-3 rounded-md bg-card text-center">
                <p className="text-xs text-muted-foreground mb-1">Side 2</p>
                <p className="font-mono font-bold text-[#00CFFF]">
                  {formatOdds(result.noVigOdds2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {result.fairProb2.toFixed(1)}% fair
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-muted pt-4 text-xs text-muted-foreground">
            <p className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {result.hold > 4 ? (
                <span>High vig means less value. Look for better lines!</span>
              ) : result.hold > 2 ? (
                <span>Decent line. Check other books for better odds.</span>
              ) : (
                <span className="text-[#00FF7F]">Low vig! This is a competitive line.</span>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
