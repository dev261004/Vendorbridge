import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    return NextResponse.json(
      {
        ok: false,
        reason: 'NEXT_PUBLIC_SUPABASE_URL is missing.',
        env: {
          hasUrl: false,
          hasAnonKey: Boolean(anonKey),
          hasServiceRoleKey: Boolean(serviceRoleKey),
        },
      },
      { status: 500 }
    )
  }

  try {
    const url = new URL(supabaseUrl)
    const response = await fetch(`${url.origin}/auth/v1/health`, {
      cache: 'no-store',
    })

    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      supabaseHost: url.host,
      env: {
        hasUrl: true,
        hasAnonKey: Boolean(anonKey),
        hasServiceRoleKey: Boolean(serviceRoleKey),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          error instanceof Error
            ? error.message
            : 'Unable to reach Supabase health endpoint.',
        env: {
          hasUrl: true,
          hasAnonKey: Boolean(anonKey),
          hasServiceRoleKey: Boolean(serviceRoleKey),
        },
      },
      { status: 502 }
    )
  }
}
