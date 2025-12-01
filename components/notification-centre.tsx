"use client"

import { useEffect, useState } from 'react'
import { X, Bell, AlertTriangle, AlertCircle, Calendar, Building2, MapPin, User } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface Notification {
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

interface NotificationCentreProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCentre({ isOpen, onClose }: NotificationCentreProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'expiring_soon' | 'expired'>('all')

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true
    if (filter === 'expiring_soon') return n.status === 'EXPIRING_SOON'
    if (filter === 'expired') return n.status === 'EXPIRED'
    return true
  })

  const expiringSoonCount = notifications.filter(n => n.status === 'EXPIRING_SOON').length
  const expiredCount = notifications.filter(n => n.status === 'EXPIRED').length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl h-[90vh] bg-card border border-border rounded-lg shadow-2xl flex flex-col mt-16">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold">Notification Centre</h2>
              <p className="text-sm text-muted-foreground">Section 21 Expiry Alerts</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-border p-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-accent text-white' 
                : 'text-muted-foreground hover:text-white hover:bg-accent/50'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('expiring_soon')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'expiring_soon' 
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                : 'text-muted-foreground hover:text-white hover:bg-yellow-500/10'
            }`}
          >
            <AlertTriangle className="inline h-4 w-4 mr-1" />
            Expiring Soon ({expiringSoonCount})
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'expired' 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                : 'text-muted-foreground hover:text-white hover:bg-red-500/10'
            }`}
          >
            <AlertCircle className="inline h-4 w-4 mr-1" />
            Expired ({expiredCount})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? 'No active notifications' 
                  : filter === 'expiring_soon'
                  ? 'No Section 21 documents expiring soon'
                  : 'No expired Section 21 documents'}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-2">
                All Section 21 documents are valid and not close to expiry
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <Card 
                  key={notification.id}
                  className={`border p-4 hover:bg-accent/10 transition-colors cursor-pointer ${
                    notification.status === 'EXPIRED' 
                      ? 'border-red-500/30 bg-red-500/5' 
                      : 'border-yellow-500/30 bg-yellow-500/5'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Status Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        {notification.status === 'EXPIRED' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-400 border border-red-500/30">
                            <AlertCircle className="h-3 w-3" />
                            EXPIRED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 px-2.5 py-0.5 text-xs font-medium text-yellow-400 border border-yellow-500/30">
                            <AlertTriangle className="h-3 w-3" />
                            EXPIRING SOON
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {notification.days_until_expiry < 0 
                            ? `Expired ${Math.abs(notification.days_until_expiry)} days ago`
                            : `${notification.days_until_expiry} days remaining`}
                        </span>
                      </div>

                      {/* Patient Info */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{notification.patient_name}</span>
                          <span className="text-xs text-muted-foreground">#{notification.patient_unique_id}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5" />
                            <span>{notification.organisation_name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{notification.location_name}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            Expires: {new Date(notification.expiry_date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 bg-card/50">
          <p className="text-xs text-muted-foreground text-center">
            Section 21 documents expire 5 months after upload date
          </p>
        </div>
      </div>
    </div>
  )
}
