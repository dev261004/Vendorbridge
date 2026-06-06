'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PasswordInputProps {
  id?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
  required?: boolean
}

interface PasswordCriteria {
  minLength: boolean
  maxLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
  hasSpecial: boolean
}

function PasswordCriteriaItem({
  met,
  label,
}: {
  met: boolean
  label: string
}) {
  return (
    <li
      className={cn(
        'flex items-center gap-2 text-xs transition-colors',
        met ? 'text-green-400' : 'text-slate-500'
      )}
    >
      <span
        className={cn(
          'inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-bold',
          met
            ? 'border-green-500 bg-green-500/20 text-green-400'
            : 'border-slate-600 text-slate-600'
        )}
      >
        {met ? '\u2713' : ''}
      </span>
      {label}
    </li>
  )
}

export function PasswordCriteria({ password }: { password: string }) {
  const criteria: PasswordCriteria = {
    minLength: password.length >= 8,
    maxLength: password.length <= 16,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
  }

  return (
    <ul className="space-y-1 mt-2">
      <PasswordCriteriaItem met={criteria.minLength} label="Min 8 characters" />
      <PasswordCriteriaItem met={criteria.maxLength} label="Max 16 characters" />
      <PasswordCriteriaItem met={criteria.hasUppercase} label="One uppercase letter" />
      <PasswordCriteriaItem met={criteria.hasLowercase} label="One lowercase letter" />
      <PasswordCriteriaItem met={criteria.hasNumber} label="One number" />
      <PasswordCriteriaItem met={criteria.hasSpecial} label="One special character" />
    </ul>
  )
}

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder = '••••••••',
  className,
  required,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={cn(
          'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 pr-9 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80',
          className
        )}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        tabIndex={-1}
      >
        {visible ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}
