# Sai Laptop & Computer Gallery - Service Management System

## 1. Business Domain & Purpose

**Application Name:** Sai Laptop & Computer Gallery - Service Management System  
**Project Name:** SaiLaptopServiceSoftware  
**Target Framework:** .NET Framework 4.7.2 (Windows Forms)  
**Primary Database:** MongoDB Atlas (cloud, database: `slcg`)  
**Offline Database:** SQLite (local queue for disconnected operation)  

**Business:** A laptop/computer/electronics repair service shop based in Wani, MH (with a second branch at Pandharkawda). The shop handles repairs for Laptops, Desktops, Printers, Scanners, Tablets, Monitors, UPS, Routers, Storage devices, and RAM modules across dozens of brands.

**Users:**
- **Admin** — full access: customer management, repairs, billing, reports, settings, data warehouse, invoice printing
- **Technician** — limited access: can manage customers and repairs but cannot access Billing, Reports, Settings, or Data Warehouse

---

## 2. Business Process Flow

### 2.1 Customer Registration
1. Customer walks in with a device
2. Staff opens the **Customers** section, fills out: name, mobile, address, device type, brand, model, problem description
3. A **Job ID** is auto-generated (format: `SLCG-WANI-YYYY-NNNN`) using a MongoDB sequence counter
4. A **Customer** record is inserted into `customers` collection with an auto-incrementing `customerId`
5. A **JobCard** record is created with status `Pending`, linked to the customer via MongoDB `_id`

### 2.2 Repair Tracking
1. Technician views all job cards in the **Repairs** section (joined with customer data)
2. Technician assigns themselves, enters diagnosis, estimate cost, and updates status
3. Status flow: `Pending` → `In Progress` → `Completed` → `Billed` (via billing) → `Delivered`

### 2.3 Billing
1. Only jobs with status `Completed` can be billed
2. Staff verifies the Job ID, an **Invoice Number** is auto-generated (`INV-YYYYMMDD-NNNN`)
3. Bill types: `GST Invoice` (with 18% GST split into 9% CGST + 9% SGST) or `Normal Bill`
4. Payment modes: `Cash`, `UPI`, `Card`
5. On save, job status is updated to `Billed`
6. A duplicate bill check prevents billing the same Job ID twice
7. Invoice prints to an HTML page with full customer/device/repair details, GST breakdown, and terms

### 2.4 Offline Mode
When MongoDB is unreachable (connection loss), operations are queued locally in a SQLite database (`queue.db`). A background `QueueProcessor` (timer-based, runs every 5 seconds) processes the queue when connectivity is restored:
- **Insert**: direct document insertion
- **Update**: `$set` update by `_id`
- **Delete**: delete by `_id`
- Max 3 retry attempts per operation

### 2.5 Customer-Facing Tracking Portal
The app hosts an embedded HTTP server (`http://localhost:8080`) that displays a public-facing HTML page where customers can enter their Job ID to track repair status visually via a 4-step stepper:
1. Registered & Queued
2. In Diagnosis / Repair
3. Repair Completed
4. Delivered & Closed

---

## 3. User Roles & Permissions

| Feature | Admin | Technician |
|---|---|---|
| Dashboard | Full | Full |
| Customers (view/add/edit) | Full | Full |
| Customers (delete) | Full | **Hidden** |
| Repairs | Full | Full |
| Billing | Full | **Hidden** |
| Reports | Full | **Hidden** |
| Settings | Full | **Hidden** |
| Data Warehouse | Full | **Hidden** |
| Invoice Printing | Full | **Hidden** |

---

## 4. Database Schema — MongoDB Atlas (Database: `slcg`)

### 4.1 Collection: `users`
| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | auto | Primary key |
| `username` | string | Yes | Unique index |
| `password` | string | Yes | BCrypt hashed |
| `role` | string | Yes | Enum: `Admin`, `Technician` |
| `branch` | string | Yes | Branch name (e.g. `Wani`) |

**Indexes:** `username` (unique ascending)

### 4.2 Collection: `customers`
| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | auto | Primary key |
| `customerId` | int | Yes | Auto-incrementing sequence |
| `name` | string | Yes | |
| `mobile` | string | Yes | |
| `address` | string | Yes | |
| `device` | string | Yes | Device type (Laptop, Desktop, etc.) |
| `model` | string | Yes | Device model name |
| `problem` | string | Yes | Problem description |
| `createdAt` | date | Yes | Timestamp |

**Indexes:** Text index on `name` + `mobile`; ascending on `customerId`

