"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { Pencil, Trash2, Plus } from "lucide-react"

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
  availableSizes?: string[] // Array of size names (WooCommerce style: "xs | s | m | l")
  availableColors?: string[] // Array of color names (WooCommerce style: "red | yellow | blue")
  variants?: Variant[] // Array of variants with color/size and quantity
}

const ITEM_STORAGE_KEY = "app.items"
const VENDOR_STORAGE_KEY = "app.vendors"
const SIZE_STORAGE_KEY = "app.sizes"
const COLOR_STORAGE_KEY = "app.colors"

interface Size {
  id: string
  name: string
  description?: string
  defaultQuantity?: number
}

interface Color {
  id: string
  name: string
  hexCode?: string
  description?: string
}

function readSizes(): Size[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(SIZE_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Size[]) : []
  } catch {
    return []
  }
}

function writeSizes(sizes: Size[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(SIZE_STORAGE_KEY, JSON.stringify(sizes))
}

function readColors(): Color[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(COLOR_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Color[]) : []
  } catch {
    return []
  }
}

function writeColors(colors: Color[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(COLOR_STORAGE_KEY, JSON.stringify(colors))
}

function isValidImageUrl(url: string | undefined): boolean {
  if (!url || url.trim() === "") return false
  // Check if it's an absolute Windows path (C:/ or C:\)
  if (url.match(/^[A-Z]:[/\\]/)) return false
  // Check if it's a valid URL or relative path
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
    // Sanitize image URLs
    const sanitizedItems = items.map(item => ({
      ...item,
      image: sanitizeImageUrl(item.image)
    }))
    
    // Update localStorage if images were sanitized
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

type Vendor = {
  id: string
  name: string
  category: string
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

export function ItemForm() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editingId = searchParams?.get("id") || ""

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

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [sizes, setSizes] = useState<Size[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [isSizeDialogOpen, setIsSizeDialogOpen] = useState(false)
  const [isColorDialogOpen, setIsColorDialogOpen] = useState(false)
  const [editingSize, setEditingSize] = useState<Size | null>(null)
  const [editingColor, setEditingColor] = useState<Color | null>(null)
  const [sizeForm, setSizeForm] = useState({ name: "", description: "", defaultQuantity: "" })
  const [colorForm, setColorForm] = useState({ name: "", hexCode: "", description: "" })

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

  const formatAttributesNamesOnly = (attributes: AttributeWithQuantity[]): string[] => {
    if (!attributes || attributes.length === 0) return []
    return attributes.map(attr => attr.name)
  }

  // Parse sizes and colors with quantities
  const parseSizesFromForm = (): AttributeWithQuantity[] => {
    if (!form.availableSizes || form.availableSizes.length === 0) return []
    // If availableSizes contains strings (old format), convert them
    return form.availableSizes.map(size => {
      if (typeof size === 'string') {
        // Check if it's already in "name : quantity" format
        const colonIndex = size.indexOf(':')
        if (colonIndex > 0) {
          const name = size.substring(0, colonIndex).trim()
          const quantityStr = size.substring(colonIndex + 1).trim()
          const quantity = parseInt(quantityStr) || 0
          return { name, quantity }
        }
        return { name: size, quantity: 0 }
      }
      return { name: size.name || '', quantity: size.quantity || 0 }
    }).filter(attr => attr.name.length > 0)
  }

  const parseColorsFromForm = (): AttributeWithQuantity[] => {
    if (!form.availableColors || form.availableColors.length === 0) return []
    // If availableColors contains strings (old format), convert them
    return form.availableColors.map(color => {
      if (typeof color === 'string') {
        // Check if it's already in "name : quantity" format
        const colonIndex = color.indexOf(':')
        if (colonIndex > 0) {
          const name = color.substring(0, colonIndex).trim()
          const quantityStr = color.substring(colonIndex + 1).trim()
          const quantity = parseInt(quantityStr) || 0
          return { name, quantity }
        }
        return { name: color, quantity: 0 }
      }
      return { name: color.name || '', quantity: color.quantity || 0 }
    }).filter(attr => attr.name.length > 0)
  }

  const parsedSizes = parseSizesFromForm()
  const parsedColors = parseColorsFromForm()
  
  // State for attribute inputs
  const [sizeAttributeInput, setSizeAttributeInput] = useState(() => formatAttributes(parsedSizes))
  const [colorAttributeInput, setColorAttributeInput] = useState(() => formatAttributes(parsedColors))

  useEffect(() => {
    const loadedSizes = readSizes()
    const loadedColors = readColors()
    setSizes(loadedSizes)
    setColors(loadedColors)
    setVendors(readVendors())
    
    if (existing) {
      setForm({
        ...existing,
        variants: existing.variants || [],
        availableSizes: existing.availableSizes || [],
        availableColors: existing.availableColors || []
      })
      // Parse existing sizes and colors to format them correctly
      const existingSizes = parseSizesFromForm()
      const existingColors = parseColorsFromForm()
      setSizeAttributeInput(formatAttributes(existingSizes))
      setColorAttributeInput(formatAttributes(existingColors))
    }
    const current = readItems()
    if (current.length === 0) {
      writeItems([
        { id: "i1", sku: "ITM-001", name: "Portable Router", category: "IT", unit: "pcs", price: 45.00, minStock: 0, location: "Main", description: "Portable router for internet connectivity", image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&auto=format&fit=crop", vendorId: "v3" },
      ])
    }
  }, [existing])

  function handleChange<T extends keyof Item>(field: T, value: Item[T]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleSubmit() {
    if (!form.sku || !form.name) {
      toast({ title: "Missing required fields", description: "SKU and Name are required" })
      return
    }
    
    // Sanitize image URL before saving
    const sanitizedForm = {
      ...form,
      image: sanitizeImageUrl(form.image)
    }
    
    upsertItem(sanitizedForm)
    toast({ title: existing ? "Item updated" : "Item registered", description: `${form.sku} - ${form.name}` })
    router.push("/item/list")
  }

  // Size Management
  const handleSizeSubmit = () => {
    if (!sizeForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Size name is required",
        variant: "destructive"
      })
      return
    }

    const existingSizes = readSizes()
    
    if (editingSize) {
      const updatedSizes = existingSizes.map(s =>
        s.id === editingSize.id
          ? { 
              ...s, 
              name: sizeForm.name.trim(), 
              description: sizeForm.description.trim() || undefined,
              defaultQuantity: sizeForm.defaultQuantity ? parseInt(sizeForm.defaultQuantity) || undefined : undefined
            }
          : s
      )
      writeSizes(updatedSizes)
      setSizes(updatedSizes)
      toast({ title: "Size Updated", description: `Size "${sizeForm.name}" has been updated.` })
    } else {
      if (existingSizes.some(s => s.name.toLowerCase() === sizeForm.name.trim().toLowerCase())) {
        toast({
          title: "Duplicate Size",
          description: "A size with this name already exists.",
          variant: "destructive"
        })
        return
      }

      const newSize: Size = {
        id: crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        name: sizeForm.name.trim(),
        description: sizeForm.description.trim() || undefined,
        defaultQuantity: sizeForm.defaultQuantity ? parseInt(sizeForm.defaultQuantity) || undefined : undefined
      }
      const updatedSizes = [...existingSizes, newSize]
      writeSizes(updatedSizes)
      setSizes(updatedSizes)
      toast({ title: "Size Created", description: `Size "${sizeForm.name}" has been created.` })
    }

    setSizeForm({ name: "", description: "", defaultQuantity: "" })
    setEditingSize(null)
    setIsSizeDialogOpen(false)
  }

  const handleEditSize = (size: Size) => {
    setEditingSize(size)
    setSizeForm({ name: size.name, description: size.description || "", defaultQuantity: size.defaultQuantity?.toString() || "" })
    setIsSizeDialogOpen(true)
  }

  const handleDeleteSize = (sizeId: string) => {
    if (!confirm("Are you sure you want to delete this size?")) return
    const updatedSizes = sizes.filter(s => s.id !== sizeId)
    writeSizes(updatedSizes)
    setSizes(updatedSizes)
    toast({ title: "Size Deleted", description: "Size has been deleted." })
  }

  // Color Management
  const handleColorSubmit = () => {
    if (!colorForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Color name is required",
        variant: "destructive"
      })
      return
    }

    const existingColors = readColors()
    
    if (editingColor) {
      const updatedColors = existingColors.map(c =>
        c.id === editingColor.id
          ? {
              ...c,
              name: colorForm.name.trim(),
              hexCode: colorForm.hexCode.trim() || undefined,
              description: colorForm.description.trim() || undefined
            }
          : c
      )
      writeColors(updatedColors)
      setColors(updatedColors)
      toast({ title: "Color Updated", description: `Color "${colorForm.name}" has been updated.` })
    } else {
      if (existingColors.some(c => c.name.toLowerCase() === colorForm.name.trim().toLowerCase())) {
        toast({
          title: "Duplicate Color",
          description: "A color with this name already exists.",
          variant: "destructive"
        })
        return
      }

      const newColor: Color = {
        id: crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        name: colorForm.name.trim(),
        hexCode: colorForm.hexCode.trim() || undefined,
        description: colorForm.description.trim() || undefined
      }
      const updatedColors = [...existingColors, newColor]
      writeColors(updatedColors)
      setColors(updatedColors)
      toast({ title: "Color Created", description: `Color "${colorForm.name}" has been created.` })
    }

    setColorForm({ name: "", hexCode: "", description: "" })
    setEditingColor(null)
    setIsColorDialogOpen(false)
  }

  const handleEditColor = (color: Color) => {
    setEditingColor(color)
    setColorForm({
      name: color.name,
      hexCode: color.hexCode || "",
      description: color.description || ""
    })
    setIsColorDialogOpen(true)
  }

  const handleDeleteColor = (colorId: string) => {
    if (!confirm("Are you sure you want to delete this color?")) return
    const updatedColors = colors.filter(c => c.id !== colorId)
    writeColors(updatedColors)
    setColors(updatedColors)
    toast({ title: "Color Deleted", description: "Color has been deleted." })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{existing ? "Update Item" : "Register Item"}</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" value={form.sku} onChange={e => handleChange("sku", e.target.value)} placeholder="ITM-001" />
            </div>
            <div>
              <Label htmlFor="name">Item Name</Label>
              <Input id="name" value={form.name} onChange={e => handleChange("name", e.target.value)} placeholder="Safety Helmet" />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select id="category" value={form.category} onChange={e => handleChange("category", e.target.value as ItemCategory)}>
                <option>General</option>
                <option>Office</option>
                <option>Industrial</option>
                <option>IT</option>
                <option>Logistics</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="vendor">Vendor</Label>
              <Select id="vendor" value={form.vendorId || ""} onChange={e => handleChange("vendorId", e.target.value)}>
                <option value="">-- Optional: Select Vendor --</option>
                {vendors
                  .filter(v => v.category === form.category)
                  .map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
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
                  ⚠️ Invalid image URL. Please use a web URL (e.g., https://example.com/image.jpg) or a relative path (e.g., /placeholder.jpg).
                  Local file paths are not supported.
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
                      parsedColors.forEach(colorAttr => {
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
                      parsedSizes.forEach(sizeAttr => {
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
            <Button type="button" onClick={handleSubmit}>{existing ? "Update" : "Save"}</Button>
            <Button type="button" variant="outline" onClick={() => router.push("/item/list")}>Cancel</Button>
          </div>
        </CardContent>
      </Card>

      {/* Size Dialog */}
      <Dialog open={isSizeDialogOpen} onOpenChange={setIsSizeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSize ? "Edit Size" : "Add New Size"}</DialogTitle>
            <DialogDescription>
              {editingSize ? "Update size information" : "Create a new size option"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="size-name">Size Name *</Label>
              <Input
                id="size-name"
                value={sizeForm.name}
                onChange={(e) => setSizeForm({ ...sizeForm, name: e.target.value })}
                placeholder="e.g., Small, Medium, Large, XL"
              />
            </div>
            <div>
              <Label htmlFor="size-description">Description (Optional)</Label>
              <Input
                id="size-description"
                value={sizeForm.description}
                onChange={(e) => setSizeForm({ ...sizeForm, description: e.target.value })}
                placeholder="Additional description"
              />
            </div>
            <div>
              <Label htmlFor="size-quantity">Default Quantity (Optional)</Label>
              <Input
                id="size-quantity"
                type="number"
                min="0"
                value={sizeForm.defaultQuantity}
                onChange={(e) => setSizeForm({ ...sizeForm, defaultQuantity: e.target.value })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Default quantity to use when this size is selected for an item
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsSizeDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSizeSubmit}>
                {editingSize ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Color Dialog */}
      <Dialog open={isColorDialogOpen} onOpenChange={setIsColorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingColor ? "Edit Color" : "Add New Color"}</DialogTitle>
            <DialogDescription>
              {editingColor ? "Update color information" : "Create a new color option"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="color-name">Color Name *</Label>
              <Input
                id="color-name"
                value={colorForm.name}
                onChange={(e) => setColorForm({ ...colorForm, name: e.target.value })}
                placeholder="e.g., Red, Blue, Black, White"
              />
            </div>
            <div>
              <Label htmlFor="color-hex">Hex Code (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="color-hex"
                  value={colorForm.hexCode}
                  onChange={(e) => setColorForm({ ...colorForm, hexCode: e.target.value })}
                  placeholder="#FF0000"
                  maxLength={7}
                />
                {colorForm.hexCode && colorForm.hexCode.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/) && (
                  <div
                    className="w-12 h-10 rounded border"
                    style={{ backgroundColor: colorForm.hexCode }}
                  />
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="color-description">Description (Optional)</Label>
              <Input
                id="color-description"
                value={colorForm.description}
                onChange={(e) => setColorForm({ ...colorForm, description: e.target.value })}
                placeholder="Additional description"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsColorDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleColorSubmit}>
                {editingColor ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ItemForm
