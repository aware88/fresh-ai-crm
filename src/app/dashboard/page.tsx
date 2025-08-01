'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  DollarSign, 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  Mail, 
  Building2,
  Package,
  FileText,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  BarChart3
} from 'lucide-react';

interface DashboardStats {
  totalContacts: number;
  totalSuppliers: number;
  totalProducts: number;
  totalOrders: number;
  emailAccounts: number;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      // Fetch real dashboard data from APIs
      const fetchDashboardData = async () => {
        try {
          // Fetch data from all APIs in parallel
          const [contactsRes, suppliersRes, productsRes, emailStatusRes] = await Promise.all([
            fetch('/api/contacts').then(r => r.ok ? r.json() : { contacts: [] }),
            fetch('/api/suppliers').then(r => r.ok ? r.json() : { suppliers: [] }),
            fetch('/api/products').then(r => r.ok ? r.json() : { products: [] }),
            fetch('/api/email/status').then(r => r.ok ? r.json() : { accounts: [] })
          ]);

          // Count real data
          const totalContacts = contactsRes.contacts?.length || 0;
          const totalSuppliers = suppliersRes.suppliers?.length || 0;
          const totalProducts = productsRes.products?.length || 0;
          const emailAccounts = emailStatusRes.accounts?.length || 0;

          // Create recent activity based on real data
          const recentActivity = [];
          if (totalContacts > 0) {
            recentActivity.push({
              id: '1',
              type: 'contact',
              message: `You have ${totalContacts} contact${totalContacts !== 1 ? 's' : ''} in your CRM`,
              timestamp: 'Current'
            });
          }
          if (totalSuppliers > 0) {
            recentActivity.push({
              id: '2',
              type: 'supplier',
              message: `${totalSuppliers} supplier${totalSuppliers !== 1 ? 's' : ''} configured`,
              timestamp: 'Current'
            });
          }
          if (totalProducts > 0) {
            recentActivity.push({
              id: '3',
              type: 'product',
              message: `${totalProducts} product${totalProducts !== 1 ? 's' : ''} in inventory`,
              timestamp: 'Current'
            });
          }
          if (emailAccounts > 0) {
            recentActivity.push({
              id: '4',
              type: 'email',
              message: `${emailAccounts} email account${emailAccounts !== 1 ? 's' : ''} connected`,
              timestamp: 'Current'
            });
          }

          // If no data, show welcome messages
          if (recentActivity.length === 0) {
            recentActivity.push({
              id: '1',
              type: 'welcome',
              message: 'Welcome to your CRM! Start by adding contacts or suppliers.',
              timestamp: 'Get started'
            });
          }

          setStats({
            totalContacts,
            totalSuppliers,
            totalProducts,
            totalOrders: 0, // TODO: Add orders API when available
            emailAccounts,
            recentActivity
          });
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          // Set empty state on error
          setStats({
            totalContacts: 0,
            totalSuppliers: 0,
            totalProducts: 0,
            totalOrders: 0,
            emailAccounts: 0,
            recentActivity: [{
              id: '1',
              type: 'error',
              message: 'Unable to load data. Please refresh the page.',
              timestamp: 'Error'
            }]
          });
        } finally {
          setLoading(false);
        }
      };

      fetchDashboardData();
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-4">Please sign in to access the dashboard.</p>
          <a href="/signin" className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user?.name || session?.user?.email}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here's what's happening with your business today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Contacts</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats?.totalContacts}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {stats?.totalContacts === 0 ? (
              <span className="text-sm text-gray-500">No contacts yet</span>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">Active contacts</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Suppliers</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats?.totalSuppliers}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {stats?.totalSuppliers === 0 ? (
              <span className="text-sm text-gray-500">No suppliers yet</span>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">Active suppliers</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Products</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats?.totalProducts}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {stats?.totalProducts === 0 ? (
              <span className="text-sm text-gray-500">No products yet</span>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">In inventory</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Orders</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats?.totalOrders}</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {stats?.totalOrders === 0 ? (
              <span className="text-sm text-gray-500">No orders yet</span>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">Total orders</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <p className="text-sm text-gray-500 mt-1">Fast access to your most used features</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Email Quick Access */}
              <Link 
                href="/dashboard/email" 
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
              >
                <Mail className="h-8 w-8 text-indigo-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-indigo-700">Email Center</p>
                  <p className="text-sm text-gray-500">Compose & manage emails</p>
                </div>
              </Link>

              {/* Email Settings Quick Access */}
              <Link 
                href="/settings/email-accounts" 
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-cyan-300 hover:bg-cyan-50 transition-colors group"
              >
                <div className="h-8 w-8 bg-cyan-100 rounded-lg flex items-center justify-center mr-3">
                  <Mail className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-cyan-700">Email Setup</p>
                  <p className="text-sm text-gray-500">Configure accounts</p>
                </div>
              </Link>

              {/* Contacts */}
              <Link 
                href="/dashboard/contacts" 
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
              >
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-blue-700">Contacts</p>
                  <p className="text-sm text-gray-500">Manage your contacts</p>
                </div>
              </Link>

              {/* Suppliers */}
              <Link 
                href="/dashboard/suppliers" 
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors group"
              >
                <Building2 className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-green-700">Suppliers</p>
                  <p className="text-sm text-gray-500">Manage suppliers</p>
                </div>
              </Link>

              {/* Products */}
              <Link 
                href="/dashboard/products" 
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group"
              >
                <Package className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-purple-700">Products</p>
                  <p className="text-sm text-gray-500">Manage inventory</p>
                </div>
              </Link>

              {/* Analytics */}
              <Link 
                href="/dashboard/analytics" 
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-colors group"
              >
                <BarChart3 className="h-8 w-8 text-pink-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-pink-700">Analytics</p>
                  <p className="text-sm text-gray-500">View reports</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-3">
                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {stats?.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Activity className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.message}
                      </p>
                      <p className="text-sm text-gray-500">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="px-6 py-3 border-t border-gray-100">
            <Link 
              href="/dashboard/interactions" 
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all activity →
            </Link>
          </div>
        </div>
      </div>


    </div>
  );
}