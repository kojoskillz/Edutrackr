'use client';

import * as React from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link for client-side navigation
import { supabase } from '../app/Authentication-supabase/lib/supabase/supabaseClient';  // adjust path to your supabaseClient
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
import { toast } from "react-toastify"; // Import toast for notifications

// Data structure for sidebar navigation items
const sidebarNavigationData = {
  versions: [], // Currently empty, but could be used for versioning info
  navMain: [
    {
      title: "", // Empty title for the main group
      url: "#", // Placeholder URL as it's a group
      items: [
        // Navigation items with icons, titles, and URLs
        { title: "Dashboard", url: "/dashboard", icon: <Home size={16} />, isActive: false },
        { title: "Profile", url: "/profile", icon: <User size={16} />, isActive: false },
        { title: "Teachers", url: "/teachers", icon: <Users size={16} />, isActive: false },
        { title: "Class/Students", url: "/students", icon: <Users size={16} />, isActive: false },
        { title: "Fee payment", url: "/fee_payment", icon: <DollarSign size={16} />, isActive: false },
        { title: "Results", url: "/results", icon: <FileText size={16} />, isActive: false },
        { title: "View Previous Results", url: "/previous_results", icon: <Clock size={16} />, isActive: false },
        { title: "Report Card", url: "/Report_card", icon: <Notebook size={16} />, isActive: false },
        { title: "Announcement", url: "/Announcement", icon: <Megaphone size={16} />, isActive: false },
        // Sign Out item, handled separately with an onClick handler
        { title: "Sign Out", url: "#", icon: <LogOut size={16} />, isActive: false },
      ],
    },
  ],
};

// AppSidebar component definition
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter(); // Initialize Next.js router

  // Sign out handler function
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut(); // Call Supabase sign out
    if (error) {
      // If there's an error during sign out, display a toast notification
      toast.error('Error signing out: ' + error.message, { position: "top-right" });
      console.error('Error signing out:', error.message); // Log the error for debugging
    } else {
      // On successful sign out, redirect to the home/login page
      router.push('/');
    }
  };

  return (
    // Sidebar container component
    <Sidebar {...props}>
      {/* Sidebar Header with branding or version switcher */}
      <SidebarHeader className="bg-blue-800 text-white">
        <VersionSwitcher />
      </SidebarHeader>

      {/* Main content area of the sidebar */}
      <SidebarContent className="bg-blue-800 text-white">
        {/* Map through main navigation groups (though only one is defined in data) */}
        {sidebarNavigationData.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            {/* Label for the sidebar group */}
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              {/* Menu for navigation items within the group */}
              <SidebarMenu>
                {/* Map through individual menu items */}
                {group.items.map((menuItem) => (
                  // Changed mb-0 to mb-[2px] for a very small gap to distinguish items
                  <SidebarMenuItem key={menuItem.title} className="mb-[2px]">
                    {/* SidebarMenuButton acts as a wrapper for clickable items */}
                    <SidebarMenuButton
                      asChild // Renders its child directly, allowing custom elements like Link or <a>
                      isActive={menuItem.isActive} // Prop to indicate if the item is active
                      // Structural/layout classes for the button wrapper
                      className="w-full text-left"
                      // No hover classes here, they are moved to the child <a> or <span>
                      // Conditional props for "Sign Out" item vs. regular navigation items
                      {...(menuItem.title === "Sign Out"
                        ? {
                            // For "Sign Out", use an onClick handler
                            onClick: (e) => {
                              e.preventDefault(); // Prevent default <a> tag behavior
                              handleSignOut(); // Call the sign out function
                            },
                            style: { cursor: 'pointer' } // Indicate it's clickable
                          }
                        : {})}
                    >
                      {/* Render content based on whether it's "Sign Out" or a navigation link */}
                      {menuItem.title === "Sign Out" ? (
                        // Render Sign Out as a span with icon and title, applying hover styles and rounded-lg
                        // Reduced py-3 px-4 to py-2 px-3 for smaller hover size
                        <span className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white hover:text-blue-800 transition-colors duration-200">
                          {menuItem.icon}
                          {menuItem.title}
                        </span>
                      ) : (
                        // Render other items using Next.js Link, applying hover styles and rounded-lg to the <a> tag
                        // Reduced py-3 px-4 to py-2 px-3 for smaller hover size
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

      {/* Sidebar Rail (collapsed view) */}
      <SidebarRail />
    </Sidebar>
  );
}
