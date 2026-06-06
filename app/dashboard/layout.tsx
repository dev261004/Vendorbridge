'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import DashboardNavigation from '@/components/DashboardNavigation'
import { Loader } from 'lucide-react'
import {
  AppRole,
  canAccessDashboardRoute,
  isAppRole,
} from '@/lib/auth/roles'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [role, setRole] = useState<AppRole>('procurement_officer')

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`)
        setIsLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      const resolvedRole = isAppRole(profile?.role)
        ? profile.role
        : 'procurement_officer'

      if (!canAccessDashboardRoute(pathname, resolvedRole)) {
        router.replace('/dashboard')
        setIsLoading(false)
        return
      }

      setRole(resolvedRole)
      setIsAuthenticated(true)
      setIsLoading(false)
    }

    checkAuth()
  }, [pathname, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background dark:bg-slate-900">
        <Loader className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-background dark:bg-slate-900">
      <DashboardNavigation initialRole={role} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
