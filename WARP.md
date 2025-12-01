# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Clinify Dashboard is a Section 21 Outcome Letters management system with authentication and role-based access control. Built with Next.js 15, TypeScript, and Tailwind CSS with a sleek black-themed UI.

**Tech Stack:**
- Next.js 15 with App Router
- TypeScript (strict mode enabled)
- Tailwind CSS with custom design tokens
- shadcn/ui component patterns (custom implementation)
- Lucide React for icons
- Supabase for database
- JWT authentication with bcrypt
- Jotform API integration

## Development Commands

### Running the Application
```powershell
npm run dev          # Start development server on http://localhost:3000
npm run build        # Create production build
npm start            # Run production build
```

### Code Quality
```powershell
npm run lint         # Run ESLint with Next.js config
```

### Setup
```powershell
npm install          # Install dependencies
```

See `SETUP.md` for complete setup instructions including Supabase configuration.

Note: There is no separate test suite or typecheck script. Use `npm run build` to verify TypeScript compilation.

## Architecture

### Directory Structure
```
app/                 # Next.js App Router pages and layouts
├── layout.tsx       # Root layout (sets dark mode, Inter font)
├── page.tsx         # Main dashboard page
└── globals.css      # CSS variables and Tailwind config

components/
├── ui/              # Base UI primitives (Button, Card)
├── sidebar.tsx      # Main navigation sidebar
└── stat-card.tsx    # Dashboard metric cards

lib/
├── utils.ts                # Utility functions (cn helper for Tailwind)
├── types/
│   └── database.ts         # TypeScript types for database tables
├── contexts/
│   └── auth-context.tsx    # Authentication context provider
├── middleware/
│   └── auth.ts             # API authentication middleware
└── supabase/
    ├── client.ts           # Browser Supabase client
    └── server.ts           # Server Supabase client

app/api/                    # API routes
├── auth/                   # Authentication endpoints
│   ├── login/route.ts      # Login endpoint
│   ├── logout/route.ts     # Logout endpoint
│   └── me/route.ts         # Current user endpoint
├── users/route.ts          # User management (admin only)
├── gmps/                   # GMP management (admin only)
│   ├── route.ts            # List/create GMPs
│   └── [id]/route.ts       # Update/delete GMP
├── patients/route.ts       # Section 21 patient records
└── jotform/
    └── sync/route.ts       # Jotform sync endpoint (admin only)
```

### Key Architectural Patterns

**Component System:**
- UI components follow shadcn/ui patterns but are custom-built (not installed via CLI)
- All components use TypeScript with proper type definitions
- Components use `forwardRef` pattern for proper ref handling
- Styling via Tailwind utility classes merged with `cn()` helper

**Path Aliases:**
- Use `@/*` for imports (e.g., `@/components/ui/button`)
- Configured in `tsconfig.json` paths

**Design System:**
- Dark mode enforced via `className="dark"` on `<html>` element in `layout.tsx`
- CSS variables in `app/globals.css` define the black-themed color palette
- All colors use HSL format via CSS variables (e.g., `hsl(var(--background))`)
- Tailwind extended with design tokens: `background`, `foreground`, `card`, `primary`, `secondary`, `muted`, `accent`, `border`, `input`, `ring`
- Custom scrollbar styling included

**Client vs Server Components:**
- `app/layout.tsx` is a Server Component (wraps app with AuthProvider)
- `app/page.tsx`, `app/login/page.tsx`, and components use `"use client"` directive
- Most interactive UI components should be client components
- API routes are server-side only

**Authentication System:**
- JWT tokens stored in HTTP-only cookies
- Bcrypt password hashing (10 rounds)
- Role-based access control (admin vs user)
- Protected routes with middleware
- Auto-redirect to `/login` if not authenticated

**Database (Supabase):**
- `users` table - User accounts with roles
- `gmps` table - GMP facilities with license numbers
- `section21_patients` table - Patient records with file URLs
- Row Level Security (RLS) enabled
- Automatic `updated_at` triggers

## Styling Guidelines

**Theme Colors (Black UI):**
- Background: Pure black (`0 0% 0%`)
- Cards: Dark gray (`0 0% 7%`)
- Borders/Accents: `0 0% 14%`
- Keep the dark aesthetic consistent with existing design

**Component Styling:**
- Use `cn()` utility from `@/lib/utils` to merge Tailwind classes
- Cards should use `border-border bg-card/50 backdrop-blur` for consistency
- Buttons follow variant system: `default`, `ghost`, `outline`
- Button sizes: `default`, `sm`, `lg`, `icon`

## Development Patterns

**Adding New Pages:**
1. Create new route in `app/` directory following App Router conventions
2. Use Server Components by default; add `"use client"` only when needed
3. Import layout from parent `layout.tsx` (already configured)

**Creating Components:**
1. Place reusable UI primitives in `components/ui/`
2. Place feature-specific components in `components/`
3. Use TypeScript interfaces for props
4. Follow existing patterns (forwardRef for DOM elements, cn() for className merging)

**API Route Patterns:**
- Use `authenticateRequest()` middleware to protect routes
- Use `requireAdmin()` to restrict admin-only routes
- Return proper HTTP status codes (401 for unauthorized, 403 for forbidden)
- All API routes are in `/app/api/` directory

**Authentication in Components:**
```typescript
import { useAuth } from '@/lib/contexts/auth-context'

const { user, loading, login, logout, isAdmin } = useAuth()
```

**Making Authenticated API Calls:**
```typescript
const response = await fetch('/api/patients')
// Cookie is automatically sent with request
```

**Environment Variables:**
- `.env.local` for local development (not committed)
- Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Required: `SUPABASE_SERVICE_ROLE_KEY` (server-side only, keep secret)
- Required: `JWT_SECRET` (for signing tokens)
- Optional: `JOTFORM_API_KEY` (for Jotform sync)

## Windows Development Notes

- This project is developed on Windows with PowerShell
- Use PowerShell commands for file operations
- Path separators should be backslashes for local development
- Line endings are CRLF (Windows style)
