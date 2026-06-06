'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Loader2, Mail } from 'lucide-react'
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
import {
  getResetPasswordCallbackUrl,
  normalizeEmail,
} from '@/lib/auth/validation'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const normalizedEmail = normalizeEmail(email)

    if (!normalizedEmail) {
      setError('Enter your account email address.')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        {
          redirectTo: getResetPasswordCallbackUrl(),
        }
      )

      if (error) {
        throw error
      }

      setSuccess('Password reset instructions were sent to your email.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset email.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border-border/70">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reset your password</CardTitle>
          <CardDescription>
            We will send a secure reset link to your registered email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="pl-8"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </div>

            {success && (
              <div className="flex gap-2 rounded-lg border border-green-600/30 bg-green-600/10 px-3 py-2 text-sm text-green-600">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="size-4 animate-spin" />}
              {isLoading ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remembered it?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Back to login
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
