# Bookla — online booking for Northern Cyprus

One place to book any local service in Northern Cyprus — barbers, beauty salons, clinics, car rental, restaurants — in Turkish, English or Russian. Customers book without an account (name + phone); businesses manage everything from a dashboard.

**Stack:** Next.js (App Router) · TypeScript · Prisma (SQLite locally, Postgres in production) · Zod · Tailwind CSS · PWA

## Features

- Catalog with search and categories, a public page per business (`/b/<slug>`) to share on Instagram / Google Maps
- Booking flow: service → specialist → time → done; customers manage their booking through a private link
- Business dashboard: bookings by day, services, staff, opening hours, profile with QR code, subscription
- Admin panel: subscriptions, hiding businesses, WhatsApp notification queue
- Availability engine (`src/lib/availability.ts`): opening hours × service length × staff load, or seat capacity for places without staff
- Double booking is impossible: the slot is re-checked inside a serializable transaction (`src/lib/booking.ts`)
- TR / EN / RU from a cookie or the browser language (`src/i18n`), all times in the Northern Cyprus time zone

## Run locally

```bash
npm install
cp .env.example .env    # then set DEMO_PASSWORD
npm run db:reset        # creates the SQLite database and seeds 19 fictional businesses
npm run dev             # http://localhost:3000
```

A longer description in Russian is in [README.ru.md](README.ru.md).
