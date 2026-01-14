"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, Package, Building2, Mail, Phone, MapPin, Hash } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import type { Vendor } from "@/components/vendor-form"

const VENDOR_STORAGE_KEY = "app.vendors"
const ITEM_STORAGE_KEY = "app.items"

interface Item {
  id: string
  sku: string
  name: string
  category: string
  unit: string
  price: number
  minStock: number
  location: string
  image?: string
  vendorId?: string
}

function readVendors(): Vendor[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(VENDOR_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Vendor[]) : []
  } catch {
    return []
  }
}

function readItems(): Item[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(ITEM_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Item[]) : []
  } catch {
    return []
  }
}

export function VendorProfile() {
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [vendorItems, setVendorItems] = useState<Item[]>([])
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const loadProfile = () => {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        toast({
          title: "Error",
          description: "User not found. Please log in again.",
          variant: "destructive"
        })
        router.push("/")
        return
      }

      // Find vendor by matching email or contact name
      const vendors = readVendors()
      const foundVendor = vendors.find(v => 
        v.email.toLowerCase() === currentUser.email.toLowerCase() ||
        v.contactName.toLowerCase() === currentUser.name.toLowerCase() ||
        v.name.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        currentUser.name.toLowerCase().includes(v.contactName.toLowerCase())
      )

      if (!foundVendor) {
        toast({
          title: "Profile Not Found",
          description: "Vendor profile not found. Please register your business first.",
          variant: "destructive"
        })
        // Don't redirect automatically, let user see the message
        return
      }

      setVendor(foundVendor)

      // Find items associated with this vendor by vendorId
      const items = readItems()
      const itemsForVendor = items.filter(item => 
        item.vendorId === foundVendor.id
      )
      setVendorItems(itemsForVendor)
    }

    loadProfile()

    // Listen for vendor updates
    const handleStorageChange = () => {
      loadProfile()
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [toast, router])

  const handleEditProfile = () => {
    if (vendor) {
      router.push(`/vendor/add?id=${vendor.id}`)
    }
  }

  if (!vendor) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Vendor Profile</h2>
          <p className="text-muted-foreground">Your business profile and supplied items</p>
        </div>
        <Button onClick={handleEditProfile} variant="outline">
          <Edit className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Business Information
          </CardTitle>
          <CardDescription>Your registered vendor profile details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <Building2 className="w-4 h-4" />
                  Company Name
                </div>
                <p className="text-lg font-semibold">{vendor.name}</p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <Hash className="w-4 h-4" />
                  SSM Number
                </div>
                <p className="text-lg">{vendor.ssmNumber || "Not provided"}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  Category
                </div>
                <Badge variant="outline" className="text-base px-3 py-1">
                  {vendor.category}
                </Badge>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  Performance Rating
                </div>
                <Badge 
                  className={
                    vendor.performance === "excellent" ? "bg-green-100 text-green-800" :
                    vendor.performance === "good" ? "bg-blue-100 text-blue-800" :
                    vendor.performance === "average" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }
                >
                  {vendor.performance.charAt(0).toUpperCase() + vendor.performance.slice(1)}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  Contact Person
                </div>
                <p className="text-lg">{vendor.contactName}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <Mail className="w-4 h-4" />
                  Email
                </div>
                <p className="text-lg">{vendor.email}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <Phone className="w-4 h-4" />
                  Phone
                </div>
                <p className="text-lg">{vendor.phone}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <MapPin className="w-4 h-4" />
                  Address
                </div>
                <p className="text-lg">
                  {vendor.address}
                  {vendor.city && `, ${vendor.city}`}
                  {vendor.country && `, ${vendor.country}`}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Items You Supply ({vendorItems.length})
          </CardTitle>
          <CardDescription>
            Items registered in the system that are associated with your vendor account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vendorItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold mb-2">No items registered yet</p>
              <p className="text-sm">
                Items that you supply need to be registered in the system and linked to your vendor ID ({vendor.id})
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Min Stock</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendorItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-muted">
                        <img 
                          src={item.image || "/placeholder.jpg"} 
                          alt={item.name}
                          className="w-full h-full object-cover object-center"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder.jpg";
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.sku}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category}</Badge>
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      ${item.price?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell>{item.minStock}</TableCell>
                    <TableCell>{item.location}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

