"use client"

import { ReactNode, useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar - hidden on mobile, shown as drawer when mobileMenuOpen */}
      <div className={`
        fixed inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onClose={() => setMobileMenuOpen(false)}
        />
      </div>
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <Header onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}



