import { UserOverviewView } from "@/components/admin/user-response/user-overview-view"

export default async function UserOverviewPage({ params }: { params: { userId: string } }) {
  const { userId } = await params
  return (
    <div className="p-10">
      <UserOverviewView userId={userId} />
    </div>
  )
}