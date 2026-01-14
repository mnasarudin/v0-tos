import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { RoleGuard } from "@/components/role-guard"
import Link from "next/link"

export default function ProponentsHomePage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <RoleGuard resource="propenents" action="view" showAccessDenied>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Proponents</h2>
            <p className="text-muted-foreground">Register your items here.</p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/proponents/item">
                <Button>Register Item</Button>
              </Link>
            </div>
          </div>
        </RoleGuard>
      </DashboardLayout>
    </AuthGuard>
  )
}



