# Query Limits Update - Complete Documentation

## 🎯 Overview

All Supabase queries have been updated to use `.limit(1000000)` to match your Supabase max rows configuration.

---

## ✅ Updated Queries

### **1. Organisations API**
**File:** `app/api/organisations/route.ts`

#### Query 1: Fetch Organisations with Locations
```typescript
// Line 45-49
const { data: orgs, error: orgError } = await supabase
  .from('organisations')
  .select('id, name, owner_email, locations(id, name, form_id)')
  .order('name')
  .limit(1000000) // ✅ Updated from 100000
```

#### Query 2: Fetch Patient Counts
```typescript
// Line 78-83
const { data, error: countError } = await supabase
  .from('section21_patients')
  .select('form_id')
  .in('form_id', allFormIds)
  .not('form_id', 'in', `(${EXCLUDED_FORM_IDS.join(',')})`)
  .limit(1000000) // ✅ Updated from 1000000000
```

---

### **2. Patients API**
**File:** `app/api/patients/route.ts`

#### Query 1: Fetch Locations
```typescript
// Line 25-28
const { data: locations, error: locError } = await supabase
  .from('locations')
  .select('form_id')
  .limit(1000000) // ✅ Updated from 10000000000000000000
```

#### Query 2: Fetch Patients
```typescript
// Line 78-80
const { data: patients, error: dbError, count } = await query
  .order('created_at', { ascending: false })
  .limit(1000000) // ✅ Updated from 1000000000
```

---

## 📊 Summary Table

| Query | File | Line | Old Limit | New Limit | Purpose |
|-------|------|------|-----------|-----------|---------|
| Organisations + Locations | `app/api/organisations/route.ts` | 49 | `100000` | `1000000` | Fetch all orgs with locations |
| Patient Counts | `app/api/organisations/route.ts` | 83 | `1000000000` | `1000000` | Count patients per org |
| Locations (Patients API) | `app/api/patients/route.ts` | 28 | `10000000000000000000` | `1000000` | Fetch all form_ids |
| Patients Main Query | `app/api/patients/route.ts` | 80 | `1000000000` | `1000000` | Fetch all patients |

---

## 🔧 Supabase Configuration

Your Supabase instance is configured with:
```
Max rows: 1,000,000
```

This means ALL queries can return up to **1 million rows** per request.

---

## ✅ What This Achieves

### Before:
- Inconsistent limits across queries
- Some queries using excessive limits (10000000000000000000)
- Potential confusion about actual capacity

### After:
- **Consistent** `.limit(1000000)` across all queries
- Matches Supabase max rows setting exactly
- Clear, maintainable codebase
- Full capacity utilization (up to 1M records per query)

---

## 🚀 System Capacity

With these limits, your system can handle:

| Resource | Maximum |
|----------|---------|
| Organisations | 1,000,000 |
| Locations | 1,000,000 |
| Patients | 1,000,000 |
| Patient counts query | 1,000,000 |

**Note:** The old 1,000-patient cap from Supabase's default limit is completely eliminated.

---

## 🔍 Verification Commands

### Check Query Execution
```bash
# Watch server logs for these messages:
- "Organisations fetched: X"
- "Patients received: Y"
- "Locations fetch result: {...}"

# All should show actual counts, not capped at 1,000
```

### SQL Verification (Supabase SQL Editor)
```sql
-- Verify total counts match system display
SELECT 
  'Organisations' as resource,
  COUNT(*) as count
FROM organisations

UNION ALL

SELECT 
  'Locations' as resource,
  COUNT(*) as count
FROM locations

UNION ALL

SELECT 
  'Patients' as resource,
  COUNT(*) as count
FROM section21_patients;
```

---

## 📝 Performance Notes

### Current Setup (Single Query)
- ✅ **Fast** for < 50,000 records
- ⚠️ **Acceptable** for 50,000 - 200,000 records
- ❌ **May need optimization** for 200,000+ records

### If Performance Issues Arise

#### Option 1: Server-Side Pagination
```typescript
// Implement pagination for large datasets
const { data, count } = await query
  .range(offset, offset + batchSize - 1)
```

#### Option 2: Database Aggregation
```sql
-- Use SQL functions for counts instead of fetching all rows
CREATE OR REPLACE FUNCTION get_patient_counts_by_org()
RETURNS TABLE(org_id UUID, org_name TEXT, patient_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    COUNT(DISTINCT p.id) as patient_count
  FROM organisations o
  LEFT JOIN locations l ON l.organisation_id = o.id
  LEFT JOIN section21_patients p ON p.form_id = l.form_id
  GROUP BY o.id, o.name;
END;
$$ LANGUAGE plpgsql;
```

---

## ✅ Checklist - All Complete

- [x] Organisations query updated to 1,000,000
- [x] Patient counts query updated to 1,000,000
- [x] Locations query updated to 1,000,000
- [x] Patients query updated to 1,000,000
- [x] All limits consistent across codebase
- [x] Matches Supabase max rows configuration
- [x] Documentation created

---

## 🎯 Result

**Your system is now configured to handle up to 1,000,000 records across all queries, with consistent limits matching your Supabase configuration.**

No more hidden caps. No more inconsistent limits. Full capacity available. ✅
