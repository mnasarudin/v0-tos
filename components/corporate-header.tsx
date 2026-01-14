"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, ChevronDown } from "lucide-react"
import { LoginModal } from "@/components/login-modal"
import Link from "next/link"

export function CorporateHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isProponentOpen, setIsProponentOpen] = useState(false)

  return (
    <>
      <header className="relative z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
                <div className="h-4 w-4 rounded-sm bg-background"></div>
              </div>
              <span className="text-xl font-semibold text-foreground">Enterprise</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </a>
              <a
                href="#solutions"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Solutions
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </a>
              
              {/* Proponent Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProponentOpen(!isProponentOpen)}
                  onMouseEnter={() => setIsProponentOpen(true)}
                  onMouseLeave={() => setIsProponentOpen(false)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 relative z-50"
                >
                  Proponent
                  <ChevronDown className={`h-4 w-4 transition-transform ${isProponentOpen ? "rotate-180" : ""}`} />
                </button>
                {isProponentOpen && (
                  <div 
                    className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-[100] overflow-hidden"
                    onMouseEnter={() => setIsProponentOpen(true)}
                    onMouseLeave={() => setIsProponentOpen(false)}
                  >
                    <div className="py-1">
                      <Link
                        href="/supplier/register"
                        className="block px-5 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        onClick={() => setIsProponentOpen(false)}
                      >
                        Register as Supplier
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <a
                href="#docs"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Documentation
              </a>
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" onClick={() => setIsLoginOpen(true)}>
                Sign In
              </Button>
              <Button onClick={() => setIsLoginOpen(true)}>Get Started</Button>
            </div>

            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {isMenuOpen && (
            <div className="md:hidden border-t border-border py-4">
              <nav className="flex flex-col gap-4">
                <a
                  href="#features"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Features
                </a>
                <a
                  href="#solutions"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Solutions
                </a>
                <a
                  href="#pricing"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pricing
                </a>
                
                {/* Mobile Proponent Dropdown */}
                <div>
                  <button
                    onClick={() => setIsProponentOpen(!isProponentOpen)}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 w-full justify-between"
                  >
                    Proponent
                    <ChevronDown className={`h-4 w-4 transition-transform ${isProponentOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isProponentOpen && (
                    <div className="mt-2 ml-4 space-y-2">
                      <Link
                        href="/supplier/register"
                        className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => {
                          setIsProponentOpen(false)
                          setIsMenuOpen(false)
                        }}
                      >
                        Register as Supplier
                      </Link>
                    </div>
                  )}
                </div>

                <a
                  href="#docs"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Documentation
                </a>
                <div className="flex flex-col gap-2 pt-4 border-t border-border">
                  <Button variant="ghost" onClick={() => setIsLoginOpen(true)}>
                    Sign In
                  </Button>
                  <Button onClick={() => setIsLoginOpen(true)}>Get Started</Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      <LoginModal open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </>
  )
}
