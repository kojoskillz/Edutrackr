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

// This is sample data.
const data = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      title: "",
      url: "#",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard ",
        },
        {
          title: "Profile",
          url: "/profile ",
        },
        {
          title: "Teachers",
          url: "/teachers",
        },
        {
          title: "Students",
          url: "/students",
        },
        {
          title: "Fee payment",
          url: "/fee_payment",
        },
        {
          title: "Results",
          url: "/results",
        },
        {
          title: "View Previous Results",
          url: "/previous_results",
        },
        {
          title: "Sign Out",
          url: "./",
        },
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
        <SearchForm  />
      </SidebarHeader>
      <SidebarContent className="bg-blue-800 text-white">
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <a href={item.url}>{item.title}</a>
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
