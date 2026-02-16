"use client"

import { useStoreContext } from "@/store/use-store-context"
import { useEffect } from "react"

export default function PosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { fetchStores } = useStoreContext()

  useEffect(() => {
    fetchStores()
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}
