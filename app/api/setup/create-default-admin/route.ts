import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import * as bcrypt from 'bcrypt'

// POST /api/setup/create-default-admin
// Creates a default admin user ONLY if the users table is empty
export async function POST() {
  try {
    const supabase = createServerClient()

    // Check if any user exists
    const { count, error: countError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })

    if (countError) {
      return NextResponse.json({ error: 'Failed to query users table' }, { status: 500 })
    }

    if ((count ?? 0) > 0) {
      return NextResponse.json({
        success: false,
        message: 'Users already exist. Bootstrap skipped.'
      }, { status: 409 })
    }

    // Create default admin with password "admin123"
    const password_hash = await bcrypt.hash('admin123', 10)

    const { data: user, error: insertError } = await supabase
      .from('users')
      .insert({
        email: 'admin@clinify.com',
        password_hash,
        full_name: 'System Administrator',
        role: 'admin',
        status: 'active',
      })
      .select('id, email, full_name, role, status, created_at')
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 })
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
