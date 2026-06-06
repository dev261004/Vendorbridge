'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import Link from 'next/link'
import { formatEmail } from '@/lib/formUtils'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const success = login(formatEmail(email), password)
      if (success) {
        router.push('/dashboard')
      } else {
        setError('Invalid email or password')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 p-8">
          <div className="flex justify-center mb-8">
            <div className="bg-blue-600 text-white p-3 rounded-lg">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-white mb-2">
            VendorBridge
          </h1>
          <p className="text-center text-slate-400 mb-8">
            Procurement & Vendor Management
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(formatEmail(e.target.value))}
                placeholder="your@email.com"
                className="w-full bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-center text-slate-400 text-sm mb-4">
              Demo Credentials
            </p>
            <div className="space-y-2 text-xs text-slate-400">
              <p>
                <span className="font-medium text-slate-300">Admin:</span>{' '}
                admin@vendorbridge.com
              </p>
              <p>
                <span className="font-medium text-slate-300">Manager:</span>{' '}
                manager@vendorbridge.com
              </p>
              <p>
                <span className="font-medium text-slate-300">Finance:</span>{' '}
                finance@vendorbridge.com
              </p>
              <p>
                <span className="font-medium text-slate-300">Vendor:</span>{' '}
                vendor@acmesupplies.com
              </p>
              <p className="pt-2">
                <span className="font-medium text-slate-300">Password:</span> any
                password
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-8">
          © 2024 VendorBridge. All rights reserved.
        </p>
      </div>
    </div>
  )
}
