# Fintrack - Personal Finance MAnagement App

Fintrack is a high-fidelity personal finance application prototype built with the **Fintech Modernist** design system. It prioritizes a premium aesthetic, clean minimalism, and an intuitive user experience, featuring AI-driven transaction capturing.

## 🚀 Tech Stack
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, Turbopack)
- **Database**: [Prisma 7](https://www.prisma.io/) with SQLite
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Typography**: `Manrope` (Headlines) & `Inter` (Body)
- **Icons**: [Material Symbols](https://fonts.google.com/icons)

## ✨ Key Features
- **Modern Landing Page**: High-impact introduction to the Fintrack ecosystem with smooth animations and interactive mockups.
- **Magic Link Auth**: Streamlined email-only authentication flow.
- **Bento Dashboard**: A comprehensive financial snapshot using a modern bento-grid layout for total balances, income/expenses, and savings insights.
- **Automated Logging**: (Mocked) AI capturing from Email, SMS, and receipts.
- **Transactions Management**: Filterable, searchable, and grouped activity feed.
- **Responsive Design**: Mobile-first architecture with a dedicated mobile bottom navigation bar and desktop sidebar.

## 📂 Project Structure
The project uses Next.js **Route Groups** for clean separation of concerns:
- `src/app/(landing)`: Public-facing marketing pages and authentication.
- `src/app/(dashboard)`: Authenticated application views (Dashboard, Transactions, etc.).
- `src/components`: Reusable UI components including the `AuthModal` and `Sidebar`.
- `src/lib`: Shared utilities and Prisma client singleton.
- `prisma`: Database schema, migrations, and seed scripts.

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js (Latest LTS recommended)
- npm or yarn

### 2. Installation
```bash
# Clone the repository
git clone <repo-url>
cd fintrack_app

# Install dependencies
npm install
```

### 3. Database Setup
```bash
# Create .env file
echo 'DATABASE_URL="file:./dev.db"' > .env

# Run migrations and generate client
npx prisma migrate dev --name init

# Seed the database with test data
npx prisma db seed
```

### 4. Run the App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the landing page.
Access the dashboard directly at [http://localhost:3000/dashboard](http://localhost:3000/dashboard).

---
*Design System: Fintech Modernist*
