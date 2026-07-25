# Multi-Vendor Vehicle Rental Marketplace

A production-oriented foundation for a multi-vendor vehicle rental marketplace: customers book vehicles from independently-operated rental partners, partners manage their fleet and bookings, and admins oversee the whole platform.

## Current scope

This repository contains the **backend + database**, the **full web platform** (public marketing site, customer portal, rental-partner dashboard, admin dashboard), and **native mobile apps** (Flutter) for all three roles.

### Backend

- PostgreSQL schema (Prisma) covering users/RBAC, rental partners + KYC, vehicles, bookings, payments/wallet, reviews, notifications, coupons, support tickets, CMS/blog, audit logs — see [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)
- REST API (Express + TypeScript) implementing the full booking lifecycle: search → book → pay → partner approval → rental tracking → review — see [`docs/API.md`](docs/API.md)
- JWT auth with refresh-token rotation, OTP email/phone verification, password reset
- Role-based access control: coarse-grained by account type (`CUSTOMER` / `RENTAL_PARTNER` / `ADMIN` / `SUPER_ADMIN`) plus fine-grained permissions for admin staff, including a driving-license verification queue (`/admin/driving-licenses`) added while building the web apps — booking creation hard-requires a `VERIFIED` license, and nothing in the original API could ever set that status
- Security middleware: Helmet, CORS allowlist (covering all three web app dev ports), rate limiting, Zod input validation, centralized error handling
- Docker Compose for local Postgres + API, with a Dockerfile that runs migrations on boot
- Seed script for permissions, a Super Admin role/account, starter cities/categories/brands

### Web platform

Three Next.js (App Router) + React + TypeScript apps sharing two workspace packages, all built against the live REST API (no mocked data). Routing is file-based (`src/app/`); every page is a Client Component (`"use client"`) — this is a mechanical port off Vite/React Router, not a rewrite onto Next's server-rendering model, so data-fetching (TanStack Query) and auth (`localStorage`-token `AuthProvider`) work exactly as before. `packages/ui` exports small Next-native shims (`Link`, `NavLink`, `useNavigate`) that replicate the React Router APIs the whole codebase was originally written against, so most page code is unchanged beyond its import line.

- **`apps/public-site`** (port 5176) — the unified public + customer site, Amazon/Flipkart-style: guests can browse freely (home, search, vehicle detail, categories, cities, blog, about, contact, FAQ, legal pages CMS-driven, become-a-partner, careers, support), and logging in (register/login/OTP/password reset) unlocks an `/account` area — dashboard, booking checkout, booking tracking with a visual status timeline, payments/wallet, notifications, support tickets, profile (licenses, saved locations), settings — rendered inside the same header/footer with a slim account sidebar (`AccountLayout`), not a separate app.
- **`apps/partner-web`** (port 5174) — registration + business onboarding (KYC documents, bank details), dashboard, vehicle CRUD + images + availability blocks, booking-request approval workflow, reviews, support, profile.
- **`apps/admin-web`** (port 5175, login only — no public admin signup) — platform dashboard, customer/partner management + KYC verification, vehicle approval queue, driving-license review queue, transactions/refunds, coupons, catalog management, roles & permissions, support tickets, CMS/blog, audit logs, settings.

Shared packages:

