import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50">
      {/* Enhanced Header */}
      <header className="w-full py-6 border-b border-gray-100">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 0 1 10 10c0 6-10 10-10 10S2 18 2 12A10 10 0 0 1 12 2Z"></path>
                  <path d="M12 12v4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </div>
              <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">CRM MIND</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#science" className="text-gray-600 hover:text-blue-600 transition-colors">Science</a>
              <a href="#benefits" className="text-gray-600 hover:text-blue-600 transition-colors">Benefits</a>
              <Link href="/dashboard">
                <Button variant="outline" className="rounded-full px-4 border-blue-200 text-blue-600 hover:bg-blue-50">Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="flex items-center justify-center py-16 px-4 md:px-6" id="hero">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <div>
                <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full mb-4">
                  <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">&#x1F916; AI-Powered Psychology</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">The Intelligence</span> Behind Our AI Assistant
                </h1>
              </div>
              
              <p className="text-xl text-gray-600 max-w-xl mx-auto lg:mx-0">
                What if every message you sent was perfectly tailored to how the other person thinks, decides, and feels — in seconds?
              </p>
              
              <p className="text-lg text-gray-600 max-w-xl mx-auto lg:mx-0">
                That&#39;s exactly what our AI was built for. This isn&#39;t just another chatbot. It&#39;s a trained psychological sales assistant.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto text-lg py-6 px-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                    Try It Now
                  </Button>
                </Link>
                <a href="#science" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
                  <span>Learn how it works</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 blur-3xl opacity-30 rounded-full"></div>
              <div className="relative bg-white/80 backdrop-blur-sm border border-gray-100 p-8 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">AI</div>
                  <div>
                    <h3 className="font-semibold">AI Assistant</h3>
                    <p className="text-sm text-gray-500">Analyzing personality...</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm font-medium text-blue-800">Personality Type: Analytical Decision-Maker</p>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <p className="text-sm font-medium text-indigo-800">Communication Style: Data-driven, logical, values precision</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <p className="text-sm font-medium text-purple-800">Recommended Approach: Focus on ROI and specific metrics</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Science Section */}
      <section className="py-16 px-4 md:px-6 bg-gradient-to-b from-white to-blue-50" id="science">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full mb-4">
              <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">&#x1F4D6; Backed by Research</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Trained on <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Real Science</span>, Not Guesswork</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Our system is built from the same principles used by elite coaches, negotiators, and sales leaders — now applied to your inbox.</p>
          </div>
          
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 mb-12">
            <h3 className="text-2xl font-bold mb-6 text-center">&#x1F525; Core Frameworks That Power It:</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <p className="text-gray-700"><span className="font-semibold">DISC profiling</span>, as taught by Tony Robbins, to decode personality types and communication patterns</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <p className="text-gray-700"><span className="font-semibold">MBTI and Big Five personality models</span>, used by psychologists to understand decision-making tendencies</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <p className="text-gray-700"><span className="font-semibold">Cialdini&#39;s 6 Principles of Influence</span> — the gold standard in persuasion psychology</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <p className="text-gray-700"><span className="font-semibold">Buyer personas and objection handling</span> used by top B2B sales teams (HubSpot, Close.com)</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <p className="text-gray-700"><span className="font-semibold">Proven emotional triggers from neuroscience-based marketing</span> (Fear, Hope, Belonging, Scarcity, and more)</p>
              </li>
            </ul>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 px-4 md:px-6" id="features">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Works</span></h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Every time you paste an email, message, or lead into the system:</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 1-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Pattern Matching</h3>
              <p className="text-gray-600 text-center">It matches their tone and phrasing to a known psychological profile</p>
            </div>
            
            <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Strategy Database</h3>
              <p className="text-gray-600 text-center">Pulls real behavior-based strategies from a curated internal database</p>
            </div>
            
            <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Instant Results</h3>
              <p className="text-gray-600 text-center">Returns a personality type, emotional trigger, best CTA, and a ready-to-send email reply</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* AI Gets Smarter Section */}
      <section className="py-16 px-4 md:px-6 bg-gradient-to-b from-blue-50 to-white" id="benefits">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full mb-4">
                <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">&#x1F916; Continuous Learning</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">But It Gets <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Smarter</span>...</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">It's Not Magic. It's Pattern Recognition, Powered by Psychology.</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
              <div className="prose prose-lg max-w-none text-gray-700">
                <p>You don't need to guess how to respond.<br />You don't need to craft the perfect tone.<br />You don't need to reread the thread 5 times.</p>
                <p className="font-medium text-xl">Our assistant remembers, understands, and suggests — with depth.</p>
              </div>
            </div>
            
            <div className="text-center mt-16 mb-8">
              <h3 className="text-2xl font-bold mb-6">&#x1F64B; Built for Teams That Want More Wins, Fewer Regrets</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                  </div>
                  <h4 className="font-semibold">SDRs</h4>
                </div>
                <p className="text-gray-600">Who want to stop sending cold emails that fall flat</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </div>
                  <h4 className="font-semibold">Founders</h4>
                </div>
                <p className="text-gray-600">Who hate following up but know it matters</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  </div>
                  <h4 className="font-semibold">Marketers</h4>
                </div>
                <p className="text-gray-600">Who want their tone to match their buyer</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                  </div>
                  <h4 className="font-semibold">Salespeople</h4>
                </div>
                <p className="text-gray-600">Who know: &quot;It's not what you say, it's how you say it.&quot;</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Final CTA Section */}
      <section className="py-16 px-4 md:px-6">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 md:p-12 text-white text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Upgrade Your Communication?</h2>
            <p className="text-xl mb-8 opacity-90">Try our AI-powered CRM MIND today and see the difference in your customer relationships.</p>
            <Link href="/dashboard">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg py-6 px-10 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 px-4 md:px-6 border-t border-gray-100">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 0 1 10 10c0 6-10 10-10 10S2 18 2 12A10 10 0 0 1 12 2Z"></path>
                  <path d="M12 12v4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">CRM MIND</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">Features</a>
              <a href="#science" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">Science</a>
              <a href="#benefits" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">Benefits</a>
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">
                Dashboard
              </Link>
            </div>
          </div>
          <div className="mt-6 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} CRM MIND. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
