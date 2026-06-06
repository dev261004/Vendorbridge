'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
import { PasswordInput } from '@/components/ui/password-input'
import { formatEmail } from '@/lib/formUtils'
import { KeyRound } from 'lucide-react'

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

    const formattedEmail = formatEmail(email)

    if (!formattedEmail || !password) {
      setError('Enter both email and password.')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formattedEmail,
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

  const handleForgotPassword = () => {
    if (email.trim()) {
      sessionStorage.setItem('forgotPasswordEmail', formatEmail(email))
    }
  }

  const forgotPasswordHref = email.trim()
    ? `/auth/forgot-password?email=${encodeURIComponent(formatEmail(email))}`
    : '/auth/forgot-password'

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Login</CardTitle>
              <CardDescription>
                Enter your email below to login to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(formatEmail(e.target.value))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        href={forgotPasswordHref}
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline"
                      >
                        <KeyRound className="h-3 w-3" />
                        Forgot Password?
                      </Link>
                    </div>
                    <PasswordInput
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/auth/sign-up"
                    className="underline underline-offset-4"
                  >
                    Sign up
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
