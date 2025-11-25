# Design Guidelines: Odds Scanner MVP

## Design Approach

**Electric Neon Dark Mode**: Inspired by modern betting platforms (PrizePicks, Sleeper, Draft Dashboard) with a high-energy, profit-focused aesthetic. Dark mode default makes numbers and EV data "pop" while maintaining professional credibility.

## Core Design Principles

1. **Data-First Hierarchy**: Odds and EV values must be immediately scannable with high contrast
2. **Energy & Trust**: Neon accents convey speed and winning while maintaining professional UX
3. **Speed Indicators**: Visual cues for time-sensitive opportunities using animated elements
4. **Tier Differentiation**: Clear visual distinction using gold gradients for premium features

## Color Psychology

- **Electric Green (#00FF7F)**: Winning, positive EV, high-value picks - the primary action color
- **Neon Blue (#00CFFF)**: Technology, clarity, secondary actions - complements green
- **Gold/Yellow (#FFCC00)**: Premium features, medium EV, highlights - creates hierarchy
- **Deep Charcoal (#0D0D0D)**: Background - makes neon colors pop and reduces eye strain

## Typography

**Font Stack**:
- Primary: Inter (Google Fonts) - for UI elements, data tables, numbers
- Display: Roboto Condensed - for hero headings and section titles
- Monospace: JetBrains Mono - for odds display and EV percentages (ensures alignment)

**Hierarchy**:
- Hero Headlines: text-5xl md:text-6xl font-bold
- Section Titles: text-3xl font-semibold
- Card Titles: text-xl font-semibold
- Body Text: text-base (16px)
- Data Labels: text-sm font-medium uppercase tracking-wide
- Odds Numbers: text-lg md:text-xl font-mono font-semibold
- EV Percentages: text-2xl font-mono font-bold

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, and 8 consistently
- Component padding: p-4 or p-6
- Section spacing: py-12 md:py-16
- Card gaps: gap-4 or gap-6
- Margin between elements: mb-4, mb-6, mb-8

**Container Strategy**:
- Max width: max-w-7xl for dashboard
- Data tables: w-full with horizontal scroll on mobile
- Cards: Grid system grid-cols-1 md:grid-cols-2 lg:grid-cols-3

## Component Library

### Dashboard Layout
**Main Container**: Full-width with sidebar navigation (left side, 240px fixed on desktop, collapsible on mobile)
- Sidebar: List subscription tier badge at top, navigation links, upgrade CTA for free users
- Main content area: Scrollable feed of picks and data tables

### Value Pick Cards
**Structure**: Card-based layout with clear visual hierarchy
- Sportsbook logo (top-left, 32px × 32px)
- Player name + stat type (prominent, text-xl)
- Line comparison display (side-by-side: "FD: 27.5 vs PP: 29.0")
- EV percentage (large, right-aligned, with color indicator)
- Best pick indicator badge (e.g., "OVER 27.5 @ FD")
- Timestamp (small, bottom-right)

**EV Visual Indicators**:
- High EV (>10%): Bold green badge with darker green background
- Medium EV (5-10%): Yellow/amber badge
- Low EV (<5%): Gray/neutral for free tier visibility

### Odds Comparison Table
**Layout**: Responsive table with sticky header
- Column headers: Sportsbook logos + name
- Rows: Player/game with expandable details
- Cell content: Odds in monospace font with trend arrows (↑↓)
- Best odd highlighted with subtle background treatment
- Mobile: Horizontal scroll with first column (player) sticky

### Subscription Tier Components
**Tier Badge**: Displayed in user profile area and throughout app
- Free: Simple gray badge
- Tier 1: Gradient badge (blue/purple)
- Tier 2: Premium gradient badge (gold/orange)
- Tier 3: Elite gradient badge (platinum/black)

**Paywall Cards**: For locked features
- Blurred preview of content
- Clear "Unlock with [Tier Name]" CTA button
- Brief benefit list (2-3 items)
- "Upgrade Now" primary action button

### Hero Section (Landing Page)
**Layout**: Split hero design
- Left side (60%): Bold headline "Find The Best Betting Value In Seconds", subheading, CTA buttons (primary: "Start Free Trial", secondary: "View Sample Picks")
- Right side (40%): Live preview screenshot or animated mockup showing the odds comparison in action

**Supporting Elements**:
- Social proof bar below hero: "Trusted by 10,000+ bettors • $2M+ in improved value"
- Sportsbook logo strip: Display 8-10 supported sportsbook logos

### Features Section (Landing Page)
**Grid Layout**: 3-column grid on desktop, stacked on mobile
- Each feature card includes: Icon (64px, sports/data themed from Heroicons), title, 2-line description
- Features: "Real-Time Odds Scanning", "EV Calculator", "Multi-Book Comparison", "Discord Integration", "Line Movement Alerts", "Sharp Picks"

### Pricing Cards (Landing Page)
**3-Tier Layout**: Card-based pricing comparison
- Each tier card: Tier name, price (large, monthly), feature list with checkmarks, CTA button
- Middle tier (Tier 2) elevated with border or shadow treatment to suggest "popular choice"
- Clear feature differentiation using strikethrough for unavailable features in lower tiers

### Alert/Notification System
**Toast Notifications**: Top-right corner for real-time updates
- EV spike alerts: Green background with trend icon
- Line movement: Blue background with arrow icon
- Compact design: Icon + message + dismiss (max 2 lines)

### Discord Bot Preview Section
**Code Block Style**: Show sample commands in terminal-style blocks
- Dark background with syntax highlighting for commands
- Example outputs in card format below
- CTA: "Add to Discord" button

## Navigation

**Top Navigation Bar**: 
- Logo (left), main nav links (center), user profile + subscription badge (right)
- Sticky on scroll
- Mobile: Hamburger menu

**Main Nav Links**: Dashboard, Sports (dropdown), Alerts, Discord Bot, Pricing, Account

## Data Visualization

**Live Indicators**: Small pulsing green dot next to "LIVE" label for real-time data
**Trend Arrows**: Simple up/down arrows (↑↓) for line movement
**Progress Bars**: For time-sensitive opportunities (e.g., "Line likely to move in 15 min")

## Forms & Inputs

**Search Bar**: Prominent on dashboard for filtering players/games
- Large input with search icon (Heroicons magnifying glass)
- Autocomplete dropdown with recent searches

**Filters**: Multi-select dropdowns for Sport, Sportsbook, EV Range
- Chip-based selected filters display above results

## Icons

**Library**: Heroicons (via CDN) for all UI icons
**Sport Icons**: Use simple SVG icons for NBA, NFL, MLB, NHL, Soccer (external library like Sports Icons or custom minimal designs)

## Images

**Hero Section**: Yes - large hero image or screenshot mockup showing the odds comparison interface in action (right side of split hero)
**Sportsbook Logos**: Use actual logos (32px-48px) throughout the app - DraftKings, FanDuel, BetMGM, Caesars, bet365, PrizePicks, Underdog
**Player Headshots**: Optional small circular headshots (40px) in pick cards if data available
**Landing Page**: Include 1-2 screenshots of the dashboard/interface to build trust

## Animations

**Use Sparingly**:
- Subtle fade-in for new picks appearing in dashboard
- Pulse effect on high-EV picks (gentle, not distracting)
- Smooth transitions for dropdown menus and modals
- NO complex scroll animations or parallax effects

## Mobile Considerations

- Collapsible sidebar to bottom navigation on mobile
- Odds tables scroll horizontally with sticky player column
- Simplified pick cards with vertical layout
- Bottom sheet modals for filters and settings