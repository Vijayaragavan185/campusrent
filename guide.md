# CampusRent Integration Guide

This guide documents everything integrated across frontend, backend, Docker, and local run workflows.

---

## 1) `start-dev.ps1` status

Yes — there are changes for `start-dev.ps1` in the current repo state (it appears as added/changed in git status).

What it does now:
- Starts PostgreSQL via Docker Compose
- Waits until Postgres is healthy (`pg_isready`)
- Runs Prisma migration deploy + Prisma generate
- Opens backend in a new PowerShell window (`npm run dev`)
- Opens frontend in a new PowerShell window (`pnpm run dev`)
- Prints key local URLs and stop instructions

---

## 2) What was integrated

### Backend integration
Added route/controller support so frontend API calls are fully backed:

- Auth (existing)
- Listings (new pair)
- Bookings (new pair)
- Messages (new pair)
- Users (new pair)
- Reviews (new pair)

Additional backend updates:
- Added `GET /api/bookings/lending`
- Improved `GET /api/messages/conversations` payload for inbox/chat rendering

### Frontend integration
Replaced mock-data-only flows with API-backed flows for key pages:

- `Home`, `Search`, `ListingDetail`
- `PostListing`
- `MyBookings` (renting + lending)
- `Inbox`, `Chat`
- `Profile`, `Settings`, `SignUp`
- `BottomNav` profile link is now auth-aware

### Data compatibility layer
Added:
- `frontend/src/services/normalizers.ts`

Purpose:
- Maps backend shapes to existing UI-friendly fields (`pickupLocation`, `status`, `reviewCount`, etc.)
- Keeps UI stable while backend returns canonical Prisma structures

### Docker + container integration
Added container artifacts:
- `backend/Dockerfile`
- `backend/.dockerignore`
- `frontend/Dockerfile`
- `frontend/.dockerignore`

Updated `docker-compose.yml`:
- Keeps `postgres` as default service
- Adds optional `backend` + `frontend` under profile `fullstack`
- Adds postgres healthcheck
- Backend runs with `NODE_ENV=development` for local OTP/dev mode behavior

---

## 3) Prerequisites

Install and ensure available:
- Docker Desktop (running)
- Node.js (18+ recommended)
- npm
- pnpm

Windows PowerShell is assumed below.

---

## 4) Run options

## 4.1 Local dev (recommended for iterative coding)

From repo root:

- Run `./start-dev.ps1`

This will:
1. Start Postgres container
2. Apply Prisma migrations + generate client
3. Start backend dev server
4. Start frontend dev server

### How to stop local dev servers (started by `start-dev.ps1`)

`start-dev.ps1` opens backend and frontend in separate PowerShell windows.

To stop cleanly:
1. In backend window, press `Ctrl + C`
2. In frontend window, press `Ctrl + C`
3. Close both windows
4. From repo root, stop Postgres container:
  - `docker-compose down`


## 4.2 Full Docker stack (postgres + backend + frontend)

From repo root:

- `docker-compose --profile fullstack up -d --build`

Check status:
- `docker-compose --profile fullstack ps`

Stop stack:
- `docker-compose --profile fullstack down`

### How to stop full Docker stack

From repo root:
- Stop and remove fullstack containers:
  - `docker-compose --profile fullstack down`
- (Optional) also remove volumes:
  - `docker-compose --profile fullstack down -v`

---

## 5) Core URLs

### App URLs
- Frontend: `http://localhost:5173`
- Backend base: `http://localhost:5000/api`
- Health: `http://localhost:5000/api/health`

### Optional tooling
- Prisma Studio (manual):
  - `cd backend`
  - `npx prisma studio`
  - URL: `http://localhost:5555`

---

## 6) API endpoint map

Base URL: `http://localhost:5000/api`

### Auth
- `POST /auth/register`
- `POST /auth/verify-otp`
- `POST /auth/login`
- `GET /auth/me`

### Listings
- `GET /listings`
- `GET /listings/search`
- `GET /listings/:id`
- `POST /listings` (auth)
- `PUT /listings/:id` (auth)
- `DELETE /listings/:id` (auth)

