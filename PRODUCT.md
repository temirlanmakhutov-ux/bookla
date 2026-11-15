# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Confirmed with the owner (2026-11-09): the primary user is the **client on a phone**.

- **Clients** — residents, expats, students and tourists in Northern Cyprus (Turkish-, English- and Russian-speaking). They arrive from a link in a business's Instagram bio / Google Maps, or open the catalog to find a place. They are usually standing somewhere, phone in one hand, and today they book by sending a WhatsApp message and waiting for an answer. Job: see a free time and take it in under a minute, without creating an account.
- **Business owners** (secondary) — small local businesses: hairdressers, barbers, nail and brow studios, massage, dentists, doctors, vets, car care, rent-a-car, restaurants, boat tours, fitness, tutors, photographers, cleaning. Job: stop answering "are you free at 3?" in WhatsApp, keep one diary of bookings, share one link.
- **Admin** (the owner of Bookla) — extends subscriptions by hand, hides or shows businesses.

## Product Purpose

Online booking for anything bookable in Northern Cyprus. A client picks a service, a person, a day and a free time, leaves a name and phone number, and is booked. Success for the pilot: 10–20 businesses in Girne using their Bookla link as the default way to take bookings.

## Positioning

One link works for every kind of local business (not only beauty), in three languages, with no client accounts and with WhatsApp as the confirmation channel, because that is what the island actually uses. Businesses pay a flat monthly subscription; clients never pay and there is no commission.

## Operating Context

- Phone first; the business page `/b/<slug>` is the link a business puts in its Instagram bio and Google Maps profile.
- Time zone Asia/Famagusta. Currency Turkish lira (₺).
- Languages TR / EN / RU, chosen by cookie or browser language; every screen must hold all three (Russian and Turkish strings run longer than English).
- Clients manage a booking through a secret link `/booking/<token>`; owners sign in with email and password.

## Capabilities and Constraints

- Catalog with search, 16 categories, 6 towns (Girne, Lefkoşa, Gazimağusa, İskele, Güzelyurt, Lefke).
- Business page: services with duration and price, staff, opening hours, route / WhatsApp / share, booking sheet (staff → day → time → contacts).
- Booking page: details, add to calendar, cancel.
- Business side: landing with plans, signup (30-day trial), login, dashboard (bookings by day, manual booking, services, staff, hours, profile + QR, billing), admin.
- Subscription only: trial 30 days, then Solo 390 ₺ / month (1 staff) or Salon 890 ₺ / month (up to 10 staff). Payment is manual for now.
- Businesses have no photos yet: a business is represented by its name, initials and a colour. The production catalog starts empty.
- Stack: Next.js 16 (App Router), Tailwind v4, Prisma. Forms work as plain HTML forms and server actions.
- Undecided: final product name ("Bookla" is the working name and stays for now), custom domain, support WhatsApp number.

## Brand Commitments

- Name: Bookla (working name, kept).
- The owner allowed everything else to change in the redesign: look, logo and wording (2026-11-09).
- The owner's complaints about the previous look, all four selected: it looks like a template, too plain and poor, does not inspire trust, boring with no character.

## Evidence on Hand

- Real: the product itself, its plans and prices, the category and town lists.
- Not available and must not be invented: customer counts, testimonials, ratings of real businesses, photos of real businesses, partner logos.
- Local demo data (19 fictional businesses in `prisma/seed.ts`) exists only for development and is never shown in production.

## Product Principles

1. The free time is the product: show real times as early as possible, never a promise of them.
2. A minute, one hand, no account: every extra field or step has to earn its place.
3. Any trade is welcome: the look must suit a car wash and a dentist as well as a beauty salon.
4. Three languages are equal: nothing may depend on English string lengths.
5. Honest by default: no invented proof, clear prices, a clear way to cancel.

## Accessibility & Inclusion

Phone use outdoors in strong sunlight: body text and controls need solid contrast; tap targets at least 44 px; reduced-motion respected.
