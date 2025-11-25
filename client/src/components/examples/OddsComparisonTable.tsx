import OddsComparisonTable from '../OddsComparisonTable';

export default function OddsComparisonTableExample() {
  const mockData = [
    {
      id: '1',
      player: 'LeBron James',
      stat: 'Points',
      sportsbooks: {
        FanDuel: { line: 27.5, trend: 'up' as const, isBest: true },
        DraftKings: { line: 28.0, trend: 'down' as const },
        BetMGM: { line: 28.5 },
        PrizePicks: { line: 29.0 },
      },
    },
    {
      id: '2',
      player: 'Stephen Curry',
      stat: 'Points',
      sportsbooks: {
        FanDuel: { line: 26.5 },
        DraftKings: { line: 26.0, isBest: true },
        BetMGM: { line: 27.0, trend: 'up' as const },
        PrizePicks: { line: 27.5 },
      },
    },
  ];

  const sportsbooks = ['FanDuel', 'DraftKings', 'BetMGM', 'PrizePicks'];

  return (
    <div className="p-4">
      <OddsComparisonTable data={mockData} sportsbooks={sportsbooks} />
    </div>
  );
}
