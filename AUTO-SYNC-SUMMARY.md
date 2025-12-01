# Automatic Sync Implementation ✅

## What Changed:

### 1. ✅ Auto-sync After Adding Organisation
**File:** `components/add-organisation-modal.tsx`

When you complete the 3-step wizard and click "Create Organisation":
- Organisation and location are created in Control Centre
- **Immediately triggers Jotform sync** for that form
- No manual refresh needed!

### 2. ✅ Auto-sync Every 5 Minutes
**File:** `app/page.tsx`

Dashboard now automatically syncs in the background:
- Syncs **every 5 minutes** while dashboard is open
- Pulls latest data from Jotform using Control Centre field mappings
- Updates patient records automatically

### 3. ✅ Removed Manual Refresh Button
The manual "Refresh" button has been removed - everything is automatic now!

### 4. ✅ Dynamic Form ID Detection
**Files:** `app/api/organisations/route.ts`, `app/page.tsx`

Sync now intelligently:
- Fetches all organisations from Control Centre
- Gets all `form_id` values from each location
- Syncs ALL configured forms automatically
- No hardcoding needed

---

## How It Works:

### Timeline:

```
┌─────────────────────────────────────────────────────────────────┐
│ USER ADDS ORGANISATION VIA WIZARD                               │
│ ↓                                                               │
│ Step 1: Enter org name + email                                 │
│ Step 2: Enter location name + Table ID                         │
│ Step 3: Map fields with drag-and-drop                          │
│ Click "Create Organisation"                                     │
│ ↓                                                               │
│ ✅ Organisation created in database                             │
│ ✅ Location created with field mappings                         │
│ ✅ **AUTO-SYNC TRIGGERED IMMEDIATELY**                          │
│ ↓                                                               │
│ • Fetches submissions from Jotform                             │
│ • Parses names into structured fields                          │
│ • Links patients to organisation/location                      │
│ • Saves to database                                            │
│ ↓                                                               │
│ Dashboard refreshes automatically                              │
│ Patient data appears instantly!                                │
└─────────────────────────────────────────────────────────────────┘

Then every 5 minutes:
┌─────────────────────────────────────────────────────────────────┐
│ BACKGROUND AUTO-SYNC                                            │
│ ↓                                                               │
│ • Fetches all organisations from Control Centre                │
│ • Gets all form_ids from locations                             │
│ • Syncs each form from Jotform                                 │
│ • Updates any new/changed patient data                         │
│ • Dashboard shows latest data                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Details:

### Sync Function (`syncFromJotform`)
```typescript
1. Fetch organisations from Control Centre
2. Extract all form_ids from locations
3. For each form_id:
   - POST /api/jotform/sync with form_id
   - Sync endpoint uses field mappings from database
   - Parses names, links to org/location
   - Saves to section21_patients table
4. Refresh dashboard to show new data
```

### Auto-sync Interval
```typescript
useEffect(() => {
  // Initial load
  fetchPatients()
  
  // Set up 5-minute interval
  const syncInterval = setInterval(() => {
    syncFromJotform()
  }, 5 * 60 * 1000) // 300,000ms = 5 minutes
  
  // Cleanup on unmount
  return () => clearInterval(syncInterval)
}, [user])
```

---

## What You'll See:

### When Adding Organisation:
1. Complete wizard
2. Click "Create Organisation"
3. Terminal shows:
   ```
   Organisation created, triggering sync...
   Syncing form: 252506373739059
   Field mappings for form...
   Synced X records from form 252506373739059
   Initial sync completed
   ```
4. Dashboard automatically shows patients!

### Every 5 Minutes:
Terminal shows:
```
Auto-sync triggered (5 min interval)
Syncing forms: ['252506373739059', ...]
Synced X records from form 252506373739059
```

---

## Benefits:

✅ **No manual intervention** - Set it and forget it
✅ **Always up-to-date** - Data refreshes automatically
✅ **Immediate feedback** - See data right after adding organisation
✅ **Scalable** - Automatically syncs ALL configured forms
✅ **Control Centre driven** - Uses your field mappings

---

## Console Logs to Watch:

When adding organisation:
- `Organisation created, triggering sync...`
- `Syncing form: [form_id]`
- `Initial sync completed`

Every 5 minutes:
- `Auto-sync triggered (5 min interval)`
- `Syncing forms: [...]`
- `Synced X records from form Y`

If sync fails:
- `Sync failed for form X: [error]`
- Check terminal for details
