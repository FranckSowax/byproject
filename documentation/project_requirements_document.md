# Project Requirements Document

## 1. Project Overview

We are building a web platform that helps construction and logistics teams compare equipment prices across different countries. In the first version, the platform will focus on Gabon (CFA currency) and China (RMB currency). Users can upload a list of materials (PDF, CSV, Excel or a public Google Sheet link). Our AI (GPT-4o) will automatically read that file, recognize columns (e.g., quantity, general characteristics, weight/volume) and let the user preview or correct the mapping before importing data. Once imported, users enter prices, photos, suppliers and technical specs for each item in each country.

On the main dashboard, users see a live comparison table: local prices, converted values, and price differences update immediately when someone edits data or adjusts the manual exchange rate. Clicking an item opens a detail page (photo, specs, transport cost estimate based on weight/volume, references). Users sign up for accounts (Freemium or Premium) and are assigned roles (Administrator, Editor, Reader). They can save projects, manage user permissions, and export professional PDF or Excel summaries for quote requests.

**Key Objectives / Success Criteria**

*   Accurate, AI-powered mapping of uploaded files with manual correction.
*   Real-time price comparison and currency conversion.
*   Clear role-based access (Admin, Editor, Reader).
*   Freemium model: limited free use vs. unlimited paid plan.
*   Clean, responsive UI in French, English and Chinese.

## 2. In-Scope vs. Out-of-Scope

### In-Scope (Version 1)

*   User authentication (email sign-up, password reset).
*   Role management: Administrator, Editor, Reader.
*   File import: PDF, CSV, Excel, Google Sheet via public URL.
*   AI analysis (GPT-4o) and column mapping preview/correction.
*   Data entry per country: price, supplier, photo, references, weight/volume.
*   Multi-currency support: CFA and RMB, manual exchange rate input.
*   Interactive comparison table with filtering and sorting.
*   Product detail page with transport cost estimate.
*   Export to PDF/Excel with professional layout (no custom templates yet).
*   Freemium subscription model (limited projects/exports vs. unlimited).

### Out-of-Scope (Later Phases)

*   Custom branding/theme upload.
*   Automated exchange-rate API integration (for now rate is manual).
*   Additional country currencies beyond CFA/RMB (except basic support ready).
*   Mobile-only or native apps (focus is responsive web).
*   Offline mode or local data storage.
*   Third-party payment gateway integration (to be added in monetization phase).

## 3. User Flow

When a new user arrives, they choose French, English or Chinese and sign up with email and password. After confirming their address, they land on a dashboard listing existing “projects.” An Administrator can also invite teammates and assign them roles (Editor or Reader). The user clicks “New Project,” gives it a name, selects default countries (Gabon and China) and creates it.

Inside a project, the user uploads a materials list (file or Google Sheet URL). GPT-4o scans the document and proposes column mappings (quantity, general features, weight/volume, etc.). The user reviews and adjusts the mappings if needed, then confirms. The platform then shows a table where each row is a product. The Editor enters prices (in CFA or RMB), supplier details, photos and references. The comparison table updates immediately: converted prices, price differences, filters and sorts apply. Clicking any row opens a detailed product page where the user sees all data plus transport cost estimates. Finally, users export the comparison to PDF or Excel and download or share the report.

## 4. Core Features

*   **Authentication & Roles**

    *   Email/password sign-up, password reset
    *   Roles: Administrator (full control), Editor (data entry), Reader (view/export only)

*   **File Import & AI Mapping**

    *   Accepts PDF, CSV, Excel, public Google Sheet URLs
    *   Uses GPT-4o to detect and map columns
    *   Preview & manual correction of mappings

*   **Data Entry per Country**

    *   Price (local currency), supplier, photos, references
    *   Required fields: quantity, general characteristic, weight or volume

*   **Real-Time Comparison Table**

    *   Side-by-side country prices, converted values
    *   Automatic gap calculation
    *   Filters: country, price range, category, supplier, gap size, search by name/ref
    *   Sort: price asc/desc, gap, name, supplier

*   **Currency Conversion**

    *   Manual input of exchange rate
    *   Instant recalculation on rate change

*   **Product Detail Page**

    *   High-res photo, full specs, references
    *   Transport cost estimate from weight/volume

*   **Exports & Reporting**

    *   PDF and Excel with professional layout
    *   Includes logo placeholder, headers/footers, project summary

*   **Freemium Monetization**

    *   Free tier: limited projects, products, exports
    *   Paid tier: unlimited, full history, priority support

## 5. Tech Stack & Tools

*   Frontend

    *   Next.js 14 (App Router) – React framework for server-side and static rendering
    *   TypeScript – type safety
    *   Tailwind CSS + shadcn/ui – utility-first styling and ready components

*   Backend & Storage

    *   Supabase – PostgreSQL-based database, authentication, file and image storage
    *   Supabase Edge Functions (if needed) for custom server logic

*   AI Integration

    *   OpenAI GPT-4o – file content analysis and mapping
    *   API calls from a secure backend proxy

*   Dev Tools & IDE

    *   VS Code with Tailwind and TypeScript plugins
    *   GitHub for source control and CI/CD
    *   (Optional) Cursor or Windsurf for AI-powered dev assistance

## 6. Non-Functional Requirements

*   **Performance**

    *   Page load under 2 seconds on 4G connection
    *   Table updates and filtering under 200ms for 1,000 rows

*   **Security**

    *   HTTPS everywhere
    *   JWT-based sessions via Supabase Auth
    *   Role-based access control on backend routes

*   **Scalability**

    *   Support hundreds of concurrent users
    *   Database indexing on key columns (project, product, country)

*   **Usability & Accessibility**

    *   WCAG 2.1 AA compliance (contrast, keyboard nav, screen-reader labels)
    *   Responsive design for desktop and tablets

*   **Compliance**

    *   GDPR consent on signup
    *   Secure storage of user data in EU region

## 7. Constraints & Assumptions

*   GPT-4o availability and OpenAI API limits are sufficient for batch imports.
*   Exchange rates are entered manually; no real-time currency API.
*   Branding guidelines are minimal (neutral palette, modern sans-serif).
*   Initial countries: only Gabon and China; others added later.
*   File size limits (e.g., 10 MB per import) to keep mapping fast.
*   Users provide publicly accessible Google Sheet links (no OAuth integration).

## 8. Known Issues & Potential Pitfalls

*   **AI Mapping Errors**

    *   GPT-4o may mislabel columns in atypical documents. Mitigation: mandatory preview step and clear “undo” on mapping.

*   **Large File Imports**

    *   Very big Excel/PDF could time out. Mitigation: file size limit, background processing with progress UI.

*   **Manual Exchange Rate Mistakes**

    *   Wrong rate leads to misleading comparisons. Mitigation: warn users when rate differs greatly from typical market value.

*   **Role Permission Loopholes**

    *   Editors trying to change global settings. Mitigation: backend checks for role on every sensitive route.

*   **Multi-Language Text Overflow**

    *   Chinese or English labels too long in UI. Mitigation: design flexible containers, test with placeholder text in all three languages.

This document serves as the single source of truth for all future technical planning, UI/UX guidelines, backend architecture, security rules, and deployment procedures. Feel free to reference it when building detailed designs or writing code.
