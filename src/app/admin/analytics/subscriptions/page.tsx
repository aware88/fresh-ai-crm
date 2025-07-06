'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import 'chart.js/auto';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { saveAs } from 'file-saver';

interface SubscriptionMetrics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  canceledSubscriptions: number;
  mrr: number; // Monthly Recurring Revenue
  planDistribution: Record<string, number>;
  planRevenueDistribution: Record<string, number>;
  subscriptionsByMonth: Record<string, number>;
  retentionRate: number;
  churnRate: number;
  conversionRate: number;
  arpu: number; // Average Revenue Per User
  averageSubscriptionValue: number;
  estimatedLTV: number; // Estimated Lifetime Value
  cohortRetention: Array<{
    cohort: string;
    retentionRate: number;
    cancelRate: number;
    total: number;
    active: number;
    canceled: number;
  }>;
}

// Function to export analytics data as CSV
function exportAnalyticsReport(metrics: SubscriptionMetrics) {
  // Create CSV content
  const headers = ['Metric', 'Value'];
  const rows = [
    ['Total Subscriptions', metrics.totalSubscriptions],
    ['Active Subscriptions', metrics.activeSubscriptions],
    ['Trialing Subscriptions', metrics.trialingSubscriptions],
    ['Canceled Subscriptions', metrics.canceledSubscriptions],
    ['Monthly Recurring Revenue', `$${metrics.mrr}`],
    ['Average Revenue Per User', `$${metrics.arpu}`],
    ['Average Subscription Value', `$${metrics.averageSubscriptionValue}`],
    ['Estimated Lifetime Value', `$${metrics.estimatedLTV}`],
    ['Retention Rate', `${metrics.retentionRate}%`],
    ['Churn Rate', `${metrics.churnRate}%`],
    ['Trial Conversion Rate', `${metrics.conversionRate}%`]
  ];

  // Add plan distribution
  rows.push(['', '']);
  rows.push(['Plan Distribution (Users)', '']);
  Object.entries(metrics.planDistribution).forEach(([plan, count]) => {
    rows.push([plan, count]);
  });

  // Add plan revenue distribution
  rows.push(['', '']);
  rows.push(['Plan Distribution (Revenue)', '']);
  Object.entries(metrics.planRevenueDistribution).forEach(([plan, revenue]) => {
    rows.push([plan, `$${revenue}`]);
  });

  // Add subscription trend
  rows.push(['', '']);
  rows.push(['Subscription Trend', '']);
  Object.entries(metrics.subscriptionsByMonth).forEach(([month, count]) => {
    rows.push([month, count]);
  });

  // Add cohort retention
  rows.push(['', '']);
  rows.push(['Cohort Retention', '']);
  rows.push(['Cohort', 'Total', 'Active', 'Canceled', 'Retention Rate', 'Churn Rate']);
  metrics.cohortRetention.forEach(cohort => {
    rows.push([
      cohort.cohort,
      cohort.total,
      cohort.active,
      cohort.canceled,
      `${cohort.retentionRate}%`,
      `${cohort.cancelRate}%`
    ]);
  });

  // Convert to CSV string
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `subscription_analytics_${new Date().toISOString().split('T')[0]}.csv`);
}

