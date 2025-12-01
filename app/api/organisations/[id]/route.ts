import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { authenticateRequest, requireAdmin } from '@/lib/middleware/auth'

// Exclude these form IDs from patient records
const EXCLUDED_FORM_IDS = [
  '252153201137544', // New Doctors Registration Form
  '252132329352551', // Green Health Product Order Form
  '252962661022555', // 420 Culture Patient Information Form ACME
  '252874785670068', // TEST Section 21 Form
]

// GET /api/organisations/[id] - Get single organisation with locations and patient counts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error

  const adminError = requireAdmin(user!)
  if (adminError) return adminError

  try {
    const supabase = createServerClient()
    const orgId = params.id

    // Fetch organisation with locations
    const { data: org, error: orgError } = await supabase
      .from('organisations')
      .select('id, name, owner_email, locations(id, name, form_id)')
      .eq('id', orgId)
      .single()

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      )
    }

    // Get patient counts per form_id
    const { data: patientCounts, error: countError } = await supabase
      .from('section21_patients')
      .select('form_id')
      .not('form_id', 'in', `(${EXCLUDED_FORM_IDS.join(',')})`)

    if (countError) {
      console.error('Failed to fetch patient counts:', countError)
    }

    // Count patients per form_id
    const formIdCounts = new Map<string, number>()
    patientCounts?.forEach((p) => {
      formIdCounts.set(p.form_id, (formIdCounts.get(p.form_id) || 0) + 1)
    })

    // Build locations with patient counts
    const locations = (org.locations || []).map((loc: any) => ({
      id: loc.id,
      name: loc.name,
      form_id: loc.form_id,
      patientCount: formIdCounts.get(loc.form_id) || 0,
    }))

    const totalPatients = locations.reduce((sum, loc) => sum + loc.patientCount, 0)

    return NextResponse.json({
      success: true,
      organisation: {
        id: org.id,
        name: org.name,
        owner_email: org.owner_email,
        locations,
        totalPatients,
      },
    })
  } catch (error) {
    console.error('Fetch organisation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/organisations/[id] - Update organisation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error

  const adminError = requireAdmin(user!)
  if (adminError) return adminError

  try {
    const { name, ownerEmail } = await request.json()
    const supabase = createServerClient()
    const orgId = params.id

    if (!name || !ownerEmail) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('organisations')
      .update({ name, owner_email: ownerEmail })
      .eq('id', orgId)

    if (updateError) {
      console.error('Failed to update organisation:', updateError)
      return NextResponse.json(
        { error: updateError.message || 'Failed to update organisation' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update organisation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/organisations/[id] - Delete organisation and all associated data
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error

  const adminError = requireAdmin(user!)
  if (adminError) return adminError

  try {
    const supabase = createServerClient()
    const orgId = params.id

    // Get all form_ids from locations before deleting
    const { data: locations } = await supabase
      .from('locations')
      .select('form_id')
      .eq('organisation_id', orgId)

    const formIds = (locations || []).map(loc => loc.form_id).filter(Boolean)

    // Delete all patient records for this organisation's forms
    if (formIds.length > 0) {
      const { error: patientsError } = await supabase
        .from('section21_patients')
        .delete()
        .in('form_id', formIds)

      if (patientsError) {
        console.error('Failed to delete patient records:', patientsError)
      }
    }

    // Delete the organisation (CASCADE will delete locations automatically)
    const { error: deleteError } = await supabase
      .from('organisations')
      .delete()
      .eq('id', orgId)

    if (deleteError) {
      console.error('Failed to delete organisation:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete organisation' },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Organisation and all associated data deleted successfully'
    })
  } catch (error) {
    console.error('Delete organisation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
