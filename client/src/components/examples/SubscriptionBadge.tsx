import SubscriptionBadge from '../SubscriptionBadge';

export default function SubscriptionBadgeExample() {
  return (
    <div className="flex gap-4 p-4">
      <SubscriptionBadge tier="free" />
      <SubscriptionBadge tier="tier1" />
      <SubscriptionBadge tier="tier2" />
      <SubscriptionBadge tier="tier3" />
    </div>
  );
}
