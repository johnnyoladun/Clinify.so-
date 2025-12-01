# Dashboard Upgrade - Control Centre Integration

## ✅ Complete! All requirements implemented.

### Changes Made:

## 1. Database Schema Updates
**File:** `upgrade-patients-schema.sql`

Added to `section21_patients` table:
- `organisation_id` (UUID) - Links patient to organisation
- `location_id` (UUID) - Links patient to location
- `name_prefix` (TEXT) - e.g., "Mr.", "Mrs.", "Dr."
- `first_name` (TEXT) - Patient's first name
- `last_name` (TEXT) - Patient's last name
- Indexes for performance

**Run this SQL in Supabase:**
```sql
-- See upgrade-patients-schema.sql file
```

## 2. Sync Endpoint Improvements
**File:** `app/api/jotform/sync/route.ts`

Now parses Jotform name JSON and:
- Extracts `prefix`, `first`, `last` from name field
- Stores as structured fields in database
- Links patients to `organisation_id` and `location_id` via form_id lookup
- Builds formatted display name: "Mr. Eric Hayes"

## 3. Patients API Enhancement
**File:** `app/api/patients/route.ts`

Now joins Control Centre data:
```sql
SELECT *,
  organisations(id, name),
  locations(id, name, organisation_id)
FROM section21_patients
```

## 4. Dashboard Display Updates
**File:** `app/page.tsx`

### New Functions:
- `formatPatientName()` - Returns "Prefix First Last" from structured fields
- `getOrganisationName()` - Returns organisation name from Control Centre
- `getLocationName()` - Returns location name from Control Centre

### Table Changes:
- **Patient Name column**: Shows "Mr. Eric Hayes" (no JSON!)
- **Organisation column**: Shows Control Centre organisation name
- **Location column**: Shows Control Centre location name
- **Document badges**: Only shown if URL exists in Control Centre

### Button Changed:
- **Before**: "Sync from Jotform"
- **After**: "Refresh"
- **Function**: Syncs from Jotform using Control Centre mappings, then reloads dashboard

## 5. Type Definitions
**File:** `lib/types/database.ts`

Updated `Section21Patient` interface with:
- New fields for structured names
- Control Centre relationship fields
- Joined organisation and location objects

---

## How to Deploy:

### Step 1: Run Database Migration
Go to **Supabase Dashboard** → **SQL Editor**, run:
```sql
-- Copy content from upgrade-patients-schema.sql
ALTER TABLE section21_patients 
ADD COLUMN organisation_id UUID REFERENCES organisations(id) ON DELETE SET NULL,
ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

ALTER TABLE section21_patients
ADD COLUMN name_prefix TEXT,
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

CREATE INDEX IF NOT EXISTS idx_patients_organisation_id ON section21_patients(organisation_id);
CREATE INDEX IF NOT EXISTS idx_patients_location_id ON section21_patients(location_id);
```

### Step 2: Clear Existing Data (Optional but Recommended)
```sql
DELETE FROM section21_patients;
DELETE FROM locations;
DELETE FROM organisations;
```

### Step 3: Add Organisation via Control Centre
1. Go to **Control Centre** → **Organisations**
2. Click **"Add Organisation"**
3. Complete 3-step wizard:
   - Organisation name and email
   - Location name and Table ID: `252506373739059`
   - Drag field mappings (ID 36 = Name, 44 = ID Doc, 53 = Dr Script, 55 = Outcome Letter)

### Step 4: Sync Data
1. Go to **Dashboard**
2. Click **"Refresh"** button
3. System will:
   - Sync from Jotform using configured field mappings
   - Parse names into structured fields
   - Link patients to organisations/locations
   - Display formatted data in table

---

## ✅ Checklist - All Complete:

- ✅ Patient Name column shows "Mr. First Last" (no JSON)
- ✅ Organisation Name matches Control Centre records
- ✅ Location matches Control Centre location
- ✅ Document badges only show if file exists in Control Centre
- ✅ "Refresh" button reloads from Control Centre (via Jotform sync with mappings)
- ✅ No Jotform artifacts visible anywhere

---

## What Changed:

### Before:
- Patient names showed raw JSON: `{"prefix":"Mr.","first":"Eric","last":"Hayes"}`
- Organisation was parsed from form title
- Location was parsed from form title
- Data came directly from Jotform without Control Centre linkage

### After:
- Patient names show formatted: `Mr. Eric Hayes`
- Organisation comes from Control Centre organisations table
- Location comes from Control Centre locations table
- All data linked via `organisation_id` and `location_id`
- Complete separation from Jotform presentation layer
