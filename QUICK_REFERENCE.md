# Quick Reference Card

## 🔑 Yes, You Have a Login System!

### ✅ What's Implemented

**Login Page:** `http://localhost:3000/login`

**User Roles:**
- 👤 **Admin** - Full access (manage users, GMPs, sync data)
- 👤 **User** - View dashboard and patient records

**Features:**
- ✅ Email/password login
- ✅ JWT tokens (HTTP-only cookies)
- ✅ Password hashing with bcrypt
- ✅ Auto-redirect if not logged in
- ✅ Logout functionality
- ✅ Role-based access control

## 🚀 Quick Start

```powershell
# 1. Install dependencies
npm install

# 2. Setup database (see SETUP.md)
# - Run supabase-schema.sql in Supabase
# - Get API keys from Supabase dashboard

# 3. Configure .env.local
# Add your Supabase keys and generate JWT_SECRET

# 4. Run dev server
npm run dev

# 5. Visit login page
# http://localhost:3000/login
```

## 📍 Important Files

**Authentication:**
- `/app/login/page.tsx` - Login UI
- `/lib/contexts/auth-context.tsx` - Auth context
- `/app/api/auth/login/route.ts` - Login API
- `/app/api/auth/me/route.ts` - Current user API
- `/app/api/auth/logout/route.ts` - Logout API

**Database:**
- `/lib/supabase/client.ts` - Browser client
- `/lib/supabase/server.ts` - Server client
- `/lib/types/database.ts` - TypeScript types
- `supabase-schema.sql` - Database schema

**Protected Pages:**
- `/app/page.tsx` - Main dashboard (requires login)

## 🔐 Default Admin Account

After running the database schema:

```
Email: admin@clinify.com
Password: admin123
```

⚠️ **Change this immediately in production!**

## 🛠️ API Endpoints

**Auth:**
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user

**Admin Only:**
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/gmps` - List GMPs
- `POST /api/gmps` - Create GMP
- `PUT /api/gmps/[id]` - Update GMP
- `DELETE /api/gmps/[id]` - Delete GMP
- `POST /api/jotform/sync` - Sync Jotform

**All Users:**
- `GET /api/patients` - List patients

## 💻 Using Auth in Components

```typescript
import { useAuth } from '@/lib/contexts/auth-context'

function MyComponent() {
  const { user, loading, isAdmin, logout } = useAuth()
  
  if (loading) return <p>Loading...</p>
  if (!user) return <p>Not logged in</p>
  
  return (
    <div>
      <p>Welcome, {user.full_name}!</p>
      {isAdmin() && <AdminPanel />}
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

## 🗄️ Database Tables

**users:**
- id, email, password_hash, full_name, role, status, assigned_gmp_ids

**gmps:**
- id, gmp_name, gmp_license_number, status

**section21_patients:**
- id, patient_full_name, patient_unique_id, patient_id_document_url, 
  dr_script_url, sahpra_invoice_url, outcome_letter_url, gmp_id, 
  form_id, form_title

## 📚 Documentation

- **`SETUP.md`** - Complete setup instructions
- **`AUTHENTICATION.md`** - Auth system details
- **`IMPLEMENTATION_SUMMARY.md`** - What's been built
- **`WARP.md`** - Development guidelines

## ❓ Common Issues

**"Not authenticated" error?**
- Check `.env.local` has correct keys
- Verify `JWT_SECRET` is set
- Clear browser cookies and login again

**Can't login?**
- Verify database schema is executed
- Check user status is 'active' in database
- Verify password hash is correct

**Database errors?**
- Run `supabase-schema.sql` in Supabase
- Check Supabase service role key
- Review RLS policies

## 🎯 What to Build Next

**Admin Panel UI (APIs ready, need UI):**
1. `/app/admin/page.tsx` - Admin dashboard
2. `/app/admin/users/page.tsx` - User management
3. `/app/admin/gmps/page.tsx` - GMP management
4. `/app/admin/sync/page.tsx` - Jotform sync

**Additional Features:**
- Password reset
- User profiles
- Advanced search/filtering
- Data export

## 🎉 You're All Set!

You have a **complete authentication system** with:
- Login/logout functionality
- Role-based access control
- Protected API routes
- Database integration
- Jotform sync capability

Just follow `SETUP.md` to configure and deploy!
