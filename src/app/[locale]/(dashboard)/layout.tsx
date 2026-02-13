import DashboardShell from "@/components/layout/dashboard-shell"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardShell 
      sidebar={<Sidebar />} 
      header={<Header />}
    >
      {children}
    </DashboardShell>
  )
}
