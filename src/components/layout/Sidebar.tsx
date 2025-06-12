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
  Package,
  Search,
  Warehouse,
  Package2,
  PackageOpen,
  Boxes,
  ShoppingCart,
  Receipt,
  CreditCard
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname() || '';
  
  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Inventory",
      href: "/dashboard/inventory/products",
      icon: <Package2 className="h-5 w-5" />,
    },
    {
      title: "Sales",
      href: "/dashboard/sales/orders",
      icon: <ShoppingCart className="h-5 w-5" />,
    },
    {
      title: "Supplier Management",
      href: "/dashboard/suppliers",
      icon: <Package className="h-5 w-5" />,
    },
    {
      title: "Email Analysis",
      href: "/dashboard/email",
      icon: <Mail className="h-5 w-5" />,
    },
    {
      title: "AI Assistant",
      href: "/dashboard/assistant",
      icon: <Brain className="h-5 w-5" />
    },
    {
      title: "Contacts",
      href: "/dashboard/contacts",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Calendar",
      href: "#",
      icon: <Calendar className="h-5 w-5" />,
      comingSoon: true
    },
    {
      title: "Analytics",
      href: "#",
      icon: <BarChart className="h-5 w-5" />,
      comingSoon: true
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />
    }
  ];

  return (
    <div className={cn("flex flex-col h-screen bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 overflow-y-auto", className)}>
      {/* Logo and Brand */}
      <div className="px-6 py-4">
        <div className="flex items-center">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mr-3">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            CRM Mind
          </h2>
        </div>
        <p className="text-xs text-gray-500 mt-1 ml-1">AI-powered customer insights</p>
      </div>
      
      {/* Search Bar */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full pl-9 text-sm h-9"
          />
        </div>
      </div>
      
      <Separator className="my-1 opacity-50" />
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive = 
            pathname === item.href || 
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
            
          return (
            <Link
              key={`${item.href}-${item.title}`}
              href={item.href}
              className={cn(
                "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive && !item.comingSoon
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-l-4 border-blue-600" 
                  : item.comingSoon 
                    ? "text-gray-400 cursor-not-allowed" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
              onClick={item.comingSoon ? (e) => e.preventDefault() : undefined}
            >
              <div className={cn(
                "p-1.5 rounded-md mr-3",
                isActive ? "bg-blue-100" : "bg-gray-100"
              )}>
                {item.icon}
              </div>
              <span className={cn(item.comingSoon ? 'text-gray-400' : '')}>
                {item.title}
                {item.comingSoon && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">
                    Coming Soon
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
