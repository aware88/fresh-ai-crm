'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bell, Check, X, CreditCard, AlertCircle, ArrowUpCircle, Clock, Settings, RefreshCw, Inbox } from 'lucide-react';
import { Notification } from '@/lib/services/notification-service';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useOnClickOutside } from '@/hooks/use-on-click-outside';

export default function NotificationCenter() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch notifications when the component mounts
  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications();
      
      // Set up polling for new notifications every 2 minutes
      const interval = setInterval(() => {
        if (!isOpen) { // Only poll when dropdown is closed
          fetchNotifications(false);
        }
      }, 120000); // 2 minutes
      
      return () => clearInterval(interval);
    }
  }, [session, isOpen]);
  
  // Close dropdown when clicking outside
  useOnClickOutside(dropdownRef, () => setIsOpen(false));

  // Fetch notifications from the API
  const fetchNotifications = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.read).length);
      } else {
        throw new Error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (showLoading) {
        toast({
          title: 'Error',
          description: 'Failed to load notifications',
          variant: 'destructive'
        });
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Get notification background color based on type
  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50';
      case 'warning':
        return 'bg-yellow-50';
      case 'success':
        return 'bg-green-50';
      case 'billing':
      case 'subscription_payment_failed':
        return 'bg-purple-50';
      case 'trial':
      case 'subscription_trial_ending':
        return 'bg-blue-50';
      case 'subscription_upgraded':
        return 'bg-green-50';
      case 'subscription_renewal':
        return 'bg-amber-50';
      default:
        return 'bg-gray-50';
    }
  };

  // Get notification icon color based on type
  const getNotificationIconColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'success':
        return 'text-green-500';
      case 'billing':
      case 'subscription_payment_failed':
        return 'text-purple-500';
      case 'trial':
      case 'subscription_trial_ending':
        return 'text-blue-500';
      case 'subscription_upgraded':
        return 'text-green-500';
      case 'subscription_renewal':
        return 'text-amber-500';
      default:
        return 'text-gray-500';
    }
  };

  // Filter notifications by type
  const getFilteredNotifications = () => {
    if (activeTab === 'all') return notifications;
    
    return notifications.filter(notification => {
      if (activeTab === 'subscription') return notification.type.startsWith('subscription_');
      if (activeTab === 'system') return notification.type.startsWith('system_');
      if (activeTab === 'user') return notification.type.startsWith('user_');
      return true;
    });
  };
  
  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };
  
  // Navigate to notification preferences
  const goToNotificationSettings = () => {
    router.push('/dashboard/settings/notifications');
    setIsOpen(false);
  };
  
  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    const iconClass = `h-4 w-4 mr-2 ${getNotificationIconColor(type)}`;
    
    if (type.includes('payment') || type.includes('billing')) {
      return <CreditCard className={iconClass} />;
    } else if (type.includes('trial')) {
      return <Clock className={iconClass} />;
    } else if (type.includes('upgraded')) {
      return <ArrowUpCircle className={iconClass} />;
    } else if (type.includes('error') || type.includes('failed')) {
      return <AlertCircle className={iconClass} />;
    }
    
    return <Bell className={iconClass} />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200">
          <div className="p-3 bg-gray-50 flex justify-between items-center border-b">
            <div className="flex items-center">
              <Bell className="h-4 w-4 mr-2 text-gray-600" />
              <h3 className="text-sm font-medium">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs h-8"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => fetchNotifications(true)}
                disabled={loading || refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={goToNotificationSettings}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-3 pt-2 border-b">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
                <TabsTrigger value="user">User</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value={activeTab} className="focus-visible:outline-none focus-visible:ring-0">
              <div className="max-h-[400px] overflow-y-auto">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex flex-col space-y-2">
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-4 w-4" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    ))}
                  </div>
                ) : getFilteredNotifications().length === 0 ? (
                  <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                    <Inbox className="h-10 w-10 mb-2 text-gray-300" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  getFilteredNotifications().map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b hover:bg-gray-50 ${notification.read ? '' : getNotificationBgColor(notification.type)}`}
                    >
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          {getNotificationIcon(notification.type)}
                          <h4 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notification.title}
                          </h4>
                        </div>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id!)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                            aria-label="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${!notification.read ? 'text-gray-800' : 'text-gray-500'}`}>
                        {notification.message}
                      </p>
                      {notification.action_url && (
                        <a
                          href={notification.action_url}
                          className="inline-block mt-2 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={() => markAsRead(notification.id!)}
                        >
                          View details
                        </a>
                      )}
                      <div className="text-xs text-gray-400 mt-2">
                        {formatRelativeTime(notification.created_at!)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="p-3 bg-gray-50 border-t text-center">
            <Button 
              variant="link" 
              size="sm" 
              className="text-xs"
              onClick={goToNotificationSettings}
            >
              Manage notification preferences
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom hook for handling clicks outside of an element
if (!('useOnClickOutside' in window)) {
  // @ts-ignore - Add the hook if it doesn't exist
  window.useOnClickOutside = (ref: React.RefObject<HTMLElement>, handler: (event: MouseEvent | TouchEvent) => void) => {
    useEffect(() => {
      const listener = (event: MouseEvent | TouchEvent) => {
        if (!ref.current || ref.current.contains(event.target as Node)) {
          return;
        }
        handler(event);
      };

      document.addEventListener('mousedown', listener);
      document.addEventListener('touchstart', listener);

      return () => {
        document.removeEventListener('mousedown', listener);
        document.removeEventListener('touchstart', listener);
      };
    }, [ref, handler]);
  };
}
