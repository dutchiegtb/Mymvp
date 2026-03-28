# ⚡ MVP — Open-Source Sports EV Scanner

Find profitable betting opportunities by comparing odds across 30+ sportsbooks in real-time.

MVP scans lines from FanDuel, DraftKings, BetMGM, Caesars, bet365 and more — then highlights picks with positive Expected Value (EV) so you can bet smarter.

![MVP Dashboard](https://img.shields.io/badge/status-open--source-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![TypeScript](https://img.shields.io/badge/typescript-5.6-blue)

<!-- Add your own screenshot here -->
<!-- ![Dashboard Screenshot](./screenshots/dashboard.png) -->

## ✨ Features

- **Real-Time EV Calculator** — Identifies profitable line discrepancies across sportsbooks
- **30+ Sportsbook Comparison** — FanDuel, DraftKings, BetMGM, Caesars, bet365, PrizePicks & more
- **5 Major Sports** — NBA, NFL, MLB, NHL, Soccer (EPL)
- **Parlay Builder** — Combine picks and calculate combined odds + potential payout
- **Top Picks Ranking** — Auto-ranked by EV percentage and confidence score
- **Dark Neon Theme** — Clean, modern UI built with shadcn/ui
- **Mock Data Fallback** — Works without an API key for development/demo

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Express, TypeScript, Node.js |
| Database | PostgreSQL (Neon) + Drizzle ORM |
| API | [The Odds API](https://the-odds-api.com/) |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (or [Neon](https://neon.tech) free tier)
- [The Odds API](https://the-odds-api.com/) key (free tier: 500 requests/month)

### Setup

```bash
# Clone the repo
git clone https://github.com/dutchiegtb/Mymvp.git
cd Mymvp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Environment Variables

Create a `.env` file in the root:

```env
# Required — get a free key at https://the-odds-api.com/
ODDS_API_KEY=your_odds_api_key_here

# Required — PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Optional — defaults to 5000
PORT=5000
```

> **Note:** The app works without `ODDS_API_KEY` — it falls back to mock data for development.

### Run

```bash
# Development (hot reload)
npm run dev

# Production build
npm run build
npm start

# Push database schema
npm run db:push
```

Open [http://localhost:5000](http://localhost:5000) and you're live 🎉

## 📁 Project Structure

```
├── client/                 # React frontend
│   └── src/
│       ├── components/     # UI components (shadcn + custom)
│       ├── pages/          # Landing, Dashboard, 404
│       └── lib/            # Utilities, query client
├── server/                 # Express backend
│   ├── evCalculator.ts     # Core EV math engine
│   ├── oddsService.ts      # The Odds API integration
│   ├── routes.ts           # API endpoints
│   └── storage.ts          # Database layer
├── shared/
│   └── schema.ts           # Drizzle schema + types
└── package.json
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/sports` | List supported sports |
| GET | `/api/odds/live?sport=basketball_nba` | Fetch live odds by sport |
| GET | `/api/picks/ev?sport=all&minEV=3` | Get EV picks with filtering |
| GET | `/api/picks/top?sport=all&limit=10` | Get top ranked picks |
| POST | `/api/parlay` | Calculate parlay odds + payout |

## 🧮 How EV Calculation Works

The engine compares odds for the same outcome across all sportsbooks:

1. **Collect** — Fetch odds from 30+ books via The Odds API
2. **Compare** — For each market outcome, find the best and worst odds
3. **Calculate** — `EV% = ((worstProb - bestProb) / bestProb) × 100`
4. **Filter** — Only surface picks with > 3% EV edge
5. **Rank** — Sort by EV percentage, assign confidence scores

A pick with **+8% EV** means the sportsbook's line is ~8% more favorable than the market consensus — that's real value.

## 🤝 Contributing

Contributions welcome! Feel free to:

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feat/my-feature`)
5. Open a Pull Request

## 📄 License

MIT — see [LICENSE](./LICENSE) for details.

## ⚠️ Disclaimer

This tool is for informational and educational purposes only. Sports betting involves risk. Always bet responsibly and within your means. This software does not guarantee profits.

---

Built with ❤️ by [@dutchiegtb](https://github.com/dutchiegtb)