### 4.3 Collection: `job_cards`
| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | auto | Primary key |
| `jobId` | string | Yes | Unique. Format: `SLCG-WANI-YYYY-NNNN` |
| `customerId` | string | Yes | References `customers._id` (MongoDB ObjectId) |
| `branch` | string | Yes | e.g. `Wani` |
| `status` | string | Yes | Enum: `Pending`, `In Progress`, `Completed`, `Delivered` |
| `createdAt` | date | Yes | Timestamp |

**Indexes:** `jobId` (unique ascending); `customerId` (ascending); `createdAt` (ascending)

### 4.4 Collection: `repairs`
| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | auto | Primary key |
| `jobId` | string | Yes | References `job_cards.jobId` |
| `technician` | string | Yes | Technician name |
| `diagnosis` | string | Yes | Diagnosis notes |
| `estimateCost` | double | Yes | Estimated repair cost |
| `status` | string | Yes | Enum: `Pending`, `In Progress`, `Completed` |
| `updatedAt` | date | Yes | Timestamp |

**Indexes:** `jobId` (ascending); `updatedAt` (ascending)

### 4.5 Collection: `billing`
| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | auto | Primary key |
| `invoiceNo` | string | Yes | Unique. Format: `INV-YYYYMMDD-NNNN` |
| `jobId` | string | Yes | References `job_cards.jobId` |
| `billType` | string | Yes | Enum: `Service`, `Parts`, `Full` |
| `amount` | double | Yes | Billed amount |
| `paymentMode` | string | Yes | Enum: `Cash`, `UPI`, `Card`, `Other` |
| `createdAt` | date | Yes | Timestamp |

**Indexes:** `jobId` (ascending); `invoiceNo` (unique ascending); `createdAt` (ascending)

### 4.6 Collection: `brands`
| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | auto | Primary key |
| `name` | string | Yes | Brand name (e.g. HP, Dell) |
| `deviceType` | string | Yes | Device category (Laptop, Desktop, etc.) |

Pre-seeded with ~40 brands across 10 device types (Laptop, Desktop, Printer, Scanner, Tablet, Monitor, UPS, Router, Storage, RAM).

### 4.7 Collection: `device_models`
| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | auto | Primary key |
| `brand` | string | Yes | Brand name |
| `deviceType` | string | Yes | Device category |
| `modelName` | string | Yes | Model name |

Pre-seeded with ~250+ models across all device types.

### 4.8 Collection: `sequences`
| Field | Type | Notes |
|---|---|---|
| `_id` | string | Sequence name (`jobId`, `customerId`, `invoiceNo`) |
| `seq` | int | Current counter value |

Used by `SequenceHelper` with `FindOneAndUpdate` (atomic upsert + increment) for ID generation.

---

## 5. Offline SQLite Schema

**File location:** `%LOCALAPPDATA%\SaiLaptopPortal\queue.db`

**Table: `OfflineOperations`**
| Column | Type | Notes |
|---|---|---|
| `Id` | INTEGER PRIMARY KEY AUTOINCREMENT | |
| `CollectionName` | TEXT NOT NULL | MongoDB collection name |
| `Operation` | TEXT NOT NULL | `INSERT`, `UPDATE`, `DELETE` |
| `DocumentId` | TEXT | MongoDB `_id` for updates/deletes |
| `Payload` | TEXT | JSON document (for insert) or fields to $set (for update) |
| `CreatedAt` | TEXT NOT NULL | ISO 8601 timestamp |
| `Status` | TEXT DEFAULT 'Pending' | `Pending`, `Completed`, `Failed` |
| `RetryCount` | INTEGER DEFAULT 0 | Max 3 retries before permanent failure |

---

## 6. Key Business Rules

### 6.1 ID Generation (`SequenceHelper.cs`)
- Uses MongoDB `sequences` collection with atomic `FindOneAndUpdate` (upsert, increment by 1)
- Thread-safe via `lock` statement
- Three sequences: `jobId`, `customerId`, `invoiceNo`

### 6.2 Job ID Format
- Pattern: `SLCG-WANI-YYYY-NNNN`
- Example: `SLCG-WANI-2026-0001`
- Components: `SLCG` (brand prefix) + `-` + branch (`WANI`) + `-` + year + `-` + zero-padded sequence (4 digits)

### 6.3 Invoice Number Format
- Pattern: `INV-YYYYMMDD-NNNN`
- Example: `INV-20260626-0001`

