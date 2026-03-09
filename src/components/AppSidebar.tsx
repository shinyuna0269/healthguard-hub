import {
  LayoutDashboard,
  Stethoscope,
  ClipboardCheck,
  Syringe,
  Droplets,
  Activity,
  Settings,
  LogOut,
  Home,
  Users,
  FileText,
  MessageSquare,
  QrCode,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useRole, type UserRole } from "@/contexts/RoleContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const mainNav: NavItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    roles: ["BHW_User", "BSI_User", "Clerk_User", "Captain_User", "SysAdmin_User"],
  },
  {
    title: "Health Center Services",
    url: "/health-center",
    icon: Stethoscope,
    roles: ["BHW_User", "Clerk_User", "Captain_User"],
  },
  {
    title: "Sanitation Permit",
    url: "/sanitation-permit",
    icon: ClipboardCheck,
    roles: ["BSI_User", "Clerk_User", "Captain_User", "BusinessOwner_User"],
  },
  {
    title: "Immunization Tracker",
    url: "/immunization",
    icon: Syringe,
    roles: ["BHW_User", "Clerk_User", "Captain_User"],
  },
  {
    title: "Wastewater & Septic",
    url: "/wastewater",
    icon: Droplets,
    roles: ["BSI_User", "Clerk_User", "Resident_User"],
  },
  {
    title: "Health Surveillance",
    url: "/surveillance",
    icon: Activity,
    roles: ["BHW_User", "Clerk_User", "Captain_User", "SysAdmin_User"],
  },
];

const residentNav: NavItem[] = [
  { title: "My Health Records", url: "/my-health", icon: Home, roles: ["Resident_User"] },
  { title: "My Business Permits", url: "/my-permits", icon: FileText, roles: ["Resident_User", "BusinessOwner_User"] },
  { title: "My Complaints", url: "/my-complaints", icon: MessageSquare, roles: ["Resident_User"] },
  { title: "My QR Citizen ID", url: "/my-qr", icon: QrCode, roles: ["Resident_User"] },
];

export function AppSidebar() {
  const { currentRole } = useRole();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const isResident = currentRole === "Resident_User" || currentRole === "BusinessOwner_User";
  const navItems = isResident
    ? residentNav.filter((item) => item.roles.includes(currentRole))
    : mainNav.filter((item) => item.roles.includes(currentRole));

  return (
    <Sidebar collapsible="icon" className="sidebar-gradient border-r-0">
      <SidebarContent>
        {!collapsed && (
          <div className="px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg health-gradient flex items-center justify-center">
                <Activity className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs font-bold text-sidebar-foreground">GSMS</p>
                <p className="text-[10px] text-sidebar-foreground/60">Health & Sanitation</p>
              </div>
            </div>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider">
            {isResident ? "My Portal" : "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/settings"
                className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
              >
                <Settings className="mr-2 h-4 w-4" />
                {!collapsed && <span className="text-sm">Settings</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span className="text-sm">Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
