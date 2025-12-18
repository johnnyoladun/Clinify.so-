"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/lib/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/loading-spinner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md border-border bg-card/50 backdrop-blur">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <Image 
              src="/images/clinify-logo.png" 
              alt="Clinify Logo" 
              width={48} 
              height={48}
              className="h-12 w-12 object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Clinify Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Section 21 Outcome Letters Management
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/50 p-3 text-sm text-red-500">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-input bg-black/20 px-4 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-input bg-black/20 px-4 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-gray-200 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading && <LoadingSpinner size="sm" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}



