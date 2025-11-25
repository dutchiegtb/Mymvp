import { Badge } from "@/components/ui/badge";

export type SubscriptionTier = "free" | "tier1" | "tier2" | "tier3";

interface SubscriptionBadgeProps {
  tier: SubscriptionTier;
  className?: string;
}

const tierConfig = {
  free: {
    label: "Free",
    className: "bg-muted text-muted-foreground",
  },
  tier1: {
    label: "Pro",
    className: "bg-gradient-to-r from-secondary to-primary text-foreground font-semibold",
  },
  tier2: {
    label: "Premium",
    className: "bg-gradient-to-r from-warning to-primary text-foreground font-semibold",
  },
  tier3: {
    label: "Elite",
    className: "bg-gradient-to-r from-chart-4 to-warning text-foreground font-semibold",
  },
};

export default function SubscriptionBadge({ tier, className = "" }: SubscriptionBadgeProps) {
  const config = tierConfig[tier];
  
  return (
    <Badge 
      className={`${config.className} ${className} no-default-hover-elevate no-default-active-elevate`}
      data-testid={`badge-subscription-${tier}`}
    >
      {config.label}
    </Badge>
  );
}
