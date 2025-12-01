import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, requireAdmin } from '@/lib/middleware/auth'

// GET /api/jotform/table-fields/[tableId] - Get table columns for mapping
export async function GET(
  request: NextRequest,
  { params }: { params: { tableId: string } }
) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error

  const adminError = requireAdmin(user!)
  if (adminError) return adminError

  try {
    const tableId = params.tableId
    const apiKey = process.env.JOTFORM_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Jotform API key not configured' },
        { status: 500 }
      )
    }

    // Fetch the table/report to get the form ID and columns
    console.log(`Fetching table with ID: ${tableId}`)
    const reportResponse = await fetch(
      `https://api.jotform.com/report/${tableId}?apiKey=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!reportResponse.ok) {
      const errorText = await reportResponse.text()
      console.error('Table fetch error:', reportResponse.status, errorText)
      
      // If report endpoint fails, this might actually be a form ID
      // Try fetching as a form directly
      console.log('Trying as form ID instead...')
      const formResponse = await fetch(
        `https://api.jotform.com/form/${tableId}/questions?apiKey=${apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      
      if (!formResponse.ok) {
        return NextResponse.json(
          { error: `Failed to fetch from Jotform. Status: ${reportResponse.status}. The ID might be invalid or you may need to use the Form ID instead of Table ID.` },
          { status: 400 }
        )
      }
      
      // If form fetch succeeded, get a submission to see actual table columns
      console.log('Fetching submissions to get table columns...')
      const submissionsResponse = await fetch(
        `https://api.jotform.com/form/${tableId}/submissions?limit=1&apiKey=${apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      
      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json()
        const submissions = submissionsData.content || []
        
        if (submissions.length > 0) {
          // Get all column keys from the first submission's answers
          const firstSubmission = submissions[0]
          const answers = firstSubmission.answers || {}
          
          console.log('Found answers keys:', Object.keys(answers))
          
          // Convert answers to field list
          const tableFields = Object.entries(answers)
            .map(([key, answer]: [string, any]) => {
              return {
                id: key,
                name: answer.name || '',
                text: answer.text || answer.name || `Column ${key}`,
                type: answer.type || 'control_textbox',
                order: parseInt(answer.order) || 0,
              }
            })
            .filter(field => {
              const excludeTypes = ['control_head', 'control_button', 'control_pagebreak', 'control_divider', 'control_collapse']
              return !excludeTypes.includes(field.type)
            })
            .sort((a, b) => a.order - b.order)
          
          console.log('Table columns found:', tableFields.length)
          console.log('Column names:', tableFields.map(f => f.text).join(', '))
          
          return NextResponse.json({
            success: true,
            formId: tableId,
            fields: tableFields,
          })
        }
      }
      
      // Fallback to form questions if no submissions
      const formData = await formResponse.json()
      const questions = formData.content || {}
      
      const formFields = Object.keys(questions)
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
          const excludeTypes = ['control_head', 'control_button', 'control_pagebreak', 'control_divider', 'control_collapse']
          return !excludeTypes.includes(field.type)
        })
        .sort((a, b) => a.order - b.order)
      
      return NextResponse.json({
        success: true,
        formId: tableId,
        fields: formFields,
      })
    }

    const reportData = await reportResponse.json()
    console.log('Report data received, keys:', Object.keys(reportData))
    
    const content = reportData.content || {}
    console.log('Content keys:', Object.keys(content))
    
    // Extract form ID from the table/report
    const formId = content.form_id || content.formID || ''
    console.log('Extracted form ID from table:', formId)
    
    // Get the table columns from list_properties - these are the ACTUAL table columns
    const listProperties = content.list_properties || {}
    console.log('List properties keys:', Object.keys(listProperties))
    console.log('Number of columns in table:', Object.keys(listProperties).length)
    
    // Convert table columns to field array
    const finalFields = Object.entries(listProperties)
      .map(([key, prop]: [string, any]) => {
        console.log(`Column ${key}:`, prop.text || prop.label || prop.name)
        return {
          id: key,
          name: prop.name || '',
          text: prop.text || prop.label || prop.name || `Column ${key}`,
          type: prop.type || 'control_textbox',
          order: parseInt(prop.order) || 0,
        }
      })
      .sort((a, b) => a.order - b.order)
    
    console.log(`Found ${finalFields.length} columns from table`)
    console.log('Column names:', finalFields.map(f => f.text).join(', '))
    
    if (finalFields.length === 0) {
      return NextResponse.json(
        { error: 'No columns found in table. The table may be empty or misconfigured.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      formId, // Return the form ID for syncing purposes
      fields: finalFields,
    })
  } catch (error) {
    console.error('Fetch table fields error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
