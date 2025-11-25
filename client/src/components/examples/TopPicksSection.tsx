import TopPicksSection from '../TopPicksSection';

export default function TopPicksSectionExample() {
  const mockPicks = [
    {
      id: '1',
      rank: 1,
      player: 'LeBron James',
      stat: 'Points',
      sport: 'NBA',
      selection: 'OVER 27.5',
      ev: 18.2,
      confidence: 92,
      book: 'FanDuel',
      line: 27.5,
      reasoning: 'Matchup against bottom-5 defense. LeBron averaging 31.2 in last 5 games. Line 2 points below his season average.',
    },
    {
      id: '2',
      rank: 2,
      player: 'Patrick Mahomes',
      stat: 'Passing Yards',
      sport: 'NFL',
      selection: 'OVER 285.5',
      ev: 14.5,
      confidence: 87,
      book: 'BetMGM',
      line: 285.5,
      reasoning: 'Chiefs facing league-worst pass defense. Weather conditions favorable. Mahomes 8-2 on overs this season.',
    },
    {
      id: '3',
      rank: 3,
      player: 'Connor McDavid',
      stat: 'Points',
      sport: 'NHL',
      selection: 'OVER 1.5',
      ev: 11.8,
      confidence: 83,
      book: 'DraftKings',
      line: 1.5,
      reasoning: 'Hot streak with points in 12 straight games. Opponent allows 3.8 goals per game. Power play clicking at 28%.',
    },
  ];

  return (
    <div className="p-4 max-w-2xl">
      <TopPicksSection picks={mockPicks} />
    </div>
  );
}
