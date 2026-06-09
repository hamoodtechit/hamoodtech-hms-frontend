"use client"

import DashboardShell from "@/components/layout/dashboard-shell"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { useAuthStore } from "@/store/use-auth-store"
import { useSettingsStore } from "@/store/use-settings-store"
import { useStoreContext } from "@/store/use-store-context"
import { useEffect } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { fetchSettings } = useSettingsStore()
  const { checkAuth } = useAuthStore()
  const { fetchStores } = useStoreContext()

  useEffect(() => {
    checkAuth()
    fetchSettings()
    fetchStores()
  }, [])
  return (
    <DashboardShell 
      sidebar={<Sidebar />} 
      header={<Header />}
    >
      {children}
    </DashboardShell>
  )
}
