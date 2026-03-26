"use client"

import { useRouter, usePathname } from "next/navigation"

export default function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()

  function changeLanguage(locale: string) {
    // Remove current locale (en or es) from pathname
    const segments = pathname.split("/");
    const newPath = segments.slice(2).join("/"); 
    // ["", "en", "edit"] → ["edit"]

    router.push(`/${locale}/${newPath}`);
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
}