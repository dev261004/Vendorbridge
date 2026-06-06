import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const errorMessages: Record<string, string> = {
  'invalid-confirmation-link':
    'This confirmation link is missing required information. Please request a new email.',
  'confirmation-failed':
    'This confirmation link is invalid or expired. Please request a new email and try again.',
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const error = params?.error
  const message = error
    ? errorMessages[error] ?? `Code error: ${error}`
    : 'An unspecified error occurred.'

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Sorry, something went wrong.
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{message}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
