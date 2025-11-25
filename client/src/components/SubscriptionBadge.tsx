import { Badge } from "@/components/ui/badge";

export type SubscriptionTier = "free" | "tier1" | "tier2" | "tier3";

interface SubscriptionBadgeProps {
  tier: SubscriptionTier;
  className?: string;
}

const tierConfig = {
  free: {
    label: "Free",
    className: "bg-secondary text-secondary-foreground",
  },
  tier1: {
    label: "Pro",
    className: "bg-gradient-to-r from-blue-500 to-purple-500 text-white",
  },
  tier2: {
    label: "Premium",
    className: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
  },
  tier3: {
    label: "Elite",
    className: "bg-gradient-to-r from-slate-700 to-slate-900 text-white",
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
