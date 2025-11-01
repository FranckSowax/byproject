# CompaChantier

A modern web platform for comparing construction equipment prices across different countries, powered by AI for intelligent file mapping and analysis.

## Overview

CompaChantier helps construction and logistics teams compare equipment prices between Gabon (CFA) and China (RMB). Upload material lists (PDF, CSV, Excel, or Google Sheets), let GPT-4o automatically map columns, enter prices and supplier details, and generate professional comparison reports.

## Features

- **AI-Powered File Import**: Upload PDF, CSV, Excel, or Google Sheets with automatic column mapping via GPT-4o
- **Multi-Country Pricing**: Compare prices between Gabon (CFA) and China (RMB) with manual exchange rates
- **Role-Based Access**: Administrator, Editor, and Reader roles with granular permissions
- **Real-Time Comparison**: Live price comparison table with filtering, sorting, and search
- **Product Details**: High-resolution photos, specifications, and transport cost estimates
- **Professional Exports**: Generate PDF and Excel reports with custom branding
- **Freemium Model**: Free tier with limitations, Premium tier with unlimited access
- **Multi-Language**: Interface in French, English, and Chinese

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: OpenAI GPT-4o for file analysis
- **File Parsing**: PapaParse (CSV), SheetJS (Excel), PDF.js (PDF)
- **State Management**: React Query (TanStack Query)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd windsurf-project
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

Edit `.env.local` with your credentials:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `OPENAI_API_KEY`: Your OpenAI API key

4. Set up the database:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the migration script from `supabase/migrations/001_initial_schema.sql`

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── auth/             # Authentication components
│   ├── projects/         # Project-related components
│   └── comparison/       # Comparison table components
├── lib/                   # Utility functions
│   ├── supabase/         # Supabase clients
│   └── utils.ts          # Helper functions
├── types/                 # TypeScript type definitions
├── documentation/         # Project documentation
└── supabase/             # Database migrations

```

## Documentation

Comprehensive documentation is available in the `documentation/` folder:

- **project_requirements_document.md**: Full project requirements and specifications
- **tech_stack_document.md**: Detailed tech stack explanation
- **backend_structure_document.md**: Backend architecture and database schema
- **frontend_guidelines_document.md**: Frontend architecture and design principles
- **app_flow_document.md**: User flows and navigation
- **security_guideline_document.md**: Security best practices
- **tasks.json**: Detailed implementation tasks

## Development Workflow

1. **Task 1**: Project setup and authentication ✅
2. **Task 2**: File import and AI mapping (In Progress)
3. **Task 3**: Product data management
4. **Task 4**: Comparison dashboard
5. **Task 5**: Export system and monetization

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run tests: `npm test`
4. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For questions or issues, please refer to the documentation or contact the development team.
# byproject
