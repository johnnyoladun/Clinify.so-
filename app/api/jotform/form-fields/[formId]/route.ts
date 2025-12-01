import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, requireAdmin } from '@/lib/middleware/auth'

// GET /api/jotform/form-fields/[formId] - Get form fields for mapping
export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error

  const adminError = requireAdmin(user!)
  if (adminError) return adminError

  try {
    const formId = params.formId
    const apiKey = process.env.JOTFORM_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Jotform API key not configured' },
        { status: 500 }
      )
    }

    // Fetch form questions from Jotform API
    const response = await fetch(
      `https://api.jotform.com/form/${formId}/questions?apiKey=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch form from Jotform. Check the Form ID.' },
        { status: 400 }
      )
    }

    const data = await response.json()
    const questions = data.content || {}

    // Convert questions object to array of fields
    const fields = Object.keys(questions)
      .map((key) => {
        const question = questions[key]
        return {
          id: key,
          name: question.name || '',
          text: question.text || question.name || `Field ${key}`,
          type: question.type || '',
          order: question.order || 0,
        }
      })
      .filter(field => {
        // Only filter out purely decorative/non-data elements
        const excludeTypes = ['control_head', 'control_button', 'control_pagebreak', 'control_divider', 'control_collapse']
        return !excludeTypes.includes(field.type)
      })
      .sort((a, b) => a.order - b.order) // Sort by form order

    return NextResponse.json({
      success: true,
      fields,
    })
  } catch (error) {
    console.error('Fetch form fields error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
