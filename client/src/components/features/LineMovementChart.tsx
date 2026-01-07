import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, TrendingUp, TrendingDown, Activity, Clock } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { getFeatureAccessLevel, type FeatureAccessLevel } from "@/lib/features";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface OddsPoint {
  timestamp: string;
  value: number;
  book?: string;
}

interface LineMovementChartProps {
  gameId?: string;
  marketType: 'spread' | 'total' | 'moneyline';
  selection: string;
  openingLine: number;
  currentLine: number;
  data: OddsPoint[];
  showCard?: boolean;
}

const MOCK_LINE_DATA: OddsPoint[] = [
  { timestamp: "12:00 AM", value: -3.5 },
  { timestamp: "4:00 AM", value: -3.5 },
  { timestamp: "8:00 AM", value: -4 },
  { timestamp: "10:00 AM", value: -4 },
  { timestamp: "12:00 PM", value: -4.5 },
  { timestamp: "2:00 PM", value: -5 },
  { timestamp: "4:00 PM", value: -4.5 },
  { timestamp: "6:00 PM", value: -5.5 },
];

function LockedChart() {
  return (
    <div 
      className="relative h-48 overflow-hidden rounded-lg"
      data-testid="line-movement-locked"
    >
      <div className="absolute inset-0 backdrop-blur-sm bg-background/70 z-10 flex flex-col items-center justify-center gap-3">
        <Lock className="h-8 w-8 text-muted-foreground" />
        <div className="text-center">
          <p className="font-semibold text-foreground">Line Movement Graphs</p>
          <p className="text-sm text-muted-foreground mb-3">
            Track how odds change over time
          </p>
          <Button 
            className="bg-[#00FF7F] text-black font-semibold border-[#00FF7F]"
            size="sm"
            data-testid="button-upgrade-line-movement"
          >
            Upgrade to Premium
          </Button>
        </div>
      </div>
      <div className="opacity-20 h-48 bg-muted rounded-lg" />
    </div>
  );
}

function LineMovementContent({ 
  marketType, 
  selection, 
  openingLine, 
  currentLine, 
  data 
}: Omit<LineMovementChartProps, 'gameId' | 'showCard'>) {
  const lineChange = currentLine - openingLine;
  const isPositiveMove = lineChange > 0;
  const hasSignificantMove = Math.abs(lineChange) >= 1;
  
  const formatValue = (value: number) => {
    if (marketType === 'spread') {
      return value > 0 ? `+${value}` : `${value}`;
    }
    return value.toString();
  };

  return (
    <div data-testid="line-movement-chart">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{selection}</Badge>
          <Badge variant="secondary" className="text-xs capitalize">{marketType}</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Open:</span>
          <span className="font-mono font-semibold">{formatValue(openingLine)}</span>
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Now:</span>
          <span className={`font-mono font-bold ${hasSignificantMove 
            ? (isPositiveMove ? 'text-[#00FF7F]' : 'text-red-400')
            : 'text-foreground'
          }`}>
            {formatValue(currentLine)}
          </span>
          {hasSignificantMove && (
            isPositiveMove 
              ? <TrendingUp className="h-4 w-4 text-[#00FF7F]" />
              : <TrendingDown className="h-4 w-4 text-red-400" />
          )}
        </div>
      </div>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <XAxis 
              dataKey="timestamp" 
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatValue}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px'
              }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
              formatter={(value: number) => [formatValue(value), 'Line']}
            />
            <ReferenceLine 
              y={openingLine} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />
            <Line 
              type="stepAfter"
              dataKey="value" 
              stroke="#00CFFF"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#00CFFF' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {hasSignificantMove && (
        <div className={`mt-3 p-2 rounded-lg text-sm flex items-center gap-2 ${
          isPositiveMove 
            ? 'bg-[#00FF7F]/10 text-[#00FF7F]' 
            : 'bg-red-400/10 text-red-400'
        }`}>
          {isPositiveMove ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          <span>
            Line moved {Math.abs(lineChange).toFixed(1)} points {isPositiveMove ? 'up' : 'down'} since open
          </span>
        </div>
      )}
    </div>
  );
}

export default function LineMovementChart({
  marketType = 'spread',
  selection = 'Team A',
  openingLine = -3.5,
  currentLine = -5.5,
  data = MOCK_LINE_DATA,
  showCard = true
}: Partial<LineMovementChartProps>) {
  const { user } = useUser();
  const accessLevel: FeatureAccessLevel = getFeatureAccessLevel('line_movement', user);
  
  if (accessLevel === 'locked') {
    if (showCard) {
      return (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Line Movement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <LockedChart />
          </CardContent>
        </Card>
      );
    }
    return <LockedChart />;
  }
  
  if (showCard) {
    return (
      <Card data-testid="line-movement-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-[#00CFFF]" />
            Line Movement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LineMovementContent 
            marketType={marketType}
            selection={selection}
            openingLine={openingLine}
            currentLine={currentLine}
            data={data}
          />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <LineMovementContent 
      marketType={marketType}
      selection={selection}
      openingLine={openingLine}
      currentLine={currentLine}
      data={data}
    />
  );
}

export function LineMovementCompact({
  openingLine = -3.5,
  currentLine = -5.5,
}: {
  openingLine?: number;
  currentLine?: number;
}) {
  const { user } = useUser();
  const accessLevel: FeatureAccessLevel = getFeatureAccessLevel('line_movement', user);
  
  if (accessLevel === 'locked') {
    return (
      <div 
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
        data-testid="line-movement-compact-locked"
      >
        <Lock className="h-3.5 w-3.5" />
        <span>Line: ???</span>
      </div>
    );
  }
  
  const lineChange = currentLine - openingLine;
  const hasMove = Math.abs(lineChange) >= 0.5;
  
  return (
    <div 
      className="inline-flex items-center gap-1.5 text-sm"
      data-testid="line-movement-compact"
    >
      <Clock className="h-3.5 w-3.5 text-[#00CFFF]" />
      <span className="text-muted-foreground">Open:</span>
      <span className="font-mono text-foreground">{openingLine > 0 ? '+' : ''}{openingLine}</span>
      {hasMove && (
        <>
          <span className="text-muted-foreground/50">→</span>
          <span className={`font-mono font-semibold ${lineChange > 0 ? 'text-[#00FF7F]' : 'text-red-400'}`}>
            {currentLine > 0 ? '+' : ''}{currentLine}
          </span>
        </>
      )}
    </div>
  );
}
