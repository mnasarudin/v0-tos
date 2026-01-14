"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import type { Vendor } from "@/components/vendor-form"

export type ItemCategory = "General" | "Office" | "Industrial" | "IT" | "Logistics"

export interface Variant {
  color?: string
  size?: string
  quantity: number
  image?: string
}

export interface Item {
  id: string
  sku: string
  name: string
  category: ItemCategory
  unit: string
  price: number
  minStock: number
  location: string
  description?: string
  image?: string
  vendorId?: string
  availableSizes?: string[] // Array of size strings with quantities (WooCommerce style: "xs : 10 | s : 5 | m : 2")
  availableColors?: string[] // Array of color strings with quantities (WooCommerce style: "red : 10 | yellow : 5 | blue : 2")
  variants?: Variant[] // Array of variants with color/size and quantity
}

const ITEM_STORAGE_KEY = "app.items"
const VENDOR_STORAGE_KEY = "app.vendors"

function isValidImageUrl(url: string | undefined): boolean {
  if (!url || url.trim() === "") return false
  if (url.match(/^[A-Z]:[/\\]/)) return false
  return true
}

function sanitizeImageUrl(url: string | undefined): string {
  if (!url || url.trim() === "" || !isValidImageUrl(url)) {
    return "/placeholder.jpg"
  }
  return url
}

function readItems(): Item[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(ITEM_STORAGE_KEY)
    const items = raw ? (JSON.parse(raw) as Item[]) : []
    const sanitizedItems = items.map(item => ({
      ...item,
      image: sanitizeImageUrl(item.image)
    }))
    
    const needsUpdate = sanitizedItems.some((item, idx) => 
      item.image !== (items[idx].image || undefined)
    )
    if (needsUpdate) {
      localStorage.setItem(ITEM_STORAGE_KEY, JSON.stringify(sanitizedItems))
    }
    
    return sanitizedItems
  } catch {
    return []
  }
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

