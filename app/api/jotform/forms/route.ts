import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'

// Exclude these form IDs from the system
const EXCLUDED_FORM_IDS = [
  '252153201137544', // New Doctors Registration Form
  '252132329352551', // Green Health Product Order Form
  '252962661022555', // 420 Culture Patient Information Form ACME
  '252874785670068', // TEST Section 21 Form
]

export async function GET(request: NextRequest) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error
  try {
    const apiKey = process.env.JOTFORM_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing JOTFORM_API_KEY' }, { status: 500 })
    }

    const res = await fetch(`https://api.jotform.com/user/forms?apiKey=${apiKey}`)
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch forms from Jotform' }, { status: 502 })
    }

    const data = await res.json()
    const allForms = data?.content || []
    // Filter out excluded forms
    const filteredForms = allForms
      .filter((f: any) => !EXCLUDED_FORM_IDS.includes(String(f.id)))
      .map((f: any) => ({ id: String(f.id), title: f.title }))
    return NextResponse.json({ success: true, forms: filteredForms })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
