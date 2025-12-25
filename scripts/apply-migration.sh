#!/bin/bash

# Script to apply the collaboration tables migration
# Date: 2025-11-05

set -e  # Exit on error

echo "🚀 Applying Collaboration Tables Migration"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed${NC}"
    echo ""
    echo "Install it with:"
    echo "  npm install -g supabase"
    echo "  or"
    echo "  brew install supabase/tap/supabase"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo -e "${YELLOW}⚠️  Project not linked to Supabase${NC}"
    echo ""
    echo "Please link your project first:"
    echo "  supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    echo "You can find your project ref in your Supabase dashboard URL:"
    echo "  https://supabase.com/dashboard/project/YOUR_PROJECT_REF"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Project is linked${NC}"
echo ""

# Check if migration file exists
MIGRATION_FILE="supabase/migrations/002_collaboration_tables.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Migration file found${NC}"
echo ""

# Show migration preview
echo "📄 Migration Preview:"
echo "-------------------"
echo "This migration will create:"
echo "  • project_collaborators table"
echo "  • material_comments table"
echo "  • project_history table"
echo "  • RLS policies for all tables"
echo "  • Indexes for performance"
echo "  • Triggers for automatic history logging"
echo ""

# Ask for confirmation
read -p "Do you want to apply this migration? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Migration cancelled${NC}"
    exit 0
fi

echo ""
echo "🔄 Applying migration..."
echo ""

# Apply the migration
if supabase db push; then
    echo ""
    echo -e "${GREEN}✅ Migration applied successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Refresh your browser (Cmd+Shift+R or Ctrl+Shift+R)"
    echo "  2. Check the console for errors"
    echo "  3. Test the collaboration features"
    echo ""
    echo "To verify the tables were created, run:"
    echo "  supabase db remote --help"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Migration failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check your internet connection"
    echo "  2. Verify your Supabase credentials"
    echo "  3. Check the Supabase dashboard for errors"
    echo "  4. Try applying the migration manually via the SQL Editor"
    echo ""
    exit 1
fi
