'use client';

import Link from "next/link"
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
    { label:'', href: '/' } // Home
]
const NavItems = () => {
  const pathname = usePathname();
  const isCreatePage = pathname.startsWith("/create");

  if (isCreatePage) {
    return (
      <nav className="toolbar-nav">
        <button className="g-tooltip" data-tooltip="Add question">+</button>
        <button className="g-tooltip" data-tooltip="Import Exam">📂</button>
        <button className="g-tooltip" data-tooltip="Save Exam">💾</button>
        <button className="g-tooltip" data-tooltip="Settings">⚙️</button>
        <button className="g-tooltip" data-tooltip="Preview exam">👁️</button>
        <button className="toolbar-btn primary">Publish</button>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-4">
        {navItems.map(({ label, href }) => (
            <Link 
                href={href}
                key={label}
                className={cn(pathname === href && 'text-primary font-semibold')}
                >
                {label}
            </Link>
        ))}
    </nav>
  )
}

export default NavItems