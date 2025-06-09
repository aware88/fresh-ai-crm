import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50">
      {/* Minimal Header */}
      <header className="w-full py-6">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">AI CRM</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center py-12 px-4 md:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="space-y-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 blur-3xl opacity-20 rounded-full"></div>
              <h1 className="relative text-5xl md:text-7xl font-bold tracking-tighter mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Intelligent CRM
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              Transform your customer relationships with AI-powered email analysis and psychological profiling.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-lg py-6 px-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                  Enter Dashboard
                </Button>
              </Link>
            </div>
            
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </div>
                <h3 className="text-xl font-semibold text-center mb-2">Email Analysis</h3>
                <p className="text-gray-600 text-center">Instantly understand customer sentiment and needs from any email.</p>
              </div>
              
              <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <h3 className="text-xl font-semibold text-center mb-2">Psychological Profiles</h3>
                <p className="text-gray-600 text-center">Tailor your communication based on personality insights.</p>
              </div>
              
              <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                </div>
                <h3 className="text-xl font-semibold text-center mb-2">Smart Responses</h3>
                <p className="text-gray-600 text-center">Generate perfectly tailored responses to any communication.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center">
            <p className="text-center text-sm text-gray-500">
              © 2025 AI CRM. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
