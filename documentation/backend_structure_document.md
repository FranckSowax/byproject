# Backend Structure Document

This document outlines the backend setup for the construction material price comparison platform. It covers architecture, database design, APIs, hosting, infrastructure, security, monitoring, and a final summary. Everything is described in everyday language, so no deep technical background is needed.

## 1. Backend Architecture

### Overview
- We use Supabase as our backend-as-a-service. Supabase provides:
  - PostgreSQL database
  - User authentication
  - Object storage for photos and reports
  - Edge functions (serverless) for custom logic
- We integrate OpenAI’s GPT-4o via secure API calls to handle file analysis and column mapping.
- The frontend (Next.js) communicates with Supabase and our edge functions through RESTful endpoints and the Supabase client library.

### Design Patterns & Frameworks
- **BaaS (Backend-as-a-Service)**: Supabase handles most backend operations, reducing boilerplate.
- **Serverless Functions**: Custom logic (for file parsing, report generation) runs in Supabase Edge Functions.
- **Event-Driven Workflows**: When a user uploads a file, an edge function triggers GPT-4o mapping, then writes results back to the database.
- **Role-Based Access Control (RBAC)**: Supabase’s Row Level Security (RLS) ensures only authorized roles (Admin, Editor, Reader) access or modify data.

### Scalability, Maintainability & Performance
- **Scalability**: Supabase auto-scales the database and storage. Edge functions scale with demand.
- **Maintainability**: Using BaaS means fewer servers to manage. Database migrations are handled via SQL scripts stored in version control.
- **Performance**: Data is cached at the edge. Static assets and reports are served through a CDN (Cloudflare or Vercel’s CDN). Queries are optimized with indexes.

---
## 2. Database Management

### Database Technology
- **Type**: SQL (Relational)
- **System**: PostgreSQL (hosted by Supabase)

### Data Storage & Access
- Tables are organized around users, projects (material lists), materials, suppliers, prices, currencies, etc.
- Access happens through:
  - Supabase client (for authenticated frontend calls)
  - RESTful endpoints or Edge Functions (for file processing, complex logic)

### Data Management Practices
- **Row Level Security**: Each table enforces who can read or write rows based on user role and ownership.
- **Backups & PITR**: Supabase provides automated daily backups and point-in-time recovery.
- **Migrations**: SQL migration files live in our repository. We apply them in a controlled pipeline.

---
## 3. Database Schema

### Human-Readable Schema
- **Users**: store personal info, email, hashed password, preferred language, role
- **Roles**: Administrator, Editor, Reader
- **Subscriptions**: plan type (Free vs Premium), limits, plus expiry date
- **Projects**: user-created material lists; link to uploaded files, mapping status
- **ColumnsMapping**: stores AI-suggested and user-corrected mappings per project
- **Materials**: individual items with name, category, quantity, weight, volume, specs
- **Suppliers**: name, country, contact info, logo URL
- **Prices**: per material, per supplier, per country; currency and converted value
- **Currencies**: CFA, RMB, plus manual rates; base currency is set per project
- **ExchangeRates**: historical or manual rates entered by user
- **Photos**: URLs to Supabase storage, linked to materials
- **Exports (Reports)**: metadata about generated PDF/Excel, timestamp, project link

