import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { authenticateRequest, requireAdmin } from '@/lib/middleware/auth'
import * as bcrypt from 'bcrypt'

// GET /api/users - List all users (Admin only)
export async function GET(request: NextRequest) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error

  const adminError = requireAdmin(user!)
  if (adminError) return adminError

  try {
    const supabase = createServerClient()
    
    const { data: users, error: dbError } = await supabase
      .from('users')
      .select('id, email, full_name, role, status, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (dbError) {
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, users: users })
  } catch (error) {
    console.error('Fetch users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create new user (Admin only)
export async function POST(request: NextRequest) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error

  const adminError = requireAdmin(user!)
  if (adminError) return adminError

  try {
    const body = await request.json()
    const { email, password, full_name, role } = body

    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: 'Email, password, full name, and role are required' },
        { status: 400 }
      )
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10)

    const supabase = createServerClient()

    const { data: newUser, error: dbError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash,
        full_name,
        role,
        status: 'active',
      })
      .select('id, email, full_name, role, status, created_at, updated_at')
      .single()

    if (dbError) {
      if (dbError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: newUser }, { status: 201 })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
