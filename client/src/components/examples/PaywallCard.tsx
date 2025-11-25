import PaywallCard from '../PaywallCard';

export default function PaywallCardExample() {
  return (
    <div className="p-4 max-w-md">
      <PaywallCard
        tierName="Pro"
        price="$9.99/mo"
        benefits={[
          'All props & live data',
          'EV rankings',
          'Custom book filters',
        ]}
      />
    </div>
  );
}
