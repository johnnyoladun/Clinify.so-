"use client"

import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  Building2,
  UserCircle,
  LogOut
} from "lucide-react"
import Image from "next/image"
import { Button } from "./ui/button"
import { useAuth } from "@/lib/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"

export function Sidebar() {
  const { user, isAdmin, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-black px-3 py-4">
      {/* Logo/Brand */}
      <div className="mb-6 flex items-center gap-2 px-3">
        <Image 
          src="/images/clinify-logo.png" 
          alt="Clinify Logo" 
          width={24} 
          height={24}
          className="h-6 w-6 object-contain"
        />
        <span className="text-lg font-semibold">Clinify Dashboard</span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1">
        <Button
          variant="ghost"
          className={`w-full justify-start gap-3 ${
            pathname === '/' ? "bg-accent" : ""
          }`}
          onClick={() => router.push('/')}
        >
          <LayoutDashboard className="h-5 w-5" />
          Dashboard
        </Button>
        <Button
          variant="ghost"
          className={`w-full justify-start gap-3 ${
            pathname === '/analytics' ? "bg-accent" : ""
          }`}
          onClick={() => router.push('/analytics')}
        >
          <BarChart3 className="h-5 w-5" />
          Analytics
        </Button>

        {/* Control Centre Section - Admin Only */}
        {isAdmin() && (
          <div className="pt-6">
            <h3 className="mb-2 px-3 text-sm font-medium text-muted-foreground">
              Control Centre
            </h3>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 ${
                pathname?.startsWith('/admin/organisations') ? "bg-accent" : ""
              }`}
              onClick={() => router.push('/admin/organisations')}
            >
              <Building2 className="h-5 w-5" />
              Organisations
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 ${
                pathname?.startsWith('/admin/users') ? "bg-accent" : ""
              }`}
              onClick={() => router.push('/admin/users')}
            >
              <Users className="h-5 w-5" />
              Users
            </Button>
          </div>
        )}

      </nav>

      {/* Profile & Logout */}
      <div className="border-t border-border pt-4 space-y-1">
        <Button
          variant="ghost"
          className={`w-full justify-start gap-3 ${
            pathname === '/profile' ? "bg-accent" : ""
          }`}
          onClick={() => router.push('/profile')}
        >
          <UserCircle className="h-5 w-5" />
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">{user?.full_name || 'User'}</span>
            <span className="text-xs text-muted-foreground">View Profile</span>
          </div>
        </Button>
        
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Logout</span>
        </Button>
      </div>
    </div>
  )
}
