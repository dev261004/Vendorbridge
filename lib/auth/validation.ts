export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 16

export const passwordRequirements =
  `Password must be ${PASSWORD_MIN}-${PASSWORD_MAX} characters, include at least one uppercase letter, one lowercase letter, one number, and one special character.`

export function isStrongPassword(password: string): boolean {
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) return false
  if (!/[A-Z]/.test(password)) return false
  if (!/[a-z]/.test(password)) return false
  if (!/[0-9]/.test(password)) return false
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) return false
  return true
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function getAuthConfirmUrl(redirectTo: string): string {
  if (typeof window === 'undefined') return '/auth/callback'
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
}
