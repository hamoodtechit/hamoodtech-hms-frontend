"use client"

import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter } from "next/navigation"

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

  const handleChange = (value: string) => {
    // Basic implementation: replace locale in path
    // This assumes path starts with /{locale}
    // A better way is to use next-intl navigation router but for now manual.
    // Or just window.location.href to force reload? No, SPA transition better.
    // Standard next-intl way:
    // import {useRouter, usePathname} from '@/i18n/navigation';
    // But I haven't set up navigation wrapper yet.
    // I'll stick to simple manual replacement for now or use window.location.
    // Regexp to replace locale.
    
    const newPath = pathname.replace(`/${locale}`, `/${value}`)
    router.push(newPath)
  }

  return (
    <Select defaultValue={locale} onValueChange={handleChange}>
      <SelectTrigger className="w-[100px]">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="es">Español</SelectItem>
      </SelectContent>
    </Select>
  )
}
