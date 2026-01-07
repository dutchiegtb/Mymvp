import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, TrendingUp, TrendingDown, Target, BarChart3, Zap, Crown } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { getFeatureAccessLevel, type FeatureAccessLevel } from "@/lib/features";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface CLVEntry {
  id: string;
  date: string;
  game: string;
  selection: string;
  oddsTaken: number;
  closingOdds: number;
  clv: number;
  result: 'win' | 'loss' | 'push';
}

interface CLVSummary {
  avgCLV: number;
  totalBets: number;
  positiveCLVRate: number;
  expectedROI: number;
}

interface CLVDashboardProps {
  entries?: CLVEntry[];
  summary?: CLVSummary;
  chartData?: { date: string; clv: number; cumulative: number }[];
}

const MOCK_ENTRIES: CLVEntry[] = [
  { id: "1", date: "Jan 7", game: "Lakers vs Celtics", selection: "Lakers +4.5", oddsTaken: -110, closingOdds: -125, clv: 2.8, result: "win" },
  { id: "2", date: "Jan 6", game: "Chiefs vs Bills", selection: "Over 48.5", oddsTaken: -105, closingOdds: -115, clv: 1.9, result: "loss" },
  { id: "3", date: "Jan 6", game: "Yankees vs Red Sox", selection: "Yankees ML", oddsTaken: -135, closingOdds: -145, clv: 1.5, result: "win" },
  { id: "4", date: "Jan 5", game: "Warriors vs Suns", selection: "Under 228.5", oddsTaken: -108, closingOdds: -102, clv: -1.2, result: "loss" },
  { id: "5", date: "Jan 5", game: "Eagles vs Cowboys", selection: "Eagles -3", oddsTaken: -110, closingOdds: -120, clv: 2.1, result: "win" },
];

const MOCK_SUMMARY: CLVSummary = {
  avgCLV: 1.42,
  totalBets: 127,
  positiveCLVRate: 68.5,
  expectedROI: 4.8,
};

const MOCK_CHART_DATA = [
  { date: "Dec 1", clv: 0.8, cumulative: 0.8 },
  { date: "Dec 8", clv: 1.2, cumulative: 2.0 },
  { date: "Dec 15", clv: -0.5, cumulative: 1.5 },
  { date: "Dec 22", clv: 1.8, cumulative: 3.3 },
  { date: "Dec 29", clv: 0.9, cumulative: 4.2 },
  { date: "Jan 5", clv: 1.5, cumulative: 5.7 },
];

function formatOdds(odds: number): string {
  return odds >= 0 ? `+${odds}` : `${odds}`;
}

