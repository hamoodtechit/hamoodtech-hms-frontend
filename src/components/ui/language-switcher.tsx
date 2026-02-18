"use client"

import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function LanguageSwitcher() {
  const t = useTranslations("Index") // Just to ensure hook usage or similar
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-[100px] h-9" /> // Placeholder to prevent layout shift
  }

  const handleChange = (value: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${value}`)
    router.push(newPath)
  }

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger className="w-[100px]">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="bn">Bangla</SelectItem>
      </SelectContent>
    </Select>
  )
}
