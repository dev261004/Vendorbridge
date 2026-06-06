import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ exists: false }, { status: 400 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await admin.auth.admin.listUsers()

    if (error) {
      return NextResponse.json({ exists: false }, { status: 500 })
    }

    const exists = data.users.some(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    )

    return NextResponse.json({ exists })
  } catch {
    return NextResponse.json({ exists: false }, { status: 500 })
  }
}
