"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { Sidebar } from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Users as UsersIcon, Plus, Edit, Trash2, Power, PowerOff } from 'lucide-react'
import { User } from '@/lib/types/database'

export default function UsersPage() {
  const { user, loading: authLoading, isAdmin } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin())) {
      router.push('/')
    } else if (user) {
      fetchUsers()
    }
  }, [authLoading, user, router])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      } else {
        setError('Failed to load users')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        fetchUsers()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to update user status')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${userName}? This action cannot be undone.`)) {
      return
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (res.ok) {
        fetchUsers()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to delete user')
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

  const activeUsers = users.filter(u => u.status === 'active')
  const inactiveUsers = users.filter(u => u.status === 'inactive')

  return (
    <div className="flex h-screen bg-black">
      <Sidebar />
      
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Users</h1>
              <p className="text-sm text-muted-foreground">
                Manage system users and permissions
              </p>
            </div>
          <Button
            variant="default"
            className="bg-white text-black hover:bg-gray-200"
            onClick={() => router.push('/admin/users/new')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/50 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Stats Overview */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-border bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-3">
                  <UsersIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-500/10 p-3">
                  <Power className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">{activeUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gray-500/10 p-3">
                  <PowerOff className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inactive Users</p>
                  <p className="text-2xl font-bold">{inactiveUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="border-border bg-card/50 backdrop-blur">
          <CardHeader>
            <h3 className="text-lg font-semibold">All Users</h3>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Created</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-accent/50">
                        <td className="px-4 py-3 text-sm font-medium">{u.full_name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`rounded-md px-2 py-1 text-xs font-medium ${
                            u.role === 'admin' 
                              ? 'bg-purple-500/10 text-purple-400' 
                              : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`rounded-md px-2 py-1 text-xs font-medium ${
                            u.status === 'active' 
                              ? 'bg-green-500/10 text-green-400' 
                              : 'bg-gray-500/10 text-gray-400'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/users/${u.id}`)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(u.id, u.status)}
                              className={u.status === 'active' 
                                ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-500/10'
                                : 'text-green-400 hover:text-green-300 hover:bg-green-500/10'
                              }
                            >
                              {u.status === 'active' ? (
                                <PowerOff className="h-4 w-4" />
                              ) : (
                                <Power className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(u.id, u.full_name)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}
