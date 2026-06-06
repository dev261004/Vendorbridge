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
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useTheme } from '@/lib/theme-provider'
import { createClient } from '@/lib/supabase/client'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'Vendors', href: '/dashboard/vendors' },
  { icon: FileText, label: 'RFQs', href: '/dashboard/rfqs' },
  { icon: Package, label: 'Quotations', href: '/dashboard/quotations' },
  { icon: Package, label: 'Purchase Orders', href: '/dashboard/purchase-orders' },
  { icon: Receipt, label: 'Invoices', href: '/dashboard/invoices' },
  { icon: BarChart3, label: 'Reports', href: '/dashboard/reports' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

export default function DashboardNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const filteredMenuItems = menuItems

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
            <p className="text-xs text-slate-500">Procurement Manager</p>
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
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
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
