"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useAuth } from "@/lib/contexts/auth-context"
import { Section21Patient } from "@/lib/types/database"
import { DocumentViewerModal } from "@/components/document-viewer-modal"
import { NotificationCentre } from "@/components/notification-centre"
import { LoadingSpinner } from "@/components/loading-spinner"
import { PanelLeft, LogOut, FileText, Search, RefreshCw, Filter, Bell, Download } from "lucide-react"

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const [patients, setPatients] = useState<Section21Patient[]>([])
  const [allPatients, setAllPatients] = useState<Section21Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [orgCount, setOrgCount] = useState<number>(0)
  const [selectedOrg, setSelectedOrg] = useState<string>('all')
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [organisations, setOrganisations] = useState<Array<{ id: string; name: string }>>([])
  const [locations, setLocations] = useState<Array<{ id: string; name: string; org: string }>>([])
  const [documentModal, setDocumentModal] = useState<{
    isOpen: boolean
    url: string
    title: string
  }>({ isOpen: false, url: '', title: '' })
  const [showNotifications, setShowNotifications] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (user) {
      fetchPatients()
      fetchNotificationCount()
      
      // Auto-sync every 5 minutes
      const syncInterval = setInterval(() => {
        console.log('Auto-sync triggered (5 min interval)')
        syncFromJotform()
      }, 5 * 60 * 1000) // 5 minutes in milliseconds
      
      // Cleanup interval on unmount
      return () => clearInterval(syncInterval)
    }
  }, [authLoading, user, router])

  const fetchNotificationCount = async () => {
    try {
      const res = await fetch('/api/notifications', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setNotificationCount(data.count || 0)
      }
    } catch (err) {
      console.error('Failed to fetch notification count:', err)
    }
  }

  const syncFromJotform = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Fetch organisations to get form IDs
      const orgRes = await fetch('/api/organisations', { credentials: 'include' })
      if (!orgRes.ok) {
        setError('Failed to fetch organisations')
        setLoading(false)
        return
      }
      
      const orgData = await orgRes.json()
      const orgs = orgData.organisations || []
      
      if (orgs.length === 0) {
        setError('No organisations configured')
        setLoading(false)
        return
      }
      
      // Fetch all form IDs from all organisations' locations
      const formIds: string[] = []
      orgs.forEach((org: any) => {
        org.locations?.forEach((loc: any) => {
          // Each location has a form_id we need to sync
          if (loc.formId) {
            formIds.push(loc.formId)
          }
        })
      })
      
      if (formIds.length === 0) {
        console.log('No forms to sync')
        await fetchPatients()
        return
      }
      
      console.log('Syncing forms:', formIds)
      
      // Sync each form
      let totalSynced = 0
      for (const formId of formIds) {
        try {
          const syncRes = await fetch('/api/jotform/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ form_id: formId })
          })
          
          if (syncRes.ok) {
            const data = await syncRes.json()
            totalSynced += data.synced || 0
            console.log(`Synced ${data.synced} records from form ${formId}`)
          } else {
            const errorData = await syncRes.json()
            console.error(`Sync failed for form ${formId}:`, errorData)
          }
        } catch (syncErr) {
          console.error(`Error syncing form ${formId}:`, syncErr)
        }
      }
      
      console.log(`Synced ${totalSynced} records from Jotform`)
      
      // Refresh patients after sync
      await fetchPatients()
    } catch (err) {
      console.error('Sync error:', err)
      setError('Failed to sync from Jotform')
      setLoading(false)
    }
  }

  const fetchPatients = async () => {
    setLoading(true)
    setError('')
    
    try {
      // First check if any organisations exist (with cache busting)
      const timestamp = Date.now()
      const orgRes = await fetch(`/api/organisations?t=${timestamp}`, { 
        credentials: 'include',
        cache: 'no-store'
      })
      
      if (!orgRes.ok) {
        console.error('Organisations API failed:', orgRes.status)
        // If orgs API fails, assume no orgs and don't fetch patients
        setOrgCount(0)
        setAllPatients([])
        setPatients([])
        setError('Failed to load organisations. Tables may not be set up.')
        setLoading(false)
        return
      }
      
      const orgData = await orgRes.json()
      const orgs = orgData.organisations || []
      console.log('Organisations found:', orgs.length)
      setOrgCount(orgs.length)
      
      // Extract unique organisations and locations for filters
      const uniqueOrgs: Array<{ id: string; name: string }> = []
      const uniqueLocs: Array<{ id: string; name: string; org: string }> = []
      
      orgs.forEach((org: any) => {
        uniqueOrgs.push({ id: org.id, name: org.organisation })
        org.locations?.forEach((loc: any) => {
          uniqueLocs.push({ id: loc.id, name: loc.location, org: org.organisation })
        })
      })
      
      setOrganisations(uniqueOrgs)
      setLocations(uniqueLocs)
      
      // If no organisations, don't fetch patients
      if (orgs.length === 0) {
        console.log('No organisations - clearing patients')
        setAllPatients([])
        setPatients([])
        setLoading(false)
        return
      }
      
      // Fetch patients only if organisations exist
      console.log('Fetching patients...')
      const response = await fetch(`/api/patients?t=${timestamp}`, {
        cache: 'no-store'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Patients received:', data.data?.length || 0)
        // All patients have complete documents - sort alphabetically by name
        const patientData = (data.data || []).sort((a: Section21Patient, b: Section21Patient) => {
          return (a.patient_full_name || '').localeCompare(b.patient_full_name || '')
        })
        setAllPatients(patientData)
        setPatients(patientData)
      } else {
        setError('Failed to load patients')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Error loading data')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const applyFilters = () => {
    let filtered = allPatients
    
    // Apply organisation filter
    if (selectedOrg !== 'all') {
      filtered = filtered.filter(p => p.organisations?.name === selectedOrg)
    }
    
    // Apply location filter
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(p => p.locations?.name === selectedLocation)
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase()
      filtered = filtered.filter(p => {
        const patientName = formatPatientName(p)
        const orgName = getOrganisationName(p)
        const locName = getLocationName(p)
        return (
          patientName.toLowerCase().includes(lowerQuery) ||
          orgName.toLowerCase().includes(lowerQuery) ||
          locName.toLowerCase().includes(lowerQuery)
        )
      })
    }
    
    // Sort alphabetically - all patients have complete documents
    setPatients(filtered.sort((a, b) => {
      return (a.patient_full_name || '').localeCompare(b.patient_full_name || '')
    }))
  }
  
  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }
  
  useEffect(() => {
    applyFilters()
  }, [searchQuery, selectedOrg, selectedLocation, allPatients])

  const openDocument = (url: string, title: string) => {
    setDocumentModal({ isOpen: true, url, title })
  }

  const closeDocument = () => {
    setDocumentModal({ isOpen: false, url: '', title: '' })
  }

  // Format patient name from Control Centre data
  const formatPatientName = (patient: Section21Patient): string => {
    // Use structured name fields if available
    if (patient.first_name || patient.last_name) {
      const parts = [
        patient.name_prefix,
        patient.first_name,
        patient.last_name
      ].filter(Boolean)
      return parts.join(' ') || patient.patient_full_name || 'N/A'
    }
    // Fallback to full name
    return patient.patient_full_name || 'N/A'
  }

  // Get organisation name from Control Centre
  const getOrganisationName = (patient: Section21Patient): string => {
    return patient.organisations?.name || '-'
  }

  // Get location name from Control Centre
  const getLocationName = (patient: Section21Patient): string => {
    return patient.locations?.name || '-'
  }

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/patients/export', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        setError('Failed to export data')
        return
      }
      
      // Create a blob from the response
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      // Create a temporary link and trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = `section21_patients_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
      setError('Failed to export data')
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <>
      <DocumentViewerModal
        isOpen={documentModal.isOpen}
        onClose={closeDocument}
        documentUrl={documentModal.url}
        documentTitle={documentModal.title}
      />
      
      <NotificationCentre
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
      
      <div className="flex h-screen overflow-hidden bg-black">
        {/* Sidebar */}
        <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <PanelLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user.full_name}</span>
            {user.role === 'admin' && (
              <span className="rounded-md bg-accent px-2 py-1 text-xs font-medium">Admin</span>
            )}
            {/* Notification Bell */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => {
                setShowNotifications(true)
                fetchNotificationCount()
              }}
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/50 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          {/* Patients Table */}
          <Card className="border-border bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">Patient Records</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Showing: {patients.length} of {allPatients.length} records
                    </p>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search by name, organisation, or location..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full rounded-lg border border-input bg-black/20 pl-9 pr-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>
                
                {/* Filters */}
                <div className="flex items-center gap-3">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={selectedOrg}
                    onChange={(e) => setSelectedOrg(e.target.value)}
                    className="rounded-lg border border-input bg-black px-3 py-2 text-sm text-white focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring [&>option]:bg-black [&>option]:text-white"
                  >
                    <option value="all">All Organisations</option>
                    {organisations.map((org) => (
                      <option key={org.id} value={org.name}>{org.name}</option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="rounded-lg border border-input bg-black px-3 py-2 text-sm text-white focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring [&>option]:bg-black [&>option]:text-white"
                  >
                    <option value="all">All Locations</option>
                    {locations
                      .filter(loc => selectedOrg === 'all' || loc.org === selectedOrg)
                      .map((loc, index) => (
                        <option key={`${loc.id}-${index}`} value={loc.name}>{loc.name}</option>
                      ))}
                  </select>
                  
                  {/* Export CSV Button */}
                  <Button
                    onClick={handleExportCSV}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={allPatients.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : patients.length === 0 ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="text-center">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    {orgCount === 0 ? (
                      <>
                        <p className="mt-4 text-muted-foreground">No organisations configured yet</p>
                        <Button 
                          className="mt-3 bg-white text-black hover:bg-gray-200"
                          onClick={() => router.push('/admin/organisations')}
                        >
                          Go to Control Centre → Organisations
                        </Button>
                      </>
                    ) : (
                      <p className="mt-4 text-muted-foreground">No patient records found</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-[200px]">Patient Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-[180px]">Organisation</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-[150px]">Location</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Viewable Documents</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map((patient) => {
                        const patientName = formatPatientName(patient)
                        const orgName = getOrganisationName(patient)
                        const locName = getLocationName(patient)
                        return (
                        <tr key={patient.id} className="border-b border-border/50 hover:bg-accent/50">
                          <td className="px-4 py-3 text-sm w-[200px] truncate" title={patientName}>{patientName}</td>
                          <td className="px-4 py-3 text-sm font-medium w-[180px] truncate" title={orgName}>{orgName}</td>
                          <td className="px-4 py-3 text-sm w-[150px] truncate" title={locName}>{locName}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-5">
                              {patient.patient_id_document_url && (
                                <button
                                  onClick={() => openDocument(patient.patient_id_document_url!, 'ID Doc - ' + patient.patient_full_name)}
                                  className="rounded-md bg-yellow-500/10 px-2.5 py-1.5 text-xs font-medium text-yellow-400 hover:bg-yellow-500/20 whitespace-nowrap"
                                >
                                  ID Doc
                                </button>
                              )}
                              {patient.dr_script_url && (
                                <button
                                  onClick={() => openDocument(patient.dr_script_url!, "Dr's Script - " + patient.patient_full_name)}
                                  className="rounded-md bg-green-500/10 px-2.5 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 whitespace-nowrap"
                                >
                                  Dr's Script
                                </button>
                              )}
                              {patient.outcome_letter_url && (
                                <button
                                  onClick={() => openDocument(patient.outcome_letter_url!, 'Section 21 Doc - ' + patient.patient_full_name)}
                                  className="rounded-md bg-blue-500/10 px-2.5 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20 whitespace-nowrap"
                                >
                                  Section 21 Doc
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
    </>
  )
}