- **`packages/ui`** — the design system: Button/Input/Select/Textarea/Checkbox, Card, Badge (incl. `BookingStatusBadge`), Modal, Dropdown, Tabs, Pagination, DataTable, Toast, StarRating, `BookingStatusTimeline` (the visual rental-tracking stepper), FileUpload, ImageGallery, `DashboardShell`/`AuthLayout` page shells (used by partner-web/admin-web), `RevealOnScroll`/`Eyebrow`/`GradientMesh`/`Marquee` (public-site's marketing polish), dark-mode `ThemeProvider`. Built with Tailwind CSS against the spec's exact color palette, unified on Inter for both headings and body text, plus Framer Motion for transitions.
- **`packages/api-client`** — a typed Axios client (Bearer-token auth, refresh-on-401), one function per backend endpoint, and TanStack Query hooks (`useVehicleSearch`, `useCreateBooking`, `usePartnerDashboard`, `useAdminDashboard`, etc.), plus a shared `AuthProvider`/`useAuth` used identically (with a different `allowedUserTypes`) by all three apps. Several hooks (`useWishlist`, `useNotifications`) accept an `enabled` flag so `public-site` can safely call them for guests without an auth-required 401.
- **`packages/config`** — the shared Tailwind preset (color/type tokens) and base `tsconfig`.

**Known, deliberate gaps** (not papered over — see `docs/API.md` and inline notes in the admin app): no "list all bookings"/"list all vehicles" admin endpoint (admin oversight is scoped to the dashboard aggregate + the vehicle-approval queue); no object-storage upload endpoint yet, so image/document "uploads" inline files as `data:` URLs client-side (satisfies the backend's URL validation and works end-to-end in dev, but isn't real file storage); no public contact-form or newsletter-subscription endpoint, so those forms validate and show a success state without a network call; live payment provider wiring is stubbed (Razorpay/Stripe integration points exist server-side but checkout in `public-site` uses the `WALLET` provider path, which is fully real — wallet debit, booking confirmation, and status history all execute for real).

### Mobile apps

Three Flutter apps, one per role, sharing a local package the same way the web apps share `packages/*`. Auth is Firebase (email/password on mobile; the web apps additionally support phone OTP), matching how the backend actually verifies sessions (`backend/app/core/firebase.py` — the backend never issues its own tokens).

- **`apps/customer-mobile`** — browse/search vehicles, vehicle detail with trip date/time pickers, booking checkout + wallet payment, booking tracking (status timeline), wallet, driving licenses, saved locations, notifications, wishlist, support tickets.
- **`apps/partner-mobile`** — registration + business onboarding (KYC documents, bank details), dashboard, vehicle CRUD + images, booking-request approval workflow, reviews replies, support.
- **`apps/admin-mobile`** — login only (no signup), dashboard, vehicle approval queue, partner verification + document review, driving-license review queue, user management (suspend/ban), coupons CRUD, support tickets.

Shared package:

- **`packages/mobile_core`** — typed API client (`Dio`, mirrors the same `{success, data, meta}` envelope as `packages/api-client`), one model class per backend entity, a `FirebaseAuthService` + Riverpod `AuthController` (the mobile equivalent of `AuthContext.tsx`, keyed by `allowedUserTypes` per app), the shared theme (matches `packages/config`'s color tokens), and common widgets (`BookingStatusTimeline`, `StatusBadge`, etc.).

**Firebase setup needed before phone auth / push notifications work on-device**: each app's `firebase_options.dart` currently reuses the existing project's (`vehicle-rent-001`) *web* app config, which is enough for email/password auth to work everywhere. Phone auth's native app-verification (Android SHA-1/SHA-256 fingerprints, iOS APNs) requires registering real Android/iOS apps for this project in the Firebase console — run `flutterfire configure --project=vehicle-rent-001` once you have Firebase CLI access to replace the placeholder options with real per-platform config.

## Repository layout

```
vehicle-rental-marketplace/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # full data model
│   │   ├── migrations/          # SQL migrations (generated offline, see below)
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/               # env, prisma client
│   │   ├── middleware/           # auth, rbac, validation, rate limiting, errors
│   │   ├── modules/               # one folder per domain: auth, users, catalog,
│   │   │                          # rentalPartners, vehicles, bookings, payments,
│   │   │                          # reviews, notifications, coupons, support, admin
│   │   ├── routes/index.ts       # mounts all module routers under /api/v1
│   │   ├── app.ts                # express app wiring
│   │   └── server.ts             # http + socket.io bootstrap
│   ├── Dockerfile
│   └── .env.example
├── packages/
│   ├── config/                   # shared Tailwind preset + base tsconfig
│   ├── ui/                       # design system component library
│   ├── api-client/                # typed API client + TanStack Query hooks + auth context
│   └── mobile_core/               # Flutter: typed API client, models, Firebase auth, theme
├── apps/
│   ├── public-site/               # unified public + customer site (port 5176)
│   ├── partner-web/                # rental partner dashboard (port 5174)
│   ├── admin-web/                  # admin dashboard (port 5175)
│   ├── customer-mobile/            # Flutter customer app
│   ├── partner-mobile/             # Flutter rental-partner app
│   └── admin-mobile/               # Flutter admin app (login only)
├── docker-compose.yml            # postgres + api
├── package.json                   # npm workspaces root (packages/*, apps/*)
└── docs/API.md                   # endpoint reference
```

## Getting started

Requires Docker (for Postgres) and Node.js 20+.

### Backend + database

```bash
cd backend
cp .env.example .env             # adjust secrets/keys as needed
npm install

# start Postgres (from repo root)
cd .. && docker compose up -d postgres

cd backend
npx prisma migrate dev           # applies the schema to your local Postgres
npm run seed                     # creates permissions, Super Admin, starter catalog data
npm run dev                      # starts the API on http://localhost:4000
```

Health check: `GET http://localhost:4000/health`.

Super Admin seed login (for `admin-web`): `admin@rentalmarketplace.example` / `ChangeMe123!` — **change this password immediately** after first login in any environment beyond local dev.

### Web apps

From the repo root (npm workspaces — one install for every app + shared package):

```bash
npm install
npm run dev:backend    # http://localhost:4000  (equivalent to the backend steps above, once configured)
npm run dev:public     # http://localhost:5176 — public-site (unified public + customer site)
npm run dev:partner    # http://localhost:5174 — partner-web
npm run dev:admin      # http://localhost:5175 — admin-web
```

Each app reads its API base URL from `NEXT_PUBLIC_API_URL` (see each app's `.env.example`; defaults to `http://localhost:4000/api/v1`).

### Mobile apps

Requires the Flutter SDK (stable channel; installed here via `git clone -b stable https://github.com/flutter/flutter.git` since Homebrew wasn't available — see `~/development/flutter`). Each app is a normal Flutter project with a local path dependency on `packages/mobile_core`:

```bash
cd packages/mobile_core && flutter pub get && cd ../..

cd apps/customer-mobile && flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api/v1   # Android emulator
# flutter run --dart-define=API_BASE_URL=http://localhost:4000/api/v1  # iOS simulator / desktop / web / real device on the same network as the backend
```

Same pattern for `apps/partner-mobile` and `apps/admin-mobile`. `10.0.2.2` is the Android emulator's alias for the host machine — swap it for your machine's LAN IP when running on a physical device. This sandbox has Chrome and macOS desktop targets available but no Android SDK or full Xcode install, so builds have been verified with `flutter analyze` (zero errors across all four packages) and a full `flutter build web --release` for `customer-mobile`; they haven't been run end-to-end against a live backend here — do that once Postgres + the API are up, the same way as the golden-path suggestion below.

### Why the migration folder was generated offline

This sandbox has no local Postgres/Docker, so the initial migration SQL was produced with `prisma migrate diff --from-empty --to-schema-datamodel` (a schema diff, no live DB needed) rather than `prisma migrate dev`. Functionally it's the same SQL `migrate dev` would have produced; run `npx prisma migrate dev` yourself once Postgres is up to apply it and let Prisma take over migration history normally from that point on. For the same reason, the web apps have been verified with `tsc --noEmit` and `next build`/dev-server boot against the real source, but not yet walked end-to-end against a live database in this environment — do that once Postgres is running (see the golden-path suggestion below).

### A note on dependency versions

`prisma@7`, `typescript@7`, and `express@5` were the versions `npm install` picked up by default at the time the backend was built, but each introduced breaking changes that either don't work together yet or add friction with no corresponding benefit here. The backend is pinned to `prisma@6`, `typescript@5`, `express@4` instead. The web apps are similarly pinned to current-but-stable majors (React 19, Next.js 16, Tailwind 3, TanStack Query 5) rather than Tailwind 4's CSS-first config, to keep the three apps' shared dependency tree simple and predictable. The apps were originally built on Vite + React Router and later migrated to Next.js — `packages/ui`'s `Link`/`NavLink`/`useNavigate` shims exist specifically to bridge that history without having to touch every page's JSX.

## Roadmap

1. ~~Customer web app (React/Vite/Tailwind) against this API~~ ✅
2. ~~Rental partner dashboard~~ ✅
3. ~~Admin dashboard~~ ✅
4. ~~Public marketing site~~ ✅
5. ~~Mobile apps (customer, partner, admin)~~ ✅ (Flutter, not React Native as originally scoped — see "Mobile apps" above)
6. Real object-storage upload endpoint (S3/R2) to replace the dev-mode `data:` URL fallback used by every file upload in the web apps; live Razorpay/Stripe client-side integration; Nodemailer templates for OTP/notifications; an admin "all bookings"/"all vehicles" listing endpoint

### Suggested first end-to-end smoke test once Postgres is running

Browse `public-site` as a guest — search vehicles, view a detail page, notice there's no login wall. Register a customer (`public-site` → `/register`) → verify OTP (dev mode echoes the code in the API response) → register a partner (`partner-web`) → complete partner onboarding + KYC → log into `admin-web` as the seeded Super Admin → verify the partner and approve one of their vehicles → back in `public-site`, add a driving license, then approve it from `admin-web`'s Driving Licenses queue → book the vehicle and pay via wallet (guest browsing → login bounce → back to checkout, same as Amazon) → confirm the booking's status timeline updates in `/account/bookings`, and that partner-web's booking-approval actions move it through the rest of the lifecycle.
