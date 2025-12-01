"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { Sidebar } from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft, Building2, Mail, MapPin, Users, Plus, Trash2, Save, Edit, X } from 'lucide-react'
import { AddLocationModal } from '@/components/add-location-modal'

interface Location {
  id: string
  name: string
  form_id: string
  patientCount: number
}

interface Organisation {
  id: string
  name: string
  owner_email: string
  locations: Location[]
  totalPatients: number
}

export default function OrganisationDetailPage() {
  const { user, loading: authLoading, isAdmin } = useAuth()
  const router = useRouter()
  const params = useParams()
  const orgId = params.id as string

  const [organisation, setOrganisation] = useState<Organisation | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [editedEmail, setEditedEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin())) {
      router.push('/')
    } else if (user) {
      fetchOrganisation()
    }
  }, [authLoading, user, router, orgId])

  const fetchOrganisation = async () => {
    try {
      const res = await fetch(`/api/organisations/${orgId}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setOrganisation(data.organisation)
        setEditedName(data.organisation.name)
        setEditedEmail(data.organisation.owner_email)
      } else {
        setError('Failed to load organisation')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }


  const handleSave = async () => {
    if (!editedName.trim() || !editedEmail.trim()) {
      setError('Name and email are required')
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/organisations/${orgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editedName,
          ownerEmail: editedEmail,
        }),
      })

      if (res.ok) {
        await fetchOrganisation()
        setIsEditing(false)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to update organisation')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }


  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm('Are you sure you want to remove this location?')) return

    try {
      const res = await fetch(`/api/organisations/${orgId}/locations/${locationId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (res.ok) {
        await fetchOrganisation()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to delete location')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <p className="text-muted-foreground">Loading organisation...</p>
      </div>
    )
  }

  if (!organisation) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black">
        <p className="text-muted-foreground mb-4">Organisation not found</p>
        <Button onClick={() => router.push('/admin/organisations')}>
          Back to Organisations
        </Button>
      </div>
    )
  }

  return (
    <>
      <AddLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSuccess={fetchOrganisation}
        organisationId={orgId}
      />
      
    <div className="flex h-screen bg-black">
      <Sidebar />
      
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-6 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin/organisations')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
            <h1 className="text-2xl font-bold">{organisation.name}</h1>
            <p className="text-sm text-muted-foreground">
              {organisation.totalPatients} total patients across {organisation.locations.length} locations
            </p>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="border-border hover:bg-accent"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Details
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/50 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Organisation Details */}
        <Card className="mb-6 border-border bg-card/50 backdrop-blur">
          <CardHeader>
            <h3 className="text-lg font-semibold">Organisation Details</h3>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Building2 className="h-4 w-4" />
                    Organisation Name
                  </label>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full rounded-lg border border-input bg-black/20 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Mail className="h-4 w-4" />
                    Owner Contact Email
                  </label>
                  <input
                    type="email"
                    value={editedEmail}
                    onChange={(e) => setEditedEmail(e.target.value)}
                    className="w-full rounded-lg border border-input bg-black/20 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-white text-black hover:bg-gray-200"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setEditedName(organisation.name)
                      setEditedEmail(organisation.owner_email)
                      setError('')
                    }}
                    className="border-border hover:bg-accent"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Organisation Name</p>
                    <p className="font-medium">{organisation.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Owner Contact</p>
                    <p className="font-medium">{organisation.owner_email}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Locations */}
        <Card className="border-border bg-card/50 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Locations</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Existing Locations */}
              {organisation.locations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-black/20 p-4"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <MapPin className="h-5 w-5 text-green-400" />
                    <div className="flex-1">
                      <p className="font-medium">{location.name}</p>
                      <p className="text-xs text-muted-foreground">Form ID: {location.form_id}</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-md bg-purple-500/10 px-3 py-1 text-sm text-purple-400">
                      <Users className="h-4 w-4" />
                      {location.patientCount}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteLocation(location.id)}
                    className="ml-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Add New Location Button */}
              <Button
                onClick={() => setIsLocationModalOpen(true)}
                className="w-full bg-white text-black hover:bg-gray-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Location
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
    </>
  )
}