### SQL Schema (PostgreSQL)
```sql
-- Users and Roles
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL  -- 'Administrator','Editor','Reader'
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  hashed_password TEXT NOT NULL,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  role_id INT REFERENCES roles(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  plan TEXT NOT NULL,        -- 'Free' or 'Premium'
  project_limit INT DEFAULT 5,
  export_limit INT DEFAULT 2,
  expires_at DATE
);

-- Projects (Material Lists)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  source_url TEXT,           -- Google Sheet URL or null
  file_path TEXT,            -- storage path for PDF/CSV/Excel
  mapping_status TEXT,       -- 'pending','completed','corrected'
  created_at TIMESTAMP DEFAULT now()
);

-- Column Mappings
CREATE TABLE column_mappings (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  ai_mapping JSONB,          -- GPT-4o suggestions
  user_mapping JSONB,        -- corrections by user
  updated_at TIMESTAMP DEFAULT now()
);

-- Materials
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  name TEXT NOT NULL,
  category TEXT,
  quantity NUMERIC,
  weight NUMERIC,
  volume NUMERIC,
  specs JSONB               -- other general characteristics
);

-- Suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT,
  contact_info JSONB,
  logo_url TEXT
);

-- Prices
CREATE TABLE currencies (
  code TEXT PRIMARY KEY,      -- 'CFA','RMB'
  symbol TEXT
);

CREATE TABLE exchange_rates (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  from_currency TEXT REFERENCES currencies(code),
  to_currency TEXT REFERENCES currencies(code),
  rate NUMERIC,
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE prices (
  id SERIAL PRIMARY KEY,
  material_id UUID REFERENCES materials(id),
  supplier_id UUID REFERENCES suppliers(id),
  country TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT REFERENCES currencies(code),
  converted_amount NUMERIC,
  created_at TIMESTAMP DEFAULT now()
);

-- Photos
CREATE TABLE photos (
  id SERIAL PRIMARY KEY,
  material_id UUID REFERENCES materials(id),
  url TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT now()
);

-- Exports (Reports)
CREATE TABLE exports (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES users(id),
  format TEXT,               -- 'PDF' or 'Excel'
  file_path TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

---
## 4. API Design and Endpoints

We follow a RESTful style. The Next.js app router or Supabase Edge Functions expose these endpoints:

### Authentication
- POST `/api/auth/signup` – register new user
- POST `/api/auth/login` – email/password login, returns JWT
- POST `/api/auth/logout` – invalidate session

### Projects & File Handling
- GET `/api/projects` – list user’s projects
- POST `/api/projects` – create a new project (with file upload URL or sheet link)
- GET `/api/projects/[id]` – fetch project details and mapping status
- POST `/api/projects/[id]/mapping` – trigger or update column mapping

### Materials & Suppliers
- GET `/api/projects/[id]/materials` – list materials in a project
- POST `/api/projects/[id]/materials` – add or update a material
- GET `/api/suppliers` – list all suppliers (or filtered by country)
- POST `/api/suppliers` – add a new supplier

### Prices & Currencies
- GET `/api/projects/[id]/prices` – fetch prices with converted values
- POST `/api/projects/[id]/prices` – add or update a price entry
- GET `/api/projects/[id]/exchange-rate` – get current rate
- POST `/api/projects/[id]/exchange-rate` – set manual exchange rate

### Photos
- POST `/api/materials/[matId]/photos` – upload a photo
- GET `/api/materials/[matId]/photos` – list photos

### Exports
- POST `/api/projects/[id]/exports` – generate PDF/Excel report
- GET `/api/exports/[exportId]/download` – fetch the generated report

All endpoints require a valid JWT and respect user roles via Supabase RLS policies.

---
## 5. Hosting Solutions

- **Supabase Cloud** (hosted in regions close to Gabon/China):
  - Managed PostgreSQL database
  - Scalable object storage for files and photos
  - Edge Functions for serverless logic
- **Benefits**:
  - High reliability (SLA-backed)
  - Automatic scaling
  - Pay-as-you-go pricing keeps costs predictable
  - Built-in backups and security compliance

---
## 6. Infrastructure Components

- **Load Balancing**: Supabase automatically balances API and database traffic.
- **CDN**: Static assets (reports, exports, images) served via Cloudflare or Vercel’s global CDN for fast delivery.
- **Caching**:
  - Edge caching of public API responses (e.g., exchange rates).
  - In-memory caching via Supabase’s built-in Postgres caching layers.
- **Storage**: Supabase Storage for file uploads and report storage, with pre-signed URLs.
- **Edge Functions**: Handle CPU-intensive tasks (file parsing, GPT calls) without blocking main database.

These pieces work together to deliver fast, reliable responses and a smooth user experience.

---
## 7. Security Measures

- **Authentication**: JWT-based via Supabase Auth (email/password).
- **Authorization**: Role-Based Access Control with PostgreSQL Row Level Security:
  - Admins can manage everything.
  - Editors can read/write their own projects.
  - Readers have view-only access to shared or public projects.
- **Encryption**:
  - TLS for all data in transit.
  - AES-256 at rest for database and storage.
- **Data Validation**: All inputs validated in Edge Functions before writing to the database.
- **Audit Logs**: Supabase logs all auth attempts and database changes for compliance.
- **Regulatory Compliance**: GDPR-ready (data deletion on request), secure storage in approved regions.

---
## 8. Monitoring and Maintenance

### Monitoring Tools
- **Supabase Dashboard**: real-time database metrics (CPU, queries, errors).
- **Sentry**: tracks runtime errors in Edge Functions and frontend.
- **Logflare or Datadog**: aggregated logs, alerting on high error rates or slow queries.

### Maintenance Strategies
- **Automated Backups**: daily snapshots + point-in-time restore.
- **Database Migrations**: managed via CI/CD pipeline, with staging environment testing.
- **Dependency Updates**: monthly reviews of Supabase client, OpenAI SDK, and other libraries.
- **Health Checks**: scheduled pings to key endpoints; alerts on downtime.

---
## 9. Conclusion and Overall Backend Summary

We have built a robust, scalable backend centered on Supabase and PostgreSQL, enriched by GPT-4o for AI-powered file mapping. Key strengths:

- **Fully Managed**: Less operational overhead, more time building features.
- **Security and Compliance**: Built-in auth, encryption, logging, and RLS.
- **Performance**: CDN, caching, and serverless functions for quick responses.
- **Scalability**: Auto-scaling database and edge functions handle growth effortlessly.

This backend design meets the project goals—easy uploads, smart AI mapping, real-time comparisons, secure user roles, and professional reporting—while remaining cost-effective and maintainable.  

Ready to power the construction material price comparison platform!