import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { StudentProvider } from "@/context/StudentContext";
import { AuthProvider } from "@/context/AuthContext";
import { createServerSupabaseClient } from '../app/Authentication-supabase/lib/supabase/server';
import SupabaseProvider from '../app/Authentication-supabase/lib/supabase/superbaseProvider';
import  SupabaseListener  from '../app/Authentication-supabase/lib/supabase/superbaseProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Edutrackr",
  description: "School Management System",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();


  return (
    <html lang="en">
        <head>
            <link rel="icon" href="/edutrackrlogo1.png" className="rounded-lg m-32 w-32" />
        </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastContainer />
        <SupabaseProvider session={session}>
          <SupabaseListener session={session}>
            <AuthProvider>
            <StudentProvider>
              {children}
            </StudentProvider>
          </AuthProvider>
        </SupabaseListener>
        </SupabaseProvider>
      </body>
    </html>
  );
}
