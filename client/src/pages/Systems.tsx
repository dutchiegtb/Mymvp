import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Cog, Target, Crown } from "lucide-react";
import SystemsBuilder from "@/components/features/SystemsBuilder";
import CLVDashboard from "@/components/features/CLVDashboard";
import ThemeToggle from "@/components/ThemeToggle";
import { useUser } from "@/hooks/useUser";
import { getFeatureAccessLevel } from "@/lib/features";

export default function Systems() {
  const { user } = useUser();
  const clvAccess = getFeatureAccessLevel('clv_tracking', user);
  const systemsAccess = getFeatureAccessLevel('systems_builder', user);
  const isElite = clvAccess === 'full' || systemsAccess === 'full';
  
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
              <Cog className="h-5 w-5 text-[#00CFFF]" />
              <h1 className="text-lg font-bold">Advanced Tools</h1>
              <Badge className="gap-1 bg-[#FFCC00]/20 text-[#FFCC00] border-[#FFCC00]/30">
                <Crown className="h-3 w-3" />
                Elite
              </Badge>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>
      
      <main className="container px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Elite Analytics</h2>
          <p className="text-muted-foreground">
            Advanced tools for serious bettors: CLV tracking and custom systems
          </p>
        </div>
        
        <Tabs defaultValue="clv" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="clv" className="gap-2" data-testid="tab-clv">
              <Target className="h-4 w-4" />
              CLV Tracking
            </TabsTrigger>
            <TabsTrigger value="systems" className="gap-2" data-testid="tab-systems">
              <Cog className="h-4 w-4" />
              Systems Builder
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="clv">
            <CLVDashboard />
          </TabsContent>
          
          <TabsContent value="systems">
            <SystemsBuilder />
          </TabsContent>
        </Tabs>
        
        {!isElite && (
          <div className="mt-8 p-6 rounded-lg border-2 border-dashed border-[#FFCC00]/30 bg-[#FFCC00]/5 text-center">
            <Crown className="h-12 w-12 text-[#FFCC00] mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Upgrade to Elite</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Get access to CLV tracking, custom systems builder, and all Premium features. 
              Elite members see an average 15% improvement in their betting performance.
            </p>
            <Link href="/settings">
              <Button 
                className="bg-[#FFCC00] text-black font-semibold border-[#FFCC00]"
                data-testid="button-upgrade-elite"
              >
                Upgrade to Elite
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
