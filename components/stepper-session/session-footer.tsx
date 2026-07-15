'use client'

type SessionFooterProps = {
  sessionName: string
}

export function SessionFooter({ sessionName }: SessionFooterProps) {
  return (
    <div className="w-full flex justify-center mt-3">
      <h3 className="text-sm text-muted-foreground font-semibold text-right uppercase">
        DAMAI SESI - {sessionName}
      </h3>
    </div>
  )
}