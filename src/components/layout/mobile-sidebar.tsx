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
  Building2,
  LayoutDashboard,
  Menu,
  Pill,
  Settings,
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
        href: string
        permission?: string | string[]
        module?: string
    }[]
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
  
  const routes: Route[] = [
    {
      label: t("dashboard"),
      icon: LayoutDashboard,
      href: "/dashboard",
      color: "text-sky-400",
      permission: "dashboard:read",
    },
    {
      label: "Pharmacy",
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
              label: "Stocks",
              href: "/pharmacy/inventory",
              permission: "stock:read",
          },
          {
              label: "Purchase Orders",
              href: "/purchases?type=pharmacy",
              permission: "purchase:read",
          },
          {
              label: "Suppliers",
              href: "/suppliers",
              permission: "supplier:read",
          },
          {
              label: "Medicines",
              href: "/pharmacy/inventory/medicines",
              permission: "medicine:read",
          },
          {
            label: "Pharmacy Reports",
            href: "/reports",
            module: "sales",
            permission: "sale:read",
          },
          {
            label: "Pharmacy Setup",
            href: "/pharmacy/setup",
            permission: "medicine-category:read",
          }
      ]
    },
    {
      label: "Clinical Operations",
      icon: Building2,
      color: "text-blue-400",
      children: [
          {
              label: "Appointments",
              href: "/appointments",
              module: "appointment",
              permission: "appointment:read",
          },
          {
              label: t("patients"),
              href: "/patients",
              module: "patients",
              permission: "patient:read",
          },
          {
              label: "Diagnostic Tests",
              href: "/diagnostic",
              module: "diagnostic",
              permission: "diagnostic-test:create",
          },
          {
              label: "Diagnostic Reports",
              href: "/diagnostic/reports",
              module: "diagnostic",
              permission: ["pathology:read", "radiology:read"],
          },
      ]
    },
    {
      label: "Billing & Collection",
      icon: Wallet,
      color: "text-indigo-600",
      children: [
          {
              label: "Appointment Billing",
              href: "/billing/appointment",
              module: "appointment",
              permission: "appointment:create",
          },
          {
              label: "Pathology Billing",
              href: "/billing/pathology",
              module: "sales",
              permission: "pathology:create",
          },
          {
              label: "Radiology Billing",
              href: "/billing/radiology",
              module: "sales",
              permission: "radiology:create",
          },
          {
              label: "Extra Charges",
              href: "/billing/extra-charge",
              module: "sales",
              permission: "radiology:create",
          }
      ]
    },
    {
      label: "Finance & Accounts",
      icon: Wallet,
      color: "text-emerald-500",
      children: [
          {
              label: "Finance / Accounts",
              href: "/finance",
              module: "finance",
              permission: "account:read",
          }
      ]
    },
    {
      label: "HR Management",
      icon: Users,
      color: "text-orange-500",
      children: [
          {
                label: "Employees",
                href: "/hr/employees",
                module: "hr",
                permission: "user:read",
          },
          {
                label: "Attendance & Leaves",
                href: "/hr/attendance-and-leaves",
                module: "hr",
                permission: "user:read",
          },
          {
                label: "Departments",
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
                label: "Commission Agents",
                href: "/hr/commission-agents",
                module: "hr",
                permission: "user:read",
          }
      ]
    },
    {
      label: "Administration",
      icon: Settings,
      color: "text-zinc-500",
      children: [
          {
              label: "Branches",
              href: "/branches",
              module: "branches",
              permission: "branch:read",
          },
          {
              label: "Facility Management",
              href: "/facility",
              permission: "facility:read",
          },
          {
              label: "User Management",
              href: "/settings/users",
              module: "users",
              permission: "user:read",
          },
          {
              label: "Roles & Permissions",
              href: "/settings/roles",
              module: "users",
              permission: "role:read",
          },
          {
            label: t("settings"),
            href: "/settings",
            module: "settings",
            permission: "settings:read",
          },
      ]
    },
  ]

  const filterRoutes = (items: typeof routes): typeof routes => {
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

      <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto min-h-0">
        {visibleRoutes.map((route) => {
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
                               <svg
                                 width="15"
                                 height="15"
                                 viewBox="0 0 15 15"
                                 fill="none"
                                 xmlns="http://www.w3.org/2000/svg"
                                 className="h-4 w-4"
                               >
                                 <path
                                   d="M6.1584 3.13508C6.35985 2.94621 6.67627 2.95642 6.86514 3.15788L10.6151 7.15788C10.7954 7.3502 10.7954 7.6498 10.6151 7.84212L6.86514 11.8421C6.67627 12.0436 6.35985 12.0538 6.1584 11.8649C5.95694 11.676 5.94673 11.3596 6.1356 11.1581L9.59196 7.50002L6.1356 3.84196C5.94673 3.6405 5.95694 3.32408 6.1584 3.13508Z"
                                   fill="currentColor"
                                   fillRule="evenodd"
                                   clipRule="evenodd"
                                 />
                               </svg>
                           </span>
                        </button>

                        {isExpanded && (
                            <div className="pl-12 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                {route.children.map(child => {
                                    if (!checkAccess(child)) return null

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
  )
}
