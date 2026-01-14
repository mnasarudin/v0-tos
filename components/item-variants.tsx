"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Pencil, Trash2, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const SIZE_STORAGE_KEY = "app.sizes"
const COLOR_STORAGE_KEY = "app.colors"

export interface Size {
  id: string
  name: string
  description?: string
}

export interface Color {
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

export function ItemVariants() {
  const { toast } = useToast()
  const [sizes, setSizes] = useState<Size[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [isSizeDialogOpen, setIsSizeDialogOpen] = useState(false)
  const [isColorDialogOpen, setIsColorDialogOpen] = useState(false)
  const [editingSize, setEditingSize] = useState<Size | null>(null)
  const [editingColor, setEditingColor] = useState<Color | null>(null)
  const [sizeForm, setSizeForm] = useState({ name: "", description: "" })
  const [colorForm, setColorForm] = useState({ name: "", hexCode: "", description: "" })

  useEffect(() => {
    setSizes(readSizes())
    setColors(readColors())
  }, [])

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
      // Update existing size
      const updatedSizes = existingSizes.map(s =>
        s.id === editingSize.id
          ? { ...s, name: sizeForm.name.trim(), description: sizeForm.description.trim() || undefined }
          : s
      )
      writeSizes(updatedSizes)
      setSizes(updatedSizes)
      toast({
        title: "Size Updated",
        description: `Size "${sizeForm.name}" has been updated.`
      })
    } else {
      // Create new size
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
        description: sizeForm.description.trim() || undefined
      }
      const updatedSizes = [...existingSizes, newSize]
      writeSizes(updatedSizes)
      setSizes(updatedSizes)
      toast({
        title: "Size Created",
        description: `Size "${sizeForm.name}" has been created.`
      })
    }

    setSizeForm({ name: "", description: "" })
    setEditingSize(null)
    setIsSizeDialogOpen(false)
  }

  const handleEditSize = (size: Size) => {
    setEditingSize(size)
    setSizeForm({ name: size.name, description: size.description || "" })
    setIsSizeDialogOpen(true)
  }

  const handleDeleteSize = (sizeId: string) => {
    if (!confirm("Are you sure you want to delete this size?")) return

    const updatedSizes = sizes.filter(s => s.id !== sizeId)
    writeSizes(updatedSizes)
    setSizes(updatedSizes)
    toast({
      title: "Size Deleted",
      description: "Size has been deleted."
    })
  }

  const handleSizeDialogOpen = (open: boolean) => {
    setIsSizeDialogOpen(open)
    if (!open) {
      setSizeForm({ name: "", description: "" })
      setEditingSize(null)
    }
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
      // Update existing color
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
      toast({
        title: "Color Updated",
        description: `Color "${colorForm.name}" has been updated.`
      })
    } else {
      // Create new color
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
      toast({
        title: "Color Created",
        description: `Color "${colorForm.name}" has been created.`
      })
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
    toast({
      title: "Color Deleted",
      description: "Color has been deleted."
    })
  }

  const handleColorDialogOpen = (open: boolean) => {
    setIsColorDialogOpen(open)
    if (!open) {
      setColorForm({ name: "", hexCode: "", description: "" })
      setEditingColor(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Size & Color Management</h2>
          <p className="text-muted-foreground">Manage available sizes and colors for items</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sizes Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Sizes ({sizes.length})</CardTitle>
              <Button size="sm" onClick={() => handleSizeDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Size
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sizes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No sizes registered yet.</p>
                <p className="text-sm mt-1">Click "Add Size" to create one.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sizes.map((size) => (
                    <TableRow key={size.id}>
                      <TableCell className="font-medium">{size.name}</TableCell>
                      <TableCell>{size.description || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditSize(size)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteSize(size.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Colors Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Colors ({colors.length})</CardTitle>
              <Button size="sm" onClick={() => handleColorDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Color
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {colors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No colors registered yet.</p>
                <p className="text-sm mt-1">Click "Add Color" to create one.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Hex Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {colors.map((color) => (
                    <TableRow key={color.id}>
                      <TableCell className="font-medium">{color.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {color.hexCode && (
                            <>
                              <div
                                className="w-6 h-6 rounded border"
                                style={{ backgroundColor: color.hexCode }}
                              />
                              <span className="text-sm">{color.hexCode}</span>
                            </>
                          )}
                          {!color.hexCode && <span className="text-muted-foreground">-</span>}
                        </div>
                      </TableCell>
                      <TableCell>{color.description || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditColor(color)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteColor(color.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Size Dialog */}
      <Dialog open={isSizeDialogOpen} onOpenChange={handleSizeDialogOpen}>
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
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => handleSizeDialogOpen(false)}>
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
      <Dialog open={isColorDialogOpen} onOpenChange={handleColorDialogOpen}>
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
              <Button variant="outline" onClick={() => handleColorDialogOpen(false)}>
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
