import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { authenticateRequest, requireAdmin } from '@/lib/middleware/auth'
import { cookies } from 'next/headers'

// Exclude these form IDs from patient records
const EXCLUDED_FORM_IDS = [
  '252153201137544', // New Doctors Registration Form
  '252132329352551', // Green Health Product Order Form
  '252962661022555', // 420 Culture Patient Information Form ACME
  '252874785670068', // TEST Section 21 Form
]

interface OrganisationStats {
  id: string
  organisation: string
  ownerEmail: string
  locations: {
    location: string
    patientCount: number
    formId: string
  }[]
  totalPatients: number
}

// GET /api/organisations - Get all organisations with their locations and patient counts
export async function GET(request: NextRequest) {
  console.log('GET /api/organisations called')
  
  const { user, error } = await authenticateRequest(request)
  if (error) {
    console.error('Auth error:', error)
    return error
  }

  console.log('User authenticated:', user?.email, 'Role:', user?.role)
  // Note: Regular users can view organisations (no admin check here)

  try {
    const supabase = createServerClient()
    console.log('Supabase client created')

    // Fetch organisations with their locations from database only
    console.log('Fetching organisations...')
    const { data: orgs, error: orgError } = await supabase
      .from('organisations')
      .select('id, name, owner_email, locations(id, name, form_id)')
      .order('name')
      .limit(1000000)

    if (orgError) {
      console.error('Database error fetching organisations:', orgError)
      console.error('Error details:', JSON.stringify(orgError, null, 2))
      return NextResponse.json(
        { error: 'Failed to fetch organisations', details: orgError.message },
        { status: 500 }
      )
    }

    console.log('Organisations fetched:', orgs?.length || 0)

    // If no organisations in database, return empty list
    if (!orgs || orgs.length === 0) {
      return NextResponse.json({
        success: true,
        organisations: [],
      })
    }

    // Get all form_ids from locations
    const allFormIds = orgs.flatMap((org: any) => 
      (org.locations || []).map((loc: any) => loc.form_id)
    ).filter(Boolean)

    // Get patient counts only for managed form_ids
    let patientCounts: any[] = []
    if (allFormIds.length > 0) {
      const { data, error: countError } = await supabase
        .from('section21_patients')
        .select('form_id')
        .in('form_id', allFormIds)
        .not('form_id', 'in', `(${EXCLUDED_FORM_IDS.join(',')})`)
        .limit(1000000)

      if (countError) {
        console.error('Database error:', countError)
      } else {
        patientCounts = data || []
      }
    }

    // Count patients per form_id
    const formIdCounts = new Map<string, number>()
    patientCounts.forEach((p) => {
      formIdCounts.set(p.form_id, (formIdCounts.get(p.form_id) || 0) + 1)
    })

    // Build organisation stats
    const organisations: OrganisationStats[] = []

    for (const org of orgs) {
      const locationArray: { location: string; patientCount: number; formTitle: string }[] = []
      let totalPatients = 0

      // Only include locations that have form_id
      const locations = org.locations || []
      for (const loc of locations) {
        if (loc.form_id) {
          const count = formIdCounts.get(loc.form_id) || 0
          locationArray.push({
            location: loc.name,
            patientCount: count,
            formId: loc.form_id,
          })
          totalPatients = totalPatients + count
        }
      }

      // Only include organisation if it has locations
      if (locationArray.length > 0) {
        // Sort locations by patient count descending
        locationArray.sort((a, b) => b.patientCount - a.patientCount)

        organisations.push({
          id: org.id,
          organisation: org.name,
          ownerEmail: org.owner_email,
          locations: locationArray,
          totalPatients: totalPatients,
        })
      }
    }

    // Sort organisations by total patients descending
    organisations.sort((a, b) => b.totalPatients - a.totalPatients)

    return NextResponse.json({
      success: true,
      organisations,
    })
  } catch (error) {
    console.error('Organisations fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/organisations - Create new organisation with locations
export async function POST(request: NextRequest) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error

  const adminError = requireAdmin(user!)
  if (adminError) return adminError

  try {
    const { name, ownerEmail, locations } = await request.json()

    if (!name || !ownerEmail || !locations || locations.length === 0) {
      return NextResponse.json(
        { error: 'Name, email, and at least one location are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Create organisation
    const { data: org, error: orgError } = await supabase
      .from('organisations')
      .insert({ name, owner_email: ownerEmail })
      .select()
      .single()

    if (orgError) {
      console.error('Failed to create organisation:', orgError)
      return NextResponse.json(
        { error: orgError.message || 'Failed to create organisation' },
        { status: 400 }
      )
    }

    // Create locations
    const locationData = locations.map((loc: any) => {
      console.log('Processing location:', JSON.stringify(loc, null, 2))
      return {
        organisation_id: org.id,
        name: loc.name,
        table_id: loc.tableId || null,
        form_id: loc.formId || null,
        field_mapping_patient_name: loc.fieldMappings?.patientName || null,
        field_mapping_id_document: loc.fieldMappings?.idDocument || null,
        field_mapping_dr_script: loc.fieldMappings?.drScript || null,
        field_mapping_outcome_letters: loc.fieldMappings?.outcomeLetters || null,
      }
    })

    const { error: locError } = await supabase
      .from('locations')
      .insert(locationData)

    if (locError) {
      console.error('Failed to create locations:', locError)
      // Rollback: delete the organisation
      await supabase.from('organisations').delete().eq('id', org.id)
      return NextResponse.json(
        { error: locError.message || 'Failed to create locations' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      organisation: org,
    })
  } catch (error) {
    console.error('Create organisation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to parse form title into organisation and location
function parseFormTitle(formTitle: string): { organisation: string; location: string } {
  const match = formTitle.match(/^(.+?)\s*["'](.+?)["']\s*-/)
  if (match) {
    return {
      organisation: match[1].trim(),
      location: match[2].trim()
    }
  }
  // Fallback: use full title as organisation
  return { organisation: formTitle, location: '-' }
}
