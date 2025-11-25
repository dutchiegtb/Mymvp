import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              <span>Trusted by 10,000+ bettors</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold leading-tight" data-testid="text-hero-title">
              Find The Best Betting Value In Seconds
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed" data-testid="text-hero-subtitle">
              Compare odds across 30+ sportsbooks in real-time. Our EV calculator identifies profitable opportunities so you can make smarter bets.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="gap-2" data-testid="button-start-trial">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" data-testid="button-view-sample">
                View Sample Picks
              </Button>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold text-primary">$2M+</div>
                <div className="text-sm text-muted-foreground">Value Found</div>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div>
                <div className="text-3xl font-bold text-primary">30+</div>
                <div className="text-sm text-muted-foreground">Sportsbooks</div>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div>
                <div className="text-3xl font-bold text-primary">5</div>
                <div className="text-sm text-muted-foreground">Major Sports</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/3] rounded-lg border bg-card p-4 shadow-lg">
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-2">
                  <TrendingUp className="h-16 w-16 mx-auto text-primary" />
                  <p className="text-sm">Live Dashboard Preview</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 h-32 w-32 bg-primary/20 rounded-full blur-3xl"></div>
            <div className="absolute -top-6 -left-6 h-32 w-32 bg-success/20 rounded-full blur-3xl"></div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t">
          <p className="text-sm text-muted-foreground text-center mb-6">Supported Sportsbooks</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            <div className="h-8 px-4 flex items-center justify-center bg-muted rounded text-xs font-semibold">FanDuel</div>
            <div className="h-8 px-4 flex items-center justify-center bg-muted rounded text-xs font-semibold">DraftKings</div>
            <div className="h-8 px-4 flex items-center justify-center bg-muted rounded text-xs font-semibold">BetMGM</div>
            <div className="h-8 px-4 flex items-center justify-center bg-muted rounded text-xs font-semibold">Caesars</div>
            <div className="h-8 px-4 flex items-center justify-center bg-muted rounded text-xs font-semibold">bet365</div>
            <div className="h-8 px-4 flex items-center justify-center bg-muted rounded text-xs font-semibold">PrizePicks</div>
            <div className="h-8 px-4 flex items-center justify-center bg-muted rounded text-xs font-semibold">Underdog</div>
          </div>
        </div>
      </div>
    </div>
  );
}