### Bookings
- `POST /bookings` (auth)
- `GET /bookings/my` (auth)
- `GET /bookings/lending` (auth)
- `GET /bookings/:id` (auth)
- `PUT /bookings/:id/status` (auth)

### Messages
- `GET /messages/conversations` (auth)
- `GET /messages/:conversationId` (auth)
- `POST /messages` (auth)

### Users
- `GET /users/:id`
- `PUT /users/me` (auth)

### Reviews
- `GET /reviews/listing/:listingId`
- `GET /reviews/user/:userId`
- `POST /reviews` (auth)

---

## 7) Frontend API client references

- `frontend/src/services/api.js`
- `frontend/src/services/normalizers.ts`

Key exported API objects:
- `authAPI`
- `listingsAPI`
- `bookingsAPI`
- `messagesAPI`
- `usersAPI`
- `reviewsAPI`

---

## 8) Smoke-tested user journey (validated)

Validated sequence in live container run:
1. Signup owner (register + OTP verify)
2. Signup renter (register + OTP verify)
3. Owner posts listing
4. Renter creates booking for that listing
5. Renter sends chat message to owner
6. Both owner/renter can fetch conversations and conversation messages

---

## 9) Troubleshooting

### Docker daemon unreachable
Symptoms:
- `failed to connect to docker API at npipe...`

Fix:
- Start Docker Desktop and wait until engine is ready

### Backend container restarts with Prisma/OpenSSL issues
Fix already applied in this integration:
- Backend Docker base image uses `node:20` (Debian), not Alpine

### `npm ci` lockfile errors in Docker build
Fix already applied:
- Dockerfiles use `npm install --no-audit --no-fund`

### OTP registration fails with AWS token error locally
Cause:
- Production mode triggers SES send path

Fix already applied for compose local fullstack:
- Backend env uses `NODE_ENV=development`

---

## 10) Files created/updated (integration-related)

### Created
- `backend/src/controllers/listings.controller.js`
- `backend/src/controllers/bookings.controller.js`
- `backend/src/controllers/messages.controller.js`
- `backend/src/controllers/users.controller.js`
- `backend/src/controllers/reviews.controller.js`
- `backend/src/routes/listings.routes.js`
- `backend/src/routes/bookings.routes.js`
- `backend/src/routes/messages.routes.js`
- `backend/src/routes/users.routes.js`
- `backend/src/routes/reviews.routes.js`
- `frontend/src/services/normalizers.ts`
- `backend/Dockerfile`
- `backend/.dockerignore`
- `frontend/Dockerfile`
- `frontend/.dockerignore`

### Updated
- `docker-compose.yml`
- `frontend/src/services/api.js`
- `frontend/src/app/components/BottomNav.tsx`
- `frontend/src/app/pages/Home.tsx`
- `frontend/src/app/pages/Search.tsx`
- `frontend/src/app/pages/ListingDetail.tsx`
- `frontend/src/app/pages/PostListing.tsx`
- `frontend/src/app/pages/MyBookings.tsx`
- `frontend/src/app/pages/Inbox.tsx`
- `frontend/src/app/pages/Chat.tsx`
- `frontend/src/app/pages/Profile.tsx`
- `frontend/src/app/pages/Settings.tsx`
- `frontend/src/app/pages/SignUp.tsx`
- `start-dev.ps1`

---

## 11) Quick command cheat sheet

### Start local dev workflow
- `./start-dev.ps1`

### Start full container stack
- `docker-compose --profile fullstack up -d --build`

### Check fullstack status
- `docker-compose --profile fullstack ps`

### Stop fullstack
- `docker-compose --profile fullstack down`

### Stop local dev started with script
- In backend and frontend PowerShell windows: press `Ctrl + C`
- Then from root: `docker-compose down`

### Backend health
- Open `http://localhost:5000/api/health`

### Frontend app
- Open `http://localhost:5173`

---

If you want, I can also generate a smaller `guide-quickstart.md` (2-minute setup only) and keep this one as the detailed operations guide.
