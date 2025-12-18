import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { Section21Patient } from '@/lib/types/database'

export async function GET() {
  try {
    const supabase = createServerClient()

    // 🔐 CRITICAL: Fetch ONLY patients with ALL 3 required documents
    // This ensures no incomplete patient data is exported
    const { data: patients, error } = await supabase
      .from('section21_patients')
      .select(`
        *,
        organisations (
          id,
          name
        ),
        locations (
          id,
          name,
          organisation_id
        )
      `)
      .not('patient_id_document_url', 'is', null)
      .not('dr_script_url', 'is', null)
      .not('outcome_letter_url', 'is', null)
      .limit(1000000)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch patients' },
        { status: 500 }
      )
    }

    // All patients already have all 3 documents (enforced by query)
    const patientsWithDocs = patients || []

    // Format patient name helper
    const formatPatientName = (patient: Section21Patient): string => {
      if (patient.first_name || patient.last_name) {
        const parts = [
          patient.name_prefix,
          patient.first_name,
          patient.last_name
        ].filter(Boolean)
        return parts.join(' ') || patient.patient_full_name || 'N/A'
      }
      return patient.patient_full_name || 'N/A'
    }

    // Generate CSV content
    // Note: All exported patients have all 3 required documents (ID, Dr Script, Section 21)
    const headers = [
      'Patient Name',
      'Patient ID',
      'Organisation',
      'Location',
      'Documents Status',
      'Created Date',
      'Last Updated'
    ]

    const csvRows = [
      headers.join(','),
      ...patientsWithDocs.map(patient => {
        const row = [
          `"${formatPatientName(patient).replace(/"/g, '""')}"`, // Escape quotes
          `"${patient.patient_unique_id || 'N/A'}"`,
          `"${patient.organisations?.name || 'N/A'}"`,
          `"${patient.locations?.name || 'N/A'}"`,
          'Complete', // All patients have all 3 docs
          new Date(patient.created_at).toLocaleDateString(),
          new Date(patient.updated_at).toLocaleDateString()
        ]
        return row.join(',')
      })
    ]

    const csvContent = csvRows.join('\n')

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="section21_patients_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export data' },
      { status: 500 }
    )
  }
}
