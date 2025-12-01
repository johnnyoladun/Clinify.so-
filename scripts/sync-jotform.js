// Script to sync Jotform submissions to Supabase
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://uvkgbahaeeoiibxmqmua.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2a2diYWhhZWVvaWlieG1xbXVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzI2NjU2OCwiZXhwIjoyMDc4ODQyNTY4fQ.5NEMQWl2gn7tr5USFap4g16P3DELEJAXNm6x1t7NWq4'
const jotformApiKey = '198c160dbd9738d443d05b1b118f44b5'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Form ID to title mapping - ADD YOUR FORM IDs HERE
const FORM_TITLE_MAPPING = {
  // Example:
  // '123456789': 'SATIVA Hibiscus Cape Town',
  // '987654321': 'Bassani Johannesburg',
}

async function syncJotform(formId) {
  console.log(`🔄 Syncing Jotform ${formId}...\n`)

  try {
    // Fetch form details
    console.log('1️⃣ Fetching form details...')
    const formResponse = await fetch(
      `https://api.jotform.com/form/${formId}?apiKey=${jotformApiKey}`
    )

    if (!formResponse.ok) {
      throw new Error(`Failed to fetch form: ${formResponse.statusText}`)
    }

    const formData = await formResponse.json()
    const formTitle = FORM_TITLE_MAPPING[formId] || formData.content?.title || formId
    console.log(`✅ Form title: ${formTitle}`)

    // Fetch form submissions
    console.log('\n2️⃣ Fetching submissions...')
    const submissionsResponse = await fetch(
      `https://api.jotform.com/form/${formId}/submissions?apiKey=${jotformApiKey}&limit=1000`
    )

    if (!submissionsResponse.ok) {
      throw new Error(`Failed to fetch submissions: ${submissionsResponse.statusText}`)
    }

    const submissionsData = await submissionsResponse.json()
    const submissions = submissionsData.content || []
    console.log(`✅ Found ${submissions.length} submissions`)

    if (submissions.length === 0) {
      console.log('\n⚠️  No submissions to sync')
      return
    }

    // Process each submission
    console.log('\n3️⃣ Processing submissions...')
    let syncedCount = 0
    let errorCount = 0

    for (const submission of submissions) {
      try {
        const answers = submission.answers || {}

        // Extract patient information
        // NOTE: You'll need to adjust these field names based on your actual form
        const fullName =
          extractFullName(answers) ||
          extractFieldValue(answers, ['name', 'fullName', 'full_name', 'patient_name', 'patient']) ||
          'Unknown'

        const patientData = {
          patient_unique_id: submission.id,
          form_id: formId,
          form_title: formTitle,
          patient_full_name: fullName,
          patient_id_document_url: extractFileUrl(answers, ['id', 'id_document', 'idDocument', 'identification']),
          dr_script_url: extractFileUrl(answers, ['prescription', 'doctor_script', 'script', 'dr_script']),
          sahpra_invoice_url: extractFileUrl(answers, ['invoice', 'sahpra_invoice', 'sahpra']),
          outcome_letter_url: extractFileUrl(answers, ['outcome', 'outcome_letter', 'section21', 'letter']),
        }

        // Upsert to database
        const { error } = await supabase
          .from('section21_patients')
          .upsert(patientData, {
            onConflict: 'patient_unique_id'
          })

        if (error) {
          console.error(`❌ Error syncing ${patientData.patient_full_name || patientData.patient_unique_id}:`, error.message)
          errorCount++
        } else {
          console.log(`✅ Synced: ${patientData.patient_full_name || patientData.patient_unique_id}`)
          syncedCount++
        }
      } catch (err) {
        console.error(`❌ Error processing submission:`, err.message)
        errorCount++
      }
    }

    console.log(`\n📊 Sync complete!`)
    console.log(`✅ Synced: ${syncedCount}`)
    console.log(`❌ Errors: ${errorCount}`)

  } catch (error) {
    console.error('❌ Sync failed:', error.message)
  }
}

// Helper function to extract full name from answers
function extractFullName(answers) {
  for (const key in answers) {
    const a = answers[key]
    const ans = a?.answer
    if (a?.prettyFormat && typeof a.prettyFormat === 'string') return a.prettyFormat
    if (ans && typeof ans === 'object') {
      const first = ans.first || ans.firstname || ans.given || ans.name || ''
      const last = ans.last || ans.lastname || ans.surname || ''
      const middle = ans.middle || ''
      const parts = [first, middle, last].filter(Boolean)
      if (parts.length) return parts.join(' ').replace(/\s+/g, ' ').trim()
    }
  }
  return undefined
}

// Helper function to extract field values
function extractFieldValue(answers, possibleKeys) {
  for (const key in answers) {
    const answer = answers[key]
    const name = (answer.name || '').toLowerCase()
    const text = (answer.text || '').toLowerCase()

    for (const possibleKey of possibleKeys) {
      if (name.includes(possibleKey) || text.includes(possibleKey)) {
        return answer.answer || answer.prettyFormat || undefined
      }
    }
  }
  return undefined
}

// Helper function to extract file URLs
function extractFileUrl(answers, possibleKeys) {
  for (const key in answers) {
    const answer = answers[key]
    const name = (answer.name || '').toLowerCase()
    const text = (answer.text || '').toLowerCase()

    for (const possibleKey of possibleKeys) {
      if (name.includes(possibleKey) || text.includes(possibleKey)) {
        if (Array.isArray(answer.answer)) {
          return answer.answer[0] || undefined
        }
        if (typeof answer.answer === 'object' && answer.answer !== null) {
          const joined = Object.values(answer.answer).filter(Boolean).join(' ')
          if (joined) return joined
        }
        return answer.answer || answer.prettyFormat || undefined
      }
    }
  }
  return undefined
}

// Get form ID from command line
const formId = process.argv[2]

if (!formId) {
  console.log('❌ Please provide a form ID')
  console.log('\nUsage: node scripts/sync-jotform.js YOUR_FORM_ID')
  console.log('\nExample: node scripts/sync-jotform.js 123456789')
  process.exit(1)
}

syncJotform(formId)
