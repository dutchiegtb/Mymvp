import ValuePickCard from '../ValuePickCard';

export default function ValuePickCardExample() {
  const mockPick = {
    id: '1',
    playerName: 'LeBron James',
    statType: 'Points',
    sport: 'NBA',
    book1: { name: 'FanDuel', line: 27.5 },
    book2: { name: 'PrizePicks', line: 29.5 },
    ev: 12.5,
    recommendation: 'OVER 27.5 @ FD',
    timestamp: '5 min ago',
  };

  return (
    <div className="p-4 max-w-md">
      <ValuePickCard pick={mockPick} />
    </div>
  );
}
