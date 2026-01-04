# MVP - Sports Betting Odds Scanner

## Overview

MVP is a sports betting odds comparison platform that scans 30+ sportsbooks in real-time to identify profitable Expected Value (EV) opportunities. The application helps bettors find line discrepancies across sportsbooks, calculate parlay odds, and make data-driven betting decisions. Built with an "Electric Neon Dark Mode" aesthetic inspired by modern betting platforms like PrizePicks and Sleeper.

**Version 2.0** now includes 40+ sports, Polymarket prediction markets, promo code system, ambassador program, and admin dashboard.

**Legal Compliance (v2.1)**: Full 21+ age gate with disclaimer acceptance, renamed "Profit Tracker" to "Performance Simulator", all "win/profit" language replaced with "hit/hypothetical", prominent responsible gambling disclaimers. MVP does NOT accept bets or hold funds - all results are simulated.

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

### Frontend Pages
- **Landing** (`/`) - Marketing page with features and pricing
- **Dashboard** (`/dashboard`) - Main EV picks, top picks, parlay builder
- **Login** (`/login`) - User sign in
- **Register** (`/register`) - New account creation with promo code support
- **Settings** (`/settings`) - Discord/Telegram bot linking, notification preferences
- **Roadmap** (`/roadmap`) - Product roadmap with development phases

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
- **Users**: Email-based accounts with Stripe subscription integration (free/web/premium/elite)
- **Games**: Sports events with home/away teams and commence times
- **Odds**: Real-time odds snapshots per sportsbook and market type
- **Top Picks**: Curated EV picks with confidence scores and reasoning
- **User Parlays**: Saved parlay combinations with calculated payouts
- **Promo Codes**: Discount codes with percentage/fixed/trial_days types
- **Ambassadors**: Referral program with commission tracking
- **Bot Users/Alerts**: Discord/Telegram integration (schema ready)
- **User Stats**: Gamification system with levels, XP, streaks, hits/misses tracking
- **Badges**: Achievement badges with icons, categories, and XP rewards
- **User Badges**: Junction table for earned badges per user
- **User Follows**: Social follow relationships between users
- **Social Posts**: Activity feed posts (parlay hits, milestones, picks shared)
- **Post Likes/Comments**: Social engagement on feed posts
- **Tracked Picks**: Performance simulator for "what if" calculation based on following picks

### External Services Integration
- **The Odds API**: Primary data source for real-time odds from 30+ sportsbooks
- **Polymarket API**: Prediction markets data (politics, economics, entertainment)
- **Stripe**: Payment processing for subscription tiers (customer ID stored on user)
- **Discord Bot**: Real-time pick notifications for Premium+ subscribers (requires DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID)
- **Telegram AI Bot**: AI-powered betting assistant for Elite subscribers (requires TELEGRAM_BOT_TOKEN, ANTHROPIC_API_KEY)
- **Supported Sports**: 40+ sports across 10 categories (see SPORTS_BY_CATEGORY in schema)

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