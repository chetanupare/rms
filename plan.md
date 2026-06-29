# RMS Technician PWA — Implementation Plan

## Overview

Build a **separate Progressive Web App (PWA) for field technicians** that connects to the existing **rms-api** (Express/MongoDB) backend. The existing **RMS Electron/Windows app** stays unchanged for shop staff.

### Architecture

```
┌──────────────────────┐     ┌──────────────────────┐
│  RMS Desktop (SHOP)  │     │  Technician PWA      │
│  Electron/Windows    │     │  React/Vite + PWA    │
│  Stays as-is         │     │  Deployed to Vercel   │
└─────────┬────────────┘     └──────────┬───────────┘
          │                             │
          └────────┬────────────────────┘
                   │
        ┌──────────▼──────────┐    ┌──────────────┐
        │   rms-api           │    │   MongoDB    │
        │  (Express/Vercel)   │◄───│  (existing)  │
        │  + NEW tech routes  │    └──────────────┘
        └─────────────────────┘
```

---

## Part 1: Backend — New routes for `rms-api`

### 1.1 New MongoDB Collections

| Collection | Purpose |
|---|---|
| `technicians` | Technician profiles (userId, status, skills, location) |
| `technician_locations` | GPS location history |
| `job_offers` | Job offers linked to technicians + tickets |
| `technician_checklists` | Per-job checklist templates + completion status |
| `device_registrations` | Customer registered devices |
| `ratings` | Customer ratings for completed jobs |
| `settings` | White-label branding (colors, logo, app name) |

### 1.2 New API Routes

#### Auth (extend existing)

| Method | Endpoint | Action |
|---|---|---|
| POST | `/api/auth/register` | Register customer/technician |
| GET | `/api/auth/me` | Return user with role (already exists — extend) |

#### Customer Routes

| Method | Endpoint | Action |
|---|---|---|
| GET | `/api/customer/devices` | Get customer's registered devices |
| GET | `/api/customer/tickets` | Get customer's service tickets |
| GET | `/api/customer/tickets/:id/track` | Live tracking (status, ETA, tech location) |
| GET | `/api/customer/service-history` | Past service history |
| GET | `/api/customer/service-history/:id` | Single history detail |
| POST | `/api/customer/jobs/:id/ratings` | Submit rating |
| GET | `/api/customer/jobs/:id/ratings` | Get rating for job |
| PUT | `/api/customer/jobs/:id/ratings` | Update rating |

#### Technician Routes

| Method | Endpoint | Action |
|---|---|---|
| GET | `/api/technician/status` | Get current duty status |
| PUT | `/api/technician/status` | Toggle on/off duty |
| PUT | `/api/technician/location` | Update GPS location |
| GET | `/api/technician/jobs/offered` | List job offers |
| GET | `/api/technician/jobs/assigned` | List assigned jobs |
| GET | `/api/technician/jobs/:id` | Get single job detail |
| POST | `/api/technician/jobs/:id/accept` | Accept offered job |
| POST | `/api/technician/jobs/:id/reject` | Reject offered job |
| PUT | `/api/technician/jobs/:id/status` | Update job status |
| PUT | `/api/technician/jobs/:id/eta` | Set/update ETA |
| POST | `/api/technician/jobs/:id/after-photo` | Upload completion photo |
| POST | `/api/technician/jobs/:id/generate-quote` | Generate repair quote |
| POST | `/api/technician/jobs/:id/sign-contract` | Sign repair contract |
| GET | `/api/technician/jobs/:id/checklist` | Get job checklist |
| POST | `/api/technician/jobs/:id/checklist/:itemId/complete` | Mark checklist item done |
| POST | `/api/technician/jobs/:id/on-hold` | Mark job on hold (waiting parts) |
| POST | `/api/technician/jobs/:id/payment` | Record payment |

#### Public Device Data / Settings

| Method | Endpoint | Action |
|---|---|---|
| GET | `/api/device-types` | Device type list |
| GET | `/api/device-brands` | Device brand list (filter by type) |
| GET | `/api/device-models` | Device model list (filter by type+brand) |
| GET | `/api/devices/all` | All device data in one call |
| GET | `/api/settings/white-label` | Dynamic branding (colors, logo, app name) |

### 1.3 Job Status Flow

```
offered → accepted → en_route → arrived → diagnosing → quoted → 
signed_contract → repairing → quality_check → waiting_payment → 
completed → released

Optional branches:
  en_route → component_pickup → arrived
  repairing → waiting_parts → repairing
  any → cancelled | no_show | cannot_repair
```

---

## Part 2: Frontend — Technician PWA

### 2.1 Stack

