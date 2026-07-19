# REST API Reference

Base URL: `http://localhost:4000/api/v1`

All responses follow the shape:

```json
{ "success": true, "data": {}, "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 } }
```

Errors:

```json
{ "success": false, "message": "Human readable message", "details": {} }
```

Authenticated routes require `Authorization: Bearer <accessToken>`. Access tokens expire quickly (15m default); use the refresh token to get a new pair.

---

## Auth — `/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Register as `CUSTOMER` or `RENTAL_PARTNER` |
| POST | `/login` | — | Email + password login |
| POST | `/refresh` | — | Exchange refresh token for a new token pair |
| POST | `/logout` | — | Revoke a refresh token |
| GET | `/me` | ✅ | Current user profile |
| POST | `/otp/request` | ✅ | Request an OTP for email/phone verification |
| POST | `/otp/verify` | ✅ | Verify OTP, activates the account |
| POST | `/forgot-password` | — | Request a password-reset OTP (no account-existence leak) |
| POST | `/reset-password` | — | Reset password using the OTP |
| POST | `/change-password` | ✅ | Change password while logged in |

`register` body:
```json
{ "firstName": "Jane", "lastName": "Doe", "email": "jane@example.com", "password": "min8chars", "userType": "CUSTOMER", "referralCode": "ABCD" }
```

Response includes `{ user, accessToken, refreshToken }`. The refresh token is a composite string (`<jwt>.<opaque>`) — store it as-is and pass it back verbatim to `/refresh` and `/logout`.

---

## Users — `/users`

All routes under `authenticate`.

| Method | Path | Description |
|---|---|---|
| PATCH | `/me` | Update profile fields |
| GET | `/me/dashboard` | Customer dashboard widgets (active/completed bookings, wishlist count, wallet) |
| GET/POST | `/me/driving-licenses` | List / add a driving license |
| GET/POST/DELETE | `/me/wishlist[/:vehicleId]` | Wishlist management |
| GET/POST/DELETE | `/me/saved-locations[/:id]` | Saved pickup locations |

---

## Catalog — `/catalog`

Public reads, admin-only writes (`ADMIN`/`SUPER_ADMIN`).

- `GET/POST /countries`
- `GET/POST /cities` (`?countryId=`, `?popular=true`)
- `GET/POST /vehicle-categories`
- `GET/POST /vehicle-brands`

---

## Rental Partners — `/rental-partners`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/me` | RENTAL_PARTNER | Create business profile (onboarding) |
| GET | `/me` | RENTAL_PARTNER | Get own profile + documents + bank details |
| PATCH | `/me` | RENTAL_PARTNER | Update business profile |
| GET | `/me/dashboard` | RENTAL_PARTNER | Fleet/revenue/booking widgets |
| POST | `/me/documents` | RENTAL_PARTNER | Upload a KYC document |
| PUT | `/me/bank-details` | RENTAL_PARTNER | Set payout bank details |
| GET | `/` | ADMIN (`partners.view`) | List all partners, filter by `?status=` |
| GET | `/:id` | ADMIN (`partners.view`) | Partner detail |
| PATCH | `/:id/verification-status` | ADMIN (`partners.verify`) | `UNDER_REVIEW` / `VERIFIED` / `REJECTED` |
| PATCH | `/documents/:documentId/review` | ADMIN (`partners.verify`) | Approve/reject a document |

A partner cannot list vehicles until `verificationStatus === "VERIFIED"`.

---

## Vehicles — `/vehicles`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/search` | optional | Search with filters + date-range availability. See query params below |
| GET | `/:id` | — | Vehicle detail with images, reviews, availability blocks |
| GET | `/:id/availability` | — | `?pickupDatetime=&returnDatetime=` → `{ available: boolean }` |
| GET | `/partner/mine` | RENTAL_PARTNER | Own fleet |
| POST | `/` | RENTAL_PARTNER | Create vehicle (requires verified business) |
| PATCH | `/:id` | RENTAL_PARTNER | Update (re-enters `PENDING` approval) |
| DELETE | `/:id` | RENTAL_PARTNER | Soft-deactivate |
| POST | `/:id/images` | RENTAL_PARTNER | Bulk-add images |
| DELETE | `/:id/images/:imageId` | RENTAL_PARTNER | Remove an image |
| POST | `/:id/availability-block` | RENTAL_PARTNER | Block dates (maintenance etc.) |
| GET | `/admin/pending-approval` | ADMIN (`vehicles.approve`) | Approval queue |
| PATCH | `/:id/review` | ADMIN (`vehicles.approve`) | Approve/reject a listing |