### 6.4 Duplicate Bill Prevention
- Before inserting a billing record, the system checks if a bill already exists for the given `jobId`
- If found, displays "A bill already exists for this Job ID" and aborts

### 6.5 Job Status Validation Before Billing
- Only jobs with status `Completed` or `Billed` can be billed
- Attempting to bill a `Pending` or `In Progress` job shows a validation error

### 6.6 Cascading Delete (Customer → Job Cards → Repairs → Billing)
When a customer is deleted:
1. Find customer by `customerId`
2. Find all job cards linked to customer's MongoDB `_id`
3. Collect all `jobId` values
4. Delete billing records for those `jobId`s
5. Delete repair records for those `jobId`s
6. Delete job cards
7. Delete customer

### 6.7 Repair Status State Machine
**JobCard statuses (schema-validated):** `Pending`, `In Progress`, `Completed`, `Delivered`  
**Repair statuses (schema-validated):** `Pending`, `In Progress`, `Completed`  
**Effective flow (observed from UI):** `Pending` → `In Progress` → `Completed` → `Billed` → `Delivered`

### 6.8 Billing Types & Payment Modes
**Bill types:** `GST Invoice` (with 18% tax: 9% CGST + 9% SGST), `Normal Bill`  
**Payment modes:** `Cash`, `UPI`, `Card`

### 6.9 Offline Queue Processing
- Runs every 5 seconds via `System.Threading.Timer`
- Processes oldest pending operations first (FIFO)
- Max 3 retry attempts per operation
- Checks network connectivity before each batch
- Dispatches operations: `INSERT` → `InsertOne`, `UPDATE` → `$set` by `_id`, `DELETE` → `DeleteOne` by `_id`
- Clears completed records after successful batch

---

## 7. Application Architecture

### 7.1 Technology Stack
- **Language:** C#
- **Framework:** .NET Framework 4.7.2
- **UI:** Windows Forms (WinForms) with custom dark theme
- **Database Driver:** MongoDB.Driver 2.28.0
- **Cloud Database:** MongoDB Atlas (connection via SRV URI)
- **Offline Storage:** System.Data.SQLite 1.0.118
- **Password Hashing:** BCrypt.Net-Next 4.2.0
- **Icons:** FontAwesome.Sharp 6.6.0
- **UI Components:** MaterialSkin.2 2.3.1
- **Support:** DnsClient, SharpCompress, BouncyCastle.Cryptography

### 7.2 Project Structure
```
SaiLaptopServiceSoftware/
├── Program.cs                    # Entry point
├── Logger.cs                     # Day-based file logging
├── App.config                    # MONGO_URI in appSettings
├── Models/
│   ├── User.cs
│   ├── Customer.cs
│   ├── JobCard.cs
│   ├── Repair.cs
│   ├── Billing.cs
│   ├── Brand.cs
│   ├── DeviceModel.cs
│   └── OfflineOperation.cs
├── Database/
│   ├── MongoDB.cs                # Static MongoDB client & collection accessor
│   ├── DatabaseSetup.cs          # Initialization, ping, seed admin + device data
│   ├── DataHelper.cs             # Brand/model query helpers
│   ├── SequenceHelper.cs         # Atomic counter-based ID generation
│   ├── OfflineQueue.cs           # SQLite-based operation queue
│   ├── QueueProcessor.cs         # Background timer-based queue processor
│   ├── NetworkHelper.cs          # TCP connectivity check to MongoDB host
│   ├── DbConnection.cs           # (legacy, unused)
│   ├── MigrateSchema.cs          # Standalone schema migration utility
│   └── Database.sql              # Legacy MySQL schema
├── Forms/
│   ├── SplashForm.cs             # Animated splash with internet/DB checks
│   ├── LoginForm.cs              # Authentication with BCrypt
│   ├── DashboardForm.cs          # MDI container with sidebar navigation + HTTP server
│   ├── DashboardView.cs          # KPI cards, chart, search
│   ├── CustomerForm.cs           # Customer CRUD with device dropdowns
│   ├── CustomerHistoryForm.cs    # Modal: repairs + billing per customer
│   ├── RepairForm.cs             # Repair status management
│   ├── BillingForm.cs            # Invoice creation and printing
│   ├── ReportsForm.cs            # Daily/Monthly/Pending reports
│   ├── SettingsForm.cs           # MongoDB URI config, backup to JSON
│   ├── DataWarehouseForm.cs      # Brands & device models management
│   ├── LoadingOverlay.cs         # Spinner overlay control
│   ├── ToastNotification.cs      # Animated toast popup
│   └── TableHelper.cs            # DataGridView dark styling + status pills
└── UI/
    ├── DoubleBufferedPanel.cs
    └── ViewTransition.cs
```

