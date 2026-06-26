# Sai Laptop & Computer Gallery — Service Management System

## Feature Overview

A comprehensive repair shop management platform built for Sai Laptop & Computer Gallery (Wani, Nagpur & Pandharkawda branches). Handles customer registration, repair tracking, billing, reporting, daily cash management, and customer self-service tracking.

---

## 1. Authentication & Role Management

| Feature | Details |
|---|---|
| **Login** | Username/password authentication with JWT tokens |
| **Admin Role** | Full access: Dashboard, Customers, Repairs, Billing, Reports, Settings, Data Warehouse, Daily Registrar |
| **Technician Role** | Limited access: Dashboard, Customers, Repairs only (no Billing, Reports, Settings, Data Warehouse) |
| **Session Persistence** | Token stored in localStorage, auto-restore on page refresh |
| **Splash Screen** | Animated startup screen with connectivity checks |

---

## 2. Dashboard

| Feature | Details |
|---|---|
| **KPI Cards** | Total Service Jobs, Pending Repairs, Completed Jobs, Today's Collection |
| **7-Day Revenue Chart** | Bar chart showing daily revenue trend with gradient bars |
| **Recent Jobs Table** | Last 5 service jobs with status badges, clickable to Repairs page |
| **New Service Job Button** | Opens Zen Mode wizard for quick job creation |
| **Daily Register Button** | Quick link to Daily Registrar page |

---

## 3. New Service Job Wizard (Zen Mode)

A full-screen, distraction-free 3-step wizard for receptionists to register a new repair job.

| Feature | Details |
|---|---|
| **Step 1 — Device & Source** | Select device type, brand, model (from DB), problem description, lead source |
| **Lead Source Options** | In Store Visit, Customer Location Visit, Telephone, WhatsApp/Social Media, Reference/Walk-in |
| **Step 2 — Customer Info** | Mobile number with live search dropdown, auto-fill existing customer, name, address, branch selector |
| **Mobile Search** | Type 2+ digits → real-time search of existing customers by mobile prefix → select to auto-fill |
| **Problem Suggestions** | While typing problem, shows previously reported issues from DB for autocomplete |
| **Step 3 — Confirm** | Review device + customer summary, shows existing/new customer status |
| **Smart Dedup** | If mobile matches existing customer, updates details and links new job — no duplicate |
| **Live Clock** | Real-time clock in header (gradient text) |
| **Keyboard Shortcuts** | Enter → next step/submit, Esc → back/close, 1-5 → quick lead source select |
| **Auto-focus** | First input auto-focuses on each step |

---

## 4. Customers

| Feature | Details |
|---|---|
| **Customer List** | Compact table with ID, name, mobile, address, registration date |
| **Inline Search** | Search by name, mobile, or address with live filtering |
| **Create Customer** | Modal form with name, mobile, address + device fields for first job |
| **Edit Customer** | Update name, mobile, address |
| **Delete Customer** | Cascade delete: removes customer + all linked job cards, repairs, billing (Admin only) |
| **Service History Modal** | Click customer → full history showing all job cards, repairs, invoices in one view |

---

## 5. Repairs (Job Tracking)

| Feature | Details |
|---|---|
| **Job Cards List** | All jobs with customer, device, model, status, technician, date |
| **Status Flow** | Pending → In Progress → Completed → Billed → Delivered |
| **Start Repair** | Opens modal to enter diagnosis, estimate cost, technician name |
| **Mark Complete** | One-click complete with activity log entry |
| **Mark Delivered** | Confirmation dialog before marking delivered |
| **View Job Details** | Eye icon → navigates to dedicated Job Detail page |
| **Technician Filter** | Dropdown to filter jobs by assigned technician |
| **Global Search** | Header search dispatches to Repairs page, filters by Job ID, customer name, mobile |
| **Technician Column** | Shows assigned technician per job |

---

## 6. Job Detail Page

A dedicated page for each job with full details, actions, and QR/barcode support.

