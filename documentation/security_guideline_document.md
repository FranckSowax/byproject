# Step-by-Step Implementation Plan

Below is a phased roadmap to build your construction-material price-comparison platform. Each phase includes key tasks, deliverables, and essential security considerations (per OWASP, Supabase best practices, and your organization’s policies).

---

## 1. Project Setup & Architecture

1. Define Requirements & Data Model
   - Review detailed user stories for Upload, Mapping, Comparison, Export, Roles, Multilanguage, Freemium.
   - Design ERD in PostgreSQL: tables for `users`, `roles`, `materials`, `prices`, `suppliers`, `exchange_rates`, `uploads`, `subscriptions`, etc.
   - Identify field types and relationships; use UUID primary keys.

2. Technology Stack Confirmation
   - Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS + shadcn/ui.
   - Backend/Database/Storage: Supabase (PostgreSQL, Auth, Storage, RLS, Functions).
   - AI: OpenAI GPT-4o API.
   - CI/CD: GitHub Actions.
   - Secrets Management: GitHub Secrets or dedicated Vault.

3. High-Level Architecture Diagram
   - Next.js client ↔ Supabase RESTful/PostgREST or via Supabase JS SDK.
   - Serverless Functions (edge/Node) for file preprocessing, AI calls, secure business logic.
   - Supabase Storage for uploaded files.
   - CDN + Vercel for frontend hosting.

Security Considerations:
   - Enforce HTTPS everywhere.
   - Design with least privilege: only required APIs exposed.
   - Plan CSP, CORS, rate limiting.

---

## 2. Environment Setup & CI/CD

1. Monorepo Initialization
   - Create a Next.js app with TypeScript.
   - Add Tailwind CSS, shadcn/ui.
   - Initialize Git, add `.gitignore`, `package.json`, lockfile.

2. Supabase Project & Local Emulators
   - Provision Supabase project for dev/staging/production.
   - Configure Supabase CLI and local emulator for Auth, Functions.
   - Define environment variables (`.env.local`, CI secrets) for SUPABASE_URL, SUPABASE_KEY, OPENAI_KEY.

3. CI/CD with GitHub Actions
   - Linting & Type Checking (ESLint, TypeScript).
   - Dependency audit (`npm audit`, SCA tool).
   - Unit Tests (Jest/React Testing Library).
   - Deploy to Vercel on merging `main` branch.

Security Considerations:
   - Store secrets in GitHub Secrets.
   - Use lockfiles for deterministic builds.
   - Fail builds on vulnerabilities.

---

## 3. Authentication & Authorization

1. Supabase Auth Setup
   - Enable Email/Password sign-up.
   - Configure Stripe (or Supabase Billing) for subscription tiers.
   - Enforce multi-factor (TOTP) for Admin roles.

2. Roles & RLS Policies
   - Create `roles` table: Admin, Editor, Reader.
   - Use Supabase RLS to restrict row-level access:
     • Editors can read/write their country’s data.
     • Readers read-only.
     • Admins have full access.

3. Session & Security
   - Configure secure, HttpOnly, SameSite=Lax cookies via NextAuth or Supabase cookie settings.
   - Set session timeouts (idle/absolute).
   - Protect against session fixation.

Security Considerations:
   - Validate JWTs on each request.
   - Enforce `exp` and `nbf` claims.
   - Implement rate limiting on Auth endpoints.

---

## 4. File Import & AI Mapping

1. Upload Component (Next.js)
   - UI for PDF, CSV, XLSX, Google Sheets URL upload.
   - Client-side validation: file size, extension.
   - Upload to Supabase Storage with unique path (`userId/uploads/...`).

2. Serverless Function for Preprocessing
   - Validate file MIME type, scan for malware (ClamAV or third-party API).
   - Convert PDF to text/CSV via LibreOffice CLI or PDF parser.
   - Extract first few rows for preview.

3. AI-Powered Column Mapping
   - Call GPT-4o with sanitized sample data.
   - Prompt: Map columns to `quantity`, `characteristics`, `weight/volume`, `name`.
   - Receive JSON mapping, validate schema.
   - Present mapping preview UI, allow corrections.

4. Persist Mappings
   - Store mapping config per upload in `uploads` table.

Security Considerations:
   - Sanitize all inputs sent to GPT.
   - Do not leak file storage URLs.
   - Validate AI response against JSON schema.

---

## 5. Data Entry Module

1. Price Entry Forms
   - Dynamic form fields based on mapping: name, qty, weight/volume, price, supplier, country.
   - Use controlled components in React, validate on client.

2. Server-Side Validation & Storage
   - API route / RPC function to insert/update `prices`.
   - Validate types, ranges, required fields.
   - Use parameterized queries via Supabase SDK.

