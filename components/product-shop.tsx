"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { ShoppingCart, Plus, Minus, Search, Filter, ArrowLeft, Package, Star } from "lucide-react"

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
  variants?: Variant[] // Array of variants with color/size and quantity
}

type CartItem = {
  item: Item
  quantity: number
  estimatedPrice?: number
  selectedColor?: string
  selectedSize?: string
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
    
    // Ensure all required fields exist
    const fixedItems = items
      .filter(item => item && item.id && item.name && item.sku) // Only keep valid items
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
        // Preserve existing variants if they exist
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

export function ProductShop() {
  const { toast } = useToast()
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"name" | "price" | "stock">("name")
  // Track selected variants for each item: { itemId: { color?: string, size?: string } }
  const [selectedVariants, setSelectedVariants] = useState<Record<string, { color?: string; size?: string }>>({})

  useEffect(() => {
    setItems(readItems())
    // Load cart from localStorage if exists
    const savedCart = localStorage.getItem("app.cart")
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch {
        setCart([])
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
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

  const addToCart = (item: Item, color?: string, size?: string) => {
    // Check if item has variants and if color/size are required
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

    // Find matching cart item with same variant
    const existingItem = cart.find(cartItem => 
      cartItem.item.id === item.id &&
      cartItem.selectedColor === color &&
      cartItem.selectedSize === size
    )

    if (existingItem) {
      // Check available quantity for this variant
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
    
    // Check available quantity
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

  const getCartQuantity = (itemId: string, color?: string, size?: string) => {
    const cartItem = cart.find(c => 
      c.item.id === itemId && 
      c.selectedColor === color && 
      c.selectedSize === size
    )
    return cartItem?.quantity || 0
  }

  const getAvailableQuantity = (item: Item, color?: string, size?: string, currentSelection?: { color?: string; size?: string }): number => {
    if (!item.variants || item.variants.length === 0) {
      return item.currentStock || 0
    }

    // Priority 1: Exact match (both color and size match)
    if (color && size) {
      const exactMatch = item.variants.find(v => 
        v.color === color && v.size === size
      )
      if (exactMatch) {
        return exactMatch.quantity
      }
    }

    // Priority 2: Color+size combination match
    if (color && size) {
      const combinedMatch = item.variants.find(v => 
        v.color === color && v.size === size
      )
      if (combinedMatch) {
        return combinedMatch.quantity
      }
    }

    // Priority 3: Color only match
    if (color && !size) {
      const selectedSize = currentSelection?.size
      const colorVariants = item.variants.filter(v => 
        v.color === color && (!selectedSize || v.size === selectedSize || !v.size)
      )
      if (colorVariants.length > 0) {
        // If there's a specific size selected, prefer that variant
        if (selectedSize) {
          const sizeSpecific = colorVariants.find(v => v.size === selectedSize)
          if (sizeSpecific) {
            return sizeSpecific.quantity
          }
        }
        // Otherwise sum all color variants (without size or matching size)
        return colorVariants.reduce((sum, v) => sum + v.quantity, 0)
      }
    }

    // Priority 4: Size only match
    if (size && !color) {
      const selectedColor = currentSelection?.color
      const sizeVariants = item.variants.filter(v => 
        v.size === size && (!selectedColor || v.color === selectedColor || !v.color)
      )
      if (sizeVariants.length > 0) {
        // If there's a specific color selected, prefer that variant
        if (selectedColor) {
          const colorSpecific = sizeVariants.find(v => v.color === selectedColor)
          if (colorSpecific) {
            return colorSpecific.quantity
          }
        }
        // Otherwise sum all size variants
        return sizeVariants.reduce((sum, v) => sum + v.quantity, 0)
      }
    }

    // If no variant selected, return total available
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

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/product-selection")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Product Shop</h1>
            <p className="text-muted-foreground">Browse and add items to your cart</p>
          </div>
        </div>
        <Button
          onClick={() => router.push("/product-selection")}
          className="gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          Cart ({totalItems})
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search products by name, SKU, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            {/* Filters */}
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
            const availableQty = getAvailableQuantity(item, selectedVariant.color, selectedVariant.size, selectedVariant)
            const cartQuantity = getCartQuantity(item.id, selectedVariant.color, selectedVariant.size)
            const isInStock = hasVariants ? availableQty > 0 : (item.currentStock || 0) > 0
            const stockLevel = hasVariants ? availableQty : (item.currentStock || 0)
            const remainingQty = availableQty - cartQuantity

            return (
              <Card
                key={item.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20 flex flex-col"
              >
                {/* Product Image */}
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
                  {/* Stock Badge */}
                  {hasVariants && (selectedVariant.color || selectedVariant.size) ? (
                    availableQty > 0 ? (
                      <Badge
                        className={`absolute top-2 right-2 ${
                          availableQty > 50
                            ? "bg-green-500"
                            : availableQty > 20
                            ? "bg-yellow-500"
                            : "bg-orange-500"
                        } text-white`}
                      >
                        {availableQty} available
                      </Badge>
                    ) : (
                      <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                        Out of Stock
                      </Badge>
                    )
                  ) : (
                    <>
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
                    </>
                  )}
                </div>

                <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
                  {/* Product Info */}
                  <div className="space-y-1 flex-shrink-0">
                    <h3 className="font-semibold text-base line-clamp-2 min-h-[2.5rem] leading-tight text-foreground">
                      {item.name || "Unnamed Product"}
                    </h3>
                    <p className="text-xs text-muted-foreground">SKU: {item.sku || "N/A"}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {item.category || "General"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{item.unit || "pcs"}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 flex-shrink-0">
                    <span className="text-2xl font-bold text-green-600">
                      ${(item.price ?? 0).toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">/ {item.unit || "pcs"}</span>
                  </div>

                  {/* Variant Selection */}
                  {hasVariants && (
                    <div className="space-y-2 pt-2 border-t">
                      {/* Color Selection */}
                      {availableColors.length > 0 && (
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Color:
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {availableColors.map(color => {
                              const colorVariant = item.variants?.find(v => v.color === color && (!selectedVariant.size || v.size === selectedVariant.size))
                              const colorQty = colorVariant?.quantity || 0
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
                                  className={`px-2 py-1 text-xs rounded border transition-all ${
                                    isSelected
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-background hover:bg-muted border-input"
                                  } ${colorQty === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                                  disabled={colorQty === 0}
                                  title={`${color}: ${colorQty} available`}
                                >
                                  {color}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Size Selection */}
                      {availableSizes.length > 0 && (
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Size:
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {availableSizes.map(size => {
                              const sizeVariant = item.variants?.find(v => 
                                v.size === size && 
                                (!selectedVariant.color || v.color === selectedVariant.color)
                              )
                              const sizeQty = sizeVariant?.quantity || 0
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
                                  className={`px-2 py-1 text-xs rounded border transition-all ${
                                    isSelected
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-background hover:bg-muted border-input"
                                  } ${sizeQty === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                                  disabled={sizeQty === 0}
                                  title={`${size}: ${sizeQty} available`}
                                >
                                  {size}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Available Quantity Display */}
                      {(selectedVariant.color || selectedVariant.size) && availableQty > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Available: <span className="font-semibold text-foreground">{availableQty}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Location */}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    Location: {item.location}
                  </p>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2 border-t">
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/product-selection/shop/${item.id}`)
                      }}
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
                              onClick={(e) => {
                                e.stopPropagation()
                                updateQuantity(item.id, cartQuantity - 1, selectedVariant.color, selectedVariant.size)
                              }}
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
                              onClick={(e) => {
                                e.stopPropagation()
                                updateQuantity(item.id, cartQuantity + 1, selectedVariant.color, selectedVariant.size)
                              }}
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
                          {remainingQty === 0 && (
                            <p className="text-xs text-center text-orange-600 font-medium">
                              All available items in cart
                            </p>
                          )}
                        </div>
                      ) : (
                        <Button
                          className="w-full"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            addToCart(item, selectedVariant.color, selectedVariant.size)
                          }}
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
    </div>
  )
}

