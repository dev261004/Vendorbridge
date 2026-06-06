'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2, LockKeyhole, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { normalizeEmail } from '@/lib/auth/validation'
import {
  AppRole,
  canAccessDashboardRoute,
  getDefaultDashboardRoute,
  isAppRole,
} from '@/lib/auth/roles'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nextPath, setNextPath] = useState('/dashboard')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get('next')
    if (next?.startsWith('/')) {
      setNextPath(next)
    }
  }, [])

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const normalizedEmail = normalizeEmail(email)

    if (!normalizedEmail || !password) {
      setError('Enter both email and password.')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (error) {
        throw error
      }

      const userId = data.user?.id
      let resolvedRole: AppRole = 'procurement_officer'

      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle()

        resolvedRole = isAppRole(profile?.role)
          ? profile.role
          : 'procurement_officer'
      }

      const defaultRoute = getDefaultDashboardRoute(resolvedRole)
      const targetRoute =
        nextPath !== '/dashboard' && canAccessDashboardRoute(nextPath, resolvedRole)
          ? nextPath
          : defaultRoute

      router.replace(targetRoute)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border-border/70">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-border bg-muted">
            <LockKeyhole className="size-6 text-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">Login to VendorBridge</CardTitle>
            <CardDescription>
              Access procurement workflows based on your assigned role.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="procurement@company.com"
                  className="pl-8"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {error && (
              <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="size-4 animate-spin" />}
              {isLoading ? 'Signing in...' : 'Login'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to VendorBridge?{' '}
            <Link
              href="/auth/sign-up"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
