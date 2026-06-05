# Fintrack

Fintrack is a personal finance tracker prototype for capturing, reviewing, and managing transactions from manual entries, SMS/email-style records, and receipt images. It uses a local-first SQLite database and a polished Next.js dashboard experience.

## Tech Stack

- **Framework**: Next.js 16.2.4 with the App Router and Turbopack
- **UI**: React 19.2.4, Tailwind CSS 4, Material Symbols
- **Database**: Prisma 7.8 with SQLite
- **Adapters**: `better-sqlite3` for local SQLite and `@libsql/client` for Turso/libSQL URLs
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
- API routes for users, categories, dashboard data, transactions, and receipt extraction

## Project Structure

```text
src/app/(landing)        Public landing page
src/app/(dashboard)      Dashboard, transactions, scan, settings, and API routes
src/app/onboarding       Local account and capture setup
src/components           Shared UI and workflow components
src/lib                  Prisma client, formatting, category helpers
prisma                   Schema, migrations, and seed script
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
DATABASE_URL="file:./dev.db"

# Optional: enables Gemini receipt extraction
GEMINI_API_KEY="your-api-key"
GEMINI_MODEL="gemini-2.5-flash"
```

For Turso/libSQL, set `DATABASE_URL` to a `libsql://` or `https://` URL and add `TURSO_AUTH_TOKEN` if required.

### Database

Run migrations and generate the Prisma client:

```bash
npx prisma migrate dev
```

The seed script currently clears local demo data so you can create a fresh local user through onboarding:

```bash
npm run postinstall
npx prisma db seed
```

### Development

```bash
npm run dev
```

Open:

- Landing page: http://localhost:3000
- Onboarding: http://localhost:3000/onboarding
- Dashboard: http://localhost:3000/dashboard
- Capture: http://localhost:3000/scan
- Transactions: http://localhost:3000/transactions
- Settings: http://localhost:3000/settings

## Scripts

```bash
npm run dev      # Start the Next.js dev server
npm run build    # Generate Prisma client and build Next.js
npm run start    # Start the production server
npm run lint     # Run ESLint
```

## Notes

- Camera capture is implemented with a file input using `capture="environment"`. Mobile browsers can open the rear camera; desktop browsers usually show a file picker.
- Browser extensions can inject attributes into the root document. The layout suppresses hydration warnings on `<body>` for those extension-only mutations.
- The app currently uses the first local user record as the active user. Full authentication is not implemented yet.
- Do not commit real API keys or production secrets in `.env`.