function writeVendors(vendors: Vendor[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(VENDOR_STORAGE_KEY, JSON.stringify(vendors))
}

function upsertVendor(vendor: Vendor) {
  const vendors = readVendors()
  const idx = vendors.findIndex(v => v.id === vendor.id)
  if (idx >= 0) vendors[idx] = vendor
  else vendors.push(vendor)
  writeVendors(vendors)
}

function writeItems(items: Item[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(ITEM_STORAGE_KEY, JSON.stringify(items))
}

function upsertItem(item: Item) {
  const items = readItems()
  const idx = items.findIndex(i => i.id === item.id)
  if (idx >= 0) items[idx] = item
  else items.push(item)
  writeItems(items)
}

export function ProponentsItemForm() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editingId = searchParams?.get("id") || ""
  const user = getCurrentUser()

  const existing = useMemo(() => {
    if (!editingId) return undefined
    return readItems().find(i => i.id === editingId)
  }, [editingId])

  const [form, setForm] = useState<Item>(() => {
    if (existing) {
      return {
        ...existing,
        variants: existing.variants || [],
        availableSizes: existing.availableSizes || [],
        availableColors: existing.availableColors || []
      }
    }
    return {
      id: crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      sku: "",
      name: "",
      category: "General",
      unit: "pcs",
      price: 0,
      minStock: 0,
      location: "Main",
      description: "",
      image: "",
      vendorId: "",
      availableSizes: [],
      availableColors: [],
      variants: [],
    }
  })

  const [vendor, setVendor] = useState<Vendor | null>(null)

  // Helper functions to parse and format WooCommerce-style attributes with quantities
  interface AttributeWithQuantity {
    name: string
    quantity: number
  }

  const parseAttributes = (input: string): AttributeWithQuantity[] => {
    if (!input || !input.trim()) return []
    return input
      .split('|')
      .map(attr => {
        const trimmed = attr.trim()
        if (!trimmed) return null
        
        // Check if it has quantity (format: "name : quantity")
        const colonIndex = trimmed.indexOf(':')
        if (colonIndex > 0) {
          const name = trimmed.substring(0, colonIndex).trim()
          const quantityStr = trimmed.substring(colonIndex + 1).trim()
          const quantity = parseInt(quantityStr) || 0
          return { name, quantity }
        } else {
          // No quantity specified, default to 0
          return { name: trimmed, quantity: 0 }
        }
      })
      .filter((attr): attr is AttributeWithQuantity => attr !== null && attr.name.length > 0)
  }

  const formatAttributes = (attributes: AttributeWithQuantity[]): string => {
    if (!attributes || attributes.length === 0) return ""
    return attributes.map(attr => `${attr.name} : ${attr.quantity}`).join(' | ')
  }

  // Parse sizes and colors with quantities from form
  const parseSizesFromForm = (formData: Item): AttributeWithQuantity[] => {
    if (!formData.availableSizes || formData.availableSizes.length === 0) return []
    return formData.availableSizes.map(size => {
      if (typeof size === 'string') {
        const colonIndex = size.indexOf(':')
        if (colonIndex > 0) {
          const name = size.substring(0, colonIndex).trim()
          const quantityStr = size.substring(colonIndex + 1).trim()
          const quantity = parseInt(quantityStr) || 0
          return { name, quantity }
        }
        return { name: size, quantity: 0 }
      }
      return { name: (size as any).name || '', quantity: (size as any).quantity || 0 }
    }).filter(attr => attr.name.length > 0)
  }

  const parseColorsFromForm = (formData: Item): AttributeWithQuantity[] => {
    if (!formData.availableColors || formData.availableColors.length === 0) return []
    return formData.availableColors.map(color => {
      if (typeof color === 'string') {
        const colonIndex = color.indexOf(':')
        if (colonIndex > 0) {
          const name = color.substring(0, colonIndex).trim()
          const quantityStr = color.substring(colonIndex + 1).trim()
          const quantity = parseInt(quantityStr) || 0
          return { name, quantity }
        }
        return { name: color, quantity: 0 }
      }
      return { name: (color as any).name || '', quantity: (color as any).quantity || 0 }
    }).filter(attr => attr.name.length > 0)
  }

  // State for attribute inputs
  const [sizeAttributeInput, setSizeAttributeInput] = useState("")
  const [colorAttributeInput, setColorAttributeInput] = useState("")
  
  // Parse sizes and colors with quantities from current form state
  const parsedSizes = parseSizesFromForm(form)
  const parsedColors = parseColorsFromForm(form)

  useEffect(() => {
    // Auto-load vendor based on current user for vendor role
    if (user?.role === "Vendor") {
      const vendors = readVendors()
      const foundVendor = vendors.find(v => 
        v.email.toLowerCase() === user.email.toLowerCase() ||
        v.contactName.toLowerCase() === user.name.toLowerCase() ||
        v.name.toLowerCase().includes(user.name.toLowerCase()) ||
        user.name.toLowerCase().includes(v.contactName.toLowerCase())
      )
      
      if (foundVendor) {
        setVendor(foundVendor)
        setForm(prev => ({ ...prev, vendorId: foundVendor.id }))
      }
    }

    if (existing) {
      setForm({
        ...existing,
        variants: existing.variants || [],
        availableSizes: existing.availableSizes || [],
        availableColors: existing.availableColors || []
      })
      
      // Parse existing sizes and colors to format them correctly
      const existingSizes = parseSizesFromForm({
        ...existing,
        variants: existing.variants || [],
        availableSizes: existing.availableSizes || [],
        availableColors: existing.availableColors || []
      })
      const existingColors = parseColorsFromForm({
        ...existing,
        variants: existing.variants || [],
        availableSizes: existing.availableSizes || [],
        availableColors: existing.availableColors || []
      })
      setSizeAttributeInput(formatAttributes(existingSizes))
      setColorAttributeInput(formatAttributes(existingColors))
      
      // Load vendor info if item has vendorId
      if (existing.vendorId) {
        const vendors = readVendors()
        const foundVendor = vendors.find(v => v.id === existing.vendorId)
        if (foundVendor) {
          setVendor(foundVendor)
        }
      }
    }
    
    // Preload mock data if none exists
    const current = readItems()
    if (current.length === 0) {
      writeItems([
        { id: "i1", sku: "ITM-001", name: "Portable Router", category: "IT", unit: "pcs", price: 45.00, minStock: 0, location: "Main", description: "Portable router for internet connectivity", image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&auto=format&fit=crop", vendorId: "v3" },
      ])
    }
  }, [existing, user])

  function handleChange<T extends keyof Item>(field: T, value: Item[T]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleCategoryChange(value: string) {
    handleChange("category", value as ItemCategory)
    // Update vendor category if vendor exists
    if (vendor) {
      const updatedVendor = { ...vendor, category: value }
      upsertVendor(updatedVendor)
      setVendor(updatedVendor)
    }
  }

  function handleSubmit() {
    if (!form.sku || !form.name) {
      toast({ title: "Missing required fields", description: "SKU and Name are required" })
      return
    }
    
    // For vendor role, ensure vendor is linked
    if (user?.role === "Vendor" && !vendor) {
      toast({ 
        title: "Vendor Profile Required", 
        description: "Please register your business profile first before adding items.",
        variant: "destructive"
      })
      router.push("/propenents/register")
      return
    }
    
    // Use existing vendor if available, otherwise create minimal vendor record (for non-vendor roles)
    let vendorRecord: Vendor | null = null
    if (vendor) {
      vendorRecord = vendor
    } else if (user?.role === "Vendor") {
      // For vendor role, vendor must exist
      toast({ 
        title: "Vendor Profile Required", 
        description: "Please register your business profile first.",
        variant: "destructive"
      })
      router.push("/propenents/register")
      return
    }
    
    // Link item to vendor if vendor exists
    const finalForm = vendorRecord ? { ...form, vendorId: vendorRecord.id } : form
    const sanitizedForm = {
      ...finalForm,
      image: sanitizeImageUrl(finalForm.image)
    }
    
    upsertItem(sanitizedForm)
    toast({ 
      title: existing ? "Item updated" : "Item registered", 
      description: vendorRecord 
        ? `${form.sku} - ${form.name} linked to ${vendorRecord.name}` 
        : `${form.sku} - ${form.name} registered successfully`
    })
    router.push("/proponents/item")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input id="sku" value={form.sku} onChange={e => handleChange("sku", e.target.value)} placeholder="ITM-001" />
            </div>
            <div>
              <Label htmlFor="name">Item Name *</Label>
              <Input id="name" value={form.name} onChange={e => handleChange("name", e.target.value)} placeholder="Safety Helmet" />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select id="category" value={form.category} onChange={e => handleCategoryChange(e.target.value)}>
                <option>General</option>
                <option>Office</option>
                <option>Industrial</option>
                <option>IT</option>
                <option>Logistics</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" value={form.unit} onChange={e => handleChange("unit", e.target.value)} placeholder="pcs" />
            </div>
            <div>
              <Label htmlFor="price">Unit Price ($)</Label>
              <Input id="price" type="number" step="0.01" min="0" value={form.price} onChange={e => handleChange("price", Number(e.target.value))} placeholder="0.00" />
            </div>
            <div>
              <Label htmlFor="minStock">Min Stock</Label>
              <Input id="minStock" type="number" value={form.minStock} onChange={e => handleChange("minStock", Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={form.location} onChange={e => handleChange("location", e.target.value)} placeholder="Main" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={form.description || ""} onChange={e => handleChange("description", e.target.value)} placeholder="Optional description" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="image">Image URL</Label>
              <Input id="image" value={form.image || ""} onChange={e => handleChange("image", e.target.value)} placeholder="https://example.com/image.jpg" />
              {form.image && !isValidImageUrl(form.image) && (
                <p className="text-sm text-amber-600 mt-1">
                  ⚠️ Invalid image URL. Please use a web URL or a relative path.
                </p>
              )}
              {form.image && (
                <div className="mt-2">
                  <Label className="text-sm text-muted-foreground">Preview:</Label>
                  <div className="w-24 h-24 rounded-md overflow-hidden bg-muted border mt-1">
                    <img 
                      src={isValidImageUrl(form.image) ? form.image : "/placeholder.jpg"} 
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.jpg";
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Product Attributes Section (WooCommerce Style) */}
          <div className="border-t pt-6 mt-6">
            <Label className="text-base font-semibold mb-4 block">Product Attributes</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Size Attribute */}
              <div>
                <Label htmlFor="size-attributes" className="text-base font-semibold mb-2 block">
                  Size
                </Label>
                <Input
                  id="size-attributes"
                  value={sizeAttributeInput}
                  onChange={(e) => {
                    const inputValue = e.target.value
                    setSizeAttributeInput(inputValue)
                    const parsed = parseAttributes(inputValue)
                    // Store as strings in format "name : quantity"
                    const sizeStrings = parsed.map(attr => `${attr.name} : ${attr.quantity}`)
                    handleChange("availableSizes", sizeStrings)
                    
                    // Auto-update variants with quantities from attributes
                    const currentVariants = form.variants || []
                    const updatedVariants = [...currentVariants]
                    
                    parsed.forEach(sizeAttr => {
                      // Update or create variants for this size (without color)
                      const variantIndex = updatedVariants.findIndex(v => 
                        v.size === sizeAttr.name && !v.color
                      )
                      
                      if (sizeAttr.quantity > 0) {
                        if (variantIndex >= 0) {
                          updatedVariants[variantIndex] = {
                            ...updatedVariants[variantIndex],
                            quantity: sizeAttr.quantity
                          }
                        } else {
                          updatedVariants.push({
                            size: sizeAttr.name,
                            quantity: sizeAttr.quantity
                          })
                        }
                      } else if (variantIndex >= 0) {
                        // Remove variant if quantity is 0
                        updatedVariants.splice(variantIndex, 1)
                      }
                      
                      // Also update variants that have this size with colors
                      // Get current parsed colors from form state
                      const currentParsedColors = parseColorsFromForm(form)
                      currentParsedColors.forEach(colorAttr => {
                        const comboIndex = updatedVariants.findIndex(v =>
                          v.size === sizeAttr.name && v.color === colorAttr.name
                        )
                        // Don't auto-update combo variants, let user set them manually
                      })
                    })
                    
                    // Remove variants for sizes that no longer exist
                    const sizeNames = parsed.map(s => s.name)
                    const filteredVariants = updatedVariants.filter(v => 
                      !v.size || sizeNames.includes(v.size)
                    )
                    
                    handleChange("variants", filteredVariants)
                  }}
                  placeholder="xs : 10 | s : 5 | m : 2 | l : 10 | xl : 8 | xxl : 4"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Enter sizes with quantities separated by pipe (|). Example: xs : 10 | s : 5 | m : 2 | l : 10 | xl : 8 | xxl : 4
                </p>
                {parsedSizes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {parsedSizes.map((size, idx) => (
                      <Badge key={idx} variant="outline" className="font-medium">
                        {size.name} : {size.quantity}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Color Attribute */}
              <div>
                <Label htmlFor="color-attributes" className="text-base font-semibold mb-2 block">
                  Color
                </Label>
                <Input
                  id="color-attributes"
                  value={colorAttributeInput}
                  onChange={(e) => {
                    const inputValue = e.target.value
                    setColorAttributeInput(inputValue)
                    const parsed = parseAttributes(inputValue)
                    // Store as strings in format "name : quantity"
                    const colorStrings = parsed.map(attr => `${attr.name} : ${attr.quantity}`)
                    handleChange("availableColors", colorStrings)
                    
                    // Auto-update variants with quantities from attributes
                    const currentVariants = form.variants || []
                    const updatedVariants = [...currentVariants]
                    
                    parsed.forEach(colorAttr => {
                      // Update or create variants for this color (without size)
                      const variantIndex = updatedVariants.findIndex(v => 
                        v.color === colorAttr.name && !v.size
                      )
                      
                      if (colorAttr.quantity > 0) {
                        if (variantIndex >= 0) {
                          updatedVariants[variantIndex] = {
                            ...updatedVariants[variantIndex],
                            quantity: colorAttr.quantity
                          }
                        } else {
                          updatedVariants.push({
                            color: colorAttr.name,
                            quantity: colorAttr.quantity
                          })
                        }
                      } else if (variantIndex >= 0) {
                        // Remove variant if quantity is 0
                        updatedVariants.splice(variantIndex, 1)
                      }
                      
                      // Also update variants that have this color with sizes
                      // Get current parsed sizes from form state
                      const currentParsedSizes = parseSizesFromForm(form)
                      currentParsedSizes.forEach(sizeAttr => {
                        const comboIndex = updatedVariants.findIndex(v =>
                          v.color === colorAttr.name && v.size === sizeAttr.name
                        )
                        // Don't auto-update combo variants, let user set them manually
                      })
                    })
                    
                    // Remove variants for colors that no longer exist
                    const colorNames = parsed.map(c => c.name)
                    const filteredVariants = updatedVariants.filter(v => 
                      !v.color || colorNames.includes(v.color)
                    )
                    
                    handleChange("variants", filteredVariants)
                  }}
                  placeholder="red : 10 | yellow : 5 | blue : 2 | green : 8"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Enter colors with quantities separated by pipe (|). Example: red : 10 | yellow : 5 | blue : 2 | green : 8
                </p>
                {parsedColors.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {parsedColors.map((color, idx) => (
                      <Badge key={idx} variant="outline" className="font-medium">
                        {color.name} : {color.quantity}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Variant Quantity Management Section */}
          {((parsedSizes.length > 0) || (parsedColors.length > 0)) && (
            <div className="border-t pt-6 mt-6">
              <Label className="text-base font-semibold mb-4 block">Set Quantity for Each Size & Color Combination</Label>
              <div className="space-y-4">
                {parsedColors.length > 0 && parsedSizes.length > 0 ? (
                  // Matrix view when both sizes and colors are selected
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 font-semibold border-r">Color / Size</th>
                          {parsedSizes.map((size, idx) => (
                            <th key={idx} className="text-center p-3 font-semibold border-r last:border-r-0">
                              <div>{size.name}</div>
                              <div className="text-xs text-muted-foreground font-normal">({size.quantity})</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedColors.map((color, colorIdx) => (
                          <tr key={colorIdx} className={`border-b ${colorIdx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}`}>
                            <td className="p-3 font-medium border-r">
                              <div>{color.name}</div>
                              <div className="text-xs text-muted-foreground">({color.quantity})</div>
                            </td>
                            {parsedSizes.map((size, sizeIdx) => {
                              const variant = form.variants?.find(v => 
                                v.color === color.name && v.size === size.name
                              )
                              const quantity = variant?.quantity || 0
                              return (
                                <td key={sizeIdx} className="text-center p-3 border-r last:border-r-0">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={quantity}
                                    onChange={(e) => {
                                      const newQuantity = parseInt(e.target.value) || 0
                                      const currentVariants = form.variants || []
                                      const variantIndex = currentVariants.findIndex(v => 
                                        v.color === color.name && v.size === size.name
                                      )
                                      
                                      let updatedVariants: Variant[]
                                      if (newQuantity > 0) {
                                        if (variantIndex >= 0) {
                                          // Update existing variant
                                          updatedVariants = currentVariants.map((v, idx) =>
                                            idx === variantIndex ? { ...v, quantity: newQuantity } : v
                                          )
                                        } else {
                                          // Add new variant
                                          updatedVariants = [...currentVariants, {
                                            color: color.name,
                                            size: size.name,
                                            quantity: newQuantity
                                          }]
                                        }
                                      } else {
                                        // Remove variant if quantity is 0
                                        updatedVariants = currentVariants.filter((v, idx) => idx !== variantIndex)
                                      }
                                      
                                      handleChange("variants", updatedVariants)
                                    }}
                                    className="w-20 text-center"
                                    placeholder="0"
                                  />
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : parsedColors.length > 0 ? (
                  // Colors only view
                  <div className="space-y-3">
                    {parsedColors.map((color, idx) => {
                      const variant = form.variants?.find(v => v.color === color.name && !v.size)
                      const quantity = variant?.quantity || color.quantity || 0
                      return (
                        <div key={idx} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="font-medium">{color.name}</span>
                            <span className="text-xs text-muted-foreground">(Default: {color.quantity})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label>Quantity:</Label>
                            <Input
                              type="number"
                              min="0"
                              value={quantity}
                              onChange={(e) => {
                                const newQuantity = parseInt(e.target.value) || 0
                                const currentVariants = form.variants || []
                                const variantIndex = currentVariants.findIndex(v => 
                                  v.color === color.name && !v.size
                                )
                                
                                let updatedVariants: Variant[]
                                if (newQuantity > 0) {
                                  if (variantIndex >= 0) {
                                    updatedVariants = currentVariants.map((v, idx) =>
                                      idx === variantIndex ? { ...v, quantity: newQuantity } : v
                                    )
                                  } else {
                                    updatedVariants = [...currentVariants, {
                                      color: color.name,
                                      quantity: newQuantity
                                    }]
                                  }
                                } else {
                                  updatedVariants = currentVariants.filter((v, idx) => idx !== variantIndex)
                                }
                                
                                handleChange("variants", updatedVariants)
                              }}
                              className="w-24"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : parsedSizes.length > 0 ? (
                  // Sizes only view
                  <div className="space-y-3">
                    {parsedSizes.map((size, idx) => {
                      const variant = form.variants?.find(v => v.size === size.name && !v.color)
                      const quantity = variant?.quantity || size.quantity || 0
                      return (
                        <div key={idx} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="flex-1">
                            <span className="font-medium">{size.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">(Default: {size.quantity})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label>Quantity:</Label>
                            <Input
                              type="number"
                              min="0"
                              value={quantity}
                              onChange={(e) => {
                                const newQuantity = parseInt(e.target.value) || 0
                                const currentVariants = form.variants || []
                                const variantIndex = currentVariants.findIndex(v => 
                                  v.size === size.name && !v.color
                                )
                                
                                let updatedVariants: Variant[]
                                if (newQuantity > 0) {
                                  if (variantIndex >= 0) {
                                    updatedVariants = currentVariants.map((v, idx) =>
                                      idx === variantIndex ? { ...v, quantity: newQuantity } : v
                                    )
                                  } else {
                                    updatedVariants = [...currentVariants, {
                                      size: size.name,
                                      quantity: newQuantity
                                    }]
                                  }
                                } else {
                                  updatedVariants = currentVariants.filter((v, idx) => idx !== variantIndex)
                                }
                                
                                handleChange("variants", updatedVariants)
                              }}
                              className="w-24"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : null}
                <p className="text-sm text-muted-foreground">
                  Enter the quantity available for each size and color combination. Leave as 0 if not available.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button type="button" onClick={handleSubmit}>{existing ? "Update" : "Register"}</Button>
            <Button type="button" variant="outline" onClick={() => router.push("/proponents")}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProponentsItemForm


