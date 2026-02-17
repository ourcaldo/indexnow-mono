import { LoadingSpinner } from '@indexnow/ui'

export default function Loading() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading analytics...</p>
      </div>
    </div>
  )
}