export default function SubscriptionAnalyticsPage() {
  const [metrics, setMetrics] = useState<SubscriptionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'30d' | '90d' | '1y'>('30d');
  
  const router = useRouter();

  useEffect(() => {
    fetchMetrics();
  }, [dateRange]);

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/analytics/subscriptions?range=${dateRange}`);
      if (!response.ok) throw new Error('Failed to load subscription metrics');
      
      const data = await response.json();
      setMetrics(data.metrics);
    } catch (err) {
      console.error('Error fetching subscription metrics:', err);
      setError('Failed to load subscription metrics. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // For demo purposes, let's create some mock data if metrics is null
  const mockMetrics: SubscriptionMetrics = {
    totalSubscriptions: 120,
    activeSubscriptions: 95,
    trialingSubscriptions: 15,
    canceledSubscriptions: 10,
    mrr: 4750,
    planDistribution: {
      'Free': 50,
      'Starter': 30,
      'Pro': 25,
      'Business': 10,
      'Enterprise': 5
    },
    planRevenueDistribution: {
      'Free': 0,
      'Starter': 540,
      'Pro': 1225,
      'Business': 990,
      'Enterprise': 985
    },
    subscriptionsByMonth: {
      'Jan': 10,
      'Feb': 15,
      'Mar': 18,
      'Apr': 22,
      'May': 25,
      'Jun': 30
    },
    retentionRate: 92.5,
    churnRate: 7.5,
    conversionRate: 85,
    arpu: 42,
    averageSubscriptionValue: 50,
    estimatedLTV: 600,
    cohortRetention: [
      { cohort: 'Jan-2025', retentionRate: 95, cancelRate: 5, total: 20, active: 19, canceled: 1 },
      { cohort: 'Feb-2025', retentionRate: 90, cancelRate: 10, total: 25, active: 22, canceled: 3 },
      { cohort: 'Mar-2025', retentionRate: 88, cancelRate: 12, total: 30, active: 26, canceled: 4 },
      { cohort: 'Apr-2025', retentionRate: 92, cancelRate: 8, total: 35, active: 32, canceled: 3 },
      { cohort: 'May-2025', retentionRate: 94, cancelRate: 6, total: 40, active: 38, canceled: 2 },
      { cohort: 'Jun-2025', retentionRate: 98, cancelRate: 2, total: 45, active: 44, canceled: 1 }
    ]
  };

  const displayMetrics = metrics || mockMetrics;

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Subscription Analytics</h1>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-64 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Subscription Analytics</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  // Chart data for plan distribution (users)
  const planDistributionData = {
    labels: Object.keys(displayMetrics.planDistribution),
    datasets: [
      {
        data: Object.values(displayMetrics.planDistribution),
        backgroundColor: [
          'rgba(156, 163, 175, 0.6)', // gray for Free
          'rgba(59, 130, 246, 0.6)',  // blue for Starter
          'rgba(79, 70, 229, 0.6)',   // indigo for Pro
          'rgba(16, 185, 129, 0.6)',  // green for Business
          'rgba(139, 92, 246, 0.6)',  // purple for Enterprise
        ],
        borderColor: [
          'rgba(156, 163, 175, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(79, 70, 229, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(139, 92, 246, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Chart data for plan distribution (revenue)
  const planRevenueData = {
    labels: Object.keys(displayMetrics.planRevenueDistribution),
    datasets: [
      {
        data: Object.values(displayMetrics.planRevenueDistribution),
        backgroundColor: [
          'rgba(156, 163, 175, 0.6)', // gray for Free
          'rgba(59, 130, 246, 0.6)',  // blue for Starter
          'rgba(79, 70, 229, 0.6)',   // indigo for Pro
          'rgba(16, 185, 129, 0.6)',  // green for Business
          'rgba(139, 92, 246, 0.6)',  // purple for Enterprise
        ],
        borderColor: [
          'rgba(156, 163, 175, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(79, 70, 229, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(139, 92, 246, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart data for subscriptions by month
  const subscriptionTrendData = {
    labels: Object.keys(displayMetrics.subscriptionsByMonth),
    datasets: [
      {
        label: 'New Subscriptions',
        data: Object.values(displayMetrics.subscriptionsByMonth),
        fill: false,
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        tension: 0.1
      }
    ]
  };

  // Chart data for subscription status
  const subscriptionStatusData = {
    labels: ['Active', 'Trialing', 'Canceled'],
    datasets: [
      {
        label: 'Subscription Status',
        data: [
          displayMetrics.activeSubscriptions,
          displayMetrics.trialingSubscriptions,
          displayMetrics.canceledSubscriptions
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.6)', // green for active
          'rgba(234, 179, 8, 0.6)',  // yellow for trialing
          'rgba(239, 68, 68, 0.6)',  // red for canceled
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(234, 179, 8, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Subscription Analytics</h1>
          <div className="flex space-x-2">
            <button 
              onClick={() => setDateRange('30d')}
              className={`px-3 py-1 rounded-md ${dateRange === '30d' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              30 Days
            </button>
            <button 
              onClick={() => setDateRange('90d')}
              className={`px-3 py-1 rounded-md ${dateRange === '90d' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              90 Days
            </button>
            <button 
              onClick={() => setDateRange('1y')}
              className={`px-3 py-1 rounded-md ${dateRange === '1y' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              1 Year
            </button>
          </div>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Subscriptions</h3>
            <p className="text-3xl font-bold">{displayMetrics.totalSubscriptions}</p>
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>Active: {displayMetrics.activeSubscriptions}</span>
              <span>Trial: {displayMetrics.trialingSubscriptions}</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Monthly Recurring Revenue</h3>
            <p className="text-3xl font-bold">${displayMetrics.mrr.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-2">
              ARPU: ${displayMetrics.arpu}/user
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Retention & Churn</h3>
            <div className="flex justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{displayMetrics.retentionRate}%</p>
                <p className="text-xs text-gray-500">Retention</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{displayMetrics.churnRate}%</p>
                <p className="text-xs text-gray-500">Churn</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Trial Conversion</h3>
            <p className="text-3xl font-bold">{displayMetrics.conversionRate}%</p>
            <p className="text-sm text-gray-500 mt-2">
              LTV: ${displayMetrics.estimatedLTV}
            </p>
          </div>
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">Plan Distribution (Users)</h3>
            <div className="h-64">
              <Doughnut 
                data={planDistributionData} 
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context: any) {
                          const label = context.label || '';
                          const value = context.raw || 0;
                          const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
                          const percentage = Math.round((value / total) * 100);
                          return `${label}: ${value} (${percentage}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">Plan Distribution (Revenue)</h3>
            <div className="h-64">
              <Doughnut 
                data={planRevenueData} 
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context: any) {
                          const label = context.label || '';
                          const value = context.raw || 0;
                          const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
                          const percentage = Math.round((value / total) * 100);
                          return `${label}: $${value} (${percentage}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">Subscription Status</h3>
            <div className="h-64">
              <Bar 
                data={subscriptionStatusData} 
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">Subscription Trend</h3>
            <div className="h-64">
              <Line 
                data={subscriptionTrendData} 
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium mb-4">Cohort Retention Analysis</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cohort</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Canceled</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retention</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Churn</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayMetrics.cohortRetention.map((cohort) => (
                  <tr key={cohort.cohort}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cohort.cohort}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cohort.total}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cohort.active}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cohort.canceled}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${cohort.retentionRate}%` }}></div>
                        </div>
                        <span className="ml-2">{cohort.retentionRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-red-600 h-2.5 rounded-full" style={{ width: `${cohort.cancelRate}%` }}></div>
                        </div>
                        <span className="ml-2">{cohort.cancelRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button 
            onClick={() => router.push('/admin/subscriptions')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Manage Subscription Plans
          </button>
          <button 
            onClick={() => exportAnalyticsReport(displayMetrics)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
}
