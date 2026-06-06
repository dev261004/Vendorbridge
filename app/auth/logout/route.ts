import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function logoutSuccessResponse() {
  return NextResponse.json(
    { ok: true },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
}

export async function POST() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    const message = error.message.toLowerCase()

    if (message.includes('session') && message.includes('missing')) {
      return logoutSuccessResponse()
    }

    return NextResponse.json(
      { error: 'Unable to log out.' },
      { status: 500 },
    )
  }

  return logoutSuccessResponse()
}
