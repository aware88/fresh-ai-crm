'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, X, Check, Mail, Users, Target, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDropdown } from '@/contexts/DropdownContext';

export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  category: 'email' | 'lead' | 'campaign' | 'system' | 'ai';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

// Real notifications will be fetched from API

const getNotificationIcon = (category: string, type: string) => {
  const baseClasses = "h-4 w-4";
  
  switch (category) {
    case 'email':
      return <Mail className={cn(baseClasses, "text-blue-500")} />;
    case 'lead':
      return <Users className={cn(baseClasses, "text-green-500")} />;
    case 'campaign':
      return <Target className={cn(baseClasses, "text-purple-500")} />;
    case 'ai':
      return <TrendingUp className={cn(baseClasses, "text-indigo-500")} />;
    case 'system':
      if (type === 'warning' || type === 'error') {
        return <AlertTriangle className={cn(baseClasses, "text-orange-500")} />;
      }
      return <Check className={cn(baseClasses, "text-emerald-500")} />;
    default:
      return <Bell className={cn(baseClasses, "text-gray-500")} />;
  }
};

const getTypeStyles = (type: string) => {
  switch (type) {
    case 'success':
      return 'border-l-green-500 bg-green-50/50';
    case 'warning':
      return 'border-l-orange-500 bg-orange-50/50';
    case 'error':
      return 'border-l-red-500 bg-red-50/50';
    case 'info':
    default:
      return 'border-l-blue-500 bg-blue-50/50';
  }
};

const formatTimestamp = (timestamp: Date) => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { activeDropdown, setActiveDropdown } = useDropdown();

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  // Handle dropdown state when other dropdowns open
  useEffect(() => {
    if (activeDropdown && activeDropdown !== 'notifications') {
      setIsOpen(false);
    }
  }, [activeDropdown]);

  // Fetch notifications on mount and when opened
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isOpen) return;
      
      setLoading(true);
      try {
        const response = await fetch('/api/notifications');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };


  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <div ref={notificationRef} className={cn("relative", className)}>
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transition-all duration-200"
        onClick={() => {
          const newState = !isOpen;
          setIsOpen(newState);
          if (newState) {
            setActiveDropdown('notifications');
          } else if (activeDropdown === 'notifications') {
            setActiveDropdown(null);
          }
        }}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-primary to-accent text-white border-0 animate-pulse-slow"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl max-h-[500px] overflow-hidden"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', zIndex: 999999 }}
        >
          {/* Header */}
          <div 
            className="p-4 border-b border-gray-200 bg-white"
            style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg text-gray-900">Notifications</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  if (activeDropdown === 'notifications') {
                    setActiveDropdown(null);
                  }
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className="text-xs"
                  style={filter !== 'all' ? { backgroundColor: 'transparent' } : {}}
                >
                  All ({notifications.length})
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                  className="text-xs"
                  style={filter !== 'unread' ? { backgroundColor: 'transparent' } : {}}
                >
                  Unread ({unreadCount})
                </Button>
              </div>
              
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs hover:bg-gray-100"
                  style={{ backgroundColor: 'transparent' }}
                >
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div 
            className="max-h-80 overflow-y-auto bg-white"
            style={{ backgroundColor: '#ffffff' }}
          >
            {loading ? (
              <div className="p-8 text-center" style={{ backgroundColor: '#ffffff' }}>
                <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-sm text-gray-500">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 border-l-4 hover:bg-muted/50 cursor-pointer transition-colors",
                    getTypeStyles(notification.type),
                    !notification.read && "bg-accent/20"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.category, notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className={cn(
                            "font-medium text-sm mb-1",
                            !notification.read && "font-semibold"
                          )}>
                            {notification.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            <Badge variant="secondary" className="text-xs capitalize">
                              {notification.category}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center" style={{ backgroundColor: '#ffffff' }}>
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500 mb-2">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                </p>
                <p className="text-xs text-gray-400">
                  {filter === 'unread' 
                    ? "You're all caught up!" 
                    : "Notifications will appear here when there's activity"
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}