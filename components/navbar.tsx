"use client"

import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState } from "react"
import { ModeToggle } from "@/components/mode-toggle"

export function Navbar() {
  const { user, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="border-b">
      <div className=" flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="text-xl">SaaS Boilerplate</span>
        </Link>

        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        <nav
          className={`${isMenuOpen ? "flex" : "hidden"} absolute top-16 left-0 right-0 z-50 flex-col gap-4 border-b bg-background p-4 md:static md:flex md:flex-row md:items-center md:border-0 md:p-0`}
        >
          <Link href="/" className="text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>

          {user ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
                Dashboard
              </Link>
              <Link href="/profile" className="text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
                Profile
              </Link>
              <Button
                variant="ghost"
                onClick={() => {
                  signOut()
                  setIsMenuOpen(false)
                }}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
                Sign In
              </Link>
              <Link href="/sign-up" onClick={() => setIsMenuOpen(false)}>
                <Button>Sign Up</Button>
              </Link>
            </>
          )}

          <ModeToggle />
        </nav>
      </div>
    </header>
  )
}
