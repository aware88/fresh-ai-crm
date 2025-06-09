'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Mail, 
  Users, 
  Calendar, 
  Settings, 
  BarChart,
  Brain,
  Sparkles
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  
  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Email Analysis",
      href: "/dashboard/email",
      icon: <Mail className="h-5 w-5" />,
    },
    {
      title: "Contacts",
      href: "/dashboard/contacts",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Calendar",
      href: "/dashboard/calendar",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "Analytics",
      href: "/dashboard/analytics",
      icon: <BarChart className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div className={cn("pb-12 min-h-screen bg-gradient-to-b from-gray-50 to-white border-r border-gray-200", className)}>
      {/* Logo and Brand */}
      <div className="px-6 py-8">
        <div className="flex items-center">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mr-3">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            AI CRM
          </h2>
        </div>
        <p className="text-xs text-gray-500 mt-2 ml-1">AI-powered customer insights</p>
      </div>
      
      <Separator className="my-2 opacity-50" />
      
      {/* Navigation */}
      <div className="px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = 
              pathname === item.href || 
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
              
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-l-4 border-blue-600" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-md mr-3",
                  isActive ? "bg-blue-100" : "bg-gray-100"
                )}>
                  {item.icon}
                </div>
                <span>{item.title}</span>
                {item.href === "/dashboard/email" && (
                  <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded">
                    New
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Pro Badge */}
      <div className="px-4 mt-8">
        <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
          <div className="flex items-center mb-2">
            <Sparkles className="h-5 w-5 text-white opacity-90" />
            <span className="ml-2 text-white font-semibold">Pro Features</span>
          </div>
          <p className="text-indigo-100 text-xs">Unlock advanced AI analysis and unlimited email responses</p>
          <button className="mt-3 w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm py-1.5 px-3 rounded-md transition-colors">
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}
