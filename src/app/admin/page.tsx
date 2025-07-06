'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalOrganizations: number;
  totalUsers: number;
  activeSubscriptions: number;
  mrr: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // In a real implementation, we would fetch actual stats
    // For now, we'll use mock data
    setTimeout(() => {
      setStats({
        totalOrganizations: 45,
        totalUsers: 128,
        activeSubscriptions: 38,
        mrr: 4750
      });
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Organizations</h3>
          <p className="text-3xl font-bold">{stats?.totalOrganizations}</p>
          <Link href="/admin/organizations" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
            View all
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Users</h3>
          <p className="text-3xl font-bold">{stats?.totalUsers}</p>
          <Link href="/admin/users" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
            View all
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Active Subscriptions</h3>
          <p className="text-3xl font-bold">{stats?.activeSubscriptions}</p>
          <Link href="/admin/subscriptions/organizations" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
            View all
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Monthly Recurring Revenue</h3>
          <p className="text-3xl font-bold">${stats?.mrr.toLocaleString()}</p>
          <Link href="/admin/analytics/subscriptions" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
            View analytics
          </Link>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/admin/subscriptions')}
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Manage Subscription Plans
          </button>
          
          <button
            onClick={() => router.push('/admin/subscriptions/organizations')}
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Manage Organization Subscriptions
          </button>
          
          <button
            onClick={() => router.push('/admin/analytics/subscriptions')}
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            View Subscription Analytics
          </button>
        </div>
      </div>
      
      {/* Subscription System Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium mb-4">Subscription System Overview</h2>
        <div className="prose max-w-none">
          <p>
            The CRM Mind subscription system allows you to manage subscription plans, organization subscriptions, and feature access.
            Here's what you can do from the admin dashboard:
          </p>
          
          <ul>
            <li><strong>Manage Subscription Plans</strong> - Create, edit, and deactivate subscription plans with custom features and pricing.</li>
            <li><strong>Manage Organization Subscriptions</strong> - View all organization subscriptions, change plans, and manage subscription status.</li>
            <li><strong>View Analytics</strong> - Track subscription metrics, revenue, and plan distribution.</li>
          </ul>
          
          <p>
            The subscription system is integrated with the feature flag system, which controls access to features based on subscription plans.
            Each plan defines a set of features and usage limits that organizations can access.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-md mt-4">
            <h3 className="text-blue-800 font-medium">Next Steps</h3>
            <p className="text-blue-700">
              To complete the subscription system implementation, consider integrating with a payment processor like Stripe
              to handle subscription billing and payment processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
