"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { Sidebar } from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft, User as UserIcon, Mail, Lock, Shield, Save, X } from 'lucide-react'
import { User } from '@/lib/types/database'

export default function EditUserPage() {
  const { user, loading: authLoading, isAdmin, refreshUser } = useAuth()
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [userData, setUserData] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'user',
    password: '', // Optional - only if changing password
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin())) {
      router.push('/')
    } else if (user) {
      fetchUser()
    }
  }, [authLoading, user, router, userId])

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/users/${userId}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setUserData(data.user)
        setFormData({
          full_name: data.user.full_name,
          email: data.user.email,
          role: data.user.role,
          password: '',
        })
      } else {
        setError('Failed to load user')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.full_name || !formData.email) {
      setError('Name and email are required')
      return
    }

    setSaving(true)
    setError('')

    try {
      const updateData: any = {
        full_name: formData.full_name,
        email: formData.email,
        role: formData.role,
      }

      // Only include password if it's being changed
      if (formData.password) {
        updateData.password = formData.password
      }

      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData),
      })

      const data = await res.json()

      if (res.ok) {
        // If user is editing their own account, refresh their session
        if (userId === user?.id) {
          await refreshUser()
        }
        router.push('/admin/users')
      } else {
        setError(data.error || 'Failed to update user')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || !user || !isAdmin()) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <p className="text-muted-foreground">Loading user...</p>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black">
        <p className="text-muted-foreground mb-4">User not found</p>
        <Button onClick={() => router.push('/admin/users')}>
          Back to Users
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-black">
      <Sidebar />
      
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/admin/users')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Edit User</h1>
                <p className="text-sm text-muted-foreground">
                  Update user details and permissions
                </p>
              </div>
            </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-md px-3 py-1 text-sm font-medium ${
              userData.status === 'active' 
                ? 'bg-green-500/10 text-green-400' 
                : 'bg-gray-500/10 text-gray-400'
            }`}>
              {userData.status}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/50 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* User Details */}
          <Card className="mb-6 border-border bg-card/50 backdrop-blur">
            <CardHeader>
              <h3 className="text-lg font-semibold">User Details</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <UserIcon className="h-4 w-4" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-input bg-black/20 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Mail className="h-4 w-4" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full rounded-lg border border-input bg-black/20 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Shield className="h-4 w-4" />
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full rounded-lg border border-input bg-black/20 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Lock className="h-4 w-4" />
                  New Password (Optional)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave blank to keep current password"
                  className="w-full rounded-lg border border-input bg-black/20 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  minLength={6}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Leave blank to keep current password. Minimum 6 characters if changing.
                </p>
              </div>

              {/* Metadata */}
              <div className="rounded-lg border border-border bg-black/20 p-3 space-y-1">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Created:</span> {new Date(userData.created_at).toLocaleDateString()} at {new Date(userData.created_at).toLocaleTimeString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Last Updated:</span> {new Date(userData.updated_at).toLocaleDateString()} at {new Date(userData.updated_at).toLocaleTimeString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/users')}
              className="flex-1 border-border hover:bg-accent"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-white text-black hover:bg-gray-200"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
