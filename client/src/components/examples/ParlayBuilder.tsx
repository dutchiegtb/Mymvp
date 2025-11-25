import ParlayBuilder from '../ParlayBuilder';

export default function ParlayBuilderExample() {
  const mockLegs = [
    {
      id: '1',
      player: 'LeBron James',
      stat: 'Points',
      selection: 'OVER 27.5',
      odds: -110,
      book: 'FanDuel',
    },
    {
      id: '2',
      player: 'Stephen Curry',
      stat: '3-Pointers',
      selection: 'OVER 4.5',
      odds: 125,
      book: 'DraftKings',
    },
    {
      id: '3',
      player: 'Giannis Antetokounmpo',
      stat: 'Rebounds',
      selection: 'OVER 11.5',
      odds: -115,
      book: 'BetMGM',
    },
  ];

  return (
    <div className="p-4 max-w-md">
      <ParlayBuilder legs={mockLegs} />
    </div>
  );
}
