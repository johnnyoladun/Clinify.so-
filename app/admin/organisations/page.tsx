"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { Sidebar } from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Building2, MapPin, Users, Plus, Trash2 } from 'lucide-react'
import { AddOrganisationModal } from '@/components/add-organisation-modal'

interface OrganisationStats {
  id: string
  organisation: string
  ownerEmail: string
  locations: {
    location: string
    patientCount: number
    formTitle: string
  }[]
  totalPatients: number
}

export default function OrganisationsPage() {
  const { user, loading: authLoading, isAdmin } = useAuth()
  const router = useRouter()
  const [organisations, setOrganisations] = useState<OrganisationStats[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin())) {
      router.push('/')
    } else if (user) {
      fetchOrganisations()
    }
  }, [authLoading, user, router])

  const fetchOrganisations = async () => {
    try {
      const res = await fetch('/api/organisations', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setOrganisations(data.organisations || [])
      }
    } catch (err) {
      console.error('Failed to fetch organisations', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteOrganisation = async (orgId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent navigation when clicking delete
    
    if (!confirm('Are you sure? This will delete the organisation, all locations, and all patient records associated with it.')) {
      return
    }

    try {
      const res = await fetch(`/api/organisations/${orgId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (res.ok) {
        fetchOrganisations() // Refresh list
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete organisation')
      }
    } catch (err) {
      console.error('Failed to delete organisation', err)
      alert('Failed to delete organisation')
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const totalPatients = organisations.reduce((sum, org) => sum + org.totalPatients, 0)

  return (
    <>
      <AddOrganisationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchOrganisations}
      />
      
    <div className="flex h-screen bg-black">
      <Sidebar />
      
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Organisations</h1>
              <p className="text-sm text-muted-foreground">
                Manage organisations, locations, and view patient statistics
              </p>
            </div>
          <Button
            variant="default"
            className="bg-white text-black hover:bg-gray-200"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Organisation
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-border bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-3">
                  <Building2 className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Organisations</p>
                  <p className="text-2xl font-bold">{organisations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-500/10 p-3">
                  <MapPin className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Locations</p>
                  <p className="text-2xl font-bold">
                    {organisations.reduce((sum, org) => sum + org.locations.length, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-500/10 p-3">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Patients</p>
                  <p className="text-2xl font-bold">{totalPatients}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organisations List */}
        <Card className="border-border bg-card/50 backdrop-blur">
          <CardHeader>
            <h3 className="text-lg font-semibold">All Organisations</h3>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground">Loading organisations...</p>
              </div>
            ) : organisations.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground">No organisations found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {organisations.map((org) => (
                  <div
                    key={org.id}
                    onClick={() => router.push(`/admin/organisations/${org.id}`)}
                    className="rounded-lg border border-border bg-black/20 p-4 cursor-pointer hover:bg-black/30 transition-colors"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-blue-400" />
                        <h4 className="text-lg font-semibold">{org.organisation}</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 rounded-md bg-purple-500/10 px-3 py-1 text-sm text-purple-400">
                          <Users className="h-4 w-4" />
                          {org.totalPatients} patients
                        </div>
                        <button
                          onClick={(e) => deleteOrganisation(org.id, e)}
                          className="rounded-md bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Locations */}
                    <div className="space-y-2">
                      {org.locations.map((loc, locIndex) => (
                        <div
                          key={locIndex}
                          className="flex items-center justify-between rounded-md border border-border/50 bg-black/30 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-green-400" />
                            <div>
                              <p className="font-medium">{loc.location}</p>
                              <p className="text-xs text-muted-foreground">{loc.formTitle}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            {loc.patientCount}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
    </>
  )
}
