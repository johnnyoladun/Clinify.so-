import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { authenticateRequest, requireAdmin } from '@/lib/middleware/auth'

// Form ID to title mapping
const FORM_TITLE_MAPPING: { [key: string]: string } = {
  // Add your form IDs and their titles here
  // Example:
  // '123456789': 'SATIVA Hibiscus',
  // '987654321': 'Bassani Cape Town',
}

// POST /api/jotform/sync - Sync Jotform submissions to Supabase (Admin only)
export async function POST(request: NextRequest) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error

  const adminError = requireAdmin(user!)
  if (adminError) return adminError

  try {
    const { form_id } = await request.json()

    if (!form_id) {
      return NextResponse.json(
        { error: 'Form ID is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.JOTFORM_API_KEY!

    // Fetch form submissions from Jotform API
    const jotformResponse = await fetch(
      `https://api.jotform.com/form/${form_id}/submissions?apiKey=${apiKey}&limit=1000`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!jotformResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch Jotform submissions' },
        { status: 500 }
      )
    }

    const jotformData = await jotformResponse.json()
    const submissions = jotformData.content || []

    // Get form title from mapping or fetch from API
    let formTitle = FORM_TITLE_MAPPING[form_id]
    
    if (!formTitle) {
      const formResponse = await fetch(
        `https://api.jotform.com/form/${form_id}?apiKey=${apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      
      if (formResponse.ok) {
        const formData = await formResponse.json()
        formTitle = formData.content?.title || form_id
      } else {
        formTitle = form_id
      }
    }

    const supabase = createServerClient()
    
    // Fetch location with organisation data
    const { data: location, error: locError } = await supabase
      .from('locations')
      .select('id, organisation_id, name, field_mapping_patient_name, field_mapping_id_document, field_mapping_dr_script, field_mapping_outcome_letters')
      .eq('form_id', form_id)
      .single()

    if (locError) {
      console.warn('No field mappings found for form', form_id, '- using fallback logic')
    }

    const fieldMappings = location ? {
      patientName: location.field_mapping_patient_name,
      idDocument: location.field_mapping_id_document,
      drScript: location.field_mapping_dr_script,
      outcomeLetters: location.field_mapping_outcome_letters,
    } : null

    console.log('Field mappings for form', form_id, ':', fieldMappings)
    
    let syncedCount = 0
    let errors = 0

    // Process each submission
    for (const submission of submissions) {
      try {
        const answers = submission.answers || {}

        // Extract patient name using field mapping or fallback
        let fullName = 'Unknown'
        let namePrefix = ''
        let firstName = ''
        let lastName = ''
        
        if (fieldMappings?.patientName && answers[fieldMappings.patientName]) {
          const nameAnswer = answers[fieldMappings.patientName]
          const nameData = nameAnswer.answer
          
          // Parse name from Jotform JSON structure
          if (typeof nameData === 'object' && nameData !== null) {
            namePrefix = nameData.prefix || ''
            firstName = nameData.first || nameData.firstname || ''
            lastName = nameData.last || nameData.lastname || ''
            
            // Build full name
            const parts = [namePrefix, firstName, lastName].filter(Boolean)
            fullName = parts.join(' ')
          } else if (nameAnswer.prettyFormat) {
            fullName = nameAnswer.prettyFormat
            // Try to parse prettyFormat (usually "First Last")
            const parts = fullName.split(' ')
            if (parts.length >= 2) {
              firstName = parts[0]
              lastName = parts.slice(1).join(' ')
            }
          } else {
            fullName = String(nameData || 'Unknown')
          }
        } else {
          fullName = extractFullName(answers) || extractFieldValue(answers, ['name', 'fullName', 'full_name', 'patient_name', 'patient']) || 'Unknown'
        }

        // Extract URLs using field mappings or fallback
        let idDocUrl = null
        let drScriptUrl = null
        let outcomeLetterUrl = null

        if (fieldMappings) {
          // Use configured field mappings
          if (fieldMappings.idDocument && answers[fieldMappings.idDocument]) {
            idDocUrl = extractFileUrlFromAnswer(answers[fieldMappings.idDocument])
          }
          if (fieldMappings.drScript && answers[fieldMappings.drScript]) {
            drScriptUrl = extractFileUrlFromAnswer(answers[fieldMappings.drScript])
          }
          if (fieldMappings.outcomeLetters && answers[fieldMappings.outcomeLetters]) {
            outcomeLetterUrl = extractFileUrlFromAnswer(answers[fieldMappings.outcomeLetters])
          }
        } else {
          // Fallback to keyword search
          idDocUrl = extractFileUrl(answers, ['id', 'id_document', 'idDocument', 'identification'])
          drScriptUrl = extractFileUrl(answers, ['prescription', 'doctor_script', 'script', 'dr_script', 'doctors', 'dr', 'medical'])
          outcomeLetterUrl = extractFileUrl(answers, ['outcome_letter', 'section21', 'outcome', 'letter', 'section_21', 'section 21'])
        }

        // Extract patient information from form fields
        const patientData = {
          patient_unique_id: submission.id,
          form_id: form_id,
          form_title: formTitle,
          patient_full_name: fullName,
          // Structured name fields
          name_prefix: namePrefix || null,
          first_name: firstName || null,
          last_name: lastName || null,
          // Control Centre links
          organisation_id: location?.organisation_id || null,
          location_id: location?.id || null,
          // Document URLs
          patient_id_document_url: idDocUrl,
          dr_script_url: drScriptUrl,
          sahpra_invoice_url: extractFileUrl(answers, ['invoice', 'sahpra_invoice', 'sahpra']),
          outcome_letter_url: outcomeLetterUrl,
          gmp_id: null,
        }

        // Debug logging for first submission to see field structure
        // Debug logging for first submission to see field structure
        if (syncedCount === 0) {
          console.log('=== FIRST SUBMISSION DEBUG ===')
          console.log('Submission ID:', submission.id)
          console.log('Available fields:')
          Object.keys(answers).forEach(key => {
            const answer = answers[key]
            console.log(`  Field: ${answer.name || 'N/A'} | Text: ${answer.text || 'N/A'} | Type: ${answer.type || 'N/A'}`)
          })
          console.log('Extracted data:', patientData)
          console.log('===========================')
        }

        // Upsert patient record
        const { error: upsertError } = await supabase
          .from('section21_patients')
          .upsert(patientData, {
            onConflict: 'patient_unique_id',
            ignoreDuplicates: false,
          })

        if (upsertError) {
          console.error('Error upserting patient:', upsertError)
          errors++
        } else {
          syncedCount++
        }
      } catch (err) {
        console.error('Error processing submission:', err)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} records, ${errors} errors`,
      synced: syncedCount,
      errors: errors,
    })
  } catch (error) {
    console.error('Jotform sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to extract a full name from common Jotform full name fields
function extractFullName(answers: any): string | undefined {
  for (const key in answers) {
    const a = answers[key]
    const ans = a?.answer
    // If prettyFormat exists, that's usually "First Last"
    if (a?.prettyFormat && typeof a.prettyFormat === 'string') return a.prettyFormat
    // Full name components
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

// Helper function to extract field values from Jotform answers
function extractFieldValue(answers: any, possibleKeys: string[]): string | undefined {
  for (const key in answers) {
    const answer = answers[key]
    const name = answer.name?.toLowerCase() || ''
    const text = answer.text?.toLowerCase() || ''

    for (const possibleKey of possibleKeys) {
      if (name.includes(possibleKey) || text.includes(possibleKey)) {
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

// Helper function to extract file URLs from Jotform answers
function extractFileUrl(answers: any, possibleKeys: string[]): string | undefined {
  for (const key in answers) {
    const answer = answers[key]
    const name = answer.name?.toLowerCase() || ''
    const text = answer.text?.toLowerCase() || ''

    for (const possibleKey of possibleKeys) {
      if (name.includes(possibleKey) || text.includes(possibleKey)) {
        if (Array.isArray(answer.answer)) {
          return answer.answer[0] || undefined
        }
        return answer.answer || undefined
      }
    }
  }
  return undefined
}

// Helper function to extract file URL from a specific answer object
function extractFileUrlFromAnswer(answer: any): string | null {
  if (!answer) return null
  if (Array.isArray(answer.answer)) {
    return answer.answer[0] || null
  }
  return answer.answer || null
}
