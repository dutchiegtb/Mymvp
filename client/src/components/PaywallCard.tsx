import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Check } from "lucide-react";

interface PaywallCardProps {
  tierName: string;
  benefits: string[];
  price?: string;
}

export default function PaywallCard({ tierName, benefits, price }: PaywallCardProps) {
  return (
    <Card className="relative overflow-hidden" data-testid="card-paywall">
      <div className="absolute inset-0 backdrop-blur-sm bg-background/80 z-10 flex items-center justify-center">
        <div className="text-center space-y-4 p-6">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Unlock with {tierName}</h3>
            {price && <p className="text-2xl font-bold text-primary">{price}</p>}
          </div>
          <ul className="space-y-2 text-sm">
            {benefits.slice(0, 3).map((benefit, i) => (
              <li key={i} className="flex items-center gap-2 justify-center">
                <Check className="h-4 w-4 text-success" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
          <Button className="w-full" data-testid="button-upgrade">
            Upgrade Now
          </Button>
        </div>
      </div>
      <CardHeader>
        <CardTitle>Premium Content</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-32 flex items-center justify-center text-muted-foreground">
          Blurred preview content...
        </div>
      </CardContent>
    </Card>
  );
}
