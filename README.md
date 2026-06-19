# LedgerOne

Cloud-based invoicing and accounting platform for freelancers and small businesses.

---

## What It Does

LedgerOne lets you manage your entire billing workflow from one place:

- Create and send professional invoices as PDFs
- Track clients and their invoice history
- Record business expenses by category
- Monitor revenue, expenses, and profit from a live dashboard
- Generate GST reports and monthly financial breakdowns
- Automatic overdue detection — invoices past their due date are flagged every night

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend | Java 21, Spring Boot 3.5 |
| Database | PostgreSQL |
| Cache | Redis (5–10 min TTL, Cache-Aside pattern) |
| Auth | JWT (JJWT 0.12) + Google OAuth2 |
| Email | Spring Mail → Gmail SMTP |
| PDF | Apache PDFBox 3.0 |
| Deployment | Vercel (frontend) + Render Docker (backend) |

---

## Project Structure

```
LedgerOne/
├── frontend/               # React SPA
│   └── src/
│       ├── pages/          # Landing, Login, Register, Dashboard, Invoices,
│       │                   # Clients, Expenses, Reports, Profile
│       ├── components/     # Layout, Sidebar, ProtectedRoute
│       ├── api/            # Axios modules per domain (auth, invoices, clients, accounting, profile)
│       └── context/        # Auth context (token storage + refresh logic)
│
├── backend/                # Spring Boot modular monolith
│   └── src/main/java/com/ledgerone/
│       ├── auth/           # Register, Login, Google OAuth, JWT, Refresh Tokens
│       ├── invoice/        # Invoice CRUD, Client CRUD, Business Profile, PDF, Scheduler
│       ├── accounting/     # Expenses, Financial Summary, GST Report, Monthly Breakdown
│       ├── notification/   # Email delivery via JavaMail
│       └── config/         # Security, CORS, Redis Cache Manager
│
└── diagrams/               # Architecture and flow descriptions
```

---

## Features

### Authentication
- Email/password registration and login
- Google Sign-In (ID token verified server-side)
- Stateless JWT access tokens (15 min) + refresh tokens (7 days, stored in DB)
- Automatic token refresh on 401

### Invoices
- Create invoices linked to a client with line items, GST rate, issue/due dates
- Invoice number auto-generated: `INV-{year}-{id}`
- Status lifecycle: `DRAFT → SENT → PAID` (or `OVERDUE`)
- Only DRAFT invoices can be edited; PAID invoices cannot be deleted
- Download invoice as PDF (business profile + client details + itemized totals)
- Sending an invoice triggers an email to the client automatically

### Clients
- Full CRUD for client records (name, email, phone, address, GSTIN)
- All clients are scoped to the authenticated user

### Expenses
- Log expenses with description, amount, category, and date
- Categories: Rent, Internet, Marketing, Travel, Software Subscription, Miscellaneous

### Dashboard
- Real-time summary: total income, total expenses, net profit, pending amount, overdue count
- Monthly income vs. expense bar chart (current year)
- All data served from Redis cache — near-instant loads

### Reports
- Financial summary (aggregated from PAID invoices + all expenses)
- GST report: output GST collected vs. input GST paid, net GST payable (by year)
- Monthly breakdown: per-month income and expense totals

### Business Profile
- Store your business name, address, GSTIN, and bank details
- Profile is embedded into every generated invoice PDF

### Overdue Detection
- Spring scheduler runs nightly at midnight
- Finds all SENT invoices past their due date and marks them OVERDUE automatically

---

## API Reference

All endpoints except `/api/auth/**` require `Authorization: Bearer <token>`.

### Auth — `/api/auth`
| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create account |
| POST | `/login` | Email/password login |
| POST | `/google` | Google ID token login |
| POST | `/refresh` | Exchange refresh token for new access token |
| POST | `/logout` | Invalidate refresh token |

### Invoices — `/api/invoices`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List all invoices for authenticated user |
| GET | `/{id}` | Get single invoice |
| POST | `/` | Create invoice |
| PUT | `/{id}` | Update invoice (DRAFT only) |
| PATCH | `/{id}/status` | Update invoice status |
| DELETE | `/{id}` | Delete invoice (not PAID) |
| GET | `/{id}/pdf` | Download invoice as PDF |

