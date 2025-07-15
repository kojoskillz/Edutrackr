'use client';

import * as React from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../app/Authentication-supabase/lib/supabase/supabaseClient';
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
  Megaphone,
  ClipboardCheck
} from "lucide-react";
import { toast } from "react-toastify";

const sidebarNavigationData = {
  versions: [],
  navMain: [
    {
      title: "",
      url: "#",
      items: [
        { title: "Dashboard", url: "./dashboard", icon: <Home size={16} />, isActive: false },
        { title: "Profile", url: "/profile", icon: <User size={16} />, isActive: false },
        { title: "Teachers", url: "/teachers", icon: <Users size={16} />, isActive: false },
        { title: "Class/Students", url: "/students", icon: <Users size={16} />, isActive: false },
        { title: "Fee Payment", url: "/fee_payment", icon: <DollarSign size={16} />, isActive: false },
        { title: "Results", url: "/results", icon: <FileText size={16} />, isActive: false },
        { title: "View Previous Results", url: "/previous_results", icon: <Clock size={16} />, isActive: false },
        { title: "Announcement", url: "/Announcement", icon: <Megaphone size={16} />, isActive: false },
        { title: "AI Exams Center", url: "/exams_center", icon: <ClipboardCheck size={16} />, isActive: false }, 
        { title: "Sign Out", url: "#", icon: <LogOut size={16} />, isActive: false },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error signing out: ' + error.message, { position: "top-right" });
      console.error('Error signing out:', error.message);
    } else {
      router.push('/');
    }
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader className="bg-blue-800 text-white">
        {/* Replace with your logo or branding */}
        <div className="px-4 py-2 font-bold">School Admin</div>
      </SidebarHeader>

      <SidebarContent className="bg-blue-800 text-white">
        {sidebarNavigationData.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((menuItem) => (
                  <SidebarMenuItem key={menuItem.title} className="mb-[2px]">
                    <SidebarMenuButton
                      asChild
                      isActive={menuItem.isActive}
                      className="w-full text-left"
                      {...(menuItem.title === "Sign Out"
                        ? {
                            onClick: (e) => {
                              e.preventDefault();
                              handleSignOut();
                            },
                            style: { cursor: 'pointer' }
                          }
                        : {})}
                    >
                      {menuItem.title === "Sign Out" ? (
                        <span className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white hover:text-blue-800 transition-colors duration-200">
                          {menuItem.icon}
                          {menuItem.title}
                        </span>
                      ) : (
                        <Link href={menuItem.url} passHref legacyBehavior>
                          <a className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white hover:text-blue-800 transition-colors duration-200">
                            {menuItem.icon}
                            {menuItem.title}
                          </a>
                        </Link>
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
