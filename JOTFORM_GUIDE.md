# Jotform Integration Guide

## 🎉 Your Jotform is Connected!

Your Jotform API key (`198c160dbd9738d443d05b1b118f44b5`) is already configured in the system.

## 🚀 How to Sync Jotform Data

### Option 1: Via Admin UI (Recommended)

1. **Login to your dashboard** at `http://localhost:3000/login`
   - Email: `admin@clinify.com`
   - Password: `admin123`

2. **Click "Sync Jotform" button** on the main dashboard

3. **You'll see all your Jotform forms listed**

4. **Click "Sync Now"** on any form to import submissions

5. **Refresh the dashboard** to see the imported patient records

### Option 2: Via Command Line

```powershell
# Sync a specific form
node scripts/sync-jotform.js YOUR_FORM_ID

# Example:
node scripts/sync-jotform.js 123456789
```

## 📋 What Gets Synced

From each Jotform submission, the system extracts:

- **Patient Full Name** - from fields containing "name", "fullName", "patient_name"
- **Patient ID Document** - from fields containing "id", "id_document", "idDocument"
- **Doctor Script** - from fields containing "prescription", "doctor_script", "script"
- **SAHPRA Invoice** - from fields containing "invoice", "sahpra_invoice", "sahpra"
- **Outcome Letter** - from fields containing "outcome", "outcome_letter", "section21"
- **Form Title** - automatically detected from Jotform
- **Submission ID** - used as unique patient ID

## 🔧 Customizing Field Mapping

If your form fields have different names, edit:

**File:** `app/api/jotform/sync/route.ts`

**Lines 91-95:**
```typescript
patient_full_name: extractFieldValue(answers, ['name', 'fullName', 'full_name']),
patient_id_document_url: extractFileUrl(answers, ['id_document', 'idDocument']),
// Add your custom field names to these arrays
```

## 🗑️ Remove Sample Data

If you want to remove the 3 sample patient records:

```powershell
node scripts/remove-samples.js
```

## 📊 Viewing Your Data

1. Go to the main dashboard at `/`
2. All synced patients appear in the table
3. Click document links to view files
4. Form Title shows which Jotform the submission came from

## 🔄 Re-syncing Data

- You can sync the same form multiple times
- Existing patients (by unique ID) will be **updated**, not duplicated
- New submissions will be **added**

## ⚠️ Important Notes

### Field Detection
The system automatically searches for fields by name. If a field isn't detected:
1. Check the field name in your Jotform
2. Add the field name to the appropriate array in the sync route
3. Re-sync the form

### File URLs
- Jotform file upload fields return URLs
- These URLs are stored directly in the database
- Click the links in the dashboard to view files

### Form Titles
- Form titles are fetched from Jotform automatically
- You can customize titles by editing `FORM_TITLE_MAPPING` in:
  - `app/api/jotform/sync/route.ts` (API route)
  - `scripts/sync-jotform.js` (CLI script)

## 🎯 Next Steps

1. **Remove sample data** (optional):
   ```powershell
   node scripts/remove-samples.js
   ```

2. **Sync your real Jotform**:
   - Go to `http://localhost:3000/admin/jotform`
   - Click "Sync Now" on your form

3. **View patient records**:
   - Go back to main dashboard
   - See all imported records

## 🛠️ Troubleshooting

### No Forms Showing Up
- Check that JOTFORM_API_KEY is correct in `.env.local`
- Verify you have forms in your Jotform account

### Fields Not Extracted
- Open browser DevTools > Console
- Look for extraction errors
- Add your field names to the arrays in sync route

### API Errors
- Check Jotform API limits (might need to upgrade plan)
- Verify form ID is correct
- Check form is not deleted or archived

## 📝 Manual Sync via API

You can also call the sync API directly:

```powershell
# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/jotform/sync" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"form_id":"YOUR_FORM_ID"}' `
  -Headers @{Cookie="auth-token=YOUR_TOKEN"}
```

## ✨ You're All Set!

Your Jotform is fully integrated! Just:
1. Go to `/admin/jotform`
2. Click "Sync Now" on your forms
3. Watch the data flow into your dashboard

🎉 Happy syncing!
