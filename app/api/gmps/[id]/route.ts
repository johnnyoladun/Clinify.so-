import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { authenticateRequest, requireAdmin } from '@/lib/middleware/auth'

// PUT /api/gmps/[id] - Update GMP (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error

  const adminError = requireAdmin(user!)
  if (adminError) return adminError

  try {
    const body = await request.json()
    const { gmp_name, gmp_license_number, status } = body

    const supabase = createServerClient()

    const updateData: any = { updated_at: new Date().toISOString() }
    if (gmp_name) updateData.gmp_name = gmp_name
    if (gmp_license_number) updateData.gmp_license_number = gmp_license_number
    if (status) updateData.status = status

    const { data: gmp, error: dbError } = await supabase
      .from('gmps')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (dbError) {
      return NextResponse.json(
        { error: 'Failed to update GMP' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: gmp })
  } catch (error) {
    console.error('Update GMP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/gmps/[id] - Delete GMP (Admin only)
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

    const { error: dbError } = await supabase
      .from('gmps')
      .delete()
      .eq('id', params.id)

    if (dbError) {
      return NextResponse.json(
        { error: 'Failed to delete GMP' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete GMP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