3. Photo & Spec Upload
   - Allow image upload (JPEG/PNG), size limit, virus scan.
   - Store in Supabase Storage under `photos/` with restricted read/write policy.

Security Considerations:
   - Enforce server-side validation.
   - Reject invalid or malicious files.
   - Apply RLS so users can only modify their own entries.

---

## 6. Real-Time Comparison Table

1. Data Fetching
   - Use SWR or React Query to fetch joined data: materials + prices + suppliers + exchange rates.
   - Paginate results.

2. Computations
   - Convert currencies on client or via RPC.
   - Calculate price differences, highlight savings.

3. Table UI
   - Use headless shadcn/ui table component.
   - Implement sorting, filtering, column resizing.

Security Considerations:
   - Prevent XSS: use React’s escape mechanisms.
   - Limit page size to prevent DoS.

---

## 7. Multi-Currency & Exchange Rates

1. Admin Interface
   - CRUD UI for exchange rates (`exchange_rates` table).
   - Input: base, target, rate, effective date.

2. Application Logic
   - Store manual rates; price conversion uses latest effective rate.
   - Fallback/warning if rate missing.

Security Considerations:
   - Only Admin role can modify rates.
   - Validate rate is positive float.

---

## 8. Product Details Page

1. Design UI
   - Display photo carousel, specs table, country-wise price list, transport estimate.

2. Transport Cost Calculation
   - Use weight/volume + distance (static matrix or API) to estimate cost.
   - Show breakdown.

3. Secure Data Loading
   - Fetch via protected RPC with RLS rules.

Security Considerations:
   - Hide sensitive supplier contact details unless authorized.
   - Sanitize all text.

---

## 9. Export Functionality

1. PDF Generation
   - Use a serverless function with Puppeteer or PDFKit.
   - Generate templated report: neutral, professional style.

2. Excel Export
   - Use SheetJS (xlsx) in backend.
   - Include selected filters, table columns.

3. Delivery
   - Provide secure, expiring download links.

Security Considerations:
   - Ensure only authenticated, authorized users can export.
   - Protect links with tokens and short TTL.

---

## 10. Freemium Model & Billing

1. Subscription Plans
   - Define limits for free tier (e.g., max uploads, rows).
   - Use Stripe + Supabase Functions to track billing.

2. Enforcement
   - Check usage quotas before file upload or data entry.
   - Graceful error messages if over limit.

Security Considerations:
   - Never expose plan logic on client.
   - Validate quotas on server.

---

## 11. Advanced Filtering & Sorting

1. Implement Filters
   - Country, price range, category, supplier, price gap.

2. Server-Side Filtering
   - Accept allow-listed filter parameters in RPC.
   - Build dynamic but parameterized SQL.

Security Considerations:
   - Whitelist filter keys; prevent SQL injection.

---

## 12. Multi-Language Support

1. Internationalization (i18n)
   - Use `next-i18next` or `@formatjs/next`.
   - Extract all UI strings into JSON for en/fr/zh.

2. Locale Routing
   - Configure Next.js middleware for locale detection.

3. Content
   - Ensure AI mapping preview supports localized UI.

Security Considerations:
   - Avoid injecting user-controlled strings into translation templates.

---

## 13. UI/UX & Design

1. Style Guide
   - Neutral palette aligned with construction sector; accessible contrast.

2. Accessibility
   - WCAG 2.1 AA compliance: ARIA labels, keyboard navigation.

3. Components
   - Reusable cards, tables, forms.

Security Considerations:
   - Avoid exposing internal debug info in UI.

---

## 14. Testing & QA

1. Unit Tests
   - Frontend: React components, utility functions.
   - Backend: RLS policies, RPC functions.

2. Integration Tests
   - Supabase Auth flows, uploads, AI mapping stub.

3. Security Testing
   - SAST with SonarCloud.
   - Automated dependency scanning.
   - Penetration test plan.

4. User Acceptance Testing
   - Role-based scenarios: Admin, Editor, Reader.

---

## 15. Deployment & Monitoring

1. Production Readiness
   - Disable debug, verbose logs.
   - Harden Vercel/Tower configuration.

2. Monitoring
   - Set up Sentry for front/backend errors.
   - Supabase logs, DB slow query logs.

3. Alerts
   - Rate-limit breaches, 5xx errors, high latency.

Security Considerations:
   - Rotate API keys periodically.
   - Review audit logs for suspicious activity.

---

## 16. Maintenance & Iteration

1. Dependency Updates
   - Quarterly review of NPM, Supabase, OpenAI libraries.

2. Security Reviews
   - Annual pen test, GDPR/CCPA compliance audit.

3. Feature Backlog
   - Additional countries, transport-API integration, vendor ratings.

---

By following this plan, you’ll incrementally deliver core features while embedding security, scalability, and maintainability at every step. Good luck!