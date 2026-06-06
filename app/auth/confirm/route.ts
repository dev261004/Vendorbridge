import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const emailOtpTypes = [
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
] as const

type EmailOtpType = (typeof emailOtpTypes)[number]

function isEmailOtpType(type: string | null): type is EmailOtpType {
  return emailOtpTypes.some((allowedType) => allowedType === type)
}

function getSafeNextPath(next: string | null, fallback = '/dashboard') {
  if (next?.startsWith('/') && !next.startsWith('//')) {
    return next
  }

  return fallback
}

function redirectToError(origin: string, error: string) {
  return NextResponse.redirect(
    `${origin}/auth/error?error=${encodeURIComponent(error)}`
  )
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const fallbackNext = type === 'recovery' ? '/auth/reset-password' : '/dashboard'
  const next = getSafeNextPath(searchParams.get('next'), fallbackNext)
  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return redirectToError(origin, 'confirmation-failed')
    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  if (!tokenHash || !isEmailOtpType(type)) {
    return redirectToError(origin, 'invalid-confirmation-link')
  }

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  })

  if (error) {
    return redirectToError(origin, 'confirmation-failed')
  }

  return NextResponse.redirect(`${origin}${next}`)
}
