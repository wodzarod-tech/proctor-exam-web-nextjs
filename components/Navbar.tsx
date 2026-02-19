import Link from "next/link"
import Image from "next/image"
import NavItems from "./NavItems"
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white border-b border-gray-200 shadow-sm">
    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        <Link href="/" className="flex items-center gap-3">
        <Image
            src="/images/logo.png"
            alt="EasyExam logo"
            width={46}
            height={44}
            priority
        />
        <span className="text-2xl font-semibold tracking-tight">
            EasyExam
        </span>
        </Link>

        <div className="flex items-center gap-8">
        <NavItems />

        <SignedOut>
            <SignInButton>
            <button className="btn-signin">Sign In</button>
            </SignInButton>
        </SignedOut>

        <SignedIn>
            <UserButton />
        </SignedIn>
        </div>

    </div>
    </nav>
  )
}

export default Navbar