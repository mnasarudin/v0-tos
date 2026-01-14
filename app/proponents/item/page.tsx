import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProponentsItemForm } from "@/components/proponents-item-form"
import { RoleGuard } from "@/components/role-guard"

export default function ProponentsItemPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <RoleGuard resource="propenents" action="create" showAccessDenied>
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Register Item</h2>
              <p className="text-muted-foreground">Add items your business supplies.</p>
            </div>
            <ProponentsItemForm />
          </div>
        </RoleGuard>
      </DashboardLayout>
    </AuthGuard>
  )
}



