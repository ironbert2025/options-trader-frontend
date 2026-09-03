# OptionsTrader — Frontend

A personal options-trading journal. This repo contains the Angular frontend for **OptionsTrader**, a system where a WinForms desktop app captures trades and screenshots from the Schwab platform, an ASP.NET Core Web API stores and serves that data, and this Angular app gives you a read-only, visual way to review your trading history — calendar view, trade log, analytics, and a KPI dashboard.

The actual Angular project lives in [`options-trader-web/`](options-trader-web).

## Stack

- **Angular 21** — standalone components, signals (`signal()` / `computed()`), no NgModules
- **TypeScript 5.9**
- **SCSS** per component
- **@tabler/icons-webfont** for icons
- **Vitest** for unit tests

## Features

- **Landing page** (`/`) — public marketing page
- **Login** (`/login`) — authenticates against the backend API and stores a JWT
- **Dashboard** (`/dashboard`) — KPI strip (month/today PnL, win rate, streaks, profit factor), equity curve, recent trades, consistency calendar, quick stats
- **Trading Journal** (`/journal`) — monthly calendar colored by daily outcome, with a per-day trade detail modal (entry/exit/trade-log screenshots)
- **Analytics** (`/analytics`) — PnL by day of week, breakdown by symbol/type, trade-duration and PnL% distributions, duration-vs-PnL scatter plot, with auto-generated insight callouts
- **Trade Log** (`/trades`) — week/month table view of all trades with filters (all/profit/loss) and pagination
- **Trade Detail** (`/trades/:id`) — full detail view for a single trade, including entry/exit/trade-log chart screenshots

All authenticated routes (`/dashboard`, `/journal`, `/analytics`, `/trades*`) are nested under a shared `AuthLayoutComponent` (sidebar + content shell) and protected by a route guard that redirects to `/login` if there's no valid session. The sidebar's "Sign out" button clears the token and sends you to `/home` (the landing page).

## Project structure

```
options-trader-web/
  src/app/
    pages/            # routed page components (home, login, dashboard, journal, analytics, trade-log, trade-detail)
    components/        # reusable pieces (e.g. TradingJournalComponent, the calendar grid)
    layouts/            # AuthLayoutComponent — shell for authenticated pages
    shared/             # SidebarComponent
    services/           # AuthService, TradeService — talk to the backend API
    guards/             # authGuard — protects authenticated routes
    utils/               # screenshot.util.ts — see below
    app.routes.ts       # route table
```

## Notable implementation details

**Screenshot naming conventions.** The WinForms capture app has used two naming schemes for trade screenshots over time: an older lowercase one (`_entry.png` / `_exit.png`) and a newer capitalized one (`_Entry.png` / `_Close.png`) that also produces noticeably wider images. `src/app/utils/screenshot.util.ts` centralizes matching for both conventions (`isEntryScreenshot`, `isExitScreenshot`, `isTradeLogScreenshot`, `isNewScreenshotFormat`). Trade Detail and the Journal's trade modal use `isNewScreenshotFormat()` to decide layout: newer (wider) screenshots are stacked entry-above-close, older ones stay side by side. Trade Log image is unaffected either way.

**Trade Log state lives in the URL.** `TradeLogComponent` syncs its full view state — year, month, week index, week/month view mode, filter, and page — into the route's query params (`?year=...&month=...&week=...&view=...&filter=...&page=...`) on every change, using `replaceUrl: true` so it doesn't spam browser history. On load, it restores state from those params instead of always defaulting to the current month. This means the Trade Log URL is shareable/bookmarkable, and the Trade Detail page's Back button (`Location.back()`) reliably returns you to the exact list state you came from.

## Getting started

```bash
cd options-trader-web
npm install
npm start        # ng serve — http://localhost:4200
```

Other scripts:

```bash
npm run build     # production build → dist/options-trader-web
npm run watch     # dev build, watch mode
npm test          # unit tests (Vitest)
```

## Backend API

The frontend talks to the OptionsTrader Web API for authentication and trade data:

| Service | Method | Endpoint |
|---|---|---|
| `AuthService.login()` | `POST` | `/api/auth/login` |
| `TradeService.getTradesByMonth(month)` | `GET` | `/api/trades?month=YYYY-MM` |
| `TradeService.getTradeByDate(date)` | `GET` | `/api/trades?date=YYYY-MM-DD` |
| `TradeService.getTradeById(id)` | `GET` | `/api/trades/{id}` |

Auth is a bearer JWT stored in `localStorage`; the token also carries the user's given/last name, decoded client-side for the dashboard greeting.

> **Note:** the API base URL is currently hardcoded in `auth.service.ts` and `trade.service.ts` rather than pulled from an Angular environment file. If you point this app at a different backend, update those two constants.

## Deployment

Production builds are served as static files via IIS on the same Windows EC2 instance that hosts the backend API (frontend on port 80, API on port 5000). To deploy:

```bash
cd options-trader-web
npm run build -- --configuration production
scp -r dist/options-trader-web/browser/. <user>@<ec2-host>:C:/OptionsTraderFrontend
```

IIS is configured with a URL Rewrite rule so unmatched paths fall back to `index.html` (required for Angular client-side routing).
