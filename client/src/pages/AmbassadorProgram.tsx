import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/ThemeToggle";
import {
  TrendingUp,
  Crown,
  DollarSign,
  Users,
  Zap,
  Gift,
  Calendar,
  MessageSquare,
  Star,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Trophy,
  Target,
  BarChart3,
  Clock,
  Shield,
} from "lucide-react";
import { SiDiscord, SiTelegram } from "react-icons/si";

export default function AmbassadorProgram() {
  const commissionTiers = [
    { tier: "Basic", price: "$9.99/mo", earnings: "$2.00/mo" },
    { tier: "Premium", price: "$19.99/mo", earnings: "$4.00/mo" },
    { tier: "Elite", price: "$49.99/mo", earnings: "$10.00/mo" },
  ];

  const earningsExamples = [
    { referrals: "10 users", mix: "8 Premium, 2 Elite", monthly: "$52", annual: "$624" },
    { referrals: "25 users", mix: "18 Premium, 7 Elite", monthly: "$142", annual: "$1,704" },
    { referrals: "50 users", mix: "30 Premium, 20 Elite", monthly: "$320", annual: "$3,840" },
    { referrals: "100 users", mix: "60 Premium, 40 Elite", monthly: "$640", annual: "$7,680" },
  ];

  const eliteFeatures = [
    "Unlimited EV picks daily across 40+ sports + Polymarket",
    "Telegram AI Assistant powered by Claude (24/7 betting advisor)",
    "Advanced analytics dashboard with ROI and CLV tracking",
    "Instant priority alerts for high-EV picks",
    "Complete Performance Simulator with data export",
    "Discord bot with real-time notifications",
    "Priority customer support (1-hour response time)",
    "Early access to all new features",
  ];

  const programPerks = [
    { icon: Crown, title: "Official MVP Ambassador Badge", desc: "Gold profile highlight and custom styling" },
    { icon: MessageSquare, title: "Private Ambassador Discord", desc: "Connect with other top performers" },
    { icon: Calendar, title: "Monthly Strategy Calls", desc: "Group sessions with founders" },
    { icon: Gift, title: "Co-Marketing Opportunities", desc: "Guest posts, interviews, features" },
    { icon: Zap, title: "Early Beta Access", desc: "2 weeks before public release" },
    { icon: Users, title: "Dedicated Success Manager", desc: "Personal support for growth" },
  ];

  const ambassadorTiers = [
    { icon: "🥉", name: "Rookie", range: "1-10 referrals", perk: "Basic support" },
    { icon: "🥈", name: "Pro", range: "11-25 referrals", perk: "Priority channel access" },
    { icon: "🥇", name: "Elite", range: "26-50 referrals", perk: "Monthly 1-on-1 calls" },
    { icon: "💎", name: "Legend", range: "51-100 referrals", perk: "Homepage feature + custom swag" },
    { icon: "👑", name: "Icon", range: "100+ referrals", perk: "Revenue share on new products" },
  ];

  const bonuses = [
    { milestone: "5 Elite users in 30 days", bonus: "$150" },
    { milestone: "25 total referrals", bonus: "$300" },
    { milestone: "50 total referrals", bonus: "$500" },
    { milestone: "100 total referrals", bonus: "$1,500 + homepage feature" },
  ];

  const whoItsFor = [
    "Sports betting content creators and influencers",
    "YouTube channels covering sports or betting",
    "TikTok creators in the sports niche",
    "Twitter/X personalities with engaged sports followers",
    "Discord server owners with betting communities",
    "Podcast hosts discussing sports betting",
    "Bloggers writing about sports betting strategy",
    "Anyone with an audience interested in profitable betting",
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">MVP</span>
            </Link>

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

      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-primary/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-4 border-amber-500/50 text-amber-400">
              <Crown className="w-3 h-3 mr-1" /> Limited to 50 Founding Ambassadors
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              MVP Brand Ambassador Program
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join an exclusive group of sports betting influencers earning recurring income 
              while helping bettors find profitable opportunities. <strong>Pay once, earn forever.</strong>
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <div className="bg-card border rounded-2xl p-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">One-Time Investment</p>
                <p className="text-5xl font-bold text-primary">$749</p>
                <p className="text-sm text-muted-foreground mt-1">Lifetime access + commissions</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" className="text-lg px-8" data-testid="button-become-ambassador">
                <Crown className="w-5 h-5 mr-2" />
                Become an Ambassador - $749
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" data-testid="button-see-success-stories">
                See Success Stories
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What You Get</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/20 rounded-xl">
                    <Crown className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Lifetime Elite Membership</CardTitle>
                    <CardDescription>Value: $599.88/year - Yours forever</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Get immediate access to everything MVP Elite offers, forever. Never pay a subscription fee again.
                </p>
                <ul className="space-y-2">
                  {eliteFeatures.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">20% Lifetime Recurring Commission</CardTitle>
                    <CardDescription>Earn every month they stay subscribed</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Earn on every customer you refer, every month they stay subscribed. Commissions continue forever.
                </p>
                
                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium mb-3">Your Earnings Per Referral:</p>
                  <div className="space-y-2">
                    {commissionTiers.map((tier, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span>{tier.tier} referrals ({tier.price})</span>
                        <span className="font-bold text-green-400">{tier.earnings}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Refer 50 users? Earn <span className="text-green-400 font-semibold">$320/month</span> passive income</p>
                  <p>Refer 100 users? Earn <span className="text-green-400 font-semibold">$640/month</span> passive income</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Your Earning Potential</h2>
            <p className="text-muted-foreground">Real numbers based on 20% lifetime commission</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Total Referrals</th>
                  <th className="text-left py-3 px-4">Tier Mix</th>
                  <th className="text-right py-3 px-4">Monthly Income</th>
                  <th className="text-right py-3 px-4">Annual Income</th>
                </tr>
              </thead>
              <tbody>
                {earningsExamples.map((example, i) => (
                  <tr key={i} className="border-b hover-elevate">
                    <td className="py-4 px-4 font-medium">{example.referrals}</td>
                    <td className="py-4 px-4 text-muted-foreground">{example.mix}</td>
                    <td className="py-4 px-4 text-right text-green-400 font-semibold">{example.monthly}/mo</td>
                    <td className="py-4 px-4 text-right text-green-400 font-bold">{example.annual}/yr</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  5,000 Followers Example
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>If 2% of your followers convert (100 referrals):</p>
                <p className="text-green-400 font-semibold text-lg">~$640/month | ~$7,680/year</p>
                <p className="text-muted-foreground">Break even in 2 months, profit $6,931 in year 1</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  20,000 Followers Example
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>If 1.5% of your followers convert (300 referrals):</p>
                <p className="text-green-400 font-semibold text-lg">~$1,920/month | ~$23,040/year</p>
                <p className="text-muted-foreground">Break even in 1 month, profit $22,291 in year 1</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                <Calendar className="w-8 h-8 text-primary" />
                Weekly Automatic Payouts
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Get paid every Friday via Stripe Connect</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Minimum payout: $25</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Direct deposit to your bank account</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Transparent dashboard showing all earnings</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Real-time referral tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Monthly performance reports</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                <Gift className="w-8 h-8 text-amber-400" />
                Performance Bonuses
              </h2>
              <p className="text-muted-foreground mb-4">Earn extra cash for hitting milestones:</p>
              <div className="space-y-3">
                {bonuses.map((b, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                    <span>{b.milestone}</span>
                    <Badge variant="outline" className="text-amber-400 border-amber-400/50 font-bold">
                      {b.bonus}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Ambassador Tier System</h2>
            <p className="text-muted-foreground">Climb the ranks and unlock more perks</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {ambassadorTiers.map((tier, i) => (
              <Card key={i} className="text-center hover-elevate">
                <CardContent className="pt-6">
                  <div className="text-4xl mb-2">{tier.icon}</div>
                  <h3 className="font-bold text-lg">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{tier.range}</p>
                  <p className="text-xs text-primary">{tier.perk}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Exclusive Ambassador Perks</h2>
            <p className="text-muted-foreground">Access reserved for ambassadors only</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programPerks.map((perk, i) => (
              <Card key={i} className="hover-elevate">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <perk.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{perk.title}</h3>
                      <p className="text-sm text-muted-foreground">{perk.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                <BarChart3 className="w-8 h-8 text-primary" />
                Complete Marketing Toolkit
              </h2>
              <ul className="space-y-3">
                {[
                  "Custom promo code with your name",
                  "Branded social media graphics and templates",
                  "Pre-written captions and hooks",
                  "Video scripts and talking points",
                  "Email swipe copy for your list",
                  "Banner ads in multiple sizes",
                  "Landing page with your tracking link",
                  "Real-time analytics dashboard",
                  "A/B tested conversion copy",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                <Users className="w-8 h-8 text-primary" />
                Who This Is For
              </h2>
              <ul className="space-y-3">
                {whoItsFor.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <ArrowRight className="w-5 h-5 text-primary mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Program Terms</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            {[
              "One-time $749 payment (no recurring fees)",
              "Lifetime Elite access starting immediately",
              "20% commission on all paid tiers",
              "Weekly payouts every Friday",
              "$25 minimum payout threshold",
              "30-day cookie tracking window",
              "Commission applies to new customers only",
              "Refunds within 30 days reverse commission",
              "Upgrades increase your commission",
              "Downgrades decrease commission (but still earn)",
              "You keep earning as long as they're subscribed",
            ].map((term, i) => (
              <div key={i} className="flex items-start gap-2 p-2">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{term}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-transparent">
            <CardContent className="pt-8 pb-8 text-center">
              <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Risk-Free Decision</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                If you can't refer at least 10 users within your first 90 days, we'll give you a 
                <strong className="text-foreground"> full refund</strong>. No questions asked. 
                We believe in this program and know you'll succeed.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="outline" className="mb-4 border-amber-500/50 text-amber-400">
            <Sparkles className="w-3 h-3 mr-1" /> Limited Availability
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Build Passive Income While Helping Bettors Win?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            We're accepting only 50 ambassadors in our founding cohort. Join now to lock in these 
            terms before we raise the price or lower the commission rate.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button size="lg" className="text-lg px-8" data-testid="button-join-ambassador">
              <Crown className="w-5 h-5 mr-2" />
              Become an Ambassador - $749
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Questions? Email: <a href="mailto:ambassadors@mvpsportsbetting.com" className="text-primary hover:underline">ambassadors@mvpsportsbetting.com</a></p>
            <p>We respond within 1 hour.</p>
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">MVP</span>
            </div>
            <p className="text-sm text-muted-foreground">
              MVP does not accept bets or hold funds. All results are simulated for educational purposes.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
