# MVP - Sports Betting Odds Scanner

## Overview

MVP is a sports betting odds comparison platform that scans 30+ sportsbooks in real-time to identify profitable Expected Value (EV) opportunities. The application helps bettors find line discrepancies across sportsbooks, calculate parlay odds, and make data-driven betting decisions. Built with an "Electric Neon Dark Mode" aesthetic inspired by modern betting platforms like PrizePicks and Sleeper.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom dark-mode-first design system using CSS variables
- **Design System**: Electric neon dark mode with green (#00FF7F), blue (#00CFFF), and gold (#FFCC00) accent colors on deep charcoal backgrounds

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful JSON API with `/api` prefix
- **Build**: esbuild for production bundling, tsx for development

### Data Layer
- **ORM**: Drizzle ORM with Zod schema validation (drizzle-zod)
- **Database**: PostgreSQL via Neon serverless driver (@neondatabase/serverless)
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Managed via drizzle-kit with `db:push` command

### Key Data Models
- **Users**: Email-based accounts with Stripe subscription integration (free/tier1/tier2/tier3)
- **Games**: Sports events with home/away teams and commence times
- **Odds**: Real-time odds snapshots per sportsbook and market type
- **Top Picks**: Curated EV picks with confidence scores and reasoning
- **User Parlays**: Saved parlay combinations with calculated payouts

### External Services Integration
- **The Odds API**: Primary data source for real-time odds from 30+ sportsbooks
- **Stripe**: Payment processing for subscription tiers (customer ID stored on user)
- **Supported Sports**: NBA, NFL, MLB, NHL, Soccer (defined in shared schema)

### Caching Strategy
- In-memory cache for odds data with 5-minute TTL
- React Query handles client-side caching with configurable stale times

### Development vs Production
- Development: Vite dev server with HMR, tsx for server
- Production: Static file serving from `dist/public`, bundled server from `dist/index.js`

## External Dependencies

### APIs
- **The Odds API** (`api.the-odds-api.com`): Real-time sports betting odds. Requires `ODDS_API_KEY` environment variable. Falls back to mock data when key is not set.

### Database
- **PostgreSQL**: Required. Connection via `DATABASE_URL` environment variable. Uses Neon serverless driver for WebSocket connections.

### Payment Processing
- **Stripe**: For subscription management. Users have `stripeCustomerId` field for linking to Stripe customer records.

### Third-Party UI Libraries
- **Radix UI**: Headless component primitives (dialogs, dropdowns, tabs, etc.)
- **Lucide React**: Icon library
- **embla-carousel**: Carousel functionality
- **react-day-picker**: Date picker component
- **recharts**: Charting library for data visualization
- **vaul**: Drawer component