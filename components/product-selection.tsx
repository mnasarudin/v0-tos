"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { ShoppingCart, Plus, Minus, Package, FileText, X, Search, Filter } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { generateRequestNumber } from "@/lib/utils"

type Variant = {
  color?: string
  size?: string
  quantity: number
}

type Item = {
  id: string
  sku: string
  name: string
  category: string
  unit: string
  price: number
  minStock: number
  location: string
  description?: string
  image?: string
  currentStock?: number
  variants?: Variant[]
}

type CartItem = {
  item: Item
  quantity: number
  estimatedPrice?: number
  selectedColor?: string
  selectedSize?: string
}

type ManualItem = {
  name: string
  description: string
  quantity: number
  estimatedPrice: number
  unit: string
}

const ITEM_STORAGE_KEY = "app.items"

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

    // Ensure office chair has predefined color variants if missing
    const withOfficeChairVariants = items.map(item => {
      const isOfficeChair = item.name?.toLowerCase().includes("office chair")
      const hasVariants = Array.isArray(item.variants) && item.variants.length > 0
      if (!isOfficeChair || hasVariants) return item
      return {
        ...item,
        variants: [
          { color: "Black", quantity: 30 },
          { color: "Gray", quantity: 25 },
          { color: "Blue", quantity: 15 },
        ],
      }
    })

    const fixedItems = withOfficeChairVariants
      .filter(item => item && item.id && item.name && item.sku)
      .map(item => ({
        ...item,
        image: sanitizeImageUrl(item.image),
        name: item.name || "Unnamed Item",
        sku: item.sku || "N/A",
        category: item.category || "General",
        unit: item.unit || "pcs",
        price: item.price ?? 0,
        currentStock: item.currentStock ?? 0,
        location: item.location || "Main",
        variants: item.variants || undefined
      }))
    
    const needsUpdate = fixedItems.some((item, idx) => 
      item.image !== (items[idx]?.image || undefined)
    )
    if (needsUpdate) {
      localStorage.setItem(ITEM_STORAGE_KEY, JSON.stringify(fixedItems))
    }
    
    const filteredItems = fixedItems.filter(item => {
      const nameLower = item.name.toLowerCase()
      return nameLower !== "pc" && nameLower !== "socks"
    })
    
    return filteredItems
  } catch (error) {
    console.error("Error reading items:", error)
    return []
  }
}

export function ProductSelection() {
  const { toast } = useToast()
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"name" | "price" | "stock">("name")
  const [selectedVariants, setSelectedVariants] = useState<Record<string, { color?: string; size?: string }>>({})
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isManualItemOpen, setIsManualItemOpen] = useState(false)
  const [manualItem, setManualItem] = useState<ManualItem>({
    name: "",
    description: "",
    quantity: 1,
    estimatedPrice: 0,
    unit: "pcs"
  })

  useEffect(() => {
    setItems(readItems())
    
    // Load cart from localStorage
    const loadCart = () => {
      const savedCart = localStorage.getItem("app.cart")
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart)
          setCart(parsedCart)
        } catch {
          setCart([])
        }
      }
    }
    
    loadCart()

    // Check if cart should be opened from URL parameter
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('cart') === 'true') {
      // Reload cart from localStorage to ensure we have the latest data
      setTimeout(() => {
        loadCart()
        setIsCartOpen(true)
      }, 150)
      // Clean up URL parameter
      window.history.replaceState({}, '', '/product-selection')
    }

    // Listen for storage events to sync cart across tabs/components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app.cart') {
        loadCart()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("app.cart", JSON.stringify(cart))
    }
  }, [cart])

  const categories = Array.from(new Set(items.map(item => item.category))).sort()

  const filteredItems = items
    .filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price":
          return a.price - b.price
        case "stock":
          return (b.currentStock || 0) - (a.currentStock || 0)
        case "name":
        default:
          return a.name.localeCompare(b.name)
      }
    })

  const getAvailableQuantity = (item: Item, color?: string, size?: string): number => {
    if (!item.variants || item.variants.length === 0) {
      return item.currentStock || 0
    }

    if (color && size) {
      const exactMatch = item.variants.find(v => 
        v.color === color && v.size === size
      )
      if (exactMatch) return exactMatch.quantity
    }

    if (color && !size) {
      const colorVariants = item.variants.filter(v => v.color === color)
      if (colorVariants.length > 0) {
        return colorVariants.reduce((sum, v) => sum + v.quantity, 0)
      }
    }

    if (size && !color) {
      const sizeVariants = item.variants.filter(v => v.size === size)
      if (sizeVariants.length > 0) {
        return sizeVariants.reduce((sum, v) => sum + v.quantity, 0)
      }
    }

    if (!color && !size) {
      return item.variants.reduce((sum, v) => sum + v.quantity, 0)
    }

    return 0
  }

  const getAvailableColors = (item: Item): string[] => {
    if (!item.variants || item.variants.length === 0) return []
    const colors = new Set<string>()
    item.variants.forEach(v => {
      if (v.color) colors.add(v.color)
    })
    return Array.from(colors).sort()
  }

  const getAvailableSizes = (item: Item, color?: string): string[] => {
    if (!item.variants || item.variants.length === 0) return []
    const sizes = new Set<string>()
    item.variants.forEach(v => {
      if (v.size && (!color || v.color === color || !v.color)) {
        sizes.add(v.size)
      }
    })
    return Array.from(sizes).sort()
  }

  const getCartQuantity = (itemId: string, color?: string, size?: string) => {
    const cartItem = cart.find(c => 
      c.item.id === itemId && 
      c.selectedColor === color && 
      c.selectedSize === size
    )
    return cartItem?.quantity || 0
  }

  const addToCart = (item: Item, color?: string, size?: string) => {
    if (item.variants && item.variants.length > 0) {
      if (!color && !size) {
        toast({
          title: "Select Variant",
          description: "Please select a color or size before adding to cart.",
          variant: "destructive"
        })
        return
      }
    }

    const existingItem = cart.find(cartItem => 
      cartItem.item.id === item.id &&
      cartItem.selectedColor === color &&
      cartItem.selectedSize === size
    )

    if (existingItem) {
      const availableQty = getAvailableQuantity(item, color, size)
      if (existingItem.quantity >= availableQty) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${availableQty} available for this variant.`,
          variant: "destructive"
        })
        return
      }
      
      setCart(cart.map(cartItem =>
        cartItem.item.id === item.id &&
        cartItem.selectedColor === color &&
        cartItem.selectedSize === size
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ))
    } else {
      setCart([...cart, { 
        item, 
        quantity: 1, 
        estimatedPrice: item.price,
        selectedColor: color,
        selectedSize: size
      }])
    }
    toast({
      title: "Added to Cart",
      description: `${item.name}${color ? ` (${color})` : ''}${size ? ` - ${size}` : ''} has been added to your cart.`,
    })
  }

  const updateQuantity = (itemId: string, quantity: number, color?: string, size?: string) => {
    if (quantity <= 0) {
      setCart(cart.filter(cartItem => 
        !(cartItem.item.id === itemId && 
          cartItem.selectedColor === color && 
          cartItem.selectedSize === size)
      ))
      return
    }
    
    const cartItem = cart.find(c => 
      c.item.id === itemId && 
      c.selectedColor === color && 
      c.selectedSize === size
    )
    if (cartItem) {
      const item = items.find(i => i.id === itemId)
      if (item) {
        const availableQty = getAvailableQuantity(item, color, size)
        if (quantity > availableQty) {
          toast({
            title: "Insufficient Stock",
            description: `Only ${availableQty} available for this variant.`,
            variant: "destructive"
          })
          return
        }
      }
    }
    
    setCart(cart.map(cartItem =>
      cartItem.item.id === itemId &&
      cartItem.selectedColor === color &&
      cartItem.selectedSize === size
        ? { ...cartItem, quantity }
        : cartItem
    ))
  }

  const removeFromCart = (itemId: string, color?: string, size?: string) => {
    setCart(cart.filter(cartItem => 
      !(cartItem.item.id === itemId && 
        cartItem.selectedColor === color && 
        cartItem.selectedSize === size)
    ))
    toast({
      title: "Removed from Cart",
      description: "Item has been removed from your cart.",
    })
  }

  const addManualItem = () => {
    const newItem: Item = {
      id: `manual-${Date.now()}`,
      sku: `MANUAL-${Date.now()}`,
      name: manualItem.name,
      category: "Manual Entry",
      unit: manualItem.unit,
      price: manualItem.estimatedPrice,
      minStock: 0,
      location: "N/A",
      description: manualItem.description
    }

    const currentItems = readItems()
    currentItems.push(newItem)
    if (typeof window !== "undefined") {
      localStorage.setItem(ITEM_STORAGE_KEY, JSON.stringify(currentItems))
    }
    setItems([...currentItems])

    const cartItem: CartItem = {
      item: newItem,
      quantity: manualItem.quantity,
      estimatedPrice: manualItem.estimatedPrice
    }

    setCart([...cart, cartItem])
    setManualItem({
      name: "",
      description: "",
      quantity: 1,
      estimatedPrice: 0,
      unit: "pcs"
    })
    setIsManualItemOpen(false)
    
    toast({
      title: "Manual Item Added",
      description: `${manualItem.name} has been added to your cart and available items list.`,
    })
  }

  const generatePR = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before generating PR.",
        variant: "destructive"
      })
      return
    }

    setIsCheckoutOpen(true)
  }

  const confirmPRGeneration = () => {
    const currentDate = new Date()
    const today = new Date().toISOString().split('T')[0]
    const currentUser = getCurrentUser()
    const department = currentUser?.department || "Operations"
    const requestNo = generateRequestNumber(department)
    const prId = requestNo
    
    const prData = {
      id: prId,
      requestNo: requestNo,
      department: department,
      requester: currentUser?.name || "Unknown User",
      requestDate: today,
      status: "submitted",
      priority: "medium",
      category: "General",
      justification: "Purchase requisition generated from product selection",
      remarks: "Items selected from product catalog",
      approvalDate: null,
      approvedBy: null,
      items: cart.map(cartItem => ({
        id: cartItem.item.id,
        name: cartItem.item.name,
        sku: cartItem.item.sku,
        category: cartItem.item.category,
        unit: cartItem.item.unit,
        quantity: cartItem.quantity,
        unitPrice: cartItem.estimatedPrice || 0,
        total: (cartItem.estimatedPrice || 0) * cartItem.quantity,
        location: cartItem.item.location,
        minStock: cartItem.item.minStock,
        currentStock: cartItem.item.currentStock,
        selectedColor: cartItem.selectedColor,
        selectedSize: cartItem.selectedSize
      })),
      totalItems: cart.reduce((sum, item) => sum + item.quantity, 0),
      estimatedTotal: cart.reduce((sum, item) => 
        sum + (item.estimatedPrice || 0) * item.quantity, 0
      ),
      createdAt: currentDate.toISOString(),
      updatedAt: currentDate.toISOString()
    }
    
    const existingPRs = JSON.parse(localStorage.getItem("app.prs") || "[]")
    existingPRs.push(prData)
    localStorage.setItem("app.prs", JSON.stringify(existingPRs))
    localStorage.setItem("app.cart", JSON.stringify(cart))
    
    setIsCheckoutOpen(false)
    setCart([])
    router.push("/pr/list")
    
    toast({
      title: "PR Generated",
      description: `Purchase requisition ${prId} has been created successfully.`,
    })
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const estimatedTotal = cart.reduce((sum, item) => 
    sum + (item.estimatedPrice || 0) * item.quantity, 0
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Product Selection</h2>
          <p className="text-muted-foreground">Browse products and add items to your cart</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setIsCartOpen(true)}
            className="gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Cart ({totalItems})
          </Button>
          <Button onClick={generatePR} disabled={cart.length === 0}>
            <FileText className="w-4 h-4 mr-2" />
            Generate PR ({cart.length} items)
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search products by name, SKU, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "name" | "price" | "stock")}
                  className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="name">Name</option>
                  <option value="price">Price (Low to High)</option>
                  <option value="stock">Stock (High to Low)</option>
                </select>
              </div>

              <div className="ml-auto text-sm text-muted-foreground">
                {filteredItems.length} product{filteredItems.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredItems.map((item) => {
            const hasVariants = item.variants && item.variants.length > 0
            const selectedVariant = selectedVariants[item.id] || {}
            const availableColors = getAvailableColors(item)
            const availableSizes = getAvailableSizes(item, selectedVariant.color)
            const availableQty = getAvailableQuantity(item, selectedVariant.color, selectedVariant.size)
            const cartQuantity = getCartQuantity(item.id, selectedVariant.color, selectedVariant.size)
            const isInStock = hasVariants ? availableQty > 0 : (item.currentStock || 0) > 0
            const stockLevel = hasVariants ? availableQty : (item.currentStock || 0)
            const remainingQty = availableQty - cartQuantity

            return (
              <Card
                key={item.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20 flex flex-col"
              >
                <div className="relative w-full aspect-square bg-muted overflow-hidden group">
                  <img
                    src={item.image || "/placeholder.jpg"}
                    alt={item.name}
                    className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.jpg"
                    }}
                  />
                  {stockLevel > 0 && (
                    <Badge
                      className={`absolute top-2 right-2 ${
                        stockLevel > 50
                          ? "bg-green-500"
                          : stockLevel > 20
                          ? "bg-yellow-500"
                          : "bg-orange-500"
                      } text-white`}
                    >
                      {stockLevel} in stock
                    </Badge>
                  )}
                  {!isInStock && (
                    <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                      Out of Stock
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
                  <div className="space-y-1 flex-shrink-0">
                    <h3 className="font-semibold text-base line-clamp-2 min-h-[2.5rem] leading-tight text-foreground">
                      {item.name || "Unnamed Product"}
                    </h3>
                    <p className="text-xs text-muted-foreground">SKU: {item.sku || "N/A"}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {item.category || "General"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{item.unit || "pcs"}</span>
                      {/* Show available variants summary */}
                      {hasVariants && (
                        <>
                          {availableColors.length > 0 && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                              {availableColors.length} Color{availableColors.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                          {availableSizes.length > 0 && (
                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                              {availableSizes.length} Size{availableSizes.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 flex-shrink-0">
                    <span className="text-2xl font-bold text-green-600">
                      ${(item.price ?? 0).toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">/ {item.unit || "pcs"}</span>
                  </div>

                  {/* Variant Details Section */}
                  {hasVariants && (
                    <div className="space-y-2 pt-2 border-t">
                      {/* Show available colors and sizes summary */}
                      <div className="space-y-1.5">
                        {availableColors.length > 0 && (
                          <div>
                            <label className="text-xs font-semibold text-foreground mb-1.5 block flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                              Available Colors:
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {availableColors.map(color => {
                                const colorQty = getAvailableQuantity(item, color)
                                const isSelected = selectedVariant.color === color
                                
                                return (
                                  <button
                                    key={color}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedVariants(prev => ({
                                        ...prev,
                                        [item.id]: { ...prev[item.id], color }
                                      }))
                                    }}
                                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md border-2 transition-all ${
                                      isSelected
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                        : "bg-background hover:bg-muted border-input hover:border-primary/50"
                                    } ${colorQty === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                                    disabled={colorQty === 0}
                                    title={`${color}: ${colorQty} available`}
                                  >
                                    {color}
                                    {colorQty > 0 && (
                                      <span className="ml-1 text-[10px] opacity-75">({colorQty})</span>
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {availableSizes.length > 0 && (
                          <div>
                            <label className="text-xs font-semibold text-foreground mb-1.5 block flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                              Available Sizes:
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {availableSizes.map(size => {
                                const sizeQty = getAvailableQuantity(item, selectedVariant.color, size)
                                const isSelected = selectedVariant.size === size
                                
                                return (
                                  <button
                                    key={size}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedVariants(prev => ({
                                        ...prev,
                                        [item.id]: { ...prev[item.id], size }
                                      }))
                                    }}
                                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md border-2 transition-all ${
                                      isSelected
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                        : "bg-background hover:bg-muted border-input hover:border-primary/50"
                                    } ${sizeQty === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                                    disabled={sizeQty === 0}
                                    title={`${size}: ${sizeQty} available`}
                                  >
                                    {size}
                                    {sizeQty > 0 && (
                                      <span className="ml-1 text-[10px] opacity-75">({sizeQty})</span>
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Selected variant info */}
                      {(selectedVariant.color || selectedVariant.size) && (
                        <div className="p-2 bg-muted rounded-md border">
                          <p className="text-xs font-semibold text-foreground mb-1">Selected:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedVariant.color && (
                              <Badge className="bg-blue-500 text-white text-xs">
                                Color: {selectedVariant.color}
                              </Badge>
                            )}
                            {selectedVariant.size && (
                              <Badge className="bg-purple-500 text-white text-xs">
                                Size: {selectedVariant.size}
                              </Badge>
                            )}
                          </div>
                          {availableQty > 0 && (
                            <p className="text-xs text-muted-foreground mt-1.5">
                              Available: <span className="font-semibold text-green-600">{availableQty}</span> units
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      Location: {item.location}
                    </p>
                    {/* Show variant summary if item has variants but none selected */}
                    {hasVariants && !selectedVariant.color && !selectedVariant.size && (
                      <p className="text-xs text-amber-600 font-medium">
                        ⚠️ Please select a color{availableSizes.length > 0 ? ' or size' : ''} to add to cart
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => router.push(`/product-selection/shop/${item.id}`)}
                    >
                      View Details
                    </Button>
                    {isInStock ? (
                      cartQuantity > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, cartQuantity - 1, selectedVariant.color, selectedVariant.size)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="flex-1 text-center font-medium text-sm">
                              {cartQuantity} in cart
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, cartQuantity + 1, selectedVariant.color, selectedVariant.size)}
                              disabled={cartQuantity >= availableQty}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          {remainingQty > 0 && (
                            <p className="text-xs text-center text-muted-foreground">
                              {remainingQty} left
                            </p>
                          )}
                        </div>
                      ) : (
                        <Button
                          className="w-full"
                          size="sm"
                          onClick={() => addToCart(item, selectedVariant.color, selectedVariant.size)}
                          disabled={hasVariants && !selectedVariant.color && !selectedVariant.size}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                      )
                    ) : (
                      <Button
                        className="w-full"
                        size="sm"
                        disabled
                        variant="outline"
                      >
                        Out of Stock
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Shopping Cart Dialog */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Shopping Cart ({totalItems} items)
            </DialogTitle>
            <DialogDescription>
              Review your selected items before generating the purchase requisition
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
                <p>Add items from the product list to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((cartItem) => (
                  <div key={`${cartItem.item.id}-${cartItem.selectedColor || ''}-${cartItem.selectedSize || ''}`} className="flex items-center gap-4 p-4 border rounded-lg bg-card">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{cartItem.item.name}</h4>
                      <p className="text-xs text-muted-foreground">SKU: {cartItem.item.sku}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {cartItem.selectedColor && (
                          <Badge className="bg-blue-500 text-white text-xs">
                            Color: {cartItem.selectedColor}
                          </Badge>
                        )}
                        {cartItem.selectedSize && (
                          <Badge className="bg-purple-500 text-white text-xs">
                            Size: {cartItem.selectedSize}
                          </Badge>
                        )}
                        {!cartItem.selectedColor && !cartItem.selectedSize && (
                          <Badge variant="outline" className="text-xs">
                            Standard
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <p className="text-xs text-muted-foreground">Unit: {cartItem.item.unit}</p>
                        {cartItem.estimatedPrice && (
                          <p className="text-xs text-green-600 font-medium">
                            ${cartItem.estimatedPrice.toFixed(2)}/unit
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity - 1, cartItem.selectedColor, cartItem.selectedSize)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">
                        {cartItem.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity + 1, cartItem.selectedColor, cartItem.selectedSize)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromCart(cartItem.item.id, cartItem.selectedColor, cartItem.selectedSize)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {cart.length > 0 && (
            <div className="border-t pt-4 space-y-4">
              {estimatedTotal > 0 && (
                <div className="flex justify-between items-center font-medium text-lg">
                  <span>Estimated Total:</span>
                  <span>${estimatedTotal.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  onClick={() => {
                    generatePR()
                    setIsCartOpen(false)
                  }}
                  size="lg"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Purchase Requisition
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCartOpen(false)}
                  size="lg"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Confirm Purchase Requisition
            </DialogTitle>
            <DialogDescription>
              Please review your items before generating the purchase requisition
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Requester Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Requester Name</label>
                    <p className="text-lg font-semibold">{getCurrentUser()?.name || "Unknown User"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Department</label>
                    <p className="text-lg font-semibold">{getCurrentUser()?.department || "Operations"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
                <CardDescription>
                  {cart.length} item(s) • Total: {totalItems} units
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cart.map((cartItem, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{cartItem.item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          SKU: {cartItem.item.sku} • Category: {cartItem.item.category}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {cartItem.selectedColor && (
                            <Badge className="bg-blue-500 text-white text-xs">
                              Color: {cartItem.selectedColor}
                            </Badge>
                          )}
                          {cartItem.selectedSize && (
                            <Badge className="bg-purple-500 text-white text-xs">
                              Size: {cartItem.selectedSize}
                            </Badge>
                          )}
                          {!cartItem.selectedColor && !cartItem.selectedSize && (
                            <Badge variant="outline" className="text-xs">
                              Standard
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Qty: {cartItem.quantity}</p>
                        {cartItem.estimatedPrice && (
                          <p className="text-sm text-muted-foreground">
                            ${cartItem.estimatedPrice.toFixed(2)} each
                          </p>
                        )}
                        {cartItem.estimatedPrice && (
                          <p className="font-medium text-lg">
                            ${(cartItem.estimatedPrice * cartItem.quantity).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Items:</span>
                    <span className="font-medium">{totalItems}</span>
                  </div>
                  {estimatedTotal > 0 && (
                    <div className="flex justify-between">
                      <span>Estimated Total:</span>
                      <span className="font-medium">${estimatedTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Purchase Requisition Total:</span>
                      <span>${estimatedTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-end pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setIsCheckoutOpen(false)}
                size="lg"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={confirmPRGeneration}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                Confirm & Generate PR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Item Dialog */}
      <Dialog open={isManualItemOpen} onOpenChange={setIsManualItemOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Add Manual Item
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Manual Item</DialogTitle>
            <DialogDescription>
              Add an item that's not in the catalog
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="manual-name">Item Name</Label>
              <Input
                id="manual-name"
                placeholder="Enter item name"
                value={manualItem.name}
                onChange={(e) => setManualItem({...manualItem, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="manual-description">Description</Label>
              <Input
                id="manual-description"
                placeholder="Enter description"
                value={manualItem.description}
                onChange={(e) => setManualItem({...manualItem, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manual-quantity">Quantity</Label>
                <Input
                  id="manual-quantity"
                  type="number"
                  min="1"
                  value={manualItem.quantity}
                  onChange={(e) => setManualItem({...manualItem, quantity: Number(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="manual-unit">Unit</Label>
                <Input
                  id="manual-unit"
                  placeholder="pcs, kg, m, etc."
                  value={manualItem.unit}
                  onChange={(e) => setManualItem({...manualItem, unit: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="manual-price">Estimated Price (per unit)</Label>
              <Input
                id="manual-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={manualItem.estimatedPrice}
                onChange={(e) => setManualItem({...manualItem, estimatedPrice: Number(e.target.value)})}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={addManualItem} disabled={!manualItem.name}>
                Add to Cart
              </Button>
              <Button variant="outline" onClick={() => setIsManualItemOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
