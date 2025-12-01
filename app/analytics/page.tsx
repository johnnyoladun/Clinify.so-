"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { Sidebar } from '@/components/sidebar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Section21Patient } from '@/lib/types/database'
import { 
  TrendingUp, 
  FileCheck, 
  Building2, 
  MapPin, 
  Calendar,
  Users,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle,
  X,
  Eye,
  Search
} from 'lucide-react'

interface AnalyticsData {
  totalPatients: number
  patientsThisMonth: number
  patientsThisWeek: number
  documentsComplete: number
  documentsIncomplete: number
  organisationBreakdown: { name: string; count: number }[]
  locationBreakdown: { name: string; count: number; org: string }[]
  monthlyTrend: { month: string; count: number }[]
  documentCompletionRate: number
  averageProcessingDays: number
}

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [allPatients, setAllPatients] = useState<Section21Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{ name: string; org: string } | null>(null)
  const [orgSearchQuery, setOrgSearchQuery] = useState('')
  const [locationSearchQuery, setLocationSearchQuery] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (user) {
      fetchAnalytics()
    }
  }, [authLoading, user, router])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/patients', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        const patients: Section21Patient[] = data.data || []
        setAllPatients(patients)
        
        const computed = computeAnalytics(patients)
        setAnalytics(computed)
      }
    } catch (err) {
      console.error('Failed to fetch analytics', err)
    } finally {
      setLoading(false)
    }
  }

  const computeAnalytics = (patients: Section21Patient[]): AnalyticsData => {
    const now = new Date()
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // Count patients by time period
    const patientsThisWeek = patients.filter(p => 
      new Date(p.created_at) >= startOfWeek
    ).length
    
    const patientsThisMonth = patients.filter(p => 
      new Date(p.created_at) >= startOfMonth
    ).length

    // Document completion tracking
    const documentsComplete = patients.filter(p => 
      p.patient_id_document_url && 
      p.dr_script_url && 
      p.outcome_letter_url
    ).length

    const documentsIncomplete = patients.length - documentsComplete
    const documentCompletionRate = patients.length > 0 
      ? (documentsComplete / patients.length) * 100 
      : 0

    // Organisation breakdown
    const orgMap = new Map<string, number>()
    patients.forEach(p => {
      const orgName = p.organisations?.name || 'Unknown'
      orgMap.set(orgName, (orgMap.get(orgName) || 0) + 1)
    })
    const organisationBreakdown = Array.from(orgMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    // Location breakdown
    const locMap = new Map<string, { count: number; org: string }>()
    patients.forEach(p => {
      const locName = p.locations?.name || 'Unknown'
      const orgName = p.organisations?.name || 'Unknown'
      const existing = locMap.get(locName)
      if (existing) {
        existing.count++
      } else {
        locMap.set(locName, { count: 1, org: orgName })
      }
    })
    const locationBreakdown = Array.from(locMap.entries())
      .map(([name, data]) => ({ name, count: data.count, org: data.org }))
      .sort((a, b) => b.count - a.count)

    // Monthly trend (last 6 months)
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      const count = patients.filter(p => {
        const created = new Date(p.created_at)
        return created >= monthStart && created <= monthEnd
      }).length

      monthlyTrend.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        count
      })
    }

    // Average processing time (days from creation to having all documents)
    const processedPatients = patients.filter(p => 
      p.patient_id_document_url && 
      p.dr_script_url && 
      p.outcome_letter_url
    )
    
    const totalDays = processedPatients.reduce((sum, p) => {
      const created = new Date(p.created_at)
      const updated = new Date(p.updated_at)
      const days = Math.floor((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      return sum + days
    }, 0)
    
    const averageProcessingDays = processedPatients.length > 0 
      ? Math.max(Math.round(totalDays / processedPatients.length), 7)
      : 7

    return {
      totalPatients: patients.length,
      patientsThisMonth,
      patientsThisWeek,
      documentsComplete,
      documentsIncomplete,
      organisationBreakdown,
      locationBreakdown,
      monthlyTrend,
      documentCompletionRate,
      averageProcessingDays
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-black">
      <Sidebar />
      
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Analytics & Insights</h1>
            <p className="text-sm text-muted-foreground">
              Section 21 patient data and processing metrics
            </p>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          ) : !analytics ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">No data available</p>
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-border bg-card/50 backdrop-blur">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-500/10 p-3">
                        <Users className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Patients</p>
                        <p className="text-2xl font-bold">{analytics.totalPatients}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card/50 backdrop-blur">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-green-500/10 p-3">
                        <TrendingUp className="h-6 w-6 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">This Month</p>
                        <p className="text-2xl font-bold">{analytics.patientsThisMonth}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card/50 backdrop-blur">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-purple-500/10 p-3">
                        <FileCheck className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Completion Rate</p>
                        <p className="text-2xl font-bold">{analytics.documentCompletionRate.toFixed(1)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card/50 backdrop-blur">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-orange-500/10 p-3">
                        <Clock className="h-6 w-6 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Processing</p>
                        <p className="text-2xl font-bold">{analytics.averageProcessingDays}d</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Document Status */}
              <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="border-border bg-card/50 backdrop-blur">
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Section 21 Compliance Status</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                          <span className="text-sm">Complete Section 21 Patients</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">{analytics.documentsComplete}</span>
                          <span className="text-sm text-muted-foreground">patients</span>
                        </div>
                      </div>
                      
                      <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all duration-500"
                          style={{ width: `${analytics.documentCompletionRate}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 text-orange-400" />
                          <span className="text-sm">Pending Section 21 Patients</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">{analytics.documentsIncomplete}</span>
                          <span className="text-sm text-muted-foreground">patients</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          Complete documentation includes: ID Document, Doctor's Script, and Section 21 Outcome Letter
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Trend */}
                <Card className="border-border bg-card/50 backdrop-blur">
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Patient Registration Trend</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.monthlyTrend.map((item, index) => {
                        const maxCount = Math.max(...analytics.monthlyTrend.map(m => m.count))
                        const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                        
                        return (
                          <div key={index}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{item.month}</span>
                              <span className="text-sm text-muted-foreground">{item.count} patients</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Organisation & Location Breakdown */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Organisations */}
                <Card className="border-border bg-card/50 backdrop-blur">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-400" />
                      <h3 className="text-lg font-semibold">Patients by Organisation</h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.organisationBreakdown.slice(0, 5).map((org, index) => {
                        const percentage = analytics.totalPatients > 0 
                          ? (org.count / analytics.totalPatients) * 100 
                          : 0
                        
                        return (
                          <div 
                            key={index} 
                            className="rounded-lg border border-border bg-black/20 p-3 cursor-pointer hover:bg-black/40 transition-colors"
                            onClick={() => setSelectedOrg(org.name)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">{org.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold">{org.count}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({percentage.toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                            <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                      
                      {analytics.organisationBreakdown.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No organisation data available
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Locations */}
                <Card className="border-border bg-card/50 backdrop-blur">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-green-400" />
                      <h3 className="text-lg font-semibold">Patients by Location</h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.locationBreakdown.slice(0, 5).map((loc, index) => {
                        const percentage = analytics.totalPatients > 0 
                          ? (loc.count / analytics.totalPatients) * 100 
                          : 0
                        
                        return (
                          <div 
                            key={index} 
                            className="rounded-lg border border-border bg-black/20 p-3 cursor-pointer hover:bg-black/40 transition-colors"
                            onClick={() => setSelectedLocation({ name: loc.name, org: loc.org })}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="text-sm font-medium">{loc.name}</span>
                                <p className="text-xs text-muted-foreground">{loc.org}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold">{loc.count}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({percentage.toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                            <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                              <div 
                                className="h-full bg-green-500 transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                      
                      {analytics.locationBreakdown.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No location data available
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Organisation Detail Modal */}
          {selectedOrg && (() => {
            const orgPatients = allPatients
              .filter(p => p.organisations?.name === selectedOrg)
              .filter(p => {
                const searchLower = orgSearchQuery.toLowerCase()
                const fullName = `${p.name_prefix} ${p.first_name} ${p.last_name}`.toLowerCase()
                return fullName.includes(searchLower)
              })
              .sort((a, b) => {
                // Sort by S21 doc - patients with doc come first
                const aHasDoc = a.outcome_letter_url ? 1 : 0
                const bHasDoc = b.outcome_letter_url ? 1 : 0
                return bHasDoc - aHasDoc
              })
            
            return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => { setSelectedOrg(null); setOrgSearchQuery('') }}>
              <div className="relative w-full max-w-6xl max-h-[90vh] overflow-auto rounded-lg border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 z-10 border-b border-border bg-card">
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedOrg}</h3>
                      <p className="text-sm text-muted-foreground">
                        {allPatients.filter(p => p.organisations?.name === selectedOrg).length} patients
                      </p>
                    </div>
                    <button onClick={() => { setSelectedOrg(null); setOrgSearchQuery('') }} className="rounded-lg p-2 hover:bg-accent">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search patients..."
                        value={orgSearchQuery}
                        onChange={(e) => setOrgSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-input bg-black/20 pl-9 pr-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Patient Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Location</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Documents</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date Added</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orgPatients.map((patient) => (
                          <tr key={patient.id} className="border-b border-border/50 hover:bg-accent/50">
                            <td className="px-4 py-3 text-sm font-medium">
                              {patient.name_prefix} {patient.first_name} {patient.last_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {patient.locations?.name || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <span className={`rounded px-2 py-1 text-xs ${
                                  patient.patient_id_document_url 
                                    ? 'bg-green-500/10 text-green-400' 
                                    : 'bg-gray-500/10 text-gray-400'
                                }`}>ID</span>
                                <span className={`rounded px-2 py-1 text-xs ${
                                  patient.dr_script_url 
                                    ? 'bg-green-500/10 text-green-400' 
                                    : 'bg-gray-500/10 text-gray-400'
                                }`}>Script</span>
                                <span className={`rounded px-2 py-1 text-xs ${
                                  patient.outcome_letter_url 
                                    ? 'bg-green-500/10 text-green-400' 
                                    : 'bg-gray-500/10 text-gray-400'
                                }`}>S21</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {new Date(patient.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            )
          })()}

          {/* Location Detail Modal */}
          {selectedLocation && (() => {
            const locationPatients = allPatients
              .filter(p => p.locations?.name === selectedLocation.name)
              .filter(p => {
                const searchLower = locationSearchQuery.toLowerCase()
                const fullName = `${p.name_prefix} ${p.first_name} ${p.last_name}`.toLowerCase()
                return fullName.includes(searchLower)
              })
              .sort((a, b) => {
                // Sort by S21 doc - patients with doc come first
                const aHasDoc = a.outcome_letter_url ? 1 : 0
                const bHasDoc = b.outcome_letter_url ? 1 : 0
                return bHasDoc - aHasDoc
              })
            
            return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => { setSelectedLocation(null); setLocationSearchQuery('') }}>
              <div className="relative w-full max-w-6xl max-h-[90vh] overflow-auto rounded-lg border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 z-10 border-b border-border bg-card">
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedLocation.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedLocation.org} • {allPatients.filter(p => p.locations?.name === selectedLocation.name).length} patients
                      </p>
                    </div>
                    <button onClick={() => { setSelectedLocation(null); setLocationSearchQuery('') }} className="rounded-lg p-2 hover:bg-accent">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search patients..."
                        value={locationSearchQuery}
                        onChange={(e) => setLocationSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-input bg-black/20 pl-9 pr-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Patient Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Organisation</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Documents</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date Added</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locationPatients.map((patient) => (
                          <tr key={patient.id} className="border-b border-border/50 hover:bg-accent/50">
                            <td className="px-4 py-3 text-sm font-medium">
                              {patient.name_prefix} {patient.first_name} {patient.last_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {patient.organisations?.name || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <span className={`rounded px-2 py-1 text-xs ${
                                  patient.patient_id_document_url 
                                    ? 'bg-green-500/10 text-green-400' 
                                    : 'bg-gray-500/10 text-gray-400'
                                }`}>ID</span>
                                <span className={`rounded px-2 py-1 text-xs ${
                                  patient.dr_script_url 
                                    ? 'bg-green-500/10 text-green-400' 
                                    : 'bg-gray-500/10 text-gray-400'
                                }`}>Script</span>
                                <span className={`rounded px-2 py-1 text-xs ${
                                  patient.outcome_letter_url 
                                    ? 'bg-green-500/10 text-green-400' 
                                    : 'bg-gray-500/10 text-gray-400'
                                }`}>S21</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {new Date(patient.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
