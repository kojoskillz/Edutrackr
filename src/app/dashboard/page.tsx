"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Image from "next/image";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from 'next/link'; // Import Link from next/link

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { useAuth } from "@/context/AuthContext"; // Assuming AuthContext is correctly implemented
import { useStudent } from "@/context/StudentContext"; // Assuming StudentContext is correctly implemented
import useFeesStore from "../dashboard/useFeesStore"; // Assuming useFeesStore is correctly implemented

import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  Title as ChartTitle,
  TooltipItem
} from "chart.js";

import { supabase } from "../Authentication-supabase/lib/supabase/supabaseClient"; // Updated Supabase client import path

// Register Chart.js components
ChartJS.register(ArcElement, ChartTooltip, Legend, BarElement, CategoryScale, LinearScale, ChartTitle);

// Define the structure for student data by class (local state structure)
interface StudentData {
  [className: string]: {
    male: number;
    female: number;
  };
}

// Interfaces for Supabase table data
interface ClassesUpdate {
  id: string;
  class_name: string;
  male_students_count: number;
  female_students_count: number;
  created_at: string;
  updated_at: string;
}

interface SupabaseAdminProfile {
  id: string;
  admin_name: string;
  admin_image_url: string | null;
  updated_at: string;
}

// Constants for image paths (replaces magic strings)
const PROFILE_PLACEHOLDER_IMAGE = "/profile-placeholder.png";
const CLOCK_IMAGE = "/clock.png";
const MALE_TEACHER_IMAGE = "/male_teacher.png";
const FEMALE_TEACHER_IMAGE = "/female_teacher.png";
const MALE_STUDENT_IMAGE = "/male_student.png";
const FEMALE_STUDENT_IMAGE = "/female_student.png";
const ALL_IMAGE = "/all.png";