### 7.3 Design Patterns
- **Static Service Layer:** `MongoDB` static class acts as a singleton database accessor
- **Repository-like Helpers:** `DataHelper`, `SequenceHelper`, `OfflineQueue` provide collection-specific operations
- **MV-like Views:** Each form/view is a `UserControl` with its own data loading and UI logic
- **Event-driven architecture:** `NetworkHelper.OnConnectivityChanged` event notifies UI of network changes; `QueueProcessor.OnQueueCountChanged` reports pending queue count

### 7.4 Logging (`Logger.cs`)
- Day-based log files: `%LOCALAPPDATA%\SaiLaptopServiceSoftware\logs\YYYY-MM-DD.log`
- Fallback directory: `{BaseDirectory}\logs\`
- Log levels: `INFO`, `ERROR`, `WARN`
- Line format: `[yyyy-MM-dd HH:mm:ss.fff] [LEVEL] message`
- Auto-cleanup: deletes logs older than 7 days
- Thread-safe via `lock`

### 7.5 Startup Flow (`Program.cs`)
1. Enable TLS 1.2/1.1
2. Show `SplashForm` (animated, checks internet + DB connectivity, initializes MongoDB, seeds admin + device data)
3. Start `QueueProcessor` (background queue sync)
4. Show `LoginForm`
5. On successful login → `DashboardForm` (role-based restrictions applied)

### 7.6 Dashboard HTTP Server (Wi-Fi Lobby Portal)
- Built-in `HttpListener` on `http://localhost:8080`
- Serves a public-facing HTML tracking page for customers
- Customers enter Job ID → see a 4-step progress stepper with device details
- No authentication required (read-only, lobby-facing)

---

## 8. UI Navigation Structure

### 8.1 Sidebar Navigation Items
| Order | Button | Icon | View Class | Role Restrictions |
|---|---|---|---|---|
| 1 | Dashboard | `Home` | `DashboardView` | None |
| 2 | Customers | `Users` | `CustomerForm` | None |
| 3 | Repairs | `Wrench` | `RepairForm` | None |
| 4 | Billing | `FileInvoiceDollar` | `BillingForm` | Hidden for Technician |
| 5 | Reports | `ChartColumn` | `ReportsForm` | Hidden for Technician |
| 6 | Settings | `Gear` | `SettingsForm` | Hidden for Technician |
| 7 | Data Warehouse | `Database` | `DataWarehouseForm` | Hidden for Technician |
| 8 | Logout | `RightFromBracket` | — | None |

### 8.2 Status Bar Indicators (Title Bar Right Side)
- **DB icon** (Database): Green = connected, Red = disconnected, blinking on state change
- **NET icon** (Wifi): Green = internet reachable, Red = no internet, blinking on state change
- Status checked every 5 seconds via timer
- DB check: TCP connect to MongoDB host port 27017 + `listCollectionNames`
- NET check: HTTP GET to `http://clients3.google.com/generate_204`

### 8.3 User Avatar
- Circular avatar in sidebar with initial letter (A for Admin, T for Technician)
- Gradient background

### 8.4 Dashboard View (`DashboardView.cs`)
4 KPI cards:
- Total Service Jobs (blue accent)
- Pending Repairs (amber accent)
- Completed Jobs (green accent)
- Today's Billed Collection (purple accent)

**Chart:** 7-day weekly revenue trend line chart (drawn with GDI+ on `Paint` event)  
**Search:** Quick job search by Mobile or Job ID (uses MongoDB `$lookup` + `$regex`)

### 8.5 Loading Overlay
- Semi-transparent overlay with animated spinning arc
- Shown during all async database operations

### 8.6 Toast Notifications
- Animated slide-up toast in bottom-right corner
- 4 types: Success (green), Error (red), Info (blue), Warning (amber)
- Auto-dismiss after 3 seconds with fade-out

### 8.7 Theme
- Dark theme throughout: `#121218` background, `#1E1E24` card surfaces, `#007ACC` accent blue
- Custom title bar (borderless form with drag, minimize, maximize, close buttons)
- Rounded corners on cards, panels, and status pill badges
- DataGridView: dark themed with colored status pills (`Pending`, `In Progress`, `Completed`, `Billed`, `Delivered`, `Cancelled`)
