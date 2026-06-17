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
    Ambulance,
    BarChart3,
    Building2,
    ChevronLeft,
    ChevronRight,
    FlaskConical,
    LayoutDashboard,
    Megaphone,
    Microscope,
    Pill,
    Receipt,
    Settings,
    Stethoscope,
    Users,
    Wallet
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export function Sidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isOpen, toggle } = useSidebarStore()
  const { general } = useSettingsStore()
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
    permission?: string | string[]
    roles?: string[]
    module?: string
    children?: {
        label: string
        href?: string
        permission?: string | string[]
        roles?: string[]
        module?: string
    }[]
  }

  interface SidebarSection {
    category: string
    items: Route[]
  }

  const { hasPermission, hasModuleAccess, isAdmin, user } = usePermissions()

  // DEBUG LOGGING
  useEffect(() => {
    if (user) {
        
    } else {
        
    }
  }, [user]);

  // State for expanded menus (using pathname to auto-expand on load?)
  // Simple approach: toggle state object { [label]: boolean }
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggleExpand = (label: string) => {
    setExpanded(prev => ({ ...prev, [label]: !prev[label] }))
    if (!isOpen) toggle() // Auto-open sidebar if expanding a menu
  }

  const sections: SidebarSection[] = [
    {
      category: "Main",
      items: [
        {
          label: t("dashboard"),
          icon: LayoutDashboard,
          href: "/dashboard",
          color: "text-sky-400",
          permission: "dashboard:read",
          roles: ["Super Admin", "Admin", "Pharmacist", "Doctor", "Pathologist", "Radiologist", "Receptionist", "Accountant", "Pathology", "Radiology", "USG", "Ultrasound"],
        },
      ]
    },
    {
      category: "CLINICAL DEPARTMENTS",
      items: [
        {
          label: "Patient Care",
          icon: Stethoscope,
          color: "text-blue-400",
          roles: ["Super Admin", "Admin", "Receptionist", "Doctor"],
          children: [
            {
              label: "All Patients",
              href: "/patients",
              module: "patients",
              permission: "patient:read",
            },
            {
              label: "OPD Patients",
              href: "/patients?visitType=opd",
              module: "patients",
              permission: "patient:read",
            },
            {
              label: "IPD Patients",
              href: "/patients?visitType=ipd",
              module: "patients",
              permission: "patient:read",
            },
            {
              label: "Book Appointment",
              href: "/appointments",
              permission: "appointment:read",
            }
          ]
        },
        {
          label: "Clinical Ops",
          icon: FlaskConical,
          color: "text-indigo-400",
          roles: ["Super Admin", "Admin", "Doctor", "Pathologist", "Radiologist", "Pathology", "Radiology", "USG", "Ultrasound"],
          children: [
            {
              label: "Diagnostic Reports",
              href: "/diagnostic/reports",
              module: "diagnostic",
              permission: ["pathology:read", "radiology:read"],
            },
            {
              label: "Lab Management",
              href: "/diagnostic/reports?tab=pending",
              module: "diagnostic",
              permission: "pathology:read",
            },
          ]
        }
      ]
    },
    {
      category: "RESOURCE MANAGEMENT",
      items: [
        {
          label: "Pharmacy & Stores",
          icon: Pill,
          color: "text-pink-400",
          module: "pharmacy",
          roles: ["Super Admin", "Admin", "Pharmacist"],
          children: [
            {
              label: "POS System",
              href: "/pharmacy/pos",
              permission: "sale:create",
            },
            {
              label: "Sales History",
              href: "/sales?type=pos",
              permission: "sale:read",
            },
            {
              label: "Cash Registers",
              href: "/pharmacy/registers",
              permission: "cash-register:read",
            },
            {
              label: "Returns",
              href: "/sales/returns?type=pos",
              permission: "sale-return:read",
            },
            {
              label: "Stock Management",
              href: "/pharmacy/inventory",
              permission: "stock:read",
            },
            {
              label: "Purchase Orders",
              href: "/purchases?type=pharmacy",
              permission: "purchase:read",
            },
            {
              label: "Medicines Catalog",
              href: "/pharmacy/inventory/medicines",
              permission: "medicine:read",
            },
            {
              label: "Suppliers",
              href: "/suppliers",
              permission: "supplier:read",
            },
            {
              label: "Pharmacy Reports",
              href: "/reports",
              module: "sales",
              permission: "sale:read",
            }
          ]
        },
        {
          label: "Ambulance Service",
          icon: Ambulance,
          color: "text-rose-500",
          roles: ["Super Admin", "Admin", "Receptionist"],
          children: [
            {
              label: "Booking Requests",
              href: "/ambulances/bookings",
              permission: "ambulance-booking:read",
            },
            {
              label: "Fleet & Vehicles",
              href: "/ambulances",
              permission: "ambulance:read",
            },
            {
              label: "Active Dispatch",
              href: "/ambulances?view=dispatch",
              permission: "ambulance:read",
            },
            {
              label: "Driver Roster",
              href: "/ambulances?view=drivers",
              permission: "ambulance:read",
            }
          ]
        }
      ]
    },
    {
      category: "FINANCIALS",
      items: [
        {
          label: "Billing & Collection",
          icon: Receipt,
          color: "text-indigo-600",
          roles: ["Super Admin", "Admin", "Receptionist", "Accountant"],
          children: [
            {
              label: "Emergency",
              href: "/billing/emergency",
              permission: ["sale:create"],
            },
            {
              label: "Appointment",
              href: "/billing/appointment",
              module: "appointment",
              permission: ["appointment:create", "sale:create"],
            },
            {
              label: "OPD",
              href: "/billing/opd",
              module: "sales",
              permission: ["pathology:create", "sale:create"],
            },
            {
              label: "IPD",
              href: "/billing/ipd",
              module: "patients",
              permission: ["patient:read", "sale:create"],
            },
            {
              label: "All Invoices & Receipts",
              href: "/sales",
              permission: ["sale:read", "sale:create"],
            },
            {
              label: "Doctor Payment",
              href: "/finance/doctor-payment",
              permission: ["account:read", "sale:update", "sale:create"],
            },
            {
              label: "Referral Network",
              href: "/hr/referrals",
              permission: ["user:read", "account:read", "sale:update", "sale:create"],
            },
          ]
        },
        {
          label: "Finance & Accounts",
          icon: Wallet,
          color: "text-emerald-500",
          roles: ["Super Admin", "Admin", "Accountant"],
          children: [
            {
              label: "Expense Tracking",
              href: "/finance/expenses",
              permission: "account:read",
            },
            {
              label: "General Ledger",
              href: "/finance",
              module: "finance",
              permission: "account:read",
            },
            {
              label: "Finance Reports",
              href: "/finance/reports",
              module: "finance",
              permission: "account:read",
            }
          ]
        }
      ]
    },
    {
      category: "ADMINISTRATION",
      items: [
        {
          label: "HR & Staff",
          icon: Users,
          color: "text-orange-500",
          roles: ["Super Admin", "Admin"],
          children: [
            {
              label: "Staff Directory",
              href: "/hr/employees",
              module: "hr",
              permission: "user:read",
            },
            {
              label: "Attendance & Shifts",
              href: "/hr/attendance-and-leaves",
              module: "hr",
              permission: "user:read",
            },
            {
              label: "Departments & Roles",
              href: "/hr/departments",
              module: "hr",
              permission: "department:read",
            },
            {
              label: "Designations",
              href: "/hr/designations",
              module: "hr",
              permission: "designation:read",
            },
            {
              label: "Payroll & Salary",
            }
          ]
        },
        {
          label: "Clinical Services",
          icon: Settings,
          color: "text-zinc-500",
          roles: ["Super Admin", "Admin"],
          children: [
            {
              label: "Service Setup",
              href: "/diagnostic",
              module: "diagnostic",
              permission: "diagnostic-test:read",
            },
            {
              label: "Service Categories",
            }
          ]
        },
        {
          label: "System & Settings",
          icon: Settings,
          color: "text-zinc-500",
          roles: ["Super Admin", "Admin"],
          children: [
            {
              label: "User Management",
              href: "/settings/users",
              module: "users",
              permission: "user:read",
            },
            {
              label: "Facility Management",
              href: "/facility",
              permission: "facility:read",
            },
            {
              label: "Roles & Permissions",
              href: "/settings/roles",
              module: "users",
              permission: "role:read",
            },
            {
              label: "Pharmacy Setup",
              href: "/pharmacy/setup",
              permission: "medicine-category:read",
            },
            {
              label: "System Settings",
              href: "/settings",
              module: "settings",
              permission: "settings:read",
            },
            {
              label: "Branches",
              href: "/branches",
              module: "branches",
              permission: "branch:read",
            },
            {
              label: "Audit Logs",
              href: "/settings/audit-logs",
              module: "settings",
              permission: "settings:read",
            },
            {
                label: "Communication",
                href: "/settings/communication",
                module: "settings",
                permission: "settings:read",
            },
            {
              label: "Media Library",
              href: "/media",
              module: "media",
              permission: "media:read",
            }
          ]
        }
      ]
    },
  ]

  // Filter routes based on permissions
  // For parents with children, we should check if at least one child is accessible?
  // Or just rely on the parent permission.
  // Let's implement recursive check if needed, but simple filter is safer to start.
  // The user asked "is that you show menu... based on permission right?". 
  // Yes, I should ensure it.
  
      // Helper to check access for a route item
      const checkAccess = (route: { permission?: string | string[]; module?: string; roles?: string[] }) => {
          // 1. Role-First Priority Gate (Absolute authority if defined)
          if (route.roles && route.roles.length > 0) {
              const userRole = user?.role?.name || "";
              const normalizedUserRole = userRole.toLowerCase().replace(/[\s\-_]+/g, '');
              
              const isAuthorizedRole = route.roles.some(r => {
                  const normalizedR = r.toLowerCase().replace(/[\s\-_]+/g, '');
                  return normalizedUserRole === normalizedR || userRole.toLowerCase() === r.toLowerCase();
              });
              
              // IF roles are listed: only those roles get access.
              // IF you match? You see it (no permission check needed).
              // IF you don't match? You don't see it.
              return isAuthorizedRole;
          }

          // 2. Permission/Module Fallback (Only if NO roles are specified)
          let hasMod = true;
          let hasPerm = true;

          // Check module access
          if (route.module) {
              hasMod = hasModuleAccess(route.module);
          }

          // Check specific permission
          if (route.permission) {
              if (Array.isArray(route.permission)) {
                  hasPerm = route.permission.some(p => hasPermission(p));
              } else {
                  hasPerm = hasPermission(route.permission);
              }
          }

          return hasMod && hasPerm;
      }

  const filterRoutes = (items: Route[]): Route[] => {
      return items.reduce<Route[]>((acc, route) => {
          if (route.children) {
              const filteredChildren = route.children.filter(child => checkAccess(child))

              if (filteredChildren.length > 0) {
                   // If any gating criteria exists (permission, module, OR roles), we must check access
                   if ((route.permission || route.module || route.roles) && !checkAccess(route)) {
                       return acc
                   }
                   
                   acc.push({ ...route, children: filteredChildren })
                   return acc
              }

              if (route.href && checkAccess(route)) {
                  const { children, ...rest } = route
                  acc.push(rest as Route)
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

  const visibleSections = sections.reduce<SidebarSection[]>((acc, section) => {
    const filteredItems = filterRoutes(section.items)
    if (filteredItems.length > 0) {
      acc.push({ ...section, items: filteredItems })
    }
    return acc
  }, [])

  return (
      <div className={cn(
        "hidden md:flex relative flex-col h-full bg-white dark:bg-sidebar border-r border-zinc-200 dark:border-sidebar-border transition-all duration-300 w-full overflow-hidden"
    )}>
      {/* Brand Header */}
      <div className="flex items-center h-20 px-6 border-b border-zinc-200 dark:border-sidebar-border bg-white dark:bg-sidebar">
        <Link href="/dashboard" className="flex items-center gap-3 w-full">
            {isMounted && activeBranch?.logoUrl ? (
                <div className={cn("relative flex items-center justify-center shrink-0 w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-sidebar-border overflow-hidden", !isOpen && "mx-auto")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={activeBranch.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                </div>
            ) : (
                <div className={cn("relative flex items-center justify-center shrink-0 w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-sidebar-border overflow-hidden", !isOpen && "mx-auto")}>
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img src="/Logo.png" alt="Logo" className="w-full h-full object-contain p-1" />
                </div>
            )}
          
          {isOpen && (
             <div className="flex flex-col h-full bg-white dark:bg-sidebar text-zinc-900 dark:text-white animate-in fade-in duration-300 overflow-hidden">
                <h1 className="text-lg font-bold tracking-tight truncate w-full">
                    {general?.hospitalName || "Patwary General hospital"}
                </h1>
                {/* <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Pro Admin</p> */}
             </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-6 px-3 min-h-0">
        <div className="space-y-6">
          {visibleSections.map((section) => (
            <div key={section.category} className="space-y-2">
              {section.category !== "Main" && isOpen && (
                <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 opacity-60">
                  {section.category}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((route) => {
                  // Check if children exist
                  if (route.children) {
                      const isExpanded = expanded[route.label]
                      const isActiveParent = route.children.some(child => {
                          if (!child.href) return false
                          if (child.href.includes('?')) {
                              const [hrefPath, hrefQuery] = child.href.split('?')
                              if (pathname !== hrefPath) return false
                              const hrefParams = new URLSearchParams(hrefQuery)
                              for (const [key, value] of hrefParams.entries()) {
                                  if (searchParams.get(key) !== value) return false
                              }
                              return true
                          }
                          return pathname === child.href && searchParams.toString() === ''
                      })
                      
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
                                        // Check child permission using robust checkAccess
                                        if (!checkAccess(child)) return null

                                        const isChildActive = (() => {
                                            if (!child.href) return false
                                            if (child.href.includes('?')) {
                                                const [hrefPath, hrefQuery] = child.href.split('?')
                                                const hrefParams = new URLSearchParams(hrefQuery)
                                                // Path must match AND every key=value in the href must match the current URL
                                                if (pathname !== hrefPath) return false
                                                for (const [key, value] of hrefParams.entries()) {
                                                    if (searchParams.get(key) !== value) return false
                                                }
                                                return true
                                            }
                                            // Plain href (no query): active only if no relevant query params are present
                                            // e.g. /patients should NOT be active when /patients?visitType=opd
                                            if (pathname === child.href) {
                                                // For plain hrefs, active only if there are no query params at all
                                                return searchParams.toString() === ''
                                            }
                                            return false
                                        })()
                                        
                                        const content = (
                                            <div
                                                className={cn(
                                                    "block p-2 text-sm rounded-lg transition-colors",
                                                    isChildActive 
                                                        ? "text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/10 font-medium" 
                                                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5",
                                                    !child.href && "cursor-default hover:bg-transparent dark:hover:bg-transparent"
                                                )}
                                            >
                                                {child.label}
                                            </div>
                                        )

                                        if (child.href) {
                                            return (
                                                <Link
                                                    key={child.href}
                                                    href={child.href}
                                                >
                                                    {content}
                                                </Link>
                                            )
                                        }

                                        return <div key={child.label}>{content}</div>
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
                        "flex items-center p-3 rounded-xl transition-all duration-200 group",
                        isActive
                            ? "bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white shadow-md backdrop-blur-sm" 
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
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer / Toggle */}
      <div className="p-4 border-t border-zinc-200 dark:border-sidebar-border bg-white dark:bg-sidebar">
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
