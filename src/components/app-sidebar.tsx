import * as React from "react"
import { SearchForm } from "@/components/search-form"
import { VersionSwitcher } from "@/components/version-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

import {
  Home,
  User,
  Users,
  DollarSign,
  FileText,
  Clock,
  LogOut,
} from "lucide-react" // <== Icons from lucide-react

// This is sample data.
const data = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      title: "",
      url: "#",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: <Home size={16} />, isActive: false },
        { title: "Profile", url: "/profile", icon: <User size={16} />, isActive: false },
        { title: "Teachers", url: "/teachers", icon: <Users size={16} />, isActive: false },
        { title: "Class/Students", url: "/students", icon: <Users size={16} />, isActive: false },
        { title: "Fee payment", url: "/fee_payment", icon: <DollarSign size={16} />, isActive: false },
        { title: "Results", url: "/results", icon: <FileText size={16} />, isActive: false },
        { title: "View Previous Results", url: "/previous_results", icon: <Clock size={16} />, isActive: false },
        { title: "Sign Out", url: "./", icon: <LogOut size={16} />, isActive: false },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader className="bg-blue-800 text-white">
        <VersionSwitcher
          versions={data.versions}
          defaultVersion={data.versions[0]}
        />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent className="bg-blue-800 text-white">
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((menuItem) => (
                  <SidebarMenuItem key={menuItem.title}>
                    <SidebarMenuButton asChild isActive={menuItem.isActive}>
                      <a
                        href={menuItem.url}
                        className="flex items-center gap-2"
                      >
                        {menuItem.icon}
                        {menuItem.title}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