`search` query params: `cityId, categoryId, brandId, transmission, fuelType, minPrice, maxPrice, seatingCapacity, pickupDatetime, returnDatetime, sortBy(price_asc|price_desc|rating|newest), page, limit`.

---

## Bookings — `/bookings`

All routes require auth.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | CUSTOMER | Create a booking (validates license, availability, coupon; computes price) |
| GET | `/mine` | CUSTOMER | List own bookings, `?status=` |
| POST | `/:id/cancel` | CUSTOMER | Cancel (only from cancellable states) |
| GET | `/partner/mine` | RENTAL_PARTNER | Bookings for the partner's fleet |
| PATCH | `/:id/status` | RENTAL_PARTNER | Advance the booking's rental-tracking status |
| GET | `/:id` | owner/partner/admin | Full detail incl. `statusHistory` timeline |

### Status machine

```
PENDING → CONFIRMED → APPROVED → VEHICLE_READY → PICKED_UP → ACTIVE → RETURNING → COMPLETED
   ↓           ↓           ↓            ↓
CANCELLED  CANCELLED   CANCELLED   CANCELLED
CONFIRMED → REJECTED (partner declines)
```

`PENDING → CONFIRMED` happens automatically once a payment is verified (see Payments below) — it is not a partner action. Every transition is appended to `BookingStatusHistory` and triggers an in-app notification to the customer, which is what drives the rental-tracking timeline UI.

---

## Payments — `/payments`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/orders` | CUSTOMER | Create a payment order for a `PENDING` booking. `provider: RAZORPAY\|STRIPE\|WALLET`. Wallet payments settle instantly; Razorpay/Stripe return a `providerConfig` for the client SDK to open checkout |
| POST | `/verify` | CUSTOMER | Verify a completed Razorpay/Stripe payment (signature-checked in production), transitions booking to `CONFIRMED`, generates the invoice |
| GET | `/mine` | CUSTOMER | Payment history |
| GET | `/wallet` | CUSTOMER | Wallet balance + last 50 transactions |
| GET | `/transactions` | ADMIN (`payments.view`) | Platform-wide transaction ledger |
| POST | `/:id/refund` | ADMIN (`payments.refund`) | Full or partial refund |

---

## Reviews — `/reviews`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/vehicle/:vehicleId` | — | Reviews for a vehicle |
| GET | `/partner/:rentalPartnerId` | — | Reviews for a rental partner |
| POST | `/` | CUSTOMER | Review a `COMPLETED` booking (one per booking); recomputes vehicle/partner average ratings |
| POST | `/:id/reply` | RENTAL_PARTNER/ADMIN | Reply to a review |
| POST | `/:id/report` | any authenticated user | Flag a review for moderation |

---

## Notifications — `/notifications`

- `GET /` — paginated, `?unreadOnly=true`, includes `meta.unreadCount`
- `PATCH /:id/read`
- `PATCH /read-all`

---

## Coupons — `/coupons`

- `POST /validate` (any authenticated user) — `{ code, bookingAmount }` → `{ discount }`
- Admin CRUD (`coupons.manage`): `GET/POST /`, `PATCH/DELETE /:id`

---

## Support Tickets — `/support-tickets`

- `POST /`, `GET /mine`, `GET /:id`, `POST /:id/messages` — customer/partner self-service
- `GET /` and `PATCH /:id/status` — admin (`support.manage`)

---

## Admin — `/admin`

- `GET /dashboard` (`analytics.view`) — platform-wide KPI widgets
- Roles & permissions: `GET /permissions`, `GET/POST /roles`, `PATCH/DELETE /roles/:id`, `POST /users/:userId/role` (all `roles.manage`)
- `GET /users`, `PATCH /users/:id/status` (`users.manage`)
- `GET /audit-logs` (`audit.view`)
- CMS/Blog: public `GET /cms/:slug`, `GET /blog`, `GET /blog/:slug`; admin `PUT /cms`, `PUT /blog` (`cms.manage`)
- Settings: `GET/PUT /settings/:key` (`settings.manage`)

Note: `SUPER_ADMIN` bypasses all `requirePermission` checks. `ADMIN` accounts need an assigned `Role` carrying the relevant permission key (seeded roles: **Super Admin**, **Support Agent**).

---

## Realtime (Socket.IO)

Connect with `io(url, { auth: { token: accessToken } })`. The server joins each socket to a `user:<id>` room; booking status transitions and other server-side events can be emitted to that room for live updates (wire-up point: `src/server.ts`, exported `io`).
