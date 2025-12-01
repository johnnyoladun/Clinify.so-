import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { authenticateRequest } from '@/lib/middleware/auth'

// Exclude these form IDs from patient records
const EXCLUDED_FORM_IDS = [
  '252153201137544', // New Doctors Registration Form
  '252132329352551', // Green Health Product Order Form
  '252962661022555', // 420 Culture Patient Information Form ACME
  '252874785670068', // TEST Section 21 Form
]

// GET /api/patients - List all Section 21 patients
export async function GET(request: NextRequest) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error

  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    
    const search = searchParams.get('search') || ''
    
    // Fetch configured locations (organisations dependency)
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('form_id')
      .limit(1000000)

    console.log('Locations fetch result:', { locations, locError })

    if (locError) {
      console.error('Failed to fetch locations:', locError)
      return NextResponse.json(
        { error: 'Failed to fetch locations: ' + locError.message },
        { status: 500 }
      )
    }

    const managedFormIds = (locations || []).map(l => l.form_id).filter(Boolean)
    console.log('Managed form IDs:', managedFormIds)

    // If there are no organisations/locations configured, return empty list
    if (!managedFormIds || managedFormIds.length === 0) {
      console.log('No organisations configured, returning empty list')
      return NextResponse.json({ 
        success: true, 
        data: [], 
        total: 0
      })
    }

    let query = supabase
      .from('section21_patients')
      .select(`
        *,
        gmps(gmp_name, gmp_license_number),
        organisations(id, name),
        locations(id, name, organisation_id)
      `, { count: 'exact' })
      .in('form_id', managedFormIds)

    // Exclude patients from non-patient forms
    query = query.not('form_id', 'in', `(${EXCLUDED_FORM_IDS.join(',')})`)

    // Filter by assigned GMPs if user is not admin
    if (user!.role !== 'admin' && user!.assigned_gmp_ids) {
      query = query.in('gmp_id', user!.assigned_gmp_ids)
    }

    // Search filter
    if (search) {
      query = query.or(`patient_full_name.ilike.%${search}%,patient_unique_id.ilike.%${search}%,form_title.ilike.%${search}%`)
    }

    // No pagination - fetch all records with explicit high limit
    // Supabase defaults to 1000, so we explicitly set a very high limit
    const { data: patients, error: dbError, count } = await query
      .order('created_at', { ascending: false })
      .limit(1000000)

    if (dbError) {
      return NextResponse.json(
        { error: 'Failed to fetch patients' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: patients,
      total: count || 0,
    })
  } catch (error) {
    console.error('Fetch patients error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
