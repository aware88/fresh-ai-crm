import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50">
      {/* Enhanced Header */}
      <header className="w-full py-4 md:py-6 border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="container px-4 mx-auto max-w-7xl">
          <nav className="flex items-center justify-between w-full">
            <div className="flex items-center flex-shrink-0">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a10 10 0 0 1 10 10c0 6-10 10-10 10S2 18 2 12A10 10 0 0 1 12 2Z"></path>
                    <path d="M12 12v4"></path>
                    <path d="M12 8h.01"></path>
                  </svg>
                </div>
                <span className="font-bold text-xl md:text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">ARIS</span>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <Link href="/features" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Features
              </Link>
              <Link href="/pricing" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Pricing
              </Link>
              <Link href="/about" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                About
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/signin">
                <Button variant="ghost" className="text-gray-700 hover:bg-gray-100">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container px-4 mx-auto max-w-7xl">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AI-Powered CRM for Modern Teams
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                Transform your customer relationships with intelligent insights, automation, and powerful analytics all in one platform.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg">
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button size="lg" variant="outline" className="border-2 border-gray-200 hover:bg-gray-50 text-gray-700 px-8 py-6 text-lg">
                    Watch Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="container px-4 mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 0 1 10 10c0 6-10 10-10 10S2 18 2 12A10 10 0 0 1 12 2Z"></path>
                  <path d="M12 12v4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">ARIS</span>
            </div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} ARIS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
