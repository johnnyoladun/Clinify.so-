import { NextRequest, NextResponse } from 'next/server'
import * as jwt from 'jsonwebtoken'
import { createServerClient } from '@/lib/supabase/server'
import { User } from '@/lib/types/database'

export interface AuthenticatedRequest extends NextRequest {
  user?: User
}

export async function authenticateRequest(
  request: NextRequest
): Promise<{ user: User | null; error: NextResponse | null }> {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Not authenticated' },
          { status: 401 }
        ),
      }
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string
      email: string
      role: string
    }

    const supabase = createServerClient()

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, status, assigned_gmp_ids, created_at, updated_at')
      .eq('id', decoded.userId)
      .eq('status', 'active')
      .single()

    if (error || !user) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        ),
      }
    }

    return { user: user as User, error: null }
  } catch (error) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      ),
    }
  }
}

export function requireAdmin(user: User): NextResponse | null {
  if (user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    )
  }
  return null
}