| Component | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router DOM v6 |
| Server state | TanStack React Query v5 |
| Client state | Zustand 4 (persist middleware) |
| HTTP client | Axios |
| Icons | Lucide React |
| Date | date-fns |
| Maps | Google Maps (places, geocoding, directions) |
| PWA | vite-plugin-pwa + Workbox |
| Animations | framer-motion |

### 2.2 PWA Configuration

| Setting | Value |
|---|---|
| registerType | `autoUpdate` |
| display | `standalone` |
| orientation | `portrait` |
| theme_color | Dynamic (from white-label API) |
| Cache strategy | NetworkFirst for API, CacheFirst for assets |
| Offline | Workbox runtime caching (JS, CSS, HTML, images) |

### 2.3 Directory Structure

```
src/
├── main.tsx                    # Entry point + PWA registration
├── App.tsx                     # Root routing + role guard
├── index.css                   # Tailwind + custom vars
├── vite-env.d.ts
├── components/
│   ├── Layout.tsx              # App shell (sidebar, bottom nav, header)
│   ├── ProtectedRoute.tsx      # Auth guard
│   ├── ErrorBoundary.tsx       # Error boundary
│   ├── Loading.tsx             # Spinner
│   ├── Map.tsx                 # Google Maps wrapper
│   └── InstallPWA.tsx          # PWA install prompt
├── hooks/
│   └── useLocation.ts          # Geolocation + reverse geocode
├── lib/
│   └── api.ts                  # Axios instance + all endpoint fns
├── pages/
│   ├── auth/
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── technician/
│   │   ├── Dashboard.tsx
│   │   ├── Jobs.tsx
│   │   └── JobDetail.tsx
│   └── customer/ (optional — accessible if role=customer)
│       ├── Dashboard.tsx
│       ├── Booking.tsx
│       ├── Tracking.tsx
│       └── ServiceHistory.tsx
├── store/
│   ├── authStore.ts            # Zustand (user, token, persist)
│   └── themeStore.ts           # Zustand (white-label colors, persist)
└── types/
    └── index.ts                # Shared TypeScript types
```

### 2.4 Routes

| Route | Page | Auth | Role |
|---|---|---|---|
| `/login` | Login | Public | — |
| `/register` | Register | Public | — |
| `/` | Dashboard | Required | Technician / Customer (role redirect) |
| `/jobs` | Jobs list | Required | Technician |
| `/jobs/:id` | Job Detail | Required | Technician |
| `/booking` | Book service | Required | Customer |
| `/tracking` | Tracking list | Required | Customer |
| `/tracking?ticket=:id` | Live tracking | Required | Customer |
| `/service-history` | History | Required | Customer |

---

## Part 3: Feature Inventory (from fsm-frontend)

### 3.1 Technician Features — ALL

