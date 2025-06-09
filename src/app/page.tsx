import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-white to-blue-50">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Transform Your Customer Relationships with AI
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl">
                  Our AI-powered CRM helps you analyze emails, understand customer needs, and take action with intelligent insights.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/dashboard/email">
                  <Button size="lg" className="px-8">Try Email Analysis</Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="px-8">Explore Dashboard</Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-[350px] w-[350px] md:h-[450px] md:w-[450px]">
                {/* Placeholder for dashboard image - you'll need to create this image */}
                <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">CRM Dashboard Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Key Features</h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Powerful tools to enhance your customer relationships
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
            <div className="grid gap-1">
              <h3 className="text-xl font-bold">Email Analysis</h3>
              <p className="text-gray-500">
                Analyze emails to extract key insights, sentiment, and action items automatically.
              </p>
            </div>
            <div className="grid gap-1">
              <h3 className="text-xl font-bold">Customer Insights</h3>
              <p className="text-gray-500">
                Get deep understanding of customer needs and pain points through AI-powered analysis.
              </p>
            </div>
            <div className="grid gap-1">
              <h3 className="text-xl font-bold">Action Recommendations</h3>
              <p className="text-gray-500">
                Receive intelligent recommendations on how to follow up with customers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-blue-50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Ready to Get Started?</h2>
              <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Try our email analysis tool and see the power of AI in action.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/dashboard/email">
                <Button size="lg" className="px-8">Start Analyzing</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 bg-gray-100">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center gap-4 md:flex-row md:gap-8">
            <p className="text-center text-sm text-gray-500">
              © 2025 AI CRM. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
