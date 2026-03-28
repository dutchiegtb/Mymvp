import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Hero from "@/components/Hero";
import FeatureCard from "@/components/FeatureCard";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Zap,
  Calculator,
  BarChart3,
  Target,
  TrendingUp,
  GitCompare,
} from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: Zap,
      title: "Real-Time Odds Scanning",
      description: "Get instant updates from 30+ sportsbooks with our lightning-fast scanning engine.",
    },
    {
      icon: Calculator,
      title: "EV Calculator",
      description: "Advanced Expected Value calculations identify the most profitable betting opportunities.",
    },
    {
      icon: BarChart3,
      title: "Multi-Book Comparison",
      description: "Compare lines across all major sportsbooks side-by-side in one clean interface.",
    },
    {
      icon: GitCompare,
      title: "Parlay Builder",
      description: "Combine your best picks into parlays and see combined odds and potential payouts instantly.",
    },
    {
      icon: Target,
      title: "Confidence Scoring",
      description: "Each pick comes with a confidence score based on the size of the EV edge detected.",
    },
    {
      icon: TrendingUp,
      title: "Open Source",
      description: "Free and open source. Run it locally, deploy it yourself, or contribute to the project.",
    },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">MVP</span>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium hover:text-primary px-3 py-2 rounded-md">
                Features
              </a>
              <Link href="/dashboard" className="text-sm font-medium hover:text-primary px-3 py-2 rounded-md">
                Dashboard
              </Link>
              <a href="https://github.com/dutchiegtb/Mymvp" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-primary px-3 py-2 rounded-md">
                GitHub
              </a>
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/dashboard">
                <Button>Open Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <Hero />

      <section id="features" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Find Value
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional-grade tools that help you identify value and make smarter betting decisions — completely free and open source.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={i} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-r from-primary via-secondary to-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-background/10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
            Ready to Start Finding Value?
          </h2>
          <p className="text-lg text-primary-foreground/90">
            No sign-up required. Just open the dashboard and start scanning.
          </p>
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Link href="/dashboard">
              <Button size="lg" className="gap-2 bg-background text-foreground hover:bg-background/90 border-2 border-primary">
                Open Dashboard
                <TrendingUp className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">MVP</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Open source · MIT License · Built by{" "}
              <a href="https://github.com/dutchiegtb" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                @dutchiegtb
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
