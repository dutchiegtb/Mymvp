import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface Feature {
  name: string;
  included: boolean;
}

interface PricingCardProps {
  tierName: string;
  price: string;
  priceSubtext?: string;
  features: Feature[];
  isPopular?: boolean;
  ctaText?: string;
}

export default function PricingCard({
  tierName,
  price,
  priceSubtext = "/month",
  features,
  isPopular = false,
  ctaText = "Get Started",
}: PricingCardProps) {
  return (
    <Card
      className={`relative ${isPopular ? 'border-primary shadow-lg' : ''}`}
      data-testid={`card-pricing-${tierName.toLowerCase()}`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
            Most Popular
          </div>
        </div>
      )}
      <CardHeader className="text-center space-y-2 pb-8">
        <CardTitle className="text-2xl" data-testid="text-tier-name">{tierName}</CardTitle>
        <div className="space-y-1">
          <div className="text-4xl font-bold" data-testid="text-price">{price}</div>
          <div className="text-sm text-muted-foreground">{priceSubtext}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3" data-testid={`list-feature-${i}`}>
              {feature.included ? (
                <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
              ) : (
                <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <span className={feature.included ? '' : 'text-muted-foreground line-through'}>
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={isPopular ? 'default' : 'outline'}
          data-testid="button-cta"
        >
          {ctaText}
        </Button>
      </CardFooter>
    </Card>
  );
}
