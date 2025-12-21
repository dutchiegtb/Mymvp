import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Hero from "@/components/Hero";
import FeatureCard from "@/components/FeatureCard";
import PricingCard from "@/components/PricingCard";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Zap,
  Calculator,
  BarChart3,
  MessageSquare,
  Bell,
  Target,
  TrendingUp,
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
      icon: MessageSquare,
      title: "Discord Integration",
      description: "Get instant picks and alerts directly in your Discord server with slash commands.",
    },
    {
      icon: Bell,
      title: "Line Movement Alerts",
      description: "Receive notifications when odds shift in your favor or EV spikes occur.",
    },
    {
      icon: Target,
      title: "Sharp Picks",
      description: "Access professional-grade betting insights with our curated sharp picks.",
    },
  ];

  const pricingTiers = [
    {
      tierName: "Free",
      price: "$0",
      features: [
        { name: "1-2 picks per day", included: true },
        { name: "Delayed data (15 min)", included: true },
        { name: "Limited props", included: true },
        { name: "EV rankings", included: false },
        { name: "Live data", included: false },
        { name: "Discord bot", included: false },
      ],
      ctaText: "Get Started",
    },
    {
      tierName: "Pro",
      price: "$9.99",
      features: [
        { name: "All props & live data", included: true },
        { name: "EV rankings", included: true },
        { name: "Custom book filters", included: true },
        { name: "Priority support", included: true },
        { name: "Discord bot access", included: false },
        { name: "Line movement alerts", included: false },
      ],
      isPopular: true,
      ctaText: "Start 7-Day Trial",
    },
    {
      tierName: "Premium",
      price: "$24.99",
      features: [
        { name: "Everything in Pro", included: true },
        { name: "Sharp picks", included: true },
        { name: "Discord bot access", included: true },
        { name: "Line movement alerts", included: true },
        { name: "Parlay builder", included: true },
        { name: "Priority alerts", included: true },
      ],
      ctaText: "Start 7-Day Trial",
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
              <Link href="#features" className="text-sm font-medium hover-elevate px-3 py-2 rounded-md">
                Features
              </Link>
              <Link href="#pricing" className="text-sm font-medium hover-elevate px-3 py-2 rounded-md">
                Pricing
              </Link>
              <Link href="/dashboard" className="text-sm font-medium hover-elevate px-3 py-2 rounded-md" data-testid="link-dashboard">
                Dashboard
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/login">
                <Button variant="outline" data-testid="button-sign-in">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button data-testid="button-get-started">Get Started</Button>
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
              Everything You Need to Win
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional-grade tools that help you identify value and make smarter betting decisions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={i} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your betting strategy. All plans include access to our core features.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingTiers.map((tier, i) => (
              <PricingCard key={i} {...tier} />
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
            Join thousands of smart bettors using MVP to maximize their edge.
          </p>
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Button size="lg" className="gap-2 bg-background text-foreground hover:bg-background/90 border-2 border-primary" data-testid="button-cta-start">
              Start Free Trial
              <TrendingUp className="h-4 w-4" />
            </Button>
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
              © 2025 MVP. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