// Main page component for the Dashboard
export default function Page() {
  // State variables for dashboard data
  const [adminName, setAdminName] = useState("Admin");
  const [adminImage, setAdminImage] = useState(PROFILE_PLACEHOLDER_IMAGE);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState("");

  // Global counts for teachers and students from school_statistics
  const [maleTeachers, setMaleTeachers] = useState(0);
  const [femaleTeachers, setFemaleTeachers] = useState(0);
  const [maleStudentsGlobal, setMaleStudentsGlobal] = useState(0);
  const [femaleStudentsGlobal, setFemaleStudentsGlobal] = useState(0);

  // Student data (class-specific) from StudentContext
  const { studentData, setStudentData } = useStudent();

  // Fees data from Zustand store
  const { paidFees, unpaidFees, setPaidFees, setUnpaidFees } = useFeesStore();
  // useLoadFees(); // If useLoadFees already fetches from Supabase, keep it.
                   // Otherwise, the fetches in this component will handle it.
                   // Let's assume this component fetches all needed data now.


  // Calculate total teachers and students
  const totalTeachers = maleTeachers + femaleTeachers;
  const totalStudentsGlobal = maleStudentsGlobal + femaleStudentsGlobal;

  // Authentication check and redirection
  interface AuthContextType {
    user: { id: string; name: string; email: string } | null;
  }
  const auth = useAuth() as AuthContextType | null;
  const user = auth?.user;
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (user === null) {
      router.push('../Authentication-supabase/login');
    }
  }, [user, router]);

  // Effect for current time display
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Supabase Data Fetching Effects ---

  // Fetch Admin Profile
  useEffect(() => {
    const fetchAdminProfile = async () => {
          try {
            const { data, error } = await supabase
              .from<"admin_profiles", SupabaseAdminProfile>("admin_profiles")
              .select("admin_name, admin_image_url")
              .limit(1)
              .single(); // Assuming a single admin profile entry

        if (error && error.code !== 'PGRST116') { // PGRST116 means no row found
          throw error;
        }

        if (data) {
          setAdminName(data.admin_name || "Admin");
          setAdminImage(data.admin_image_url || PROFILE_PLACEHOLDER_IMAGE);
        } else {
          // If no profile exists, ensure default values are used
          setAdminName("Admin");
          setAdminImage(PROFILE_PLACEHOLDER_IMAGE);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast.error(`Error fetching admin profile: ${errorMessage}`, {
          position: "top-right",
        });
        console.error("Error fetching admin profile:", error);
      }
    };
    fetchAdminProfile();
  }, []);

  // Fetch School Statistics (Teachers, Overall Students, Fees)
  useEffect(() => {
    const fetchSchoolStatistics = async () => {
      try {
        const { data, error } = await supabase
          .from("school_statistics")
          .select("*")
          .limit(1)
          .single(); // Assuming a single row for all school statistics

        if (error && error.code !== 'PGRST116') { // PGRST116 means no row found
          throw error;
        }

        if (data) {
          setMaleTeachers(data.total_male_teachers);
          setFemaleTeachers(data.total_female_teachers);
          setMaleStudentsGlobal(data.overall_male_students);
          setFemaleStudentsGlobal(data.overall_female_students);
          setPaidFees(data.paid_fees_percentage);
          setUnpaidFees(data.unpaid_fees_percentage);
        } else {
          // Initialize with default zeros if no record found
          setMaleTeachers(0);
          setFemaleTeachers(0);
          setMaleStudentsGlobal(0);
          setFemaleStudentsGlobal(0);
          setPaidFees(0);
          setUnpaidFees(0);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast.error(`Error fetching school statistics: ${errorMessage}`, {
          position: "top-right",
        });
        console.error("Error fetching school statistics:", error);
      }
    };
    fetchSchoolStatistics();
  }, [setPaidFees, setUnpaidFees]); // Include useFeesStore setters as dependencies

  // Fetch Class-Specific Student Data
  useEffect(() => {
    const fetchClassStudentData = async () => {
      try {
        const { data, error } = await supabase
          .from<'classes_update', ClassesUpdate>('classes_update')
          .select('*');

        if (error) {
          throw error;
        }

        if (data) {
          const transformedData: StudentData = {};
          data.forEach((cls) => {
            transformedData[cls.class_name] = {
              male: cls.male_students_count,
              female: cls.female_students_count,
            };
          });
          setStudentData(transformedData);

          // Set the current class to the first one found, or empty
          const firstClass = Object.keys(transformedData)[0];
          if (firstClass) {
            setSelectedClass(firstClass);
          } else {
            setSelectedClass("");
          }
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast.error(`Error fetching class data: ${errorMessage}`, {
          position: "top-right",
        });
        console.error("Error fetching class data:", error);
      }
    };
    fetchClassStudentData();
  }, [setStudentData]); // Dependency array includes setStudentData

  // Render nothing if user is not authenticated yet
  if (user === null) return null;

  // Prepare data for the bar chart (Students Enrollment Per Class)
  const barChartData = {
    labels: ["Male", "Female"],
    datasets: [
      {
        label: `Students in ${selectedClass || "Selected Class"}`,
        data: [
          studentData?.[selectedClass]?.male || 0,
          studentData?.[selectedClass]?.female || 0,
        ],
        backgroundColor: ["#3B82F6", "#EC4899"], // Tailwind blue-500, pink-500
        borderColor: ["#2563EB", "#DB2777"], // Darker shades
        borderWidth: 1,
        borderRadius: 8,
        barThickness: 50, // Adjust bar thickness
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allow chart to fill container height
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: {
            size: 14,
            family: "Inter, sans-serif",
          },
          color: '#4B5563', // Tailwind gray-600
        },
      },
      title: {
        display: true,
        text: selectedClass ? `Enrollment in ${selectedClass}` : 'Class Enrollment',
        font: {
          size: 18,
          weight: 'bold' as const,
          family: "Inter, sans-serif",
        },
        color: '#1F2937', // Tailwind gray-800
        padding: {
          top: 10,
          bottom: 20,
        }
      },
      tooltip: {
        backgroundColor: '#FFFFFF', // White background for tooltip
        titleColor: '#1F2937', // Dark text for title
        bodyColor: '#4B5563', // Medium text for body
        borderColor: '#E5E7EB', // Light gray border
        borderWidth: 1,
        padding: 10,
        cornerRadius: 6,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0, // Ensure whole numbers for student count
          color: '#4B5563', // Tailwind gray-600
          font: {
            family: "Inter, sans-serif",
          }
        },
        grid: {
          color: '#E5E7EB', // Lighter grid lines
        },
      },
      x: {
        ticks: {
          color: '#4B5563', // Tailwind gray-600
            font: {
            family: "Inter, sans-serif",
          }
        },
        grid: {
          display: false, // Hide vertical grid lines for cleaner look
        },
      },
    },
  };


  // Prepare data for the pie chart (Fee Payment)
  const pieData = {
    labels: ["Paid Fees", "Unpaid Fees"],
    datasets: [
      {
        data: [paidFees, unpaidFees],
        backgroundColor: ["#10B981", "#EF4444"], // Tailwind green-500, red-500
        borderColor: ["#FFFFFF", "#FFFFFF"], // White border for separation
        borderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

  // Options for the pie chart
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          font: {
            size: 12,
            family: "Inter, sans-serif",
          },
          color: '#4B5563', // Tailwind gray-600
          boxWidth: 15,
          padding: 20,
        },
      },
      title: { // Added title for Pie chart for consistency
        display: true,
        text: 'Fee Payment Status',
        font: {
          size: 16,
          weight: 'bold' as const,
          family: "Inter, sans-serif",
        },
        color: '#1F2937', // Tailwind gray-800
        padding: {
          top: 10,
          bottom: 10,
        }
      },
      tooltip: {
        callbacks: {
          // Use TooltipItem type for the context parameter
          label: function(context: TooltipItem<'pie'>) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              // Format the value as a percentage
              label += `${context.parsed}%`;
            }
            return label;
          }
        },
        backgroundColor: '#FFFFFF',
        titleColor: '#1F2937',
        bodyColor: '#4B5563',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 6,
      }
    },
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header section */}
        <header className="flex h-16 items-center gap-2 border-b bg-white px-4 sticky top-0 z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-6" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                {/* Use Next.js Link component for client-side navigation */}
                <Link href="/dashboard" passHref legacyBehavior>
                  <BreadcrumbLink>Dashboard</BreadcrumbLink>
                </Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Admin Overview</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Main content area */}
        <main className="flex-1 bg-slate-100 p-4 md:p-6 lg:p-8">
          {/* Welcome & Clock Container */}
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2 flex items-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 p-6 shadow-lg text-white">
              {adminImage && (
                <Image
                  src={adminImage}
                  alt="Admin Profile"
                  width={64}
                  height={64}
                  className="rounded-full object-cover mr-5 border-2 border-blue-300"
                  onError={(e) => (e.currentTarget.src = PROFILE_PLACEHOLDER_IMAGE)}
                />
              )}
              <div>
                <p className="text-2xl font-semibold">Welcome, {adminName}!</p>
                <p className="text-blue-200 text-sm">Here&apos;s your school overview.</p>
              </div>
            </div>

            <div className="flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 p-6 shadow-lg text-white">
              <Image src={CLOCK_IMAGE} alt="Clock" width={40} height={40} className="mr-3" />
              <h2 className="font-semibold text-3xl">
                {currentTime.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true })}
              </h2>
            </div>
          </div>

          {/* Stats Grid Container */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
            <StatCard
              title="Teachers"
              bgColor="bg-green-500"
              textColor="text-white"
              stats={[
                { icon: MALE_TEACHER_IMAGE, label: "Male", value: maleTeachers },
                { icon: FEMALE_TEACHER_IMAGE, label: "Female", value: femaleTeachers },
                { icon: ALL_IMAGE, label: "Total", value: totalTeachers },
              ]}
            />
            <StatCard
              title="Students"
              bgColor="bg-sky-500"
              textColor="text-white"
              stats={[
                { icon: MALE_STUDENT_IMAGE, label: "Male", value: maleStudentsGlobal },
                { icon: FEMALE_STUDENT_IMAGE, label: "Female", value: femaleStudentsGlobal },
                { icon: ALL_IMAGE, label: "Total", value: totalStudentsGlobal },
              ]}
            />
            {/* Fee Payment Chart Container */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
              <div style={{ height: "250px" }}>
                <Pie data={pieData} options={pieOptions} />
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
            <div className="mb-4 flex flex-col sm:flex-row gap-2 items-center justify-between">
              <div></div> {/* Placeholder for alignment if needed */}
              <div className="flex gap-2 items-center">
                <label htmlFor="classSelect" className="font-medium text-sm text-gray-700">Select Class:</label>
                <select
                  id="classSelect"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="p-2 rounded-md bg-slate-50 border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {studentData && Object.keys(studentData).length > 0 ? (
                    Object.keys(studentData).map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No classes available</option>
                  )}
                </select>
              </div>
            </div>

            <div className="w-full h-[350px] md:h-[400px]">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

