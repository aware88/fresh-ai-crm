import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail, Building2, Globe, Users, ArrowRight } from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="container mx-auto px-4 py-8 mt-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          CRM MIND Features
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Explore our powerful AI-driven tools designed to enhance your customer relationships and optimize your business operations.
        </p>
      </div>

      <div className="space-y-12">
        {/* Email Analysis Feature */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-2/3 p-8">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full mr-4">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-blue-800">Email Analysis</h2>
                  <p className="text-blue-600">AI-powered email psychology insights</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Analyze customer emails to understand their personality, communication style, and get AI-suggested responses tailored to their psychology. Our system uses advanced AI to decode personality traits, communication preferences, and decision-making patterns.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <span className="mr-2 text-blue-600">✓</span>
                  <span>Personality type identification</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-blue-600">✓</span>
                  <span>Communication style analysis</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-blue-600">✓</span>
                  <span>AI-generated response suggestions</span>
                </li>
              </ul>
              <Link href="/dashboard/email">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  Try Email Analysis <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="md:w-1/3 bg-gradient-to-br from-blue-600 to-indigo-600 p-8 flex items-center justify-center">
              <div className="text-white text-center">
                <Mail className="h-16 w-16 mx-auto mb-4 opacity-90" />
                <p className="font-medium">Unlock the psychology behind every email</p>
              </div>
            </div>
          </div>
        </div>

        {/* Supplier Management Feature */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-lg overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-2/3 p-8">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-purple-100 rounded-full mr-4">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-purple-800">Supplier Management</h2>
                  <p className="text-purple-600">AI-powered supplier insights and analysis</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Manage suppliers, upload documents, parse emails, and get AI-powered insights to optimize your procurement and sourcing decisions. Our system helps you maintain a comprehensive database of suppliers with reliability scoring and document management.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <span className="mr-2 text-purple-600">✓</span>
                  <span>Supplier database with reliability scoring</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-purple-600">✓</span>
                  <span>Document upload and management</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-purple-600">✓</span>
                  <span>Email parsing and product tag extraction</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-purple-600">✓</span>
                  <span>AI-powered supplier querying and insights</span>
                </li>
              </ul>
              <Link href="/suppliers">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  Manage Suppliers <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="md:w-1/3 bg-gradient-to-br from-purple-600 to-blue-600 p-8 flex items-center justify-center">
              <div className="text-white text-center">
                <Building2 className="h-16 w-16 mx-auto mb-4 opacity-90" />
                <p className="font-medium">Optimize your sourcing and procurement</p>
              </div>
            </div>
          </div>
        </div>

        {/* Other Features Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Globe className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold">URL Analysis</h3>
            </div>
            <p className="text-gray-600 mb-4">Extract insights from websites and online content to better understand market trends and competitor positioning.</p>
            <Link href="/dashboard/url" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
              Learn more <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-indigo-100 rounded-full">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold">Customer Profiles</h3>
            </div>
            <p className="text-gray-600 mb-4">Build comprehensive customer profiles with AI assistance to better understand and serve your clients' needs.</p>
            <Link href="/dashboard/profiles" className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
              Learn more <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
