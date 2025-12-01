"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { Sidebar } from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { User as UserIcon, Lock, Save, X } from 'lucide-react'
import { User } from '@/lib/types/database'

export default function ProfilePage() {
  const { user: authUser, loading: authLoading } = useAuth()
  const router = useRouter()

  const [userData, setUserData] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/login')
    } else if (authUser) {
      fetchUserData()
    }
  }, [authLoading, authUser, router])

  const fetchUserData = async () => {
    try {
      const res = await fetch(`/api/users/${authUser?.id}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setUserData(data.user)
        setFormData({
          full_name: data.user.full_name,
          password: '',
          confirmPassword: '',
        })
      } else {
        setError('Failed to load profile')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.full_name) {
      setError('Name is required')
      return
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const updateData: any = {
        full_name: formData.full_name,
      }

      // Only include password if it's being changed
      if (formData.password) {
        updateData.password = formData.password
      }

      const res = await fetch(`/api/users/${authUser?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess('Profile updated successfully!')
        setFormData({ ...formData, password: '', confirmPassword: '' })
        fetchUserData() // Refresh user data
      } else {
        setError(data.error || 'Failed to update profile')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || !authUser) {
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
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="text-sm text-muted-foreground">
              Manage your account details and password
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/50 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/50 p-3 text-sm text-green-500">
              {success}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Personal Details */}
              <Card className="mb-6 border-border bg-card/50 backdrop-blur">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Personal Details</h3>
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
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      Email Address (Read Only)
                    </label>
                    <input
                      type="email"
                      value={userData?.email || ''}
                      disabled
                      className="w-full rounded-lg border border-input bg-black/40 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Contact an administrator to change your email address
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Security */}
              <Card className="mb-6 border-border bg-card/50 backdrop-blur">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Security</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Lock className="h-4 w-4" />
                      New Password
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Leave blank to keep current password"
                      className="w-full rounded-lg border border-input bg-black/20 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Lock className="h-4 w-4" />
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirm your new password"
                      className="w-full rounded-lg border border-input bg-black/20 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                      minLength={6}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Leave blank to keep your current password. Minimum 6 characters.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Account Info */}
              {userData && (
                <Card className="mb-6 border-border bg-card/50 backdrop-blur">
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Account Information</h3>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Role:</span>
                      <span className={`rounded-md px-2 py-1 text-xs font-medium ${
                        userData.role === 'admin' 
                          ? 'bg-purple-500/10 text-purple-400' 
                          : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {userData.role}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <span className={`rounded-md px-2 py-1 text-xs font-medium ${
                        userData.status === 'active' 
                          ? 'bg-green-500/10 text-green-400' 
                          : 'bg-gray-500/10 text-gray-400'
                      }`}>
                        {userData.status}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Account created:</span> {new Date(userData.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Last updated:</span> {new Date(userData.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/')}
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
          )}
        </div>
      </div>
    </div>
  )
}
