"use client"

import DashboardShell from "@/components/layout/dashboard-shell"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { useSettingsStore } from "@/store/use-settings-store"
import { useEffect } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { fetchSettings } = useSettingsStore()

  useEffect(() => {
    fetchSettings()
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