| # | Feature | Frontend | Backend | Priority |
|---|---|---|---|---|
| 1 | On/Off duty toggle | Dashboard.tsx | `PUT /technician/status` | P0 |
| 2 | Stats cards (offers, in-progress, completed, on-hold) | Dashboard.tsx | `GET /technician/status` + aggregated queries | P0 |
| 3 | New job offers list (latest 5) | Dashboard.tsx | `GET /technician/jobs/offered` | P0 |
| 4 | View all assigned jobs (sorted by priority) | Jobs.tsx | `GET /technician/jobs/assigned` | P0 |
| 5 | View all job offers with accept/reject | Jobs.tsx | `GET /technician/jobs/offered` | P0 |
| 6 | Accept job offer (with expired offer handling) | JobDetail.tsx / Jobs.tsx | `POST /technician/jobs/:id/accept` | P0 |
| 7 | Reject job offer | Jobs.tsx | `POST /technician/jobs/:id/reject` | P0 |
| 8 | Accept expired job with confirmation modal | JobDetail.tsx | `POST /technician/jobs/:id/accept?allow_expired=true` | P0 |
| 9 | **Progressive state-based UI** (offered → accepted → en_route → arrived → diagnosing → quoted → signed_contract → repairing → waiting_parts → quality_check → waiting_payment → completed) | JobDetail.tsx | `PUT /technician/jobs/:id/status` | P0 |
| 10 | Device info + issue description display | JobDetail.tsx | `GET /technician/jobs/:id` | P0 |
| 11 | Customer details panel (toggle show/hide) | JobDetail.tsx | `GET /technician/jobs/:id` | P0 |
| 12 | Call customer button | JobDetail.tsx | Frontend only (`tel:`) | P0 |
| 13 | WhatsApp customer button | JobDetail.tsx | Frontend only (`wa.me`) | P0 |
| 14 | Get directions / Open in Google Maps | JobDetail.tsx | Frontend only | P0 |
| 15 | **Live Google Maps** with technician + customer markers + route | JobDetail.tsx | `GET /technician/jobs/:id` (locations) | P1 |
| 16 | ETA countdown timer (HH:MM:SS) with color changes | JobDetail.tsx | `PUT /technician/jobs/:id/eta` | P0 |
| 17 | Manual ETA setup modal (when no automatic ETA) | JobDetail.tsx | `PUT /technician/jobs/:id/eta` | P0 |
| 18 | ETA timeout notification (browser push + vibration) | JobDetail.tsx | Frontend only | P1 |
| 19 | ETA timeout actions (I've Arrived / Update ETA) | JobDetail.tsx | Frontend only | P1 |
| 20 | Arrival confirmation card with time | JobDetail.tsx | Frontend only | P0 |
| 21 | Customer meeting section | JobDetail.tsx | Frontend only | P0 |
| 22 | Pre-diagnosis checklist | JobDetail.tsx | Frontend only (static) | P1 |
| 23 | Arrival photo upload (proof of arrival) | JobDetail.tsx | `POST /technician/jobs/:id/after-photo` | P0 |
| 24 | Arrival notes textarea | JobDetail.tsx | Frontend only | P1 |
| 25 | Emergency & Support buttons | JobDetail.tsx | Frontend only | P1 |
| 26 | Start Diagnosis CTA | JobDetail.tsx | `PUT /technician/jobs/:id/status` | P0 |
| 27 | Status dropdown (diagnosing / quoted / signed_contract / repairing / waiting_parts / quality_check) | JobDetail.tsx | `PUT /technician/jobs/:id/status` | P0 |
| 28 | Dynamic checklist from backend (with Done toggle) | JobDetail.tsx | `GET /technician/jobs/:id/checklist` + `POST .../checklist/:id/complete` | P1 |
| 29 | Checklist progress counter | JobDetail.tsx | `GET /technician/jobs/:id/checklist` | P1 |
| 30 | More Actions section (Upload Photo) | JobDetail.tsx | `POST /technician/jobs/:id/after-photo` | P0 |
| 31 | Component Pickup flow | JobDetail.tsx | `PUT /technician/jobs/:id/status` | P0 |
| 32 | Browser notification permission request | JobDetail.tsx | Frontend only | P1 |
| 33 | Auto-refresh job data (polling every 30s) | JobDetail.tsx | `GET /technician/jobs/:id` | P0 |
| 34 | Shimmer loading placeholders | All pages | Frontend only | P0 |
| 35 | Empty state display | All pages | Frontend only | P0 |
| 36 | **Quote generation** | JobDetail.tsx | `POST /technician/jobs/:id/generate-quote` | P2 |
| 37 | **Contract signing** | JobDetail.tsx | `POST /technician/jobs/:id/sign-contract` | P2 |
| 38 | **Payment recording** | JobDetail.tsx | `POST /technician/jobs/:id/payment` | P2 |
| 39 | Location update (GPS tracking) | Background | `PUT /technician/location` | P1 |
| 40 | Mark job on-hold (waiting parts) | JobDetail.tsx | `POST /technician/jobs/:id/on-hold` | P1 |

### 3.2 Customer Features (accessible in same PWA)

| # | Feature | Frontend | Backend | Priority |
|---|---|---|---|---|
| 41 | Login/Register | Login.tsx / Register.tsx | `POST /auth/login` / `POST /auth/register` | P0 |
| 42 | Customer dashboard (stats, devices, recent tickets) | Dashboard.tsx | `GET /customer/devices`, `GET /customer/tickets` | P1 |
| 43 | 3-step booking wizard (device → location → review) | Booking.tsx | Device API + `POST /customer/bookings` | P2 |
| 44 | Cascading device type/brand/model selects | Booking.tsx | `GET /device-types`, `/device-brands`, `/device-models` | P1 |
| 45 | Geolocation with draggable map marker | Booking.tsx | Frontend only | P1 |
| 46 | Ticket list with status badges | Tracking.tsx | `GET /customer/tickets` | P1 |
| 47 | Live tracking page (status, map, ETA, timeline) | Tracking.tsx | `GET /customer/tickets/:id/track` | P1 |
| 48 | Technician contact (call/WhatsApp) | Tracking.tsx | Frontend only | P1 |
| 49 | Service history list + detail | ServiceHistory.tsx | `GET /customer/service-history` | P2 |
| 50 | Job ratings (submit/view/update) | Tracking.tsx | `POST/GET/PUT /customer/jobs/:id/ratings` | P2 |

### 3.3 PWA & Platform Features

| # | Feature | Status |
|---|---|---|
| 51 | Service worker auto-update | ✅ vite-plugin-pwa |
| 52 | Offline API caching (NetworkFirst, 5min TTL) | ✅ Workbox runtimeCaching |
| 53 | Static asset caching (JS/CSS/HTML/images) | ✅ globPatterns |
| 54 | Apple touch icon + meta tags | ✅ index.html |
| 55 | Standalone display mode | ✅ manifest |
| 56 | Dynamic theme-color from white-label API | ✅ themeStore.ts |
| 57 | Safe area insets for notched devices | ✅ index.css |
| 58 | Install prompt banner | ✅ InstallPWA component |
| 59 | Responsive layout (mobile bottom nav + desktop sidebar) | ✅ Layout.tsx |

---

## Part 4: Vercel Deployment

### 4.1 Frontend (`/` route on Vercel)

**vercel.json:**
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Environment variables:**
- `VITE_API_URL` → `https://rms-api-psi.vercel.app`

### 4.2 Backend (`rms-api` — already deployed)

- Deploy updated `rms-api` with new technician routes
- No changes to existing endpoints

---

## Part 5: Implementation Order

### Phase 1 — Foundation (Backend + Auth)
- [ ] Add new MongoDB collections + indexes
- [ ] Create technician routes (status, location)
- [ ] Create job offers + assigned jobs routes
- [ ] Create auth/register endpoint
- [ ] Create white-label + device data endpoints
- [ ] Scaffold frontend project (Vite + React + TS + Tailwind + PWA)
- [ ] Set up Zustand stores (auth, theme)
- [ ] Create Axios instance + API functions
- [ ] Build login/register pages
- [ ] Build Layout + ProtectedRoute + routing

### Phase 2 — Core Technician Features
- [ ] Dashboard (duty toggle, stats, job offers preview)
- [ ] Jobs list (assigned + offered with accept/reject)
- [ ] Job Detail — offered state (accept, issue display)
- [ ] Job Detail — accepted state (customer info, call/WhatsApp, location, en_route/pickup)
- [ ] Job Detail — en_route state (map, ETA countdown, directions)
- [ ] Job Detail — arrived state (confirmation, photo upload, pre-diagnosis, start diagnosis)
- [ ] Job Detail — in-progress state (status dropdown)
- [ ] Job Detail — quality_check/waiting_payment state (checklist)

### Phase 3 — Polish & Customer Features
- [ ] Google Maps integration (technician + customer markers, route)
- [ ] ETA countdown with browser notifications + vibration
- [ ] Expired job offer modal
- [ ] Manual ETA modal
- [ ] Customer dashboard + tracking pages
- [ ] Customer booking wizard (if needed)

### Phase 4 — Deployment & Testing
- [ ] Vercel deployment config
- [ ] PWA manifest + icons
- [ ] Offline caching strategy
- [ ] Test full technician workflow end-to-end
- [ ] Test with actual rms-api backend

---

## Part 6: File Reference

| Existing File | Purpose |
|---|---|
| `fsm-frontend/src/lib/api.ts` | Full API endpoint list for reference |
| `fsm-frontend/src/pages/technician/Dashboard.tsx` | Tech dashboard (183 lines) |
| `fsm-frontend/src/pages/technician/Jobs.tsx` | Jobs list (358 lines) |
| `fsm-frontend/src/pages/technician/JobDetail.tsx` | Job detail (1361 lines) |
| `fsm-frontend/src/pages/customer/Booking.tsx` | Customer booking (506 lines) |
| `fsm-frontend/src/pages/customer/Tracking.tsx` | Customer tracking (400 lines) |
| `fsm-frontend/src/pages/customer/Dashboard.tsx` | Customer dashboard |
| `fsm-frontend/src/components/Layout.tsx` | App shell layout |
| `fsm-frontend/src/components/Map.tsx` | Google Maps wrapper |
| `fsm-frontend/src/components/Loading.tsx` | Loading spinner |
| `fsm-frontend/src/components/ProtectedRoute.tsx` | Auth guard |
| `fsm-frontend/src/hooks/useLocation.ts` | Geolocation hook |
| `fsm-frontend/src/store/authStore.ts` | Auth store (Zustand) |
| `fsm-frontend/src/store/themeStore.ts` | Theme store (Zustand) |
| `fsm-frontend/vite.config.ts` | PWA + proxy config |
| `fsm-frontend/index.html` | PWA meta tags |
| `rms-api/api/index.js` | Express app entry (add routes here) |
| `rms-api/routes/auth.js` | Auth routes (extend) |
| `rms-api/routes/jobCards.js` | Job cards (extend status field) |
| `rms-api/middleware/auth.js` | Auth middleware (extend for roles) |

---

## Status Legend

- `⬜ Pending` — Not started
- `🔄 In Progress` — Being worked on
- `✅ Done` — Completed
- `❌ Cancelled` — No longer needed
