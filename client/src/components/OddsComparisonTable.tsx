import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface OddsData {
  id: string;
  player: string;
  stat: string;
  sportsbooks: {
    [key: string]: {
      line: number;
      trend?: 'up' | 'down';
      isBest?: boolean;
    };
  };
}

interface OddsComparisonTableProps {
  data: OddsData[];
  sportsbooks: string[];
}

export default function OddsComparisonTable({ data, sportsbooks }: OddsComparisonTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-card z-10 min-w-[200px]">Player</TableHead>
            <TableHead>Stat</TableHead>
            {sportsbooks.map((book) => (
              <TableHead key={book} className="text-center font-mono">
                {book}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id} data-testid={`row-odds-${row.id}`}>
              <TableCell className="sticky left-0 bg-card z-10 font-semibold" data-testid="text-player">
                {row.player}
              </TableCell>
              <TableCell className="text-muted-foreground">{row.stat}</TableCell>
              {sportsbooks.map((book) => {
                const odds = row.sportsbooks[book];
                if (!odds) return <TableCell key={book} className="text-center text-muted-foreground">-</TableCell>;
                
                return (
                  <TableCell
                    key={book}
                    className={`text-center font-mono font-semibold ${
                      odds.isBest ? 'bg-success/10 text-success' : ''
                    }`}
                    data-testid={`cell-odds-${book}`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {odds.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                      {odds.trend === 'down' && <TrendingDown className="h-3 w-3" />}
                      {odds.line}
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
