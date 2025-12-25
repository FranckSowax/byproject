# CompaChantier - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)
- OpenAI API key

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp env.example .env.local
```

Edit `.env.local` with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-openai-key
```

### 3. Set Up Database
1. Go to your Supabase project dashboard
2. Open SQL Editor
3. Copy and run `supabase/migrations/001_initial_schema.sql`

### 4. Start Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## 📁 Project Structure

```
app/
├── (auth)/          # Authentication pages (login, signup)
├── (dashboard)/     # Protected dashboard pages
├── api/             # API routes (to be implemented)
└── page.tsx         # Landing page

components/
├── ui/              # shadcn/ui components
└── ...              # Custom components (to be added)

lib/
├── supabase/        # Supabase client configuration
└── utils.ts         # Utility functions

types/
└── database.ts      # Database type definitions

documentation/       # Full project documentation
```

## 🎯 What's Built

✅ **Landing Page** - Professional homepage with features
✅ **Authentication UI** - Login and signup pages
✅ **Dashboard Layout** - Navigation and user menu
✅ **Database Schema** - Complete SQL migration
✅ **Type Definitions** - TypeScript types for database

## 🔨 What's Next

### Immediate Tasks (Priority Order)

1. **Implement Supabase Authentication**
   - Create auth context provider
   - Connect login/signup forms
   - Add session management

2. **Build File Upload System**
   - File upload component
   - Supabase storage integration
   - AI mapping with GPT-4o

3. **Create Project Management**
   - New project form
   - Project list with CRUD
   - Project detail pages

4. **Develop Comparison Features**
   - Product data entry forms
   - Real-time comparison table
   - Currency conversion

5. **Add Export Functionality**
   - PDF generation
   - Excel export
   - Subscription limits

## 📖 Key Documentation Files

- **SETUP_GUIDE.md** - Detailed setup instructions
- **README.md** - Project overview and features
- **documentation/tasks.json** - Complete task breakdown
- **documentation/project_requirements_document.md** - Full requirements
- **documentation/tech_stack_document.md** - Technology explanations

## 🔑 Important Notes

### Supabase Setup
- Enable Email Auth in Authentication settings
- Configure email templates
- Set up RLS policies (already in migration)
- Create storage bucket for file uploads

### OpenAI Integration
- Use GPT-4o model for best results
- Implement rate limiting
- Handle API errors gracefully
- Cache results when possible

### Security
- Never commit `.env.local`
- Use environment variables for all secrets
- Test RLS policies thoroughly
- Validate all user inputs

## 🐛 Common Issues

**"Module not found" errors**
```bash
npm install
```

**Supabase connection fails**
- Check `.env.local` variables
- Verify Supabase project is active
- Test connection in Supabase dashboard

**TypeScript errors**
```bash
npm run build
```

**Port 3000 already in use**
```bash
lsof -ti:3000 | xargs kill
npm run dev
```

## 💡 Development Tips

1. **Use the documentation** - Everything is documented in `/documentation`
2. **Follow the tasks.json** - Detailed implementation steps
3. **Test incrementally** - Build and test each feature
4. **Check types** - TypeScript will catch many errors
5. **Use shadcn/ui** - Pre-built accessible components

## 🎨 Design System

**Colors:**
- Primary: Blue (#1E40AF)
- Secondary: Amber (#F59E0B)
- Accent: Emerald (#10B981)
- Background: Light Gray (#F3F4F6)

**Typography:**
- Font: Inter (already configured)
- Headings: Bold weights
- Body: Regular weights

**Components:**
- All UI components from shadcn/ui
- Consistent spacing with Tailwind
- Responsive design (mobile-first)

## 📞 Need Help?

1. Check `SETUP_GUIDE.md` for detailed instructions
2. Review `documentation/` folder for specifications
3. Look at `tasks.json` for implementation details
4. Check component examples in shadcn/ui docs

## ✨ Features to Implement

### Phase 1: Authentication (Week 1)
- [ ] Supabase auth integration
- [ ] Protected routes middleware
- [ ] User session management
- [ ] Password reset flow

### Phase 2: File Upload (Week 2)
- [ ] File upload component
- [ ] GPT-4o integration
- [ ] Column mapping UI
- [ ] Data import flow

### Phase 3: Data Management (Week 3)
- [ ] Product CRUD operations
- [ ] Multi-country pricing
- [ ] Supplier management
- [ ] Image uploads

### Phase 4: Comparison (Week 4)
- [ ] Comparison table
- [ ] Real-time updates
- [ ] Filtering and sorting
- [ ] Currency conversion

### Phase 5: Export & Polish (Week 5)
- [ ] PDF export
- [ ] Excel export
- [ ] Subscription system
- [ ] Testing and deployment

## 🚢 Deployment

When ready to deploy:

1. **Vercel (Recommended)**
   ```bash
   vercel
   ```

2. **Environment Variables**
   - Add all `.env.local` variables to Vercel
   - Configure production Supabase project
   - Set up custom domain

3. **Database**
   - Use production Supabase project
   - Run migrations
   - Test RLS policies

## 📈 Success Metrics

- [ ] Users can sign up and log in
- [ ] Files can be uploaded and mapped
- [ ] Products can be added with prices
- [ ] Comparison table shows real-time data
- [ ] Reports can be exported
- [ ] App is responsive on mobile
- [ ] All features work in production

---

**Ready to build?** Start with implementing Supabase authentication! 🚀
