import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { authenticateRequest, requireAdmin } from '@/lib/middleware/auth'

// GET /api/gmps - List all GMPs
export async function GET(request: NextRequest) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error

  try {
    const supabase = createServerClient()
    
    const { data: gmps, error: dbError } = await supabase
      .from('gmps')
      .select('*')
      .order('gmp_name', { ascending: true })

    if (dbError) {
      return NextResponse.json(
        { error: 'Failed to fetch GMPs' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: gmps })
  } catch (error) {
    console.error('Fetch GMPs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/gmps - Create new GMP (Admin only)
export async function POST(request: NextRequest) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error

  const adminError = requireAdmin(user!)
  if (adminError) return adminError

  try {
    const body = await request.json()
    const { gmp_name, gmp_license_number } = body

    if (!gmp_name || !gmp_license_number) {
      return NextResponse.json(
        { error: 'GMP name and license number are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { data: gmp, error: dbError } = await supabase
      .from('gmps')
      .insert({
        gmp_name,
        gmp_license_number,
        status: 'active',
      })
      .select()
      .single()

    if (dbError) {
      return NextResponse.json(
        { error: 'Failed to create GMP' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: gmp }, { status: 201 })
  } catch (error) {
    console.error('Create GMP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
