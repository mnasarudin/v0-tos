"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useParams } from "next/navigation"
import { ShoppingCart, Plus, Minus, ArrowLeft, Package, Truck, Check, Heart, Share2, FileText, X } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { generateRequestNumber } from "@/lib/utils"

type Variant = {
  color?: string
  size?: string
  quantity: number
  image?: string
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
  availableSizes?: string[] // Array of size IDs
  availableColors?: string[] // Array of color IDs
}

interface Size {
  id: string
  name: string
  description?: string
}

interface Color {
  id: string
  name: string
  hexCode?: string
  description?: string
}

type CartItem = {
  item: Item
  quantity: number
  estimatedPrice?: number
  selectedColor?: string
  selectedSize?: string
}

const ITEM_STORAGE_KEY = "app.items"
const SIZE_STORAGE_KEY = "app.sizes"
const COLOR_STORAGE_KEY = "app.colors"
const FAVORITES_STORAGE_KEY = "app.favorites"

function readFavorites(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function writeFavorites(favorites: string[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
}

function toggleFavorite(itemId: string): boolean {
  const favorites = readFavorites()
  const index = favorites.indexOf(itemId)
  if (index >= 0) {
    favorites.splice(index, 1)
    writeFavorites(favorites)
    return false
  } else {
    favorites.push(itemId)
    writeFavorites(favorites)
    return true
  }
}

function isFavorite(itemId: string): boolean {
  return readFavorites().includes(itemId)
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

function readColors(): Color[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(COLOR_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Color[]) : []
  } catch {
    return []
  }
}

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
    
    return withOfficeChairVariants.map(item => ({
      ...item,
      image: sanitizeImageUrl(item.image),
      // Preserve existing variants and stock - don't generate random data
      currentStock: item.currentStock ?? 0
    }))
  } catch {
    return []
  }
}

