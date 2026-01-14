"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCurrentSupplier, logoutSupplier, type SupplierAccount } from "@/lib/supplier-auth"
import { Building2, Mail, Phone, MapPin, Globe, PackagePlus, LogOut } from "lucide-react"
import { CorporateHeader } from "@/components/corporate-header"
import { useToast } from "@/hooks/use-toast"

export default function SupplierProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [supplier, setSupplier] = useState<Omit<SupplierAccount, "password"> | null>(null)

  useEffect(() => {
    const currentSupplier = getCurrentSupplier()
    if (!currentSupplier) {
      router.push("/supplier/login")
      return
    }
    setSupplier(currentSupplier)
  }, [router])

  const handleLogout = () => {
    logoutSupplier()
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    })
    router.push("/")
  }

  const handleAddItem = () => {
    router.push("/supplier/items/add")
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <CorporateHeader />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Supplier Profile</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Company Name</p>
                    <p className="text-base font-medium">{supplier.companyName}</p>
                  </div>
                  {supplier.ssmNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground">SSM Number</p>
                      <p className="text-base font-medium">{supplier.ssmNumber}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Business Category</p>
                    <p className="text-base font-medium">{supplier.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact Person</p>
                    <p className="text-base font-medium">{supplier.contactName}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </p>
                    <p className="text-base font-medium">{supplier.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone
                    </p>
                    <p className="text-base font-medium">{supplier.phone}</p>
                  </div>
                  {supplier.website && (
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Website
                      </p>
                      <a
                        href={supplier.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base font-medium text-blue-600 hover:underline"
                      >
                        {supplier.website}
                      </a>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </p>
                    <p className="text-base font-medium">{supplier.address}</p>
                    <p className="text-base font-medium">
                      {supplier.city}, {supplier.country}
                    </p>
                  </div>
                </div>
              </div>

              {supplier.businessDescription && (
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Business Description</p>
                  <p className="text-base text-muted-foreground">{supplier.businessDescription}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleAddItem} size="lg" className="w-full">
                <PackagePlus className="h-5 w-5 mr-2" />
                Add Item
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

