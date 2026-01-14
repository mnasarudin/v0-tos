"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ProductShopPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/product-selection")
  }, [router])
  
  return null
}



