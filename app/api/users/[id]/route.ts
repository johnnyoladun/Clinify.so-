import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { authenticateRequest, requireAdmin } from '@/lib/middleware/auth'
import * as bcrypt from 'bcrypt'

// GET /api/users/[id] - Get single user
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
    const userId = params.id

    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('id, email, full_name, role, status, created_at, updated_at')
      .eq('id', userId)
      .single()

    if (dbError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: userData,
    })
  } catch (error) {
    console.error('Fetch user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user
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
    const { email, full_name, role, status, password } = body
    const supabase = createServerClient()
    const userId = params.id

    const updateData: any = {}
    
    if (email) updateData.email = email.toLowerCase()
    if (full_name) updateData.full_name = full_name
    if (role) updateData.role = role
    if (status) updateData.status = status
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10)
    }

    const { data: updatedUser, error: dbError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, email, full_name, role, status, created_at, updated_at')
      .single()

    if (dbError) {
      console.error('Failed to update user:', dbError)
      return NextResponse.json(
        { error: dbError.message || 'Failed to update user' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete user (hard delete)
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
    const userId = params.id

    const { error: dbError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (dbError) {
      console.error('Failed to delete user:', dbError)
      return NextResponse.json(
        { error: dbError.message || 'Failed to delete user' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
