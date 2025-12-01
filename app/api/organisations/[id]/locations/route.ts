import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { authenticateRequest, requireAdmin } from '@/lib/middleware/auth'

// POST /api/organisations/[id]/locations - Add new location
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error

  const adminError = requireAdmin(user!)
  if (adminError) return adminError

  try {
    const { name, tableId, formId, fieldMappings } = await request.json()
    const supabase = createServerClient()
    const orgId = params.id

    if (!name || !formId) {
      return NextResponse.json(
        { error: 'Name and form ID are required' },
        { status: 400 }
      )
    }

    const { error: insertError } = await supabase
      .from('locations')
      .insert({
        organisation_id: orgId,
        name,
        table_id: tableId || null,
        form_id: formId,
        field_mapping_patient_name: fieldMappings?.patientName || null,
        field_mapping_id_document: fieldMappings?.idDocument || null,
        field_mapping_dr_script: fieldMappings?.drScript || null,
        field_mapping_outcome_letters: fieldMappings?.outcomeLetters || null,
      })

    if (insertError) {
      console.error('Failed to add location:', insertError)
      return NextResponse.json(
        { error: insertError.message || 'Failed to add location' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Add location error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
