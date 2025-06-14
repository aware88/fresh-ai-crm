'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-xl">CRM MIND</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {isHomePage ? (
            // If on home page, use anchor links to sections
            <>
              <a href="#features" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50">
                Features
              </a>
              <a href="#psychology" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50">
                Psychology
              </a>
              <a href="#why-it-works" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50">
                Why It Works
              </a>
              <a href="#testimonials" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50">
                Testimonials
              </a>
            </>
          ) : (
            // If not on home page, link back to home page with anchors
            <>
              <Link href="/#features" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50">
                Features
              </Link>
              <Link href="/#psychology" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50">
                Psychology
              </Link>
              <Link href="/#why-it-works" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50">
                Why It Works
              </Link>
              <Link href="/#testimonials" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50">
                Testimonials
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/signin" className="mr-2">
            <Button variant="ghost" className="text-gray-700 hover:bg-gray-100/80">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold">
              Join Beta Free - Limited Time
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
