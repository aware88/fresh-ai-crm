import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, TrendingUp, Inbox, Send, AlertCircle } from 'lucide-react';
import EmailAnalyserClient from "@/app/dashboard/email-analyser/EmailAnalyserClient";

// Mock stats data
const emailStats = [
  {
    title: "Total Emails",
    value: "2,847",
    change: "+15%",
    trend: "up" as const,
    icon: Mail,
    color: "#3B82F6"
  },
  {
    title: "Unread",
    value: "127",
    change: "+8%",
    trend: "up" as const,
    icon: Inbox,
    color: "#8B5CF6"
  },
  {
    title: "Sent Today",
    value: "34",
    change: "+12%",
    trend: "up" as const,
    icon: Send,
    color: "#EC4899"
  },
  {
    title: "Pending Actions",
    value: "8",
    change: "-20%",
    trend: "down" as const,
    icon: AlertCircle,
    color: "#F59E0B"
  }
];

export default function EmailAnalyserPage() {
  return (
    <div className="space-y-6">
      {/* Header with ARIS Branding */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
      >
        <div className="absolute inset-0 bg-black/5" />
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-bold text-white mb-2"
              >
                Email Analyser
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-white/90 text-lg"
              >
                Automatically fetch, analyze, and manage your emails
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="hidden md:block"
            >
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                <Mail className="h-12 w-12 text-white" />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {emailStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className={`h-4 w-4 ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                      <span className={`text-sm font-medium ml-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div 
                    className="p-3 rounded-full"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <stat.icon className="h-6 w-6" style={{ color: stat.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      <EmailAnalyserClient />
    </div>
  );
}