export function ProductDetail() {
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const itemId = params?.id as string

  const [item, setItem] = useState<Item | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedVariant, setSelectedVariant] = useState<{ color?: string; size?: string }>({})
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [allSizes, setAllSizes] = useState<Size[]>([])
  const [allColors, setAllColors] = useState<Color[]>([])
  const [isLiked, setIsLiked] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  // Update quantity when variant changes to ensure it doesn't exceed available
  useEffect(() => {
    if (item) {
      const available = getAvailableQuantity(selectedVariant.color, selectedVariant.size)
      if (quantity > available) {
        setQuantity(Math.max(1, available))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariant.color, selectedVariant.size, item])

  useEffect(() => {
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
      } else {
        setCart([])
      }
    }

    loadCart()
    const items = readItems()
    const foundItem = items.find(i => i.id === itemId)
    if (foundItem) {
      // Only use the actual item data - no random generation
      setItem(foundItem)
      // Reset variant selection when item changes
      setSelectedVariant({})
      setQuantity(1)
    } else {
      toast({
        title: "Product Not Found",
        description: "The product you're looking for doesn't exist.",
        variant: "destructive"
      })
      router.push("/product-selection/shop")
    }

    // Load cart
    loadCart()

    // Load sizes and colors
    setAllSizes(readSizes())
    setAllColors(readColors())

    // Check if item is favorited
    if (itemId) {
      setIsLiked(isFavorite(itemId))
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
  }, [itemId, router, toast])

  // Save cart to localStorage whenever it changes (but skip if it's empty and we just cleared it)
  useEffect(() => {
    if (typeof window !== "undefined" && cart.length >= 0) {
      localStorage.setItem("app.cart", JSON.stringify(cart))
    }
  }, [cart])

  const getAvailableQuantity = (color?: string, size?: string): number => {
    if (!item) return 0
    const variantColor = color !== undefined ? color : selectedVariant.color
    const variantSize = size !== undefined ? size : selectedVariant.size
    
    if (!item.variants || item.variants.length === 0) {
      // For items without variants, return currentStock or default to showing as available
      return item.currentStock ?? 999
    }

    // Priority 1: Exact match (both color and size)
    if (variantColor && variantSize) {
      const exactMatch = item.variants.find(v => 
        v.color === variantColor && v.size === variantSize
      )
      if (exactMatch) return exactMatch.quantity
      // If exact match not found, return 0 (this combination doesn't exist)
      return 0
    }

    // Priority 2: Color only - sum all variants with this color (regardless of size)
    if (variantColor && !variantSize) {
      const colorVariants = item.variants.filter(v => v.color === variantColor)
      if (colorVariants.length > 0) {
        // Sum all quantities for this color
        return colorVariants.reduce((sum, v) => sum + v.quantity, 0)
      }
      // If color not found, return 0 (this color doesn't exist)
      return 0
    }

    // Priority 3: Size only (with optional color filter)
    if (variantSize && !variantColor) {
      const sizeVariants = item.variants.filter(v => v.size === variantSize)
      if (sizeVariants.length > 0) {
        return sizeVariants.reduce((sum, v) => sum + v.quantity, 0)
      }
      // If size not found, return 0 (this size doesn't exist)
      return 0
    }

    // If no variant selected, return total of all variants
    if (!variantColor && !variantSize) {
      return item.variants.reduce((sum, v) => sum + v.quantity, 0)
    }

    return 0
  }

  const getAvailableColors = (): string[] => {
    // Priority 1: Use availableColors from item registration if available (now stores "name : quantity" format)
    if (item?.availableColors && item.availableColors.length > 0) {
      // Extract just the color names (before the colon)
      return item.availableColors
        .map(colorStr => {
          const colonIndex = colorStr.indexOf(':')
          return colonIndex > 0 ? colorStr.substring(0, colonIndex).trim() : colorStr.trim()
        })
        .filter(name => name.length > 0)
        .sort()
    }
    
    // Priority 2: Fall back to variants system
    if (!item?.variants || item.variants.length === 0) return []
    const colors = new Set<string>()
    item.variants.forEach(v => {
      if (v.color && v.quantity > 0) {
        colors.add(v.color)
      }
    })
    return Array.from(colors).sort()
  }

  // Get quantity for a specific color (sum of all variants with that color)
  const getColorQuantity = (color: string): number => {
    if (!item?.variants) return 0
    return item.variants
      .filter(v => v.color === color)
      .reduce((sum, v) => sum + v.quantity, 0)
  }

  const getAvailableSizes = (): string[] => {
    // Priority 1: Use availableSizes from item registration if available (now stores "name : quantity" format)
    if (item?.availableSizes && item.availableSizes.length > 0) {
      // Extract just the size names (before the colon)
      return item.availableSizes
        .map(sizeStr => {
          const colonIndex = sizeStr.indexOf(':')
          return colonIndex > 0 ? sizeStr.substring(0, colonIndex).trim() : sizeStr.trim()
        })
        .filter(name => name.length > 0)
        .sort()
    }
    
    // Priority 2: Fall back to variants system
    if (!item?.variants || item.variants.length === 0) return []
    const sizes = new Set<string>()
    item.variants.forEach(v => {
      if (v.size && v.quantity > 0) {
        // Filter by selected color if one is selected
        if (!selectedVariant.color || v.color === selectedVariant.color || !v.color) {
          sizes.add(v.size)
        }
      }
    })
    return Array.from(sizes).sort()
  }

  const getVariantQuantity = (color?: string, size?: string): number => {
    return getAvailableQuantity(color, size)
  }

  const getVariantImage = (color?: string, size?: string): string => {
    if (!item) return "/placeholder.jpg"
    
    if (item.variants) {
      const variant = item.variants.find(v => 
        v.color === color && v.size === size
      ) || item.variants.find(v => v.color === color) || item.variants.find(v => v.size === size)
      
      if (variant?.image) return variant.image
    }
    
    return item.image || "/placeholder.jpg"
  }

  const getCartQuantity = (): number => {
    if (!item) return 0
    const cartItem = cart.find(c => 
      c.item.id === item.id && 
      c.selectedColor === selectedVariant.color && 
      c.selectedSize === selectedVariant.size
    )
    return cartItem?.quantity || 0
  }

  const availableQty = getAvailableQuantity()
  const cartQty = getCartQuantity()
  const remainingQty = availableQty - cartQty
  const maxQuantity = remainingQty > 0 ? remainingQty : availableQty
  const hasVariants = item?.variants && item.variants.length > 0
  const availableColors = getAvailableColors()
  const availableSizes = getAvailableSizes()

  // Generate product images (main + variants) - only use actual item images
  const productImages = item ? (() => {
    const images: string[] = []
    // Add main image
    if (item.image) {
      images.push(item.image)
    }
    // Add variant images if they exist
    if (item.variants) {
      item.variants.forEach(v => {
        if (v.image && !images.includes(v.image)) {
          images.push(v.image)
        }
      })
    }
    // If no images, use placeholder
    if (images.length === 0) {
      images.push("/placeholder.jpg")
    }
    return images
  })() : []

  const handleAddToCart = () => {
    if (!item) {
      console.log("No item found")
      return
    }

    console.log("Adding to cart:", {
      itemId: item.id,
      itemName: item.name,
      selectedColor: selectedVariant.color,
      selectedSize: selectedVariant.size,
      quantity,
      hasVariants,
      availableQty
    })

    if (hasVariants && !selectedVariant.color) {
      toast({
        title: "Select Color",
        description: "Please select a color before adding to cart.",
        variant: "destructive"
      })
      return
    }

    if (quantity > availableQty) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${availableQty} available for this variant.`,
        variant: "destructive"
      })
      return
    }

    // Read current cart from localStorage to ensure we have the latest
    const currentCartStr = localStorage.getItem("app.cart")
    const currentCart: CartItem[] = currentCartStr ? JSON.parse(currentCartStr) : []
    
    console.log("Current cart from localStorage:", currentCart)

    const existingItem = currentCart.find(cartItem => 
      cartItem.item.id === item.id &&
      cartItem.selectedColor === selectedVariant.color &&
      cartItem.selectedSize === selectedVariant.size
    )

    let updatedCart: CartItem[]
    if (existingItem) {
      const newQty = existingItem.quantity + quantity
      if (newQty > availableQty) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${availableQty} available. You already have ${existingItem.quantity} in cart.`,
          variant: "destructive"
        })
        return
      }
      updatedCart = currentCart.map(cartItem =>
        cartItem.item.id === item.id &&
        cartItem.selectedColor === selectedVariant.color &&
        cartItem.selectedSize === selectedVariant.size
          ? { ...cartItem, quantity: newQty }
          : cartItem
      )
    } else {
      updatedCart = [...currentCart, {
        item,
        quantity,
        estimatedPrice: item.price,
        selectedColor: selectedVariant.color,
        selectedSize: selectedVariant.size
      }]
    }

    console.log("Updated cart:", updatedCart)

    // Save to localStorage first (synchronously)
    if (typeof window !== "undefined") {
      localStorage.setItem("app.cart", JSON.stringify(updatedCart))
      console.log("Saved to localStorage:", localStorage.getItem("app.cart"))
    }

    // Update state
    setCart(updatedCart)

    toast({
      title: "Added to Cart",
      description: `${item.name}${selectedVariant.color ? ` (${selectedVariant.color})` : ''}${selectedVariant.size ? ` - ${selectedVariant.size}` : ''} added to cart.`,
    })
  }

  const handleBuyNow = () => {
    // Add to cart first
    handleAddToCart()
    // Open cart dialog on current page
    setIsCartOpen(true)
  }

  const updateQuantity = (itemId: string, newQuantity: number, color?: string, size?: string) => {
    if (newQuantity <= 0) {
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
      const item = readItems().find(i => i.id === itemId)
      if (item) {
        const availableQty = getAvailableQuantity(color, size)
        if (newQuantity > availableQty) {
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
        ? { ...cartItem, quantity: newQuantity }
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
    setIsCartOpen(false)
    setCart([])
    router.push("/pr/list")
    
    toast({
      title: "PR Generated",
      description: `Purchase requisition ${prId} has been created successfully.`,
    })
  }

  const handleShare = async () => {
    if (!item) return

    const shareData = {
      title: item.name,
      text: `Check out ${item.name} - $${item.price?.toFixed(2) || '0.00'}`,
      url: window.location.href
    }

    try {
      // Try Web Share API first (mobile browsers)
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
        toast({
          title: "Shared!",
          description: "Product shared successfully."
        })
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Link Copied!",
          description: "Product link has been copied to clipboard."
        })
      }
    } catch (error: any) {
      // User cancelled or error occurred
      if (error.name !== 'AbortError') {
        // Fallback: Copy to clipboard if Web Share API fails
        try {
          await navigator.clipboard.writeText(window.location.href)
          toast({
            title: "Link Copied!",
            description: "Product link has been copied to clipboard."
          })
        } catch (clipboardError) {
          toast({
            title: "Share Failed",
            description: "Unable to share. Please copy the URL manually.",
            variant: "destructive"
          })
        }
      }
    }
  }

  const handleLike = () => {
    if (!item) return
    
    const newLikedState = toggleFavorite(item.id)
    setIsLiked(newLikedState)
    
    toast({
      title: newLikedState ? "Added to Favorites" : "Removed from Favorites",
      description: newLikedState 
        ? `${item.name} has been added to your favorites.`
        : `${item.name} has been removed from your favorites.`
    })
  }

  if (!item) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/product-selection/shop")}
        className="gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Shop
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden border-2">
            <img
              src={productImages[selectedImageIndex] || item.image || "/placeholder.jpg"}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "/placeholder.jpg"
              }}
            />
            {/* Stock Badge Overlay */}
            {availableQty > 0 && (
              <Badge
                className={`absolute top-4 right-4 ${
                  availableQty > 50
                    ? "bg-green-500"
                    : availableQty > 20
                    ? "bg-yellow-500"
                    : "bg-orange-500"
                } text-white text-sm px-3 py-1`}
              >
                {availableQty} IN STOCK
              </Badge>
            )}
          </div>

          {/* Thumbnail Images */}
          <div className="grid grid-cols-6 gap-2">
            {productImages.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                  selectedImageIndex === index
                    ? "border-primary ring-2 ring-primary ring-offset-2"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <img
                  src={img}
                  alt={`${item.name} view ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.jpg"
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right Side - Product Info */}
        <div className="space-y-6">
          {/* Product Title */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{item.name}</h1>
            <p className="text-muted-foreground">SKU: {item.sku}</p>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-green-600">
              ${item.price?.toFixed(2) || '0.00'}
            </span>
            <span className="text-lg text-muted-foreground">/ {item.unit}</span>
          </div>

          {/* Shipping Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="w-4 h-4" />
            <span>Get by {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>

          {/* Shopping Guarantee */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>15-Day Free Returns</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Cash on Delivery</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Product Care Service Programme</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Sizes & Colors from Registration - Show if item has availableSizes or availableColors */}
          {((item?.availableSizes && item.availableSizes.length > 0) || (item?.availableColors && item.availableColors.length > 0)) && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Available Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Available Colors */}
                  {item.availableColors && item.availableColors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        Available Colors ({item.availableColors.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {item.availableColors.map(colorId => {
                          const color = allColors.find(c => c.id === colorId)
                          if (!color) return null
                          return (
                            <div
                              key={colorId}
                              className="flex items-center gap-2 p-2 border rounded-lg"
                            >
                              {color.hexCode && (
                                <div
                                  className="w-6 h-6 rounded border"
                                  style={{ backgroundColor: color.hexCode }}
                                />
                              )}
                              <Badge variant="outline" className="font-medium">
                                {color.name}
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Available Sizes */}
                  {item.availableSizes && item.availableSizes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                        Available Sizes ({item.availableSizes.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {item.availableSizes.map(sizeId => {
                          const size = allSizes.find(s => s.id === sizeId)
                          if (!size) return null
                          return (
                            <Badge key={sizeId} variant="outline" className="font-medium px-3 py-1">
                              {size.name}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Variants Overview - Show all variants in a structured way */}
          {hasVariants && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Available Variants</h3>
                  <div className="flex items-center gap-2">
                    {availableColors.length > 0 && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {availableColors.length} Color{availableColors.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {availableSizes.length > 0 && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {availableSizes.length} Size{availableSizes.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {item.variants?.reduce((sum, v) => sum + v.quantity, 0) || 0} Total Units
                    </Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  {/* Show all color variants with quantities */}
                  {availableColors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        Available Colors ({availableColors.length})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {availableColors.map(color => {
                          const colorQty = getColorQuantity(color)
                          const colorVariants = item.variants?.filter(v => v.color === color) || []
                          const sizesForColor = new Set(colorVariants.map(v => v.size).filter(Boolean))
                          
                          return (
                            <div
                              key={color}
                              className="p-3 border rounded-lg hover:border-primary/50 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{color}</span>
                                <Badge className={`text-xs ${
                                  colorQty > 20 ? "bg-green-500" : 
                                  colorQty > 10 ? "bg-yellow-500" : 
                                  "bg-orange-500"
                                } text-white`}>
                                  {colorQty} units
                                </Badge>
                              </div>
                              {sizesForColor.size > 0 && (
                                <div className="mt-2 pt-2 border-t">
                                  <p className="text-xs text-muted-foreground mb-1">Sizes:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {Array.from(sizesForColor).map(size => {
                                      const variant = colorVariants.find(v => v.size === size)
                                      return (
                                        <span key={size} className="text-xs px-1.5 py-0.5 bg-muted rounded">
                                          {size} ({variant?.quantity || 0})
                                        </span>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Show all size variants with quantities */}
                  {availableSizes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                        Available Sizes ({availableSizes.length})
                      </h4>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {availableSizes.map(size => {
                          const sizeVariants = item.variants?.filter(v => v.size === size) || []
                          const sizeQty = sizeVariants.reduce((sum, v) => sum + v.quantity, 0)
                          const colorsForSize = new Set(sizeVariants.map(v => v.color).filter(Boolean))
                          
                          return (
                            <div
                              key={size}
                              className="p-2 border rounded-lg hover:border-primary/50 transition-colors text-center"
                            >
                              <div className="font-medium text-sm mb-1">{size}</div>
                              <Badge className={`text-xs ${
                                sizeQty > 20 ? "bg-green-500" : 
                                sizeQty > 10 ? "bg-yellow-500" : 
                                "bg-orange-500"
                              } text-white`}>
                                {sizeQty} units
                              </Badge>
                              {colorsForSize.size > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {colorsForSize.size} color{colorsForSize.size > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Variant Matrix - Show all combinations if both color and size exist */}
                  {availableColors.length > 0 && availableSizes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Variant Combinations Matrix</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        View all available color and size combinations with their stock quantities
                      </p>
                      <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="text-left p-3 font-semibold border-r">Color / Size</th>
                              {availableSizes.map(size => (
                                <th key={size} className="text-center p-3 font-semibold border-r last:border-r-0">{size}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {availableColors.map((color, idx) => (
                              <tr key={color} className={`border-b ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}`}>
                                <td className="p-3 font-medium border-r">{color}</td>
                                {availableSizes.map(size => {
                                  const variant = item.variants?.find(v => 
                                    v.color === color && v.size === size
                                  )
                                  const qty = variant?.quantity || 0
                                  return (
                                    <td key={`${color}-${size}`} className="text-center p-3 border-r last:border-r-0">
                                      {qty > 0 ? (
                                        <Badge className={`${
                                          qty > 20 ? "bg-green-500" : 
                                          qty > 10 ? "bg-yellow-500" : 
                                          "bg-orange-500"
                                        } text-white`}>
                                          {qty}
                                        </Badge>
                                      ) : (
                                        <span className="text-muted-foreground text-xs">N/A</span>
                                      )}
                                    </td>
                                  )
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Variant Selection - Only show if item has variants */}
          {hasVariants && (
            <div className="space-y-4">
              {/* Color Selection - Only show if item has color variants */}
              {availableColors.length > 0 && (
                <div>
                  <label className="text-sm font-semibold mb-2 block">
                    Select Color <span className="text-red-500">*</span>:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map(color => {
                      const colorQty = getColorQuantity(color)
                      const isSelected = selectedVariant.color === color
                      const variantImage = getVariantImage(color, selectedVariant.size)

                      return (
                        <button
                          key={color}
                          onClick={() => {
                            setSelectedVariant(prev => ({ ...prev, color }))
                            // Reset quantity if it exceeds new color's availability
                            const newAvailable = getColorQuantity(color)
                            if (quantity > newAvailable) {
                              setQuantity(Math.max(1, newAvailable))
                            }
                          }}
                          className={`relative flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                            isSelected
                              ? "border-primary ring-2 ring-primary ring-offset-2 bg-primary/5"
                              : "border-border hover:border-primary/50"
                          } ${colorQty === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                          disabled={colorQty === 0}
                          title={`${color}: ${colorQty} available`}
                        >
                          <div className="w-20 h-20 rounded-md overflow-hidden border-2 border-muted">
                            <img
                              src={variantImage}
                              alt={color}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/placeholder.jpg"
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium">{color}</span>
                          <span className="text-xs text-muted-foreground font-semibold">
                            {colorQty} available
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {!selectedVariant.color && (
                    <p className="text-xs text-amber-600 mt-1">
                      Please select a color to see available quantity
                    </p>
                  )}
                </div>
              )}

              {/* Size Selection - Only show if item has size variants */}
              {availableSizes.length > 0 && (
                <div>
                  <label className="text-sm font-semibold mb-2 block">
                    Select Size:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map(size => {
                      const sizeQty = getVariantQuantity(selectedVariant.color, size)
                      const isSelected = selectedVariant.size === size

                      return (
                        <button
                          key={size}
                          onClick={() => {
                            setSelectedVariant(prev => ({ ...prev, size }))
                            // Reset quantity if it exceeds new variant's availability
                            const newAvailable = getVariantQuantity(selectedVariant.color, size)
                            if (quantity > newAvailable) {
                              setQuantity(Math.max(1, newAvailable))
                            }
                          }}
                          className={`px-4 py-2 rounded-lg border-2 transition-all ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary/50"
                          } ${sizeQty === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                          disabled={sizeQty === 0}
                          title={`${size}: ${sizeQty} available`}
                        >
                          <span className="font-medium">{size}</span>
                          {sizeQty > 0 && (
                            <span className="text-xs ml-1">({sizeQty} left)</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Available Quantity Display - Show when color is selected */}
              {selectedVariant.color && (
                <div className={`p-4 rounded-lg border-2 ${
                  availableQty > 0 
                    ? "bg-green-50 border-green-200" 
                    : "bg-red-50 border-red-200"
                }`}>
                  <p className="text-sm font-semibold mb-1">
                    Available Quantity for <span className="text-primary">{selectedVariant.color}</span>:
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {availableQty} units
                  </p>
                  {cartQty > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      ({cartQty} in cart, {remainingQty} left)
                    </p>
                  )}
                  {availableQty === 0 && (
                    <p className="text-xs text-red-600 mt-2 font-medium">
                      This color is currently out of stock
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Show stock info if item has no variants */}
          {!hasVariants && item && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <span className="font-semibold">Available Stock:</span>{" "}
                <span className="text-green-600 font-bold">{item.currentStock || 0}</span> units
                {cartQty > 0 && (
                  <span className="text-muted-foreground ml-2">
                    ({cartQty} in cart, {remainingQty} left)
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Quantity Selection - Only show if color is selected (for items with variants) */}
          {(!hasVariants || selectedVariant.color) && (
            <div className="space-y-2">
              <label className="text-sm font-semibold block">
                Quantity{hasVariants && selectedVariant.color 
                  ? ` (for ${selectedVariant.color})` 
                  : ` (for ${item.name})`}:
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 border-2 rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || availableQty === 0}
                    className="h-10 w-10"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <input
                    type="number"
                    min="1"
                    max={maxQuantity}
                    value={quantity}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(maxQuantity, parseInt(e.target.value) || 1))
                      setQuantity(val)
                    }}
                    disabled={availableQty === 0}
                    className="w-20 text-center border-0 focus:outline-none focus:ring-0 font-semibold text-lg"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity || availableQty === 0}
                    className="h-10 w-10"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  {availableQty > 0 ? (
                    <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
                      IN STOCK
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 text-sm px-3 py-1">
                      OUT OF STOCK
                    </Badge>
                  )}
                  {cartQty > 0 && (
                    <span className="text-sm text-muted-foreground">
                      ({cartQty} in cart, {remainingQty} left)
                    </span>
                  )}
                </div>
              </div>
              {hasVariants && !selectedVariant.color && (
                <p className="text-xs text-amber-600">
                  Please select a color first to choose quantity
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleAddToCart}
              disabled={availableQty === 0 || (hasVariants && !selectedVariant.color)}
              className="flex-1 h-12 text-lg"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add To Cart
            </Button>
            <Button
              onClick={handleBuyNow}
              disabled={availableQty === 0 || (hasVariants && !selectedVariant.color)}
              variant="default"
              className="flex-1 h-12 text-lg bg-green-600 hover:bg-green-700"
            >
              Buy Now
            </Button>
          </div>
          {hasVariants && !selectedVariant.color && (
            <p className="text-sm text-center text-amber-600 font-medium">
              ⚠️ Please select a color before adding to cart
            </p>
          )}

          {/* Social Actions */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Share:</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleShare}
                className="hover:bg-primary/10"
                title="Share this product"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`gap-2 ${isLiked ? "text-red-500 hover:text-red-600" : ""}`}
              onClick={handleLike}
              title={isLiked ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              <span className="text-sm">{isLiked ? "Favorited" : "Favorite"}</span>
            </Button>
          </div>

          {/* Product Details */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Product Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span>{item.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span>{item.location}</span>
                </div>
                {item.description && (
                  <div>
                    <span className="text-muted-foreground">Description:</span>
                    <p className="mt-1">{item.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Shopping Cart Dialog */}
      <Dialog open={isCartOpen} onOpenChange={(open) => {
        setIsCartOpen(open)
        // Reload cart when dialog opens to ensure latest data
        if (open) {
          const savedCart = localStorage.getItem("app.cart")
          console.log("Dialog opening, cart from localStorage:", savedCart)
          if (savedCart) {
            try {
              const parsedCart = JSON.parse(savedCart)
              console.log("Parsed cart:", parsedCart)
              setCart(parsedCart)
            } catch (error) {
              console.error("Error parsing cart:", error)
              setCart([])
            }
          } else {
            console.log("No cart in localStorage")
            setCart([])
          }
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Shopping Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)
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
              {cart.reduce((sum, item) => sum + (item.estimatedPrice || 0) * item.quantity, 0) > 0 && (
                <div className="flex justify-between items-center font-medium text-lg">
                  <span>Estimated Total:</span>
                  <span>${cart.reduce((sum, item) => sum + (item.estimatedPrice || 0) * item.quantity, 0).toFixed(2)}</span>
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
                  {cart.length} item(s) • Total: {cart.reduce((sum, item) => sum + item.quantity, 0)} units
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
                    <span className="font-medium">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                  {cart.reduce((sum, item) => sum + (item.estimatedPrice || 0) * item.quantity, 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Estimated Total:</span>
                      <span className="font-medium">${cart.reduce((sum, item) => sum + (item.estimatedPrice || 0) * item.quantity, 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Purchase Requisition Total:</span>
                      <span>${cart.reduce((sum, item) => sum + (item.estimatedPrice || 0) * item.quantity, 0).toFixed(2)}</span>
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
    </div>
  )
}

