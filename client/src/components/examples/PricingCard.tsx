import PricingCard from '../PricingCard';

export default function PricingCardExample() {
  const features = [
    { name: 'All props & live data', included: true },
    { name: 'EV rankings', included: true },
    { name: 'Custom book filters', included: true },
    { name: 'Discord bot access', included: false },
    { name: 'Line movement alerts', included: false },
  ];

  return (
    <div className="p-4 max-w-sm">
      <PricingCard
        tierName="Pro"
        price="$9.99"
        features={features}
        isPopular={true}
      />
    </div>
  );
}
