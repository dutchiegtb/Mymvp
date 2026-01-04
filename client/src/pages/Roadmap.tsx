import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check, Clock, Rocket, Star, Zap } from "lucide-react";
import { SiDiscord, SiTelegram } from "react-icons/si";

export default function Roadmap() {
  const [, navigate] = useLocation();

  const phases = [
    {
      title: "Phase 1: Live Now",
      status: "complete",
      icon: <Check className="w-5 h-5" />,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      items: [
        "Real-time odds scanning (40+ sports)",
        "EV calculations and top picks",
        "Parlay builder",
        "Performance Simulator",
        "Social features (follow, like, comment)",
        "Gamification (XP, levels, badges)",
        "Polymarket prediction markets",
        "4-tier subscription system",
      ],
    },
    {
      title: "Phase 2: Next 30 Days",
      status: "in_progress",
      icon: <Clock className="w-5 h-5 animate-pulse" />,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      items: [
        { text: "Discord bot notifications", icon: <SiDiscord className="w-4 h-4" />, tier: "Premium+" },
        { text: "Telegram AI Assistant", icon: <SiTelegram className="w-4 h-4" />, tier: "Elite" },
        "Claude AI-powered betting advisor",
        "Instant high-EV alerts",
        "Basic analytics dashboard",
        "Quiet hours & notification settings",
      ],
    },
    {
      title: "Phase 3: Next 60-90 Days",
      status: "planned",
      icon: <Rocket className="w-5 h-5" />,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      items: [
        "Advanced analytics (ROI, CLV tracking)",
        "Data export (CSV/Excel)",
        "Line movement alerts",
        "Priority picks (early access for Elite)",
        "Custom filters and preferences",
        "Bankroll management tools",
        "API access for developers",
        "Mobile app (iOS & Android)",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Product Roadmap</h1>
            <p className="text-muted-foreground">
              We're constantly improving MVP. Here's what's coming next.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {phases.map((phase, phaseIndex) => (
            <Card 
              key={phase.title} 
              className={`${phase.borderColor} border-2`}
              data-testid={`card-phase-${phaseIndex}`}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${phase.bgColor} ${phase.color}`}>
                    {phase.icon}
                  </div>
                  <CardTitle className="text-xl">{phase.title}</CardTitle>
                  {phase.status === "complete" && (
                    <span className="ml-auto px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                      Complete
                    </span>
                  )}
                  {phase.status === "in_progress" && (
                    <span className="ml-auto px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-semibold">
                      In Progress
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {phase.items.map((item, itemIndex) => (
                    <li 
                      key={itemIndex} 
                      className="flex items-center gap-3"
                      data-testid={`list-item-${phaseIndex}-${itemIndex}`}
                    >
                      {phase.status === "complete" ? (
                        <Check className="w-4 h-4 text-green-400 shrink-0" />
                      ) : phase.status === "in_progress" ? (
                        <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <Star className="w-4 h-4 text-blue-400 shrink-0" />
                      )}
                      {typeof item === "string" ? (
                        <span>{item}</span>
                      ) : (
                        <span className="flex items-center gap-2">
                          {item.icon}
                          {item.text}
                          {item.tier && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">
                              {item.tier}
                            </span>
                          )}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 border-primary/30" data-testid="card-cta">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold mb-2">Want to influence our roadmap?</h3>
                <p className="text-muted-foreground">
                  Elite members get early access to new features and can vote on what we build next.
                </p>
              </div>
              <Button onClick={() => navigate("/dashboard?tab=pricing")} data-testid="button-upgrade-cta">
                Upgrade to Elite
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
