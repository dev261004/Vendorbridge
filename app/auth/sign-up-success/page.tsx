import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function SignUpSuccessPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border-border/70 text-center">
        <CardHeader className="space-y-3">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-green-600/30 bg-green-600/10 text-green-600">
            <CheckCircle2 className="size-7" />
          </div>
          <div>
            <CardTitle className="text-2xl">Registration received</CardTitle>
            <CardDescription>
              Check your email to confirm your account. After confirmation,
              VendorBridge will open your role-based dashboard.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link
            href="/auth/login"
            className={buttonVariants({ className: 'w-full' })}
          >
            Go to login
          </Link>
          <p className="text-xs text-muted-foreground">
            If email confirmation is disabled in Supabase, you can log in
            immediately.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
