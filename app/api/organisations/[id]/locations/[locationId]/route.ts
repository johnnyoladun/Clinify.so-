import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { authenticateRequest, requireAdmin } from '@/lib/middleware/auth'

// DELETE /api/organisations/[id]/locations/[locationId] - Delete location
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; locationId: string } }
) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error

  const adminError = requireAdmin(user!)
  if (adminError) return adminError

  try {
    const supabase = createServerClient()
    const { id: orgId, locationId } = params

    const { error: deleteError } = await supabase
      .from('locations')
      .delete()
      .eq('id', locationId)
      .eq('organisation_id', orgId)

    if (deleteError) {
      console.error('Failed to delete location:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete location' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete location error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
