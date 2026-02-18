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
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Pill,
  Settings,
  Users,
  Wallet
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

export function Sidebar() {
  const pathname = usePathname()
  const { isOpen, toggle } = useSidebarStore()
  const { general } = useSettingsStore()
  console.log("Sidebar General Settings:", general); // DEBUG
  const { activeBranch } = usePosStore()
  const t = useTranslations("Sidebar")
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  interface Route {
    label: string
    icon: any
    href?: string
    color?: string
    permission?: string
    module?: string
    children?: {
        label: string
        href: string
        permission?: string
        module?: string
    }[]
  }

  const { hasPermission, hasModuleAccess, user } = usePermissions() // Ensure hasPermission is used

  // DEBUG LOGGING
  useEffect(() => {
    if (user) {
        console.log("Sidebar User Full:", JSON.stringify(user, null, 2));
    } else {
        console.log("Sidebar User is NULL");
    }
  }, [user]);

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
      module: "patients",
    },
    {
      label: "Pharmacy",
      icon: Pill,
      href: "/pharmacy",
      color: "text-pink-400",
      module: "pharmacy",
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
  
  const filterRoutes = (items: typeof routes): typeof routes => {
      // Helper to check access for a single route item
      const checkAccess = (route: { permission?: string; module?: string }) => {
          if (route.module) {
              if (hasModuleAccess(route.module)) return true
          }
           
          if (route.permission) {
              return hasPermission(route.permission)
          }
          
          if (!route.module && !route.permission) return true
          
          return false
      }

      return items.reduce<typeof routes>((acc, route) => {
          if (route.children) {
              const filteredChildren = route.children.filter(child => checkAccess(child))

              if (filteredChildren.length > 0) {
                   if ((route.permission || route.module) && !checkAccess(route)) {
                       return acc
                   }
                   
                   acc.push({ ...route, children: filteredChildren })
                   return acc
              }

              if (route.href && checkAccess(route)) {
                  const { children, ...rest } = route
                  acc.push(rest as any)
                  return acc
              }
              
              return acc
          }

          if (checkAccess(route)) {
              acc.push(route)
          }

          return acc
      }, [])
  }

  const visibleRoutes = filterRoutes(routes)

  return (
    <div className={cn(
        "hidden md:flex relative flex-col h-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border-r border-zinc-200 dark:border-white/10 transition-all duration-300 w-full"
    )}>
      {/* Brand Header */}
      <div className="flex items-center h-20 px-6 border-b border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900">
        <Link href="/dashboard" className="flex items-center gap-3 w-full">
            {isMounted && activeBranch?.logoUrl ? (
                <div className={cn("relative flex items-center justify-center shrink-0 w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 overflow-hidden", !isOpen && "mx-auto")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={activeBranch.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                </div>
            ) : (
                <div className={cn("relative flex items-center justify-center shrink-0 w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 overflow-hidden", !isOpen && "mx-auto")}>
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img src="/Logo.png" alt="Logo" className="w-full h-full object-contain p-1" />
                </div>
            )}
          
          {isOpen && (
             <div className="flex flex-col animate-in fade-in duration-300 overflow-hidden">
                <h1 className="text-lg font-bold tracking-tight truncate w-full">
                    {general?.hospitalName || "Patwary General hospital"}
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
                                "w-full relative flex items-center justify-between p-3 rounded-xl transition-all duration-200 group overflow-hidden text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5",
                                (isActiveParent || isExpanded) && "text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/5"
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
                                                    ? "text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/10 font-medium" 
                                                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
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
                        ? "bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white shadow-sm dark:shadow-md backdrop-blur-sm" 
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
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
      <div className="p-4 border-t border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950">
        <Button 
            variant="ghost" 
            className={cn(
                "w-full text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5", 
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
