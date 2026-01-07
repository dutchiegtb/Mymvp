import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Cog, Plus, Trash2, Play, Save, Crown, ChevronRight, TrendingUp } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { getFeatureAccessLevel, type FeatureAccessLevel } from "@/lib/features";

interface SystemCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface BettingSystem {
  id: string;
  name: string;
  description?: string;
  conditions: SystemCondition[];
  sport: string;
  winRate?: number;
  roi?: number;
  sampleSize?: number;
  active: boolean;
}

interface SystemsBuilderProps {
  systems?: BettingSystem[];
  onSaveSystem?: (system: BettingSystem) => void;
}

const MOCK_SYSTEMS: BettingSystem[] = [
  {
    id: "1",
    name: "NBA Home Dogs After Loss",
    description: "Home underdogs that lost previous game by 10+",
    conditions: [
      { id: "c1", field: "spread", operator: ">", value: "0" },
      { id: "c2", field: "location", operator: "=", value: "home" },
      { id: "c3", field: "prev_margin", operator: "<", value: "-10" },
    ],
    sport: "NBA",
    winRate: 58.3,
    roi: 12.4,
    sampleSize: 127,
    active: true,
  },
  {
    id: "2",
    name: "NFL Thursday Unders",
    description: "Thursday Night Football unders",
    conditions: [
      { id: "c1", field: "day", operator: "=", value: "thursday" },
      { id: "c2", field: "bet_type", operator: "=", value: "under" },
    ],
    sport: "NFL",
    winRate: 55.8,
    roi: 8.2,
    sampleSize: 89,
    active: true,
  },
];

const CONDITION_FIELDS = [
  { value: "spread", label: "Spread" },
  { value: "total", label: "Total" },
  { value: "moneyline", label: "Moneyline" },
  { value: "location", label: "Home/Away" },
  { value: "day", label: "Day of Week" },
  { value: "rest_days", label: "Days of Rest" },
  { value: "prev_margin", label: "Previous Game Margin" },
  { value: "conference", label: "Conference Game" },
  { value: "division", label: "Division Game" },
  { value: "time", label: "Game Time" },
];

const OPERATORS = [
  { value: "=", label: "equals" },
  { value: "!=", label: "not equals" },
  { value: ">", label: "greater than" },
  { value: "<", label: "less than" },
  { value: ">=", label: "at least" },
  { value: "<=", label: "at most" },
];

