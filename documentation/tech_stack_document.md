# Tech Stack Document

## 1. Frontend Technologies

We chose a modern, component-driven approach to build a clean and responsive interface. Here are the main building blocks:

- **Next.js 14 (App Router)**
  - Framework for React that provides server-side rendering and easy page routing.
  - Improves performance and SEO by rendering pages on the server.
  - Built-in support for internationalization (i18n) in French, English, and Chinese.

- **TypeScript**
  - Statically typed version of JavaScript, which helps catch errors early.
  - Makes our code more self-documenting and easier to maintain.

- **Tailwind CSS**
  - Utility-first CSS framework for rapid styling.
  - Keeps our styles consistent and small by generating only the CSS we use.

- **shadcn/ui**
  - Collection of accessible, pre-built React components on top of Tailwind.
  - Speeds up UI development while maintaining a professional look and feel.

- **React Query (TanStack Query)**
  - Data-fetching library that handles caching, background updates, and stale-while-revalidate patterns.
  - Ensures our tables and detail pages update instantly when data changes.

- **File Parsing Libraries**
  - **Papaparse** for CSV processing.
  - **SheetJS (xlsx)** for Excel files.
  - **PDF.js** (or similar) for basic PDF text extraction.
  - These allow users to upload PDF/CSV/Excel and get data out quickly.

- **Internationalization**
  - Built-in Next.js i18n routing for switching interface language.
  - Texts and labels managed via JSON files per locale (fr, en, zh).

## 2. Backend Technologies

All backend needs—authentication, database, and file storage—are handled by Supabase, offering a unified, scalable platform:

- **Supabase Auth**
  - Manages user sign-up, login, email confirmation, and password resets.
  - Provides session handling out of the box.

- **Supabase Database (PostgreSQL)**
  - Stores projects, products, prices, country settings, user roles, and manual exchange rates.
  - Leverages row-level security (RLS) to enforce permissions for admins, editors, and readers.

- **Supabase Storage**
  - Stores uploaded files (spreadsheets, PDFs) and product images securely.
  - Provides signed URLs for serving images to the frontend.

- **OpenAI GPT-4o API**
  - Processes uploaded files to automatically detect and map columns (quantity, weight, specs).
  - Returns a suggested schema that users can preview and adjust.

- **Stripe (Payment Processing)**
  - Handles subscription billing for the freemium model.
  - Integrates with Supabase via webhooks to update user access levels.

## 3. Infrastructure and Deployment

We chose tried-and-true services and workflows to ensure reliability and fast iteration:

- **Version Control**: Git & GitHub
  - Feature branching and pull requests for code reviews.

- **CI/CD**: GitHub Actions → Vercel
  - On every push to `main`, we run tests and deploy to a staging or production environment on Vercel.
  - Automated previews for pull requests to review changes live.

- **Hosting Platform**: Vercel
  - Optimized for Next.js, with built-in CDN, edge functions, and instant cache invalidation.
  - Automatically scales to handle traffic spikes.

- **Supabase (Managed Service)**
  - Hosted PostgreSQL and storage with built-in backups.
  - Auto-scales based on usage.

- **Monitoring & Logging**
  - Basic logging via Supabase logs and Vercel Analytics.
  - Optional Sentry integration for error tracking (future enhancement).

## 4. Third-Party Integrations

To enrich functionality without reinventing the wheel, we integrate best-in-class services:

- **OpenAI GPT-4o**
  - Powers the automatic mapping of data columns when users upload files.

- **Stripe**
  - Manages freemium and premium subscription plans.

- **Exchange Rates API (Manual Override)**
  - While we store and display rates from a simple API (e.g., exchangerate.host), administrators can edit rates manually in the settings.

- **Google Analytics** (optional)
  - Tracks user behavior and adoption metrics.

## 5. Security and Performance Considerations

We follow best practices to keep data safe and the app snappy:

- **Authentication & Authorization**
  - Supabase Auth with email verification.
  - Role-based access control implemented via PostgreSQL RLS policies (admin, editor, reader).

- **Secure File Handling**
  - Uploaded files and images stored with private permissions; served via signed URLs.
  - Virus/malware scanning can be added later via webhook.

- **Data Protection**
  - All traffic is served over HTTPS.
  - Database backups and point-in-time recovery in Supabase.

- **Performance Optimizations**
  - Server-side rendering and static generation for public pages.
  - React Query caches requests and updates only changed data.
  - Images optimized using Next.js Image component.
  - Tailwind’s JIT mode keeps CSS bundle small.

## 6. Conclusion and Overall Tech Stack Summary

Our platform combines proven, full-stack tools to meet the project’s goals of an intuitive, scalable, and secure price comparison tool for construction materials across countries:

- Frontend built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **shadcn/ui** for a clean, responsive interface in multiple languages.
- Backend managed entirely by **Supabase** (Auth, PostgreSQL, Storage) to simplify development and scale effortlessly.
- **OpenAI GPT-4o** integration for smart, automatic file mapping—our unique edge.
- **Stripe** for subscription-based monetization, enabling a freemium model with clear upgrade paths.
- Deployed on **Vercel** with GitHub Actions for continuous integration and fast, reliable updates.

This stack ensures a user-friendly experience, rapid development, and the flexibility to grow (new countries, more file formats, advanced analytics) as your business evolves.