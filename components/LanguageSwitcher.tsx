/*"use client"

import { useRouter, usePathname } from "next/navigation"

export default function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()

  function changeLanguage(locale: string) {
    router.push(`/${locale}${pathname}`)
  }

  return (
    <select
      onChange={(e) => changeLanguage(e.target.value)}
      defaultValue="en"
      style={{ padding: "6px", borderRadius: "6px" }}
    >
      <option value="en">English</option>
      <option value="es">Español</option>
    </select>
  )
}*/