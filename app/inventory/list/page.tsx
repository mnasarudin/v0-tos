import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { InventoryList } from "@/components/inventory/inventory-list"

export default function InventoryListPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <InventoryList />
      </DashboardLayout>
    </AuthGuard>
  )
}








