'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import OutlookClient from '@/components/email/outlook/OutlookClient';
import ImapClient from '@/components/email/imap/ImapClient';
import EmailAnalyserClient from "@/app/dashboard/email-analyser/EmailAnalyserClient";
import { FaEnvelope, FaRobot, FaSearch, FaSync, FaCog } from 'react-icons/fa';
import { Mail, TrendingUp, Inbox, Send, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function EmailPage() {
  const { data: session, status } = useSession();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('inbox');
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [imapAccounts, setImapAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  
  // Check if email accounts are connected (both Outlook and IMAP)
  useEffect(() => {
    async function checkConnection() {
      if (status === 'authenticated' && session?.user) {
        try {
          setLoading(true);
          const response = await fetch('/api/settings/email/status');
          const data = await response.json();
          
          if (data.success) {
            setConnected(data.connected);
            setOutlookConnected(data.outlookConnected);
            setImapAccounts(data.imapAccounts || []);
            
            // If we have any accounts, set the active tab to inbox
            if (data.connected) {
              setActiveTab('inbox');
            }
          } else {
            setError(data.error || 'Failed to check email connection');
          }
        } catch (err) {
          setError('Failed to check email connection');
        } finally {
          setLoading(false);
        }
      }
    }
    
    checkConnection();
  }, [status, session]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
        <div className="container mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
        <div className="container mx-auto">
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <div>
              <h3 className="font-semibold">Error</h3>
              <p>{error}</p>
            </div>
          </Alert>
        </div>
      </div>
    );
  }

  // Not connected state
  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-8">
              Email Management
            </h1>
            
            <Card className="max-w-2xl mx-auto border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Mail className="w-5 h-5 text-purple-600" />
                  Connect Your Email Accounts
                </h2>
                <p className="text-gray-600">
                  Connect your email accounts to start managing your communications with AI assistance.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/auth/outlook/connect">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                      <FaEnvelope className="mr-2" />
                      Connect Outlook
                    </Button>
                  </Link>
                  <Link href="/settings/email-accounts">
                    <Button variant="outline" className="w-full">
                      <FaCog className="mr-2" />
                      Configure IMAP
                    </Button>
                  </Link>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Features you'll get:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• AI-powered email analysis and responses</li>
                    <li>• Automated email categorization</li>
                    <li>• Smart reply suggestions</li>
                    <li>• Email performance analytics</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Connected state - show email management interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Email Management
            </h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <FaSync className="mr-2" />
                Sync
              </Button>
              <Link href="/settings/email-accounts">
                <Button variant="outline" size="sm">
                  <FaCog className="mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>

          {/* Email Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Inbox</p>
                    <p className="text-2xl font-bold text-gray-900">24</p>
                  </div>
                  <Inbox className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sent</p>
                    <p className="text-2xl font-bold text-gray-900">156</p>
                  </div>
                  <Send className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">AI Processed</p>
                    <p className="text-2xl font-bold text-gray-900">89</p>
                  </div>
                  <FaRobot className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Response Rate</p>
                    <p className="text-2xl font-bold text-gray-900">94%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Selection */}
          {imapAccounts.length > 0 && (
            <div className="mb-6">
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select email account" />
                </SelectTrigger>
                <SelectContent>
                  {outlookConnected && (
                    <SelectItem value="outlook">Outlook Account</SelectItem>
                  )}
                  {imapAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Email Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="inbox">Inbox</TabsTrigger>
              <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
              <TabsTrigger value="compose">Compose</TabsTrigger>
            </TabsList>

            <TabsContent value="inbox" className="space-y-6">
              <Card className="border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Email Inbox</h3>
                </CardHeader>
                <CardContent>
                  {outlookConnected && (selectedAccount === 'outlook' || !selectedAccount) ? (
                    <OutlookClient />
                                     ) : selectedAccount && imapAccounts.find(acc => acc.id === selectedAccount) ? (
                     <ImapClient account={imapAccounts.find(acc => acc.id === selectedAccount)} />
                   ) : (
                    <div className="text-center py-8 text-gray-500">
                      Select an email account to view messages
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai-analysis" className="space-y-6">
              <Card className="border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FaRobot className="text-purple-600" />
                    AI Email Analysis
                  </h3>
                </CardHeader>
                <CardContent>
                  <EmailAnalyserClient />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compose" className="space-y-6">
              <Card className="border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Compose Email</h3>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    Email composition interface coming soon...
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
