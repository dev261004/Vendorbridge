export function formatName(value: string): string {
  return value
    .replace(/[0-9]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function formatEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function formatPhone(value: string): string {
  return value.replace(/[^0-9]/g, '').slice(0, 10)
}

export function getPasswordCriteria(password: string) {
  return {
    minLength: password.length >= 8,
    maxLength: password.length <= 16,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
  }
}
