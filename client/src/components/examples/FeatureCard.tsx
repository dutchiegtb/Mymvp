import FeatureCard from '../FeatureCard';
import { Zap } from 'lucide-react';

export default function FeatureCardExample() {
  return (
    <div className="p-4 max-w-sm">
      <FeatureCard
        icon={Zap}
        title="Real-Time Odds Scanning"
        description="Get instant updates from 30+ sportsbooks with our lightning-fast scanning engine."
      />
    </div>
  );
}
