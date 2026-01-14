// API Client utility functions to replace localStorage operations

const API_BASE = '/api'

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || error.error || 'API request failed')
    }

    return await response.json()
  } catch (error: any) {
    console.error(`API call failed: ${endpoint}`, error)
    throw error
  }
}

// Items API
export const itemsApi = {
  getAll: (category?: string, vendorId?: string) => {
    const params = new URLSearchParams()
    if (category) params.append('category', category)
    if (vendorId) params.append('vendorId', vendorId)
    const query = params.toString() ? `?${params.toString()}` : ''
    return apiCall(`/items${query}`)
  },
  getById: (id: string) => apiCall(`/items/${id}`),
  create: (item: any) => apiCall('/items', { method: 'POST', body: JSON.stringify(item) }),
  update: (id: string, item: any) => apiCall(`/items/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  delete: (id: string) => apiCall(`/items/${id}`, { method: 'DELETE' }),
}

// Vendors API
export const vendorsApi = {
  getAll: () => apiCall('/vendors'),
  getById: (id: string) => apiCall(`/vendors/${id}`),
  create: (vendor: any) => apiCall('/vendors', { method: 'POST', body: JSON.stringify(vendor) }),
  update: (id: string, vendor: any) => apiCall(`/vendors/${id}`, { method: 'PUT', body: JSON.stringify(vendor) }),
  delete: (id: string) => apiCall(`/vendors/${id}`, { method: 'DELETE' }),
}

// Cart API
export const cartApi = {
  getAll: (userEmail?: string) => {
    const params = new URLSearchParams()
    if (userEmail) params.append('userEmail', userEmail)
    const query = params.toString() ? `?${params.toString()}` : ''
    return apiCall(`/cart${query}`)
  },
  add: (item: { userEmail?: string; itemId: string; quantity: number; selectedColor?: string; selectedSize?: string }) =>
    apiCall('/cart', { method: 'POST', body: JSON.stringify(item) }),
  update: (item: { userEmail?: string; itemId: string; quantity: number; selectedColor?: string; selectedSize?: string }) =>
    apiCall('/cart', { method: 'PUT', body: JSON.stringify(item) }),
  remove: (userEmail: string, itemId: string, selectedColor?: string, selectedSize?: string) => {
    const params = new URLSearchParams()
    params.append('userEmail', userEmail)
    params.append('itemId', itemId)
    if (selectedColor !== undefined) params.append('selectedColor', selectedColor || '')
    if (selectedSize !== undefined) params.append('selectedSize', selectedSize || '')
    return apiCall(`/cart?${params.toString()}`, { method: 'DELETE' })
  },
  clear: (userEmail: string) => {
    const params = new URLSearchParams()
    params.append('userEmail', userEmail)
    return apiCall(`/cart?${params.toString()}`, { method: 'DELETE' })
  },
}

// Purchase Requisitions API
export const prsApi = {
  getAll: (status?: string) => {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    const query = params.toString() ? `?${params.toString()}` : ''
    return apiCall(`/prs${query}`)
  },
  create: (pr: any) => apiCall('/prs', { method: 'POST', body: JSON.stringify(pr) }),
}

// Helper to get current user email (you may need to adjust this based on your auth system)
export function getCurrentUserEmail(): string {
  if (typeof window === 'undefined') return 'guest@example.com'
  
  try {
    const userStr = localStorage.getItem('app.currentUser')
    if (userStr) {
      const user = JSON.parse(userStr)
      return user.email || 'guest@example.com'
    }
  } catch {
    // Ignore errors
  }
  
  return 'guest@example.com'
}
