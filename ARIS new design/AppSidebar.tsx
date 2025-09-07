import { NavLink, useLocation } from "react-router-dom";
import { ChevronRight, LayoutDashboard, Users, Mail, Settings, Target, Brain, BarChart3, Calendar, MessageSquare, FileText, Zap, TrendingUp } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import arisLogo from "@/assets/aris-logo-clean.png";

// Menu items
const mainItems = [
  { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard },
  { title: "Leads", url: "/app/leads", icon: Users },
  { title: "Campaigns", url: "/app/campaigns", icon: Target },
  { title: "Email Sequences", url: "/app/emails", icon: Mail },
  { title: "Analytics", url: "/app/analytics", icon: BarChart3 },
  { title: "Calendar", url: "/app/calendar", icon: Calendar },
];

const aiItems = [
  { title: "AI Training", url: "/app/ai-training", icon: Brain },
  { title: "Voice Patterns", url: "/app/voice-patterns", icon: MessageSquare },
  { title: "Smart Insights", url: "/app/insights", icon: TrendingUp },
  { title: "Automation", url: "/app/automation", icon: Zap },
];

const settingsItems = [
  { title: "Integration", url: "/app/integrations", icon: FileText },
  { title: "Settings", url: "/app/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-card/30 backdrop-blur-sm">
      <SidebarHeader className="border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <img 
            src={arisLogo} 
            alt="ARIS" 
            className="h-8 w-8 shrink-0"
          />
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-primary">ARIS</span>
              <span className="text-xs text-muted-foreground">Sales AI Platform</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel className="text-xs font-medium text-muted-foreground mb-2">Main</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                    className="group hover:bg-primary/10 data-[active=true]:bg-primary/15 data-[active=true]:text-primary rounded-lg transition-all duration-200"
                  >
                    <NavLink to={item.url} className="flex items-center gap-3 px-3 py-2">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI Tools */}
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel className="text-xs font-medium text-muted-foreground mb-2">AI Tools</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {aiItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                    className="group hover:bg-primary/10 data-[active=true]:bg-primary/15 data-[active=true]:text-primary rounded-lg transition-all duration-200"
                  >
                    <NavLink to={item.url} className="flex items-center gap-3 px-3 py-2">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel className="text-xs font-medium text-muted-foreground mb-2">Settings</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                    className="group hover:bg-primary/10 data-[active=true]:bg-primary/15 data-[active=true]:text-primary rounded-lg transition-all duration-200"
                  >
                    <NavLink to={item.url} className="flex items-center gap-3 px-3 py-2">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-sm font-medium text-primary">U</span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-foreground truncate">User Name</span>
              <span className="text-xs text-muted-foreground truncate">user@company.com</span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}