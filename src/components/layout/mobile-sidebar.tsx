"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { usePermissions } from "@/hooks/use-permissions"
import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { usePosStore } from "@/store/use-pos-store"
import { useSettingsStore } from "@/store/use-settings-store"
import {
  Activity,
  Ambulance,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  LayoutDashboard,
  Menu,
  Pill,
  Receipt,
  Settings,
  Stethoscope,
  Users,
  Wallet
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Close sidebar on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  if (!isMounted) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 border-r-0 bg-[#111827] text-white w-72">
        <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
        <SidebarBase />
      </SheetContent>
    </Sheet>
  )
}

function SidebarBase() {
  const pathname = usePathname()
  const { hasPermission, hasModuleAccess } = usePermissions()
  const { general } = useSettingsStore()
  const { activeBranch } = usePosStore()
  const t = useTranslations("Sidebar")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggleExpand = (label: string) => {
    setExpanded(prev => ({ ...prev, [label]: !prev[label] }))
  }

  interface Route {
    label: string
    icon: any
    href?: string
    color?: string
    permission?: string | string[]
    module?: string
    children?: {
        label: string
        href?: string
        permission?: string | string[]
        module?: string
    }[]
  }

  interface SidebarSection {
    category: string
    items: Route[]
  }

  const checkAccess = (route: { permission?: string | string[]; module?: string }) => {
    let hasMod = true;
    let hasPerm = true;

    // 1. Check module access if defined
    if (route.module) {
        hasMod = hasModuleAccess(route.module);
    }

    // 2. Check specific permission if defined
    if (route.permission) {
        if (Array.isArray(route.permission)) {
            hasPerm = route.permission.some(p => hasPermission(p));
        } else {
            hasPerm = hasPermission(route.permission);
        }
    }

    // Both MUST be true if they are defined
    return hasMod && hasPerm;
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
          children: [
            {
              label: "All Patients",
              href: "/patients",
              module: "patients",
              permission: "patient:read",
            },
            {
              label: "OPD Patients",
              href: "/patients?type=opd",
              module: "patients",
              permission: "patient:read",
            },
            {
              label: "IPD Patients",
              href: "/patients?type=ipd",
              module: "patients",
              permission: "patient:read",
            },
            {
              label: "Appointments",
              href: "/appointments",
              permission: "appointment:read",
            }
          ]
        },
        {
          label: "Clinical Ops",
          icon: FlaskConical,
          color: "text-indigo-400",
          children: [
            {
              label: "Diagnostic Reports",
              href: "/diagnostic/reports",
              module: "diagnostic",
              permission: ["pathology:read", "radiology:read"],
            },
            {
              label: "Lab Management",
              module: "diagnostic",
              permission: "pathology:read",
            },
            {
              label: "Prescriptions",
              permission: "patient:read",
            }
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
          children: [
            {
              label: "Active Dispatch",
            },
            {
              label: "Vehicle Directory",
            },
            {
              label: "Driver Roster",
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
          children: [
            {
              label: "OPD Billing",
              href: "/billing/opd",
              module: "sales",
              permission: ["pathology:create", "sale:create"],
            },
            {
              label: "IPD Billing & Ledgers",
              href: "/billing/ipd",
              module: "patients",
              permission: ["patient:read", "sale:create"],
            },
            {
              label: "All Invoices / Receipts",
              href: "/sales",
              permission: ["sale:read", "sale:create"],
            },
            {
              label: "Appointment Billing",
              href: "/billing/appointment",
              module: "appointment",
              permission: ["appointment:create", "sale:create"],
            },
            {
              label: "Insurance & TPA",
            }
          ]
        },
        {
          label: "Finance Management",
          icon: Wallet,
          color: "text-emerald-500",
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
              label: "Payroll & Salary",
            },
            {
              label: "Referral Network",
              href: "/hr/referrals",
              module: "hr",
              permission: "user:read",
            }
          ]
        },
        {
          label: "Clinical Services",
          icon: Settings,
          color: "text-zinc-500",
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

  const filterRoutes = (items: Route[]): Route[] => {
    return items.reduce<Route[]>((acc, route) => {
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
    <div className="flex flex-col h-full bg-[#111827] text-white">
      <div className="flex items-center h-20 px-6 border-b border-white/10">
          <div className="flex items-center gap-3 w-full">
            {activeBranch?.logoUrl ? (
                <div className="relative flex items-center justify-center shrink-0 w-10 h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={activeBranch.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                </div>
            ) : (
                <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-blue-600 shadow-lg shadow-primary/20 text-white">
                   <Activity className="w-6 h-6" />
                </div>
            )}
             <h1 className="text-lg font-bold tracking-tight truncate w-full">
                {general?.hospitalName || activeBranch?.name || "MediCare"}
             </h1>
          </div>
      </div>

      <div className="flex-1 py-6 px-3 min-h-0 overflow-y-auto">
        <div className="space-y-6">
          {visibleSections.map((section) => (
            <div key={section.category} className="space-y-2">
              {section.category !== "Main" && (
                <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 opacity-60">
                  {section.category}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((route) => {
                  // Check if children exist
                  if (route.children) {
                      const isExpanded = expanded[route.label]
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
                                <div className="flex items-center flex-1">
                                    <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                                    <span className="font-medium text-sm">{route.label}</span>
                                </div>
                               <span className={cn("transition-transform duration-200", isExpanded && "rotate-90")}>
                                   <ChevronRight className="h-4 w-4" />
                               </span>
                            </button>

                            {isExpanded && (
                                <div className="pl-12 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                    {route.children.map(child => {
                                        if (!checkAccess(child)) return null

                                        const isChildActive = child.href ? pathname === child.href : false
                                        return (
                                            <div key={child.label || child.href}>
                                                {child.href ? (
                                                    <Link
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
                                                ) : (
                                                    <div
                                                        className={cn(
                                                            "block p-2 text-sm rounded-lg transition-colors text-zinc-500 opacity-60 cursor-default"
                                                        )}
                                                    >
                                                        {child.label}
                                                    </div>
                                                )}
                                            </div>
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
                        "flex items-center p-3 rounded-xl transition-all duration-200 group",
                        isActive
                            ? "bg-white/10 text-white shadow-md backdrop-blur-sm" 
                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                    )}
                    >
                        <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                        <span className="font-medium text-sm">{route.label}</span>
                    </Link>
                )
             })}
            </div>
           </div>
          ))}
        </div>
      </div>
    </div>
  )
}
