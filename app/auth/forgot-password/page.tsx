'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
import { useToast } from '@/components/ui/toast'
import { formatEmail } from '@/lib/formUtils'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'

function ForgotPasswordForm() {
  const searchParams = useSearchParams()
  const emailFromLogin = searchParams.get('email') || ''
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    if (emailFromLogin) {
      setEmail(formatEmail(emailFromLogin))
    }
  }, [emailFromLogin])

  const isPrefilled = !!emailFromLogin

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const trimmedEmail = formatEmail(email)

    if (!trimmedEmail) {
      showToast({
        title: 'Email required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      })
      setIsSubmitting(false)
      return
    }

    setIsChecking(true)
    try {
      const res = await fetch('/api/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      })
      const data = await res.json()

      if (!data.exists) {
        showToast({
          title: 'User not found',
          description: 'No account found with this email. Please sign up first.',
          variant: 'destructive',
        })
        setIsSubmitting(false)
        setIsChecking(false)
        return
      }

      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        showToast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        })
      } else {
        setIsSubmitted(true)
        showToast({
          title: 'Email sent!',
          description: 'Check your inbox for password reset instructions.',
          variant: 'success',
        })
      }
    } catch {
      showToast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
      setIsChecking(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Check your email</CardTitle>
              <CardDescription>
                We&apos;ve sent a password reset link to your email address.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 text-sm text-blue-400 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Forgot password?</CardTitle>
              <CardDescription>
                {isPrefilled
                  ? 'Confirm your email to receive a reset link'
                  : 'Enter your email to receive a reset link'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
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
                    {isPrefilled && emailFromLogin && (
                      <p className="text-xs text-slate-400">
                        Prefilled from your login email — you can edit it if needed
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || isChecking}
                  >
                    {isChecking ? (
                      'Checking...'
                    ) : isSubmitting ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send reset link
                      </>
                    )}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-1 text-blue-400 hover:underline"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Back to login
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

function ForgotPasswordSkeleton() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="h-8 w-48 bg-slate-700 rounded animate-pulse" />
              <div className="h-4 w-64 bg-slate-700 rounded animate-pulse mt-2" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <div className="h-4 w-12 bg-slate-700 rounded animate-pulse" />
                  <div className="h-8 bg-slate-700 rounded animate-pulse" />
                </div>
                <div className="h-8 bg-slate-700 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotPasswordSkeleton />}>
      <ForgotPasswordForm />
    </Suspense>
  )
}
