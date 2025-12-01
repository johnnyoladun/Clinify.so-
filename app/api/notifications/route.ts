import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { authenticateRequest } from '@/lib/middleware/auth'

export interface Notification {
  id: string
  patient_id: string
  patient_name: string
  patient_unique_id: string
  organisation_name: string
  location_name: string
  uploaded_date: string
  expiry_date: string
  days_until_expiry: number
  status: 'EXPIRING_SOON' | 'EXPIRED'
}

// GET /api/notifications - Get Section 21 expiry notifications
export async function GET(request: NextRequest) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error

  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status') // 'expiring_soon', 'expired', or 'all'

    // Fetch all patients with Section 21 outcome letters
    const { data: patients, error: dbError } = await supabase
      .from('section21_patients')
      .select(`
        id,
        patient_full_name,
        first_name,
        last_name,
        patient_unique_id,
        outcome_letter_url,
        outcome_letter_uploaded_at,
        created_at,
        organisations(id, name),
        locations(id, name)
      `)
      .not('outcome_letter_url', 'is', null)
      .limit(1000000)

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    const now = new Date()
    const notifications: Notification[] = []

    for (const patient of patients || []) {
      // Use outcome_letter_uploaded_at if available, otherwise fall back to created_at
      const uploadedDate = patient.outcome_letter_uploaded_at 
        ? new Date(patient.outcome_letter_uploaded_at)
        : new Date(patient.created_at)

      // Calculate expiry date: uploaded_date + 5 months
      const expiryDate = new Date(uploadedDate)
      expiryDate.setMonth(expiryDate.getMonth() + 5)

      // Calculate days until expiry
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      // Determine status
      let notificationStatus: 'EXPIRING_SOON' | 'EXPIRED' | null = null
      
      if (daysUntilExpiry < 0) {
        notificationStatus = 'EXPIRED'
      } else if (daysUntilExpiry <= 30) {
        notificationStatus = 'EXPIRING_SOON'
      }

      // Only include if it's expiring soon or expired
      if (notificationStatus) {
        // Filter by status if specified
        if (status && status !== 'all') {
          const requestedStatus = status.toUpperCase().replace('_', '_')
          if (requestedStatus !== notificationStatus) {
            continue
          }
        }

        notifications.push({
          id: patient.id,
          patient_id: patient.id,
          patient_name: patient.patient_full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown',
          patient_unique_id: patient.patient_unique_id,
          organisation_name: patient.organisations?.name || 'Unknown',
          location_name: patient.locations?.name || 'Unknown',
          uploaded_date: uploadedDate.toISOString(),
          expiry_date: expiryDate.toISOString(),
          days_until_expiry: daysUntilExpiry,
          status: notificationStatus,
        })
      }
    }

    // Sort by expiry date (most urgent first)
    notifications.sort((a, b) => {
      // Expired first, then by days until expiry
      if (a.status === 'EXPIRED' && b.status !== 'EXPIRED') return -1
      if (a.status !== 'EXPIRED' && b.status === 'EXPIRED') return 1
      return a.days_until_expiry - b.days_until_expiry
    })

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length,
      summary: {
        expiring_soon: notifications.filter(n => n.status === 'EXPIRING_SOON').length,
        expired: notifications.filter(n => n.status === 'EXPIRED').length,
      }
    })
  } catch (error) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
