import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Card className="hover-elevate" data-testid="card-feature">
      <CardContent className="pt-6 space-y-4">
        <div className="h-16 w-16 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold" data-testid="text-feature-title">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-feature-description">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
