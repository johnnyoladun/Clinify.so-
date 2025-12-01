# Clinify Dashboard - Setup Guide

## Overview

This system provides a complete authentication and management platform for Section 21 Outcome Letters with role-based access control.

## Features Implemented

### Authentication System
✅ **Login system** for both users and admins
✅ **JWT-based session management** with HTTP-only cookies
✅ **Password hashing** with bcrypt
✅ **Role-based access control** (Admin vs Standard User)
✅ **Auto-redirect** to login if not authenticated
✅ **Logout functionality**

### User Roles

#### Admin Users
- Can view all patient records
- Can manage users (create, edit, deactivate)
- Can manage GMPs (create, edit, deactivate)
- Can sync Jotform data
- Can assign users to specific GMPs
- Can reset passwords

#### Standard Users (Clinic/GMP Staff)
- Can view Outcome Letters Dashboard
- Can view patient records (filtered by assigned GMPs if applicable)
- Cannot manage users or GMPs

## Setup Instructions

### 1. Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Execute the SQL to create all tables and indexes

### 2. Get Your Supabase Keys

1. In Supabase dashboard, go to **Settings** > **API**
2. Copy the following:
   - **Project URL** (e.g., `https://uvkgbahaeeoiibxmqmua.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

### 3. Configure Environment Variables

Edit `.env.local` and add your actual keys:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://uvkgbahaeeoiibxmqmua.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here

# Jotform API
JOTFORM_API_KEY=198c160dbd9738d443d05b1b118f44b5

# JWT Secret (generate a secure random string)
JWT_SECRET=your_secure_random_jwt_secret_here
```

**To generate a secure JWT_SECRET:**

PowerShell:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | % {[char]$_})
```

### 4. Create Your First Admin User

After running the schema SQL, you'll have a default admin account:

```
Email: admin@clinify.com
Password: admin123
```

**⚠️ IMPORTANT:** Change this password immediately after first login by creating a new admin user via the API or updating the database directly.

To create a proper admin user with a hashed password:

```powershell
# Install bcrypt-cli if needed
npm install -g bcrypt-cli

# Generate password hash
bcrypt-cli "YourSecurePassword" 10
```

Then insert into Supabase:

```sql
INSERT INTO users (email, password_hash, full_name, role, status)
VALUES (
  'youremail@example.com',
  'the_generated_hash_here',
  'Your Full Name',
  'admin',
  'active'
);
```

### 5. Install Dependencies & Run

```powershell
npm install
npm run dev
```

Visit `http://localhost:3000/login` to sign in.

## Using the System

### Login
1. Navigate to `/login`
2. Enter your email and password
3. Click "Sign In"
4. You'll be redirected to the dashboard

### Main Dashboard (`/`)
- Shows all Section 21 patient records
- Displays: Patient Name, Patient ID, Form Title/Location, GMP, and Documents
- Standard users only see patients from their assigned GMPs
- Admins see all patients
- Click document links to view/download files

### Admin Panel (Admin Only)
Access via the "Admin Panel" button on the main dashboard.

**Note:** The admin panel UI needs to be created. Here are the API endpoints available:

#### User Management API
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123",
    "full_name": "John Doe",
    "role": "user",
    "assigned_gmp_ids": ["uuid-1", "uuid-2"]
  }
  ```

#### GMP Management API
- `GET /api/gmps` - List all GMPs
- `POST /api/gmps` - Create new GMP
  ```json
  {
    "gmp_name": "SATIVA Hibiscus",
    "gmp_license_number": "GMP-12345"
  }
  ```
- `PUT /api/gmps/[id]` - Update GMP
- `DELETE /api/gmps/[id]` - Delete GMP

#### Patient Data API
- `GET /api/patients` - List patients (with pagination and search)
  - Query params: `page`, `per_page`, `search`

#### Jotform Sync API
- `POST /api/jotform/sync` - Sync form submissions from Jotform
  ```json
  {
    "form_id": "123456789"
  }
  ```

### Logout
Click the logout icon in the top-right header.

## Database Schema

### Users Table
- `id` - UUID
- `email` - Unique email address
- `password_hash` - Bcrypt hashed password
- `full_name` - User's full name
- `role` - 'admin' or 'user'
- `status` - 'active' or 'inactive'
- `assigned_gmp_ids` - Array of GMP UUIDs (optional)

### GMPs Table
- `id` - UUID
- `gmp_name` - GMP facility name
- `gmp_license_number` - Unique license number
- `status` - 'active' or 'inactive'

### Section21_Patients Table
- `id` - UUID
- `patient_full_name` - Patient's name
- `patient_unique_id` - Unique identifier from Jotform
- `patient_id_document_url` - ID document file URL
- `dr_script_url` - Doctor prescription file URL
- `sahpra_invoice_url` - SAHPRA invoice file URL
- `outcome_letter_url` - Section 21 outcome letter PDF URL
- `gmp_id` - Foreign key to GMPs table
- `form_id` - Jotform form ID
- `form_title` - Human-readable form name/location

## Jotform Integration

### Form Title Mapping

Edit `/app/api/jotform/sync/route.ts` and update the `FORM_TITLE_MAPPING` object:

```typescript
const FORM_TITLE_MAPPING: { [key: string]: string } = {
  '123456789': 'SATIVA Hibiscus',
  '987654321': 'Bassani Cape Town',
  // Add more form mappings here
}
```

### Syncing Forms

Make a POST request to `/api/jotform/sync` with:
```json
{
  "form_id": "your_jotform_form_id"
}
```

The system will:
1. Fetch all submissions from Jotform
2. Extract patient data and file URLs
3. Upsert records into the database
4. Match or fetch form titles

### Customizing Field Mapping

The Jotform field extraction logic is in helper functions `extractFieldValue` and `extractFileUrl` in the sync route. Adjust the `possibleKeys` arrays to match your actual form field names.

## Security Notes

- Passwords are hashed with bcrypt (10 rounds)
- JWT tokens expire after 7 days
- HTTP-only cookies prevent XSS attacks
- Row Level Security (RLS) is enabled in Supabase
- Service role key must be kept secret and never exposed to the client

## Next Steps

1. **Create Admin Panel UI** - Build pages for user and GMP management
2. **Add password reset functionality** - Email-based password reset
3. **Implement form title auto-detection** - Automatically fetch and cache form titles
4. **Add audit logging** - Track user actions
5. **Implement advanced filtering** - Filter patients by date, GMP, status
6. **Add file upload functionality** - Allow admins to upload documents directly

## Troubleshooting

### "Not authenticated" errors
- Check that `.env.local` has the correct Supabase keys
- Verify JWT_SECRET is set
- Clear browser cookies and try logging in again

### Database errors
- Verify the schema SQL has been executed
- Check Supabase table permissions
- Review RLS policies if certain operations fail

### Jotform sync not working
- Verify JOTFORM_API_KEY is correct
- Check form ID is valid
- Review Jotform API rate limits
- Check console logs for specific errors

## Support

For issues or questions, review the code comments or check the Supabase and Next.js documentation.