function LockedView() {
  return (
    <Card data-testid="clv-dashboard-locked">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-muted-foreground" />
          CLV Tracking
          <Badge variant="outline" className="ml-2 gap-1 text-xs text-[#FFCC00] border-[#FFCC00]/30">
            <Crown className="h-3 w-3" />
            Elite
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-hidden rounded-lg">
          <div className="absolute inset-0 backdrop-blur-sm bg-background/70 z-10 flex flex-col items-center justify-center gap-3 p-6">
            <div className="p-3 rounded-full bg-[#FFCC00]/10">
              <Crown className="h-8 w-8 text-[#FFCC00]" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Closing Line Value Tracking</p>
              <p className="text-sm text-muted-foreground mb-3">
                Track your edge against the closing line
              </p>
              <Button 
                className="bg-[#FFCC00] text-black font-semibold border-[#FFCC00]"
                size="sm"
                data-testid="button-upgrade-clv"
              >
                Upgrade to Elite
              </Button>
            </div>
          </div>
          <div className="opacity-20 space-y-4 p-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="h-20 bg-muted rounded" />
              <div className="h-20 bg-muted rounded" />
              <div className="h-20 bg-muted rounded" />
              <div className="h-20 bg-muted rounded" />
            </div>
            <div className="h-48 bg-muted rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CLVContent({ 
  entries = MOCK_ENTRIES, 
  summary = MOCK_SUMMARY,
  chartData = MOCK_CHART_DATA
}: CLVDashboardProps) {
  const isPositiveAvgCLV = summary.avgCLV > 0;
  
  return (
    <div className="space-y-6" data-testid="clv-dashboard">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-muted/30 border border-muted text-center">
          <p className="text-xs text-muted-foreground mb-1">Avg CLV</p>
          <p className={`text-2xl font-mono font-bold ${isPositiveAvgCLV ? 'text-[#00FF7F]' : 'text-red-400'}`}>
            {isPositiveAvgCLV ? '+' : ''}{summary.avgCLV.toFixed(2)}%
          </p>
        </div>
        <div className="p-4 rounded-lg bg-muted/30 border border-muted text-center">
          <p className="text-xs text-muted-foreground mb-1">Total Bets</p>
          <p className="text-2xl font-mono font-bold text-foreground">{summary.totalBets}</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/30 border border-muted text-center">
          <p className="text-xs text-muted-foreground mb-1">+CLV Rate</p>
          <p className={`text-2xl font-mono font-bold ${summary.positiveCLVRate >= 50 ? 'text-[#00CFFF]' : 'text-red-400'}`}>
            {summary.positiveCLVRate.toFixed(1)}%
          </p>
        </div>
        <div className="p-4 rounded-lg bg-muted/30 border border-muted text-center">
          <p className="text-xs text-muted-foreground mb-1">Expected ROI</p>
          <p className={`text-2xl font-mono font-bold ${summary.expectedROI > 0 ? 'text-[#00FF7F]' : 'text-red-400'}`}>
            {summary.expectedROI > 0 ? '+' : ''}{summary.expectedROI.toFixed(1)}%
          </p>
        </div>
      </div>
      
      <div className="p-4 rounded-lg border border-muted bg-card">
        <p className="text-sm font-medium mb-4 text-muted-foreground">CLV Over Time</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="clvGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00FF7F" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00FF7F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Cumulative CLV']}
              />
              <Area 
                type="monotone" 
                dataKey="cumulative" 
                stroke="#00FF7F" 
                strokeWidth={2}
                fill="url(#clvGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div>
        <p className="text-sm font-medium mb-3 text-muted-foreground">Recent Bets</p>
        <div className="space-y-2">
          {entries.slice(0, 5).map((entry) => (
            <div 
              key={entry.id}
              className="flex items-center justify-between gap-3 p-3 rounded-lg border border-muted bg-card text-sm"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  entry.clv > 0 ? 'bg-[#00FF7F]/20' : 'bg-red-400/20'
                }`}>
                  {entry.clv > 0 
                    ? <TrendingUp className="h-4 w-4 text-[#00FF7F]" />
                    : <TrendingDown className="h-4 w-4 text-red-400" />
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{entry.selection}</p>
                  <p className="text-xs text-muted-foreground truncate">{entry.game}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-right">
                <div>
                  <p className="text-xs text-muted-foreground">Taken → Close</p>
                  <p className="font-mono text-xs">
                    {formatOdds(entry.oddsTaken)} → {formatOdds(entry.closingOdds)}
                  </p>
                </div>
                <div className="min-w-[60px]">
                  <p className={`font-mono font-bold ${entry.clv > 0 ? 'text-[#00FF7F]' : 'text-red-400'}`}>
                    {entry.clv > 0 ? '+' : ''}{entry.clv.toFixed(1)}%
                  </p>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      entry.result === 'win' 
                        ? 'text-[#00FF7F] border-[#00FF7F]/30' 
                        : entry.result === 'loss' 
                          ? 'text-red-400 border-red-400/30'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {entry.result}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-3 rounded-lg bg-[#FFCC00]/5 border border-[#FFCC00]/20 text-sm text-muted-foreground">
        <div className="flex items-start gap-2">
          <Zap className="h-4 w-4 text-[#FFCC00] mt-0.5" />
          <p>
            <span className="font-semibold text-foreground">Pro Tip:</span> Consistently beating the closing line is the best indicator of long-term profitability. 
            Even with short-term variance, +CLV bettors are expected to profit over time.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CLVDashboard(props: CLVDashboardProps) {
  const { user } = useUser();
  const accessLevel: FeatureAccessLevel = getFeatureAccessLevel('clv_tracking', user);
  
  if (accessLevel === 'locked') {
    return <LockedView />;
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-[#00FF7F]" />
          CLV Tracking
          <Badge className="ml-2 gap-1 text-xs bg-[#FFCC00]/20 text-[#FFCC00] border-[#FFCC00]/30">
            <Crown className="h-3 w-3" />
            Elite
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CLVContent {...props} />
      </CardContent>
    </Card>
  );
}
