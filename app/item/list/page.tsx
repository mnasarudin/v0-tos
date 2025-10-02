import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ItemList } from "@/components/item-list"

export default function ItemListPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <ItemList />
      </DashboardLayout>
    </AuthGuard>
  )
}








