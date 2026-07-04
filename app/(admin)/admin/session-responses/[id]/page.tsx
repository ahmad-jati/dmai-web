import { SessionResponsesView } from "@/components/admin/responses/session-responses-view"

export default async function SessionResponsesPage({ params }: { params: { id: string } }) {
  const { id } = await params
  return (
    <div className="p-10">
      <SessionResponsesView sessionId={id} />
    </div>
  )
}