'use client';

import * as React from "react";
import { useRouter } from 'next/navigation';
import { supabase } from '../app/Authentication-supabase/lib/supabaseClient';  // adjust path to your supabaseClient
import { VersionSwitcher } from "@/components/version-switcher";
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
} from "@/components/ui/sidebar";

import {
  Home,
  User,
  Users,
  DollarSign,
  FileText,
  Clock,
  LogOut,
  Notebook,
  Megaphone,
} from "lucide-react";

const data = {
  versions: [],
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
        { title: "Report Card", url: "/Report_card", icon: <Notebook size={16} />, isActive: false },
        { title: "Announcement", url: "/Announcement", icon: <Megaphone size={16} />, isActive: false },
        { title: "Sign Out", url: "#", icon: <LogOut size={16} />, isActive: false },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();

  // Sign out handler
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert('Error signing out: ' + error.message);
    } else {
      router.push('/');  // redirect to home or login page after sign out
    }
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader className="bg-blue-800 text-white">
        <VersionSwitcher />
      </SidebarHeader>
      <SidebarContent className="bg-blue-800 text-white">
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((menuItem) => (
                  <SidebarMenuItem key={menuItem.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={menuItem.isActive}
                      {...(menuItem.title === "Sign Out"
                        ? { onClick: (e) => {
                            e.preventDefault();
                            handleSignOut();
                          }, style: { cursor: 'pointer' } }
                        : {})}
                    >
                      {menuItem.title === "Sign Out" ? (
                        <span className="flex items-center gap-2">
                          {menuItem.icon}
                          {menuItem.title}
                        </span>
                      ) : (
                        <a href={menuItem.url} className="flex items-center gap-2">
                          {menuItem.icon}
                          {menuItem.title}
                        </a>
                      )}
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
  );
}
