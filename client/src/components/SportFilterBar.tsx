import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SPORTS = ["All Sports", "NBA", "NFL", "MLB", "NHL", "Soccer"];
const SPORTSBOOKS = ["All Books", "FanDuel", "DraftKings", "BetMGM", "Caesars", "PrizePicks", "Underdog"];
const EV_RANGES = ["All EV", "5%+", "10%+", "15%+"];

export default function SportFilterBar() {
  const [sport, setSport] = useState("All Sports");
  const [sportsbook, setSportsbook] = useState("All Books");
  const [evRange, setEvRange] = useState("All EV");
  const [searchQuery, setSearchQuery] = useState("");

  const activeFilters = [
    sport !== "All Sports" && sport,
    sportsbook !== "All Books" && sportsbook,
    evRange !== "All EV" && evRange,
  ].filter(Boolean);

  const clearFilters = () => {
    setSport("All Sports");
    setSportsbook("All Books");
    setEvRange("All EV");
    setSearchQuery("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-players"
          />
        </div>

        <Select value={sport} onValueChange={setSport}>
          <SelectTrigger className="w-[160px]" data-testid="select-sport">
            <SelectValue placeholder="Sport" />
          </SelectTrigger>
          <SelectContent>
            {SPORTS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sportsbook} onValueChange={setSportsbook}>
          <SelectTrigger className="w-[160px]" data-testid="select-sportsbook">
            <SelectValue placeholder="Sportsbook" />
          </SelectTrigger>
          <SelectContent>
            {SPORTSBOOKS.map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={evRange} onValueChange={setEvRange}>
          <SelectTrigger className="w-[140px]" data-testid="select-ev-range">
            <SelectValue placeholder="EV Range" />
          </SelectTrigger>
          <SelectContent>
            {EV_RANGES.map((ev) => (
              <SelectItem key={ev} value={ev}>{ev}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" data-testid="button-filter">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {activeFilters.map((filter, i) => (
            <Badge key={i} variant="secondary">{filter}</Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 px-2 text-xs"
            data-testid="button-clear-filters"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
