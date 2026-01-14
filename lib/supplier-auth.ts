// Supplier authentication utilities
import type { Vendor } from "@/components/vendor-form"

export interface SupplierAccount {
  id: string
  email: string
  password: string // In production, this should be hashed
  companyName: string
  ssmNumber?: string
  category: string
  contactName: string
  phone: string
  address: string
  city: string
  country: string
  website?: string
  businessDescription?: string
}

const SUPPLIER_ACCOUNTS_KEY = "app.supplierAccounts"
const CURRENT_SUPPLIER_KEY = "app.currentSupplier"
const VENDOR_STORAGE_KEY = "app.vendors"

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

export function registerSupplier(account: SupplierAccount): void {
  if (typeof window === "undefined") return
  
  const accounts = getSupplierAccounts()
  // Check if email already exists
  if (accounts.some(acc => acc.email === account.email)) {
    throw new Error("Email already registered")
  }
  
  accounts.push(account)
  localStorage.setItem(SUPPLIER_ACCOUNTS_KEY, JSON.stringify(accounts))

  // Also save as vendor in vendor list
  const vendors = readVendors()
  // Check if vendor with same email already exists
  const existingVendorIndex = vendors.findIndex(v => v.email === account.email)
  
  const vendor: Vendor = {
    id: account.id,
    name: account.companyName,
    category: account.category,
    ssmNumber: account.ssmNumber,
    contactName: account.contactName,
    email: account.email,
    phone: account.phone,
    address: account.address,
    city: account.city,
    country: account.country,
    performance: "good", // Default performance for new suppliers
  }

  if (existingVendorIndex >= 0) {
    vendors[existingVendorIndex] = vendor
  } else {
    vendors.push(vendor)
  }
  
  writeVendors(vendors)
}

export function getSupplierAccounts(): SupplierAccount[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(SUPPLIER_ACCOUNTS_KEY)
    return raw ? (JSON.parse(raw) as SupplierAccount[]) : []
  } catch {
    return []
  }
}

export function authenticateSupplier(email: string, password: string): SupplierAccount | null {
  const accounts = getSupplierAccounts()
  const account = accounts.find(acc => acc.email === email && acc.password === password)
  
  if (account) {
    // Store current supplier session (without password)
    const { password: _, ...sessionData } = account
    localStorage.setItem(CURRENT_SUPPLIER_KEY, JSON.stringify(sessionData))
    return account
  }
  
  return null
}

export function getCurrentSupplier(): Omit<SupplierAccount, "password"> | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(CURRENT_SUPPLIER_KEY)
    return raw ? (JSON.parse(raw) as Omit<SupplierAccount, "password">) : null
  } catch {
    return null
  }
}

export function isSupplierAuthenticated(): boolean {
  return getCurrentSupplier() !== null
}

export function logoutSupplier(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(CURRENT_SUPPLIER_KEY)
}