// StatCard component with improved styling
interface StatCardProps {
  title: string;
  bgColor: string; // e.g., 'bg-blue-500'
  textColor: string; // e.g., 'text-blue-100'
  stats: { icon: string; label: string; value: number }[];
  borderRadius?: string; // Optional: '10px', '1rem', etc.
}

function StatCard({ title, bgColor, textColor, stats, borderRadius }: StatCardProps) {
  return (
    <div
      className={`${bgColor} p-5 shadow-lg flex flex-col justify-between ${borderRadius ? '' : 'rounded-xl'}`}
      style={{ borderRadius: borderRadius || undefined }}
    >
      <h3 className={`text-xl ${textColor} font-semibold mb-4`}>{title}</h3>
      <div className="flex justify-around items-end">
        {stats.map((s, index) => (
          <StatItem key={index} icon={s.icon} label={s.label} value={s.value} />
        ))}
      </div>
    </div>
  );
}

// Single Stat Item component
interface StatItemProps {
  icon: string;
  label: string;
  value: number;
}

function StatItem({ icon, label, value }: StatItemProps) {
  return (
    <div className="text-center flex flex-col items-center">
      <Image
        src={icon}
        alt={label}
        width={40}
        height={40}
        className="mb-1.5"
        onError={(e) => (e.currentTarget.style.display = 'none')}
      />
      <p className="text-sm text-white/90 font-medium">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
