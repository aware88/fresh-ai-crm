'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { useSession } from "next-auth/react";

export function Header() {
  const pathname = usePathname() || '';
  const isHomePage = pathname === '/';
  const isDashboard = pathname.startsWith('/dashboard');
  const { data: session } = useSession();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Link href={isDashboard ? '/dashboard' : '/'} className="flex items-center gap-2">
            <span className="font-bold text-xl">CRM MIND</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-1 text-sm">
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
          ) : isDashboard ? (
            // If in dashboard, show dashboard navigation
            <>
              <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50">
                Dashboard
              </Link>
              <Link href="/dashboard/email" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50">
                Email Analyser
              </Link>
              <Link href="/dashboard/suppliers" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50">
                Suppliers
              </Link>
              <Link href="/dashboard/products" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50">
                Products
              </Link>
              <Link href="/dashboard/orders" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50">
                Orders
              </Link>
              <Link href="/dashboard/contacts" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50">
                Contacts
              </Link>
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
          {session ? (
            <>
              <NotificationCenter />
              <Link href="/dashboard" className="mr-2">
                <Button variant="ghost" className="text-gray-700 hover:bg-gray-100/80">
                  Dashboard
                </Button>
              </Link>
              <Link href="/settings/profile">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold">
                  My Account
                </Button>
              </Link>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}