| Feature | Details |
|---|---|
| **Job Header** | Job ID, status badge, branch, date, lead source, tracking code |
| **Device Information Card** | Type, brand, model, problem description |
| **Customer Card** | Name, mobile, address — with WhatsApp button |
| **Repair Details Card** | Technician, estimate cost, diagnosis (if repair started) |
| **Billing Card** | Invoice number, amount, bill type, tax type, payment mode (if billed) |
| **Activity Log** | Timestamped history of all status changes and actions |
| **QR Code** | Live QR code image linked to public tracking URL |
| **Barcode (CODE 128)** | Rendered barcode for technician scanner |
| **Tracking Code** | Unique 8-char nanoid code for customer tracking |
| **WhatsApp Button** | One-click to send status update via WhatsApp |
| **A4 Receipt Print** | Modern designed receipt with gradient header, info cards, QR, digital signature |
| **Thermal Label Print** | 58×36mm label with QR + CODE 128 barcode for device attachment |

---

## 7. Billing

| Feature | Details |
|---|---|
| **Ready for Billing** | Shows all Completed jobs without invoices |
| **Invoice Creation** | Select job → enter amount → preview with GST breakdown |
| **GST Invoice** | 18% tax split into 9% CGST + 9% SGST |
| **Bill Types** | Service, Parts, Full (what's being billed) |
| **Tax Types** | GST Invoice, Normal Bill |
| **Payment Modes** | Cash, UPI, Card, Other |
| **Duplicate Prevention** | Blocks billing the same Job ID twice |
| **Status Validation** | Only Completed/Billed jobs can be billed |
| **Invoice History** | Full history with invoice number, type, amount, payment, print button |
| **Invoice Print** | Opens styled HTML invoice in new window with print dialog |

---

## 8. Reports

| Feature | Details |
|---|---|
| **Report Types** | Daily, Monthly, Pending Jobs |
| **KPI Summary** | Total jobs, completed, revenue, pending |
| **Job Details Table** | All jobs with customer, device, status, amount, date |
| **CSV Export** | Downloads filtered report as CSV file |
| **Branch Filtering** | Reports respect selected branch |

---

## 9. Daily Registrar (Cash Management)

A zen-mode daily cash register for receptionists.

| Feature | Details |
|---|---|
| **Today View** | Full edit mode — add in/out entries, edit, delete |
| **Yesterday View** | Read-only — can view but not modify |
| **History View** | Date-wise summary of all days with totals |
| **Entry Types** | IN (green) / OUT (red) |
| **Categories** | Repair Payment, Part Sale, Expense, Petty Cash, Other |
| **Payment Modes** | Cash, UPI, Card, Other |
| **Live Clock** | Real-time gradient clock in header |
| **KPI Display** | Total In, Total Out, Balance with color coding |
| **Floating Bottom Bar** | Big touch-friendly action buttons (Add In, Add Out, Finalize) |
| **Inline Editing** | Edit/delete entries directly from the table |
| **Finalize Day** | Locks all entries, logs summary, shows report popup |
| **Keyboard Shortcuts** | N → new entry, Enter → save, Esc → cancel |

---

## 10. Data Warehouse

| Feature | Details |
|---|---|
| **Categories Tab** | Grid showing all 10 device types with brand/model counts |
| **Brands Tab** | Manage brands with device type filter chips |
| **Models Tab** | Manage device models with brand + type filters |
| **Filter by Type** | Click any category to filter brands/models by that device type |
| **Dashboard Preview** | Each category shows brand count + model count |

---

## 11. Settings

| Feature | Details |
|---|---|
| **MongoDB URI** | Configure database connection (stored locally) |
| **Branch Display** | Shows current user branch |
| **System Info** | User, role, branch, version |
| **Backup Download** | One-click JSON backup of all collections |

---

## 12. Customer Tracking Portal

A public-facing web page (no login required) for customers to track their repair status.

| Feature | Details |
|---|---|
| **Track by Job ID** | Enter Job ID or tracking code to look up repair |
| **Track by QR** | Scan QR code from receipt → opens tracking page automatically |
| **4-Step Stepper** | Registered & Queued → In Diagnosis/Repair → Completed → Delivered |
| **Device Info** | Shows device, model, customer name, problem description |
| **Activity History** | Timestamped list of all status changes |
| **Real-time Status** | Current status with color-coded badge |
| **QR Code Display** | Page shows QR code for the repair |
| **Mobile Optimized** | Responsive design for phone access |

---

## 13. Multi-Branch Support

| Feature | Details |
|---|---|
| **Branch Switcher** | Dropdown in header to switch between WANI, NAGPUR, PANDHARKAWDA |
| **Branch Filtering** | All list APIs filter by selected branch |
| **Branch Persistence** | Selected branch saved in localStorage |
| **Branch on Jobs** | Each job card stores its branch |

---

## 14. PWA (Progressive Web App)

| Feature | Details |
|---|---|
| **Install Prompt** | Browser install banner for native app experience |
| **Service Worker** | Pre-caches all static assets for offline loading |
| **Manifest** | App name, icons (192×192, 512×512), theme color, standalone display |
| **Notifications** | Browser notification permission with bell icon in header |

---

## 15. Offline Support

| Feature | Details |
|---|---|
| **IndexedDB Queue** | Operations queued locally when offline |
| **Auto-Sync** | Queue processed every 5 seconds when connectivity restored |
| **Max Retries** | 3 retry attempts per operation before permanent failure |
| **Offline Banner** | Red banner shown when offline with pending queue count |
| **DB/NET Status** | Real connectivity checks (pings MongoDB + google.com) updated every 10s |

---

## 16. Activity Log

| Feature | Details |
|---|---|
| **Automatic Logging** | Every status change (repair start, complete, deliver) logged automatically |
| **Activity Display** | Timestamped history shown in Job Detail page |
| **Backend API** | `GET/POST /api/activity` for querying and creating logs |

---

## 17. Print Systems

| Feature | Details |
|---|---|
| **A4 Service Receipt** | Modern design with gradient header, info cards, service summary, QR code, digital signature, terms |
| **Thermal Label (58×36mm)** | QR code + CODE 128 barcode + job ID + customer info for device attachment |
| **Invoice Print** | HTML invoice with shop details, GST breakdown, payment info, terms |
| **Print Delays** | 500-600ms delay for QR/barcode images to load before print dialog |

---

## 18. Job Numbering & Tracking

| Feature | Details |
|---|---|
| **Job ID Format** | `RM-YYYYMMDD-NNNNNN` (e.g., `RM-20260626-000123`) |
| **Tracking Code** | 8-character nanoid (e.g., `0II5U0S6`) for customer-facing tracking |
| **QR Code** | Dynamic QR pointing to `/track/{trackingCode}` |
| **Barcode (CODE 128)** | Job ID encoded as barcode for technician scanning |

---

## 19. Technology Stack

| Component | Technology |
|---|---|
| **Frontend** | React 19, React Router v7, Vite 8 |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB Atlas (cloud) |
| **Authentication** | JWT, BCrypt |
| **Icons** | Material Symbols Rounded |
| **PWA** | vite-plugin-pwa, Workbox |
| **QR Code** | qrcode (backend generation) |
| **Barcode** | JsBarcode (client-side rendering) |
| **UI Design** | Dark theme, CSS custom properties, responsive |

---

## 20. Keyboard Shortcuts

| Shortcut | Page | Action |
|---|---|---|
| `Enter` | New Service Job | Next step / Submit |
| `Esc` | New Service Job | Back / Close |
| `1-5` | New Service Job (step 1) | Quick select lead source |
| `N` | Daily Registrar | New entry |
| `Enter` | Daily Registrar | Save entry |
| `Esc` | Daily Registrar | Cancel edit |
| `Ctrl+K` | Any page | Focus header search |

---

## Deployment

- **Frontend**: Vite build → `dist/` folder
- **Backend**: `node api/server.js`
- **Quick start**: `npm run dev:all` (runs both API on :8000 and frontend on :3000)

---

## 21. Electron Desktop App

The RMS can be packaged as a native Windows desktop application using Electron.

| Feature | Details |
|---|---|
| **Dev Mode** | `npm run dev:electron` — starts API + Vite + Electron window together |
| **Build Installer** | `npm run build:electron` — compiles Vite, packages into NSIS installer |
| **Output** | `.exe` installer in `release/` folder, ~150MB |
| **Auto-backend** | In production, Node.js API server starts automatically as child process |
| **Native Window** | 1366×900 default, 1024×700 minimum, auto-hides menu bar |
| **Print Support** | IPC bridge for direct printing from renderer process |
| **WhatsApp Links** | Opens `wa.me` links in default browser |

### Commands

```bash
# Development — starts API + Vite + Electron
npm run dev:electron

# Production build — creates Windows installer (.exe)
npm run build:electron
```

### Requirements

- **Node.js** must be installed on the system for the backend API to run
- The installer (~212MB) includes the Electron runtime + frontend
- Run the backend separately: `npm run dev:api` (or it starts automatically if Node.js is available)
