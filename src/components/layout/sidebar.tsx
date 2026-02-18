"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePermissions } from "@/hooks/use-permissions"
import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { usePosStore } from "@/store/use-pos-store"
import { useSettingsStore } from "@/store/use-settings-store"
import { useSidebarStore } from "@/store/use-sidebar-store"
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Pill,
  Settings,
  Users,
  Wallet
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

export function Sidebar() {
  const pathname = usePathname()
  const { isOpen, toggle } = useSidebarStore()
  const { general } = useSettingsStore()
  const { activeBranch } = usePosStore()
  const t = useTranslations("Sidebar")
  interface Route {
    label: string
    icon: typeof LayoutDashboard
    href?: string
    color?: string
    permission?: string
    children?: {
        label: string
        href: string
        permission?: string
    }[]
  }

  const { hasPermission } = usePermissions() // Ensure hasPermission is used

  // State for expanded menus (using pathname to auto-expand on load?)
  // Simple approach: toggle state object { [label]: boolean }
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggleExpand = (label: string) => {
    setExpanded(prev => ({ ...prev, [label]: !prev[label] }))
    if (!isOpen) toggle() // Auto-open sidebar if expanding a menu
  }

  const routes: Route[] = [
    {
      label: t("dashboard"),
      icon: LayoutDashboard,
      href: "/dashboard",
      color: "text-sky-400",
      permission: "dashboard:read",
    },
    {
      label: t("patients"),
      icon: Users,
      href: "/patients",
      color: "text-violet-400",
      permission: "patient:read",
    },
    {
      label: "Pharmacy",
      icon: Pill,
      href: "/pharmacy",
      color: "text-pink-400",
      permission: "medicine:read",
    },
    // {
    //   label: t("appointments"),
    //   icon: CalendarDays,
    //   href: "/appointments",
    //   color: "text-orange-400",
    //   // permission: "appointment:read",
    // },
    {
        label: "Finance",
        icon: Wallet,
        href: "/finance",
        color: "text-green-500",
        // permission: "finance:read",
    },
    {
      label: "User Management",
      icon: Users,
      color: "text-indigo-400",
      // Parent permission: visible if any child is visible or explicit permission?
      // For now, let's say "user:read" covers it, or check children.
      permission: "user:read", 
      children: [
          {
              label: "Users",
              href: "/settings/users",
              permission: "user:read",
          },
          {
              label: "Roles & Permissions",
              href: "/settings/roles",
              permission: "role:read",
          }
      ]
    },
    {
      label: t("settings"),
      icon: Settings,
      href: "/settings",
      color: "text-emerald-400",
      permission: "settings:read",
    },
  ]

  // Filter routes based on permissions
  // For parents with children, we should check if at least one child is accessible?
  // Or just rely on the parent permission.
  // Let's implement recursive check if needed, but simple filter is safer to start.
  // The user asked "is that you show menu... based on permission right?". 
  // Yes, I should ensure it.
  
  const filterRoutes = (items: typeof routes) => {
      return items.filter(route => {
          if (route.permission && !hasPermission(route.permission)) return false
          
          // If children exists, filter them too?
          // For now, simple implementation assuming parent permission controls visibility of the block
          return true
      })
  }

  const visibleRoutes = filterRoutes(routes)

  return (
    <div className={cn(
        "hidden md:flex relative flex-col h-full bg-[#111827] text-white border-r border-white/10 transition-all duration-300 w-full"
    )}>
      {/* Brand Header */}
      <div className="flex items-center h-20 px-6 border-b border-white/10 bg-[#111827]">
        <Link href="/dashboard" className="flex items-center gap-3 w-full">
            {activeBranch?.logoUrl ? (
                <div className={cn("relative flex items-center justify-center shrink-0 w-10 h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden", !isOpen && "mx-auto")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={activeBranch.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                </div>
            ) : (
                <div className={cn("relative flex items-center justify-center shrink-0 w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-blue-600 shadow-lg shadow-primary/20", !isOpen && "mx-auto")}>
                     <Activity className="w-6 h-6 text-white" />
                </div>
            )}
          
          {isOpen && (
             <div className="flex flex-col animate-in fade-in duration-300 overflow-hidden">
                <h1 className="text-lg font-bold tracking-tight truncate w-full">
                    {general?.hospitalName || activeBranch?.name || "MediCare"}
                </h1>
                {/* <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Pro Admin</p> */}
             </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-6 px-3">
        <div className="space-y-2">
          {visibleRoutes.map((route) => {
             // Check if children exist
             if (route.children) {
                 const isExpanded = expanded[route.label]
                 // Check if any child is active to auto-expand? 
                 // (Can add useEffect for this, but manual toggle is fine for now)
                 const isActiveParent = route.children.some(child => pathname === child.href)
                 
                 return (
                     <div key={route.label} className="space-y-1">
                        <button
                            onClick={() => toggleExpand(route.label)}
                            className={cn(
                                "w-full relative flex items-center justify-between p-3 rounded-xl transition-all duration-200 group overflow-hidden text-zinc-400 hover:text-white hover:bg-white/5",
                                (isActiveParent || isExpanded) && "text-white bg-white/5"
                            )}
                        >
                            <div className={cn("flex items-center flex-1", !isOpen && "justify-center")}>
                                <route.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", route.color, isOpen && "mr-3")} />
                                {isOpen && <span className="font-medium text-sm">{route.label}</span>}
                            </div>
                            {isOpen && (
                                <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-90")} />
                            )}
                        </button>

                        {/* Dropdown Items */}
                        {isOpen && isExpanded && (
                            <div className="pl-12 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                {route.children.map(child => {
                                    // Check child permission
                                    if (child.permission && !hasPermission(child.permission)) return null

                                    const isChildActive = pathname === child.href
                                    return (
                                        <Link
                                            key={child.href}
                                            href={child.href}
                                            className={cn(
                                                "block p-2 text-sm rounded-lg transition-colors",
                                                isChildActive 
                                                    ? "text-white bg-white/10 font-medium" 
                                                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            {child.label}
                                        </Link>
                                    )
                                })}
                            </div>
                        )}
                     </div>
                 )
             }

             const isActive = pathname === route.href || (route.href && pathname.startsWith(`${route.href}/`))
             return (
                <Link
                key={route.href}
                href={route.href!}
                className={cn(
                    "relative flex items-center p-3 rounded-xl transition-all duration-200 group overflow-hidden",
                    isActive 
                        ? "bg-white/10 text-white shadow-md backdrop-blur-sm" 
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
                >
                {isActive && (
                    <div className="absolute left-0 w-1 h-8 bg-primary rounded-r-full" />
                )}
                
                <div className={cn("flex items-center flex-1", !isOpen && "justify-center")}>
                    <route.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", route.color, isOpen && "mr-3")} />
                    {isOpen && <span className="font-medium text-sm">{route.label}</span>}
                </div>
                
                {/* Hover Glow Effect */}
                {!isActive && (
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-gradient-to-r from-white/5 to-transparent transition-opacity pointer-events-none" />
                )}
                </Link>
             )
          })}
        </div>
      </ScrollArea>

      {/* Footer / Toggle */}
      <div className="p-4 border-t border-white/10 bg-[#0f1523]">
        <Button 
            variant="ghost" 
            className={cn(
                "w-full text-zinc-400 hover:text-white hover:bg-white/5", 
                !isOpen && "px-2"
            )}
            onClick={toggle}
        >
             {isOpen ? (
                 <div className="flex items-center w-full">
                     <ChevronLeft className="h-5 w-5 mr-2" />
                     <span>Collapse Sidebar</span>
                 </div>
             ) : (
                 <ChevronRight className="h-5 w-5" />
             )}
        </Button>
      </div>
    </div>
  )
}
