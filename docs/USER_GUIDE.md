# User Guide — OptionsTrader

This guide explains how to use each section of OptionsTrader: what information it shows, how to navigate it, and what actions you can take.

> **Note on images:** the spots marked `![...](images/file.png)` are placeholders. Save your own screenshots to `docs/images/` using those exact filenames and they'll render automatically when this file is viewed on GitHub or in any Markdown viewer.

## Table of contents

1. [Login](#1-login)
2. [Dashboard](#2-dashboard)
3. [Trading Journal (Calendar)](#3-trading-journal-calendar)
4. [Trade detail (from the calendar)](#4-trade-detail-from-the-calendar)
5. [Trade Log](#5-trade-log)
6. [Trade detail (full page)](#6-trade-detail-full-page)
7. [Analytics](#7-analytics)
8. [Signing out](#8-signing-out)

---

## 1. Login

Route: `/login`

The app's entry screen. Enter your username and password to sign in. If the credentials are wrong, an error message appears below the form.

![Login screen](images/login.png)

**Fields:**
- **Username** — your username.
- **Password** — your password (toggle visibility with the eye icon).

On a successful sign-in, the app takes you straight to the **Dashboard**.

---

## 2. Dashboard

Route: `/dashboard`

The first screen you land on after signing in. Gives you a quick summary of your performance for the current month.

![Main dashboard](images/dashboard.png)

**What it shows:**
- **KPI strip** — month PnL, today's PnL, win rate, current winning-day streak, and average PnL per trade (with profit factor).
- **Equity curve** — a line chart of your cumulative PnL through the month, with an amber dot marking "today."
- **Recent trades** — your last 4 closed trades; click any of them to see its full detail.
- **Consistency** — your last 10 trading days, each with a color-coded icon (green = winner, red = loser, amber = pending) plus your current streak and best streak for the month.
- **Quick stats** — best trade, worst trade, average winner/loser, and your fastest trade to close.

---

## 3. Trading Journal (Calendar)

Route: `/journal`

A monthly calendar view where each day is colored by that day's outcome.

![Trading Journal calendar](images/journal-calendar.png)

**What it shows:**
- **Month summary** — month PnL, trading days, win rate, and total trades.
- **Calendar** — each day cell shows the day's PnL and trade count. Colors:
  - 🟢 Green = winning day
  - 🔴 Red = losing day
  - 🟠 Amber = pending trade (not yet closed)
  - Gray = no trades that day
- **WEEK column** — a per-week summary (total PnL, active days, trades).
- **Navigation** — use the `‹ ›` arrows next to the month name to move between months.

Click any day with activity to see that day's trades.

---

## 4. Trade detail (from the calendar)

Clicking a calendar day opens a modal:

![Modal with the day's trade list](images/journal-day-modal.png)

- If the day has **multiple trades**, you first see a summary list with the day's total PnL and each individual trade.
- Clicking a specific trade shows its **full detail**: entry/exit price, contracts, duration, status, and the entry/close/trade-log screenshots (if any).

![Trade detail inside the modal](images/journal-trade-detail-modal.png)

Screenshots come from the WinForms capture app and have used two naming conventions over time — older, narrower ones and newer, noticeably wider ones. The layout adapts automatically: **newer screenshots are stacked** (entry above close) since they're too wide to fit side by side, while **older screenshots stay side by side** as before. Trade Log stays at the bottom either way.

---

## 5. Trade Log

Route: `/trades`

A table view of all your trades, organized by week or by month.

![Trade Log — week view](images/trade-log-week.png)

**Controls at the top:**
- **Week navigator** (`‹ W3 ›`) — visible only in week view.
- **Week / Month toggle** — switch between viewing one week at a time or all of the month's trades in a paginated table.
- **Filters** — All / Profit / Loss, to narrow down which trades you see.

**Week view:** groups trades by day, with each day expandable/collapsible by clicking its header. Days with no trades are compressed into a single row ("Tue Jul 15 — Fri Jul 18 · No trades").

**Month view:**

![Trade Log — month view](images/trade-log-month.png)

A flat table of all the month's trades, 10 per page, with pagination at the bottom.

Click any row to jump to that trade's full detail.

> Your current month, week, view mode, filter, and page are kept in the page's URL, so you can refresh the page or share the link without losing your place — and the Back button from a trade's detail page always returns you to exactly where you were.

---

## 6. Trade detail (full page)

Route: `/trades/:id`

A dedicated view of a single trade, reached by clicking any row in the Trade Log.

![Trade detail page](images/trade-detail-page.png)

**What it shows:**
- Symbol, type (Call/Put), strike, expiration, and level.
- PnL in dollars and percent.
- Entry/exit price, contracts, premium paid, target, and duration.
- Status (Closed/Pending) with a color indicator.
- **Charts** — entry, close, and trade-log screenshots (if uploaded). If one is missing, a "No screenshot" placeholder is shown instead. As in the calendar modal, newer (wider) screenshots stack vertically; older ones stay side by side.

Use the **← Back** button to return to the Trade Log — it takes you back to the exact list state (month/week/view/filter/page) you came from.

---

## 7. Analytics

Route: `/analytics`

A statistics and pattern-analysis page for your trading.

![Analytics — overview](images/analytics-overview.png)

**Period selector:** Week / Month / All time, top right.

**What it shows:**
- **KPI strip** — total PnL, win rate, profit factor, average/min/max duration.
- **PnL by day of week** — a bar chart of which days are most profitable, with an auto-generated insight callout (e.g. "Monday–Tuesday account for 81% of your PnL").

  ![PnL by day of week](images/analytics-day-of-week.png)

- **Breakdown by symbol & type** — progress bars for each symbol+type combination (e.g. "SPY Call"), with win rate and best/worst trade and average winner/loser stats.
- **Duration histogram** — how many trades fall into each duration bucket (0–15 min, 15–30 min, etc.), with an insight about your "sweet spot."
- **PnL % distribution** — how many trades fall into each percent-return bucket.
- **Duration vs. PnL (scatter)** — a scatter plot of how long a trade lasted versus its outcome, with a highlighted zone marking your best-performing range.

  ![Duration vs PnL and patterns](images/analytics-duration-scatter.png)

Every amber callout with a bulb icon (💡) is an **auto-generated insight** computed from your real data — not fixed text.

---

## 8. Signing out

From any authenticated page, the **Sign out** button sits at the bottom of the sidebar.

![Sign-out button in the sidebar](images/sidebar-logout.png)

Signing out clears your token and takes you to `/home`, the public landing page.

---

## General navigation

The sidebar, visible on every authenticated page, lets you move between:

- **Dashboard**
- **Trading Journal**
- **Analytics**
- **Trade Log**

The active section is always highlighted in the sidebar.