function LockedView() {
  return (
    <Card data-testid="systems-builder-locked">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Cog className="h-4 w-4 text-muted-foreground" />
          Systems Builder
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
              <p className="font-semibold text-foreground">Custom Systems Builder</p>
              <p className="text-sm text-muted-foreground mb-3">
                Create and backtest your own betting systems
              </p>
              <Button 
                className="bg-[#FFCC00] text-black font-semibold border-[#FFCC00]"
                size="sm"
                data-testid="button-upgrade-systems"
              >
                Upgrade to Elite
              </Button>
            </div>
          </div>
          <div className="opacity-20 space-y-4 p-4">
            <div className="h-12 bg-muted rounded" />
            <div className="h-24 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SystemCard({ system }: { system: BettingSystem }) {
  return (
    <div 
      className="p-4 rounded-lg border border-muted bg-card hover-elevate transition-all cursor-pointer group"
      data-testid={`system-card-${system.id}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground group-hover:text-[#00CFFF] transition-colors">
              {system.name}
            </h3>
            {system.active && (
              <Badge className="text-xs bg-[#00FF7F]/20 text-[#00FF7F] border-[#00FF7F]/30">
                Active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{system.sport}</Badge>
            <span className="text-xs text-muted-foreground">
              {system.conditions.length} condition{system.conditions.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
      </div>
      
      {system.description && (
        <p className="text-sm text-muted-foreground mb-3">{system.description}</p>
      )}
      
      {system.winRate && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-md bg-muted/50">
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className={`font-mono font-bold ${system.winRate >= 55 ? 'text-[#00FF7F]' : 'text-foreground'}`}>
              {system.winRate.toFixed(1)}%
            </p>
          </div>
          <div className="p-2 rounded-md bg-muted/50">
            <p className="text-xs text-muted-foreground">ROI</p>
            <p className={`font-mono font-bold ${(system.roi || 0) > 0 ? 'text-[#00CFFF]' : 'text-red-400'}`}>
              {(system.roi || 0) > 0 ? '+' : ''}{(system.roi || 0).toFixed(1)}%
            </p>
          </div>
          <div className="p-2 rounded-md bg-muted/50">
            <p className="text-xs text-muted-foreground">Sample</p>
            <p className="font-mono font-semibold text-foreground">{system.sampleSize}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ConditionBuilder({ 
  conditions, 
  onChange 
}: { 
  conditions: SystemCondition[]; 
  onChange: (conditions: SystemCondition[]) => void;
}) {
  const addCondition = () => {
    onChange([
      ...conditions,
      { id: `c${Date.now()}`, field: 'spread', operator: '>', value: '' }
    ]);
  };
  
  const removeCondition = (id: string) => {
    onChange(conditions.filter(c => c.id !== id));
  };
  
  const updateCondition = (id: string, updates: Partial<SystemCondition>) => {
    onChange(conditions.map(c => c.id === id ? { ...c, ...updates } : c));
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Conditions</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={addCondition}
          className="gap-1"
          data-testid="button-add-condition"
        >
          <Plus className="h-3 w-3" />
          Add
        </Button>
      </div>
      
      {conditions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No conditions added yet. Click "Add" to create your first rule.
        </p>
      ) : (
        <div className="space-y-2">
          {conditions.map((condition, index) => (
            <div key={condition.id} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
              <span className="text-xs text-muted-foreground w-6">{index + 1}.</span>
              
              <Select
                value={condition.field}
                onValueChange={(v) => updateCondition(condition.id, { field: v })}
              >
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_FIELDS.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={condition.operator}
                onValueChange={(v) => updateCondition(condition.id, { operator: v })}
              >
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATORS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                value={condition.value}
                onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                placeholder="Value"
                className="w-24 h-8"
              />
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeCondition(condition.id)}
                className="h-8 w-8 text-muted-foreground hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SystemsContent({ systems = MOCK_SYSTEMS, onSaveSystem }: SystemsBuilderProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newSystem, setNewSystem] = useState<Partial<BettingSystem>>({
    name: '',
    sport: 'NBA',
    conditions: [],
  });
  
  const handleSave = () => {
    if (onSaveSystem && newSystem.name && newSystem.conditions) {
      onSaveSystem({
        id: `new-${Date.now()}`,
        name: newSystem.name,
        description: newSystem.description,
        sport: newSystem.sport || 'NBA',
        conditions: newSystem.conditions as SystemCondition[],
        active: true,
      });
      setIsCreating(false);
      setNewSystem({ name: '', sport: 'NBA', conditions: [] });
    }
  };
  
  return (
    <div className="space-y-6" data-testid="systems-builder">
      {!isCreating ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {systems.length} system{systems.length !== 1 ? 's' : ''} created
            </p>
            <Button 
              onClick={() => setIsCreating(true)} 
              className="gap-2 bg-[#00FF7F] text-black font-semibold border-[#00FF7F]"
              data-testid="button-create-system"
            >
              <Plus className="h-4 w-4" />
              New System
            </Button>
          </div>
          
          {systems.length === 0 ? (
            <div className="text-center py-12">
              <Cog className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-semibold text-foreground mb-2">No Systems Yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first betting system to start backtesting
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {systems.map(system => (
                <SystemCard key={system.id} system={system} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Create New System</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsCreating(false)}
            >
              Cancel
            </Button>
          </div>
          
          <div className="space-y-4 p-4 rounded-lg border border-muted bg-muted/30">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="system-name">System Name</Label>
                <Input
                  id="system-name"
                  value={newSystem.name}
                  onChange={(e) => setNewSystem({ ...newSystem, name: e.target.value })}
                  placeholder="e.g., NBA Home Dogs"
                  data-testid="input-system-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="system-sport">Sport</Label>
                <Select
                  value={newSystem.sport}
                  onValueChange={(v) => setNewSystem({ ...newSystem, sport: v })}
                >
                  <SelectTrigger id="system-sport" data-testid="select-system-sport">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NBA">NBA</SelectItem>
                    <SelectItem value="NFL">NFL</SelectItem>
                    <SelectItem value="MLB">MLB</SelectItem>
                    <SelectItem value="NHL">NHL</SelectItem>
                    <SelectItem value="NCAAB">NCAAB</SelectItem>
                    <SelectItem value="NCAAF">NCAAF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="system-desc">Description (optional)</Label>
              <Input
                id="system-desc"
                value={newSystem.description || ''}
                onChange={(e) => setNewSystem({ ...newSystem, description: e.target.value })}
                placeholder="Brief description of your system"
                data-testid="input-system-description"
              />
            </div>
            
            <ConditionBuilder
              conditions={(newSystem.conditions || []) as SystemCondition[]}
              onChange={(conditions) => setNewSystem({ ...newSystem, conditions })}
            />
            
            <div className="flex items-center gap-3 pt-4 border-t border-muted">
              <Button 
                variant="outline" 
                className="gap-2"
                disabled={(newSystem.conditions?.length || 0) === 0}
                data-testid="button-backtest"
              >
                <Play className="h-4 w-4" />
                Backtest
              </Button>
              <Button 
                onClick={handleSave}
                className="gap-2 bg-[#00FF7F] text-black font-semibold border-[#00FF7F]"
                disabled={!newSystem.name || (newSystem.conditions?.length || 0) === 0}
                data-testid="button-save-system"
              >
                <Save className="h-4 w-4" />
                Save System
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SystemsBuilder(props: SystemsBuilderProps) {
  const { user } = useUser();
  const accessLevel: FeatureAccessLevel = getFeatureAccessLevel('systems_builder', user);
  
  if (accessLevel === 'locked') {
    return <LockedView />;
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Cog className="h-4 w-4 text-[#00CFFF]" />
          Systems Builder
          <Badge className="ml-2 gap-1 text-xs bg-[#FFCC00]/20 text-[#FFCC00] border-[#FFCC00]/30">
            <Crown className="h-3 w-3" />
            Elite
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SystemsContent {...props} />
      </CardContent>
    </Card>
  );
}