### Clients — `/api/clients`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List all clients |
| GET | `/{id}` | Get single client |
| POST | `/` | Create client |
| PUT | `/{id}` | Update client |
| DELETE | `/{id}` | Delete client |

### Accounting — `/api/accounting`
| Method | Path | Description |
|---|---|---|
| GET | `/expenses` | List all expenses |
| POST | `/expenses` | Create expense |
| PUT | `/expenses/{id}` | Update expense |
| DELETE | `/expenses/{id}` | Delete expense |
| GET | `/summary` | Financial summary (income, expenses, profit) |
| GET | `/gst-report?year=` | GST report for a given year |
| GET | `/monthly?year=` | Monthly income vs. expense breakdown |

### Business Profile — `/api/profile`
| Method | Path | Description |
|---|---|---|
| GET | `/` | Get business profile |
| PUT | `/` | Create or update business profile |

---

## Environment Variables

### Backend

| Variable | Description |
|---|---|
| `DB_URL` | PostgreSQL JDBC URL (e.g. `jdbc:postgresql://host:5432/ledgerone`) |
| `DB_USERNAME` | PostgreSQL username |
| `DB_PASSWORD` | PostgreSQL password |
| `REDIS_URL` | Redis connection URL (e.g. `redis://host:6379`) |
| `JWT_SECRET` | Secret key for signing JWTs (min 32 chars) |
| `MAIL_USERNAME` | Gmail address used to send notifications |
| `MAIL_PASSWORD` | Gmail App Password (not the account password) |
| `GOOGLE_CLIENT_ID` | Google OAuth2 client ID from Google Cloud Console |
| `CORS_ALLOWED_ORIGINS` | Frontend URL (e.g. `https://your-app.vercel.app`) |

### Frontend

Create `frontend/.env`:

```
VITE_API_BASE_URL=http://localhost:8080
```

---

## Local Development

### Prerequisites
- Java 21+
- Maven 3.9+
- Node.js 20+
- PostgreSQL running locally
- Redis running locally

### Backend

```bash
cd backend

# Copy and fill in env vars
export DB_URL=jdbc:postgresql://localhost:5432/ledgerone
export DB_USERNAME=postgres
export DB_PASSWORD=yourpassword
export REDIS_URL=redis://localhost:6379
export JWT_SECRET=local-dev-secret-key-change-in-prod
export MAIL_USERNAME=your@gmail.com
export MAIL_PASSWORD=your-app-password
export GOOGLE_CLIENT_ID=your-google-client-id
export CORS_ALLOWED_ORIGINS=http://localhost:5173

mvn spring-boot:run
# Backend starts on http://localhost:8080
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Frontend starts on http://localhost:5173
```

---

## Deployment

The project ships with a `render.yaml` for one-click backend deployment on Render.

**Backend (Render)**
1. Connect this repo to Render.
2. Render picks up `render.yaml` automatically (Docker build from `./backend/Dockerfile`).
3. Set all environment variables in the Render dashboard.

**Frontend (Vercel)**
1. Import the repo into Vercel.
2. Set root directory to `frontend`.
3. Set `VITE_API_BASE_URL` to your Render backend URL.
4. Deploy.

---

## Database Schema (summary)

```
users               — id, name, email, password, created_at
refresh_tokens      — id, token, expiry_date, user_email

clients             — id, user_email, name, company_name, email, phone, address, gstin
invoices            — id, user_email, invoice_number, client_id, issue_date, due_date,
                       status, subtotal, gst_rate, gst_amount, total_amount, notes, created_at
invoice_items       — id, invoice_id, description, quantity, unit_price, amount

business_profiles   — id, user_email, business_name, address, gstin, logo_url, bank_details

expenses            — id, user_email, description, amount, category, date, created_at
```

Schema is managed by Hibernate (`ddl-auto: update`) — no manual migrations needed.

---

## Caching Strategy

| Cache Key | TTL | Evicted When |
|---|---|---|
| `invoices::{userEmail}` | 5 min | Invoice created, updated, or deleted |
| `summary::{userEmail}` | 5 min | Invoice or expense written |
| `gst::{userEmail}::{year}` | 10 min | Invoice or expense written |
| `monthly::{userEmail}::{year}` | 10 min | Invoice or expense written |

Cache-Aside pattern: Spring `@Cacheable` checks Redis first; on miss, loads from PostgreSQL and populates Redis. Writes use `@CacheEvict` to invalidate stale entries.
