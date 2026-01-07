import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BookOpen, Flame, Filter, TrendingUp } from "lucide-react";
import TrendsLibrary from "@/components/features/TrendsLibrary";
import HoldCalculator from "@/components/features/HoldCalculator";
import ThemeToggle from "@/components/ThemeToggle";
import { useUser } from "@/hooks/useUser";

const SPORTS = ['all', 'NBA', 'NFL', 'MLB', 'NHL', 'NCAAB', 'NCAAF'];
const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'situational', label: 'Situational' },
  { value: 'team', label: 'Team' },
  { value: 'player', label: 'Player' },
  { value: 'official', label: 'Official' },
];

export default function Trends() {
  const { user } = useUser();
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-dashboard">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#00CFFF]" />
              <h1 className="text-lg font-bold">Trends Library</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>
      
      <main className="container px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Betting Trends & Analytics</h2>
          <p className="text-muted-foreground">
            Explore historical betting trends, calculate vig, and find profitable patterns
          </p>
        </div>
        
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="trends" className="gap-2" data-testid="tab-trends">
              <TrendingUp className="h-4 w-4" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="calculator" className="gap-2" data-testid="tab-calculator">
              <Filter className="h-4 w-4" />
              Hold Calculator
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="trends" className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sport:</span>
                <div className="flex flex-wrap gap-1">
                  {SPORTS.map(sport => (
                    <Button
                      key={sport}
                      variant={selectedSport === sport ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedSport(sport)}
                      data-testid={`button-sport-${sport}`}
                    >
                      {sport === 'all' ? 'All Sports' : sport}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Category:</span>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[150px]" data-testid="select-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <TrendsLibrary 
              sport={selectedSport} 
              category={selectedCategory === 'all' ? undefined : selectedCategory} 
            />
          </TabsContent>
          
          <TabsContent value="calculator" className="max-w-md">
            <HoldCalculator />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
