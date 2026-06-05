# Fintrack

Fintrack is a personal finance tracker prototype for capturing, reviewing, and managing transactions from manual entries, SMS/email-style records, and receipt images. It uses a local-first SQLite database and a polished dashboard built with plain HTML, CSS, browser JavaScript, and Node.js.

## Tech Stack

- **Server**: Node.js HTTP server
- **Frontend**: HTML, CSS, and vanilla JavaScript
- **Database**: SQLite through `better-sqlite3`
- **Receipt extraction**: Gemini when `GEMINI_API_KEY` is configured, with a local fallback draft

## Features

- Landing page with onboarding entry points
- Local onboarding for profile, location, and capture preferences
- Dashboard with balance, income, expense, savings rate, top spending, and recent activity
- Receipt capture at `/scan` using image upload or supported mobile camera capture
- Manual transaction entry
- Transaction management at `/transactions`
  - Search by merchant, category, or note
  - Filter by category and source
  - Edit merchant, amount, category, type, status, source, and note
  - Delete/remove transactions
- Settings screen for profile, currency, notifications, and capture toggles
- JSON APIs for users, categories, dashboard data, transactions, and receipt extraction

## Project Structure

```text
server.js             Node server, SQLite access, API routes, static fallback
public/index.html     Browser app shell
public/styles.css     Fintrack visual system and responsive layout
public/app.js         Vanilla JavaScript SPA, forms, routing, and UI rendering
dev.db                Local SQLite database
DESIGN.md             Design direction preserved from the original app
```

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm

This project uses native `better-sqlite3` bindings. If you switch Node versions after installing dependencies, rebuild the native package:

```bash
npm rebuild better-sqlite3
```

### Install

```bash
npm install
```

### Environment

Create a `.env` file:

```bash
# Optional: enables Gemini receipt extraction
GEMINI_API_KEY="your-api-key"
GEMINI_MODEL="gemini-2.5-flash"
```

The app stores data in `dev.db`. The server creates required SQLite tables/columns automatically if they are missing.

### Development

```bash
npm run dev
```

Open:

- Landing page: http://127.0.0.1:3000
- Onboarding: http://127.0.0.1:3000/onboarding
- Dashboard: http://127.0.0.1:3000/dashboard
- Capture: http://127.0.0.1:3000/scan
- Transactions: http://127.0.0.1:3000/transactions
- Settings: http://127.0.0.1:3000/settings

## Scripts

```bash
npm run dev      # Start the Node development server
npm run build    # Syntax-check server and browser JavaScript
npm run start    # Start the Node server
npm run lint     # Syntax-check server and browser JavaScript
```

## Notes

- Camera capture is implemented with a file input using `capture="environment"`. Mobile browsers can open the rear camera; desktop browsers usually show a file picker.
- The app currently uses the first local user record as the active user. Full authentication is not implemented yet.
- Do not commit real API keys or production secrets in `.env`.
