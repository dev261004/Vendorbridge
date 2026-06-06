'use client'

import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  Package,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Sun,
  Moon,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useTheme } from '@/lib/theme-provider'
import { createClient } from '@/lib/supabase/client'
import { AppRole, dashboardRouteRoles, isAppRole, roleLabels } from '@/lib/auth/roles'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'Vendors', href: '/dashboard/vendors' },
  { icon: FileText, label: 'RFQs', href: '/dashboard/rfqs' },
  { icon: Package, label: 'Quotations', href: '/dashboard/quotations' },
  { icon: CheckCircle, label: 'Approvals', href: '/dashboard/approvals' },
  { icon: Package, label: 'Purchase Orders', href: '/dashboard/purchase-orders' },
  { icon: Receipt, label: 'Invoices', href: '/dashboard/invoices' },
  { icon: BarChart3, label: 'Reports', href: '/dashboard/reports' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

interface DashboardNavigationProps {
  initialRole?: AppRole
}

interface ProfileSummary {
  role: AppRole
  first_name: string | null
  last_name: string | null
}

export default function DashboardNavigation({
  initialRole = 'procurement_officer',
}: DashboardNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<ProfileSummary | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role, first_name, last_name')
          .eq('id', user.id)
          .maybeSingle()

        if (data) {
          setProfile({
            role: isAppRole(data.role) ? data.role : initialRole,
            first_name: data.first_name,
            last_name: data.last_name,
          })
        }
      }
    }
    getUser()
  }, [initialRole])

  const handleLogout = async () => {
    if (isLoggingOut) {
      return
    }

    setIsLoggingOut(true)
    setLogoutError(null)

    try {
      const response = await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      })

      if (!response.ok) {
        throw new Error('Unable to log out.')
      }

      const supabase = createClient()
      await supabase.auth.signOut({ scope: 'local' })

      setUser(null)
      setProfile(null)
      router.replace('/auth/login')
      router.refresh()
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : 'Unable to log out.',
      )
      setIsLoggingOut(false)
    }
  }

  const activeRole = profile?.role || initialRole
  const fullName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(' ')
  const filteredMenuItems = menuItems.filter((item) => {
    const route = dashboardRouteRoles.find((route) => route.href === item.href)
    return !route || route.roles.includes(activeRole)
  })

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-slate-800 border border-slate-700 p-2 rounded-lg"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'w-64 bg-slate-800 border-r border-slate-700 flex flex-col transition-all duration-300',
          'fixed inset-y-0 left-0 z-40 md:relative md:z-0 md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">VendorBridge</h1>
              <p className="text-xs text-slate-400">ERP System</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="px-6 py-4 border-b border-slate-700">
            <p className="text-sm text-slate-300 font-medium">{user.email}</p>
            {fullName && <p className="text-xs text-slate-400">{fullName}</p>}
            <p className="text-xs text-slate-500">{roleLabels[activeRole]}</p>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Theme Toggle & Logout */}
        <div className="p-4 border-t border-slate-700 space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">
              {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </span>
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            aria-busy={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingOut ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogOut className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </span>
          </button>
          {logoutError && (
            <p className="px-4 text-xs text-red-300">{logoutError}</p>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
