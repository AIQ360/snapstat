"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Settings, X, Home, BarChart2, User, LogOut } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface AppSidebarProps {
  credits: number
  userEmail: string
  userName: string
  avatarUrl?: string
  isMobile?: boolean
  onClose?: () => void
  onNavigate?: () => void
}

interface NavItem {
  label: string
  icon: React.ReactNode
  href: string
}

export function AppSidebar({ credits, userEmail, userName, avatarUrl, isMobile = false, onClose, onNavigate }: AppSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const navItems: NavItem[] = [
    { label: "Dashboard", icon: <Home className="h-5 w-5" />, href: "/dashboard" },
    { label: "Analytics", icon: <BarChart2 className="h-5 w-5" />, href: "/analytics-dashboard" },
    { label: "Account", icon: <User className="h-5 w-5" />, href: "/settings" },
    { label: "GA Setup", icon: <BarChart2 className="h-5 w-5" />, href: "/ga-setup" },
  ]

  const toggleMenu = () => setIsOpen(!isOpen)


  const handleNavigation = (href: string) => {
    setIsOpen(false)
    if (onNavigate) onNavigate()
    if (onClose) onClose()
  }

  return (
    <>
      {/* Backdrop overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-md bg-maker-blue text-white hover:bg-maker-blue/90",
          "bg-[url('/grain.png')] bg-opacity-70"
        )}
        onClick={toggleMenu}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
          {isOpen ? <X className="h-6 w-6" /> : <Settings className="h-6 w-6" />}
        </motion.div>
      </motion.button>

      {/* Navigation menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 z-50 flex flex-col gap-3 items-end"
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {navItems.map((item, index) => (
              <motion.a
                key={item.label}
                href={item.href}
                className="flex items-center gap-2 group relative"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleNavigation(item.href)}
              >
                {/* Icon */}
                <span className="p-2 rounded-full bg-slate-200 text-foreground transition-colors group-hover:bg-maker-blue group-hover:text-white">
                  {item.icon}
                </span>
                {/* Label */}
                <span className="text-lg font-medium text-foreground bg-white px-3 py-1 rounded-md border border-slate-200 transform -rotate-1 group-hover:rotate-0 transition-transform">
                  {item.label}
                </span>
              </motion.a>
            ))}

            {/* Sign out */}
            <motion.button
              className="flex items-center gap-2 group relative"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: navItems.length * 0.05 }}
              onClick={handleSignOut}
            >
              <span className="p-2 rounded-full bg-slate-200 text-foreground transition-colors group-hover:bg-rose-500 group-hover:text-white">
                <LogOut className="h-5 w-5" />
              </span>
              <span className="text-lg font-medium text-foreground bg-white px-3 py-1 rounded-md border border-slate-200 transform -rotate-1 group-hover:rotate-0 transition-transform">
                Sign Out
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
