# Frontend Guideline Document

This document explains how we build and organize the frontend of our construction‐material price comparison platform. It’s written in everyday language so everyone—from new team members to non-technical stakeholders—can understand the setup.

---

## 1. Frontend Architecture

**Frameworks & Libraries**
- **Next.js 14 (App Router)**: Provides file-based routing, server components, and code splitting out of the box.
- **TypeScript**: Adds type safety so we catch errors early.
- **Tailwind CSS**: A utility-first CSS framework for rapid styling.
- **shadcn/ui**: A component library built with Tailwind CSS, offering ready-made, accessible UI elements.
- **Supabase Client**: Handles authentication, database calls, and storage from the frontend.
- **AI Integration**: We call GPT-4o via our own backend endpoints to map file columns automatically.
- **File Parsers**: PapaParse for CSV, SheetJS (xlsx) for Excel, and PDF.js for PDF text extraction.

**How This Architecture Helps**
- **Scalable**: Next.js auto splits pages and components so new features don’t bloat the app.
- **Maintainable**: TypeScript + clear folder structure + UI components in `shadcn/ui` keep the codebase organized.
- **Performant**: Server components, lazy loading, and Tailwind’s small final CSS bundle ensure fast load times.

---

## 2. Design Principles

1. **Usability**: Simple flows—upload, map, compare—keep users focused on tasks.
2. **Accessibility**: We use semantic HTML, ARIA labels, and `shadcn/ui`’s built-in keyboard/navigation support.
3. **Responsiveness**: Mobile-first design; breakpoints ensure tables and forms adapt from phones to large monitors.
4. **Clarity**: Consistent spacing, typography, and color usage make data easy to scan.
5. **Internationalization (i18n)**: All UI text lives in translation files (English, French, Chinese). We rely on Next.js i18n routing with `next-i18next`.

_Application Example:_
- **Form Labels** always accompany inputs.
- **Error Messages** appear inline in the user’s language.
- **Table Columns** collapse under a “details” button on narrow screens.

---

## 3. Styling and Theming

**Approach**
- **Tailwind CSS** (utility-first) means we rarely write custom CSS. We lean on Tailwind classes for layout, spacing, colors.
- **shadcn/ui** provides base components (buttons, inputs, dialogs) styled with Tailwind. We extend them via configuration.

**Theme Style**: Modern flat design with subtle glassmorphism in modals and cards (semi-transparent backgrounds + soft shadows).

**Color Palette**
- Primary: `#1E40AF` (Deep Blue)  
- Secondary: `#F59E0B` (Amber)  
- Accent: `#10B981` (Emerald)  
- Background: `#F3F4F6` (Light Gray)  
- Surface/Card: `rgba(255, 255, 255, 0.75)` (Glass effect)  
- Text Primary: `#111827` (Almost Black)  
- Error: `#DC2626` (Red)  
- Success: `#16A34A` (Green)

**Fonts**
- Primary: `Inter, system-ui, sans-serif`  
- Headings: bold weights of Inter  
- Body: regular weights of Inter

Themes (light/dark) are toggled via a Tailwind CSS media query or manual switch, storing preference in `localStorage`.

---

## 4. Component Structure

**Folder Organization** (inside `app/`)
```
app/
├─ layout.tsx        # Main layout with header, footer, i18n switch
├─ page.tsx          # Dashboard home
├─ projects/         # All project-related routes
│   ├─ layout.tsx    # Sidebar + breadcrumb
│   ├─ new/          # New project flow
│   ├─ [id]/         # Existing project pages (mapping, entry, comparison)
components/
├─ ui/               # shadcn/ui overrides & custom UI bits
├─ common/           # Buttons, inputs, modals (wrappers around shadcn/ui)
├─ table/            # Comparison table, row, cell
├─ mapping/          # Column mapping preview/editor
```

**Reusability**
- **Atomic Components**: Buttons, Inputs, Cards are small and configurable.
- **Composite Components**: MappingTable, ComparisonTable combine atoms into larger blocks.
- **Layouts**: Reused for dashboard, project flows, and detail pages.

This structure keeps code DRY, easy to navigate, and allows quick styling or behavior tweaks in one place.

---

## 5. State Management

**Local Component State**
- Used for small UI interactions (e.g., toggling modals, form field states).

**Context API**
- **AuthContext**: Tracks user session and role (Admin/Editor/Reader).
- **I18nContext**: Current language selection.
- **ThemeContext**: Light/dark theme state.

**Data Fetching & Global Data**
- **React Query (TanStack Query)**: Manages remote data (projects list, exchange rates, product lists) with caching and background updates.
- Supabase client calls are wrapped by React Query hooks.

This blend ensures quick UI responses, centralized error handling, and consistent sync with the backend.

---

## 6. Routing and Navigation

**Next.js App Router** (file-based):
- **Public Routes**: `/login`, `/signup`
- **Protected**: All under `/app`—requires authentication.
- **Dynamic**: `/app/projects/[id]` for each project’s pages.

**Navigation Elements**
- **Header**: App logo, language switcher, user menu (profile, logout).
- **Sidebar** (inside project layout): Steps—Import → Map → Entry → Comparison → Export.
- **Breadcrumbs**: Show context within a project.

Route protection is done via a `withAuth` wrapper that redirects unauthenticated users to `/login`.

---

## 7. Performance Optimization

1. **Code Splitting**: Next.js automatically splits by route; we also use dynamic imports for heavy components (e.g., PDF preview).
2. **Lazy Loading**: Images via `next/image`; heavy tables load pages of data on demand.
3. **Tailwind Purge**: We remove unused CSS in production for a tiny CSS footprint.
4. **Caching**: React Query caches remote calls; Supabase uses real-time listeners for live updates.
5. **Asset Optimization**: SVG icons via `@svgr/webpack`, minimizing file sizes.

These steps let our app feel snappy, even on slower connections.

---

## 8. Testing and Quality Assurance

**Unit Tests**
- **Jest + React Testing Library**: Test individual components (buttons, forms, tables).
- **Vitest** can be used as an alternative for faster TypeScript support.

**Integration Tests**
- Combine multiple components (e.g., column mapping + preview UI).
- Mock GPT-4o responses and file parser outputs.

**End-to-End Tests**
- **Cypress** (or Playwright): Simulate user flows—login, import file, map columns, enter data, export report.

**Linting & Formatting**
- **ESLint** (with TypeScript rules) for code quality.
- **Prettier** for consistent formatting.

**Continuous Integration**
- GitHub Actions run tests and lint on every pull request.

---

## 9. Conclusion and Overall Frontend Summary

Our frontend is built on a solid, modern stack (Next.js, TypeScript, Tailwind, shadcn/ui) with clear architecture that supports growth. We follow simple yet powerful design principles—focus on usability, accessibility, and performance. A well-organized component structure, combined with React Query and Context API, keeps state predictable and code easy to maintain. Routing via Next.js App Router ensures a clean URL structure and comfortable navigation. Performance tuning and comprehensive testing guarantee a smooth, reliable user experience.

In sum, this setup helps us move fast, deliver features with confidence, and ensure our users can quickly compare construction material prices across countries with a polished, accessible interface.

---

Thank you for reviewing the frontend guidelines! Feel free to reach out if you have any questions or suggestions.