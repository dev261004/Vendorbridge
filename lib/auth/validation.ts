export const passwordRequirements =
  'Use at least 8 characters with uppercase, lowercase, number, and symbol.'

export function isStrongPassword(password: string) {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  )
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function getAuthCallbackUrl(next = '/dashboard') {
  if (typeof window === 'undefined') {
    return `/auth/callback?next=${encodeURIComponent(next)}`
  }

  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
}

export function getAuthConfirmUrl(next = '/dashboard') {
  if (typeof window === 'undefined') {
    return `/auth/confirm?next=${encodeURIComponent(next)}`
  }

  return `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`
}

export function getResetPasswordCallbackUrl() {
  if (typeof window === 'undefined') {
    return '/auth/callback?next=/auth/reset-password'
  }

  return `${window.location.origin}/auth/callback?next=/auth/reset-password`
}