"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar"; // Assuming this path is correct
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"; // Assuming this path is correct
import { Separator } from "@/components/ui/separator"; // Assuming this path is correct
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"; // Assuming this path is correct

// import Tooltip from "@mui/material/Tooltip"; // Still used for StatCard (though a custom tooltip might be better with Tailwind)


// These imports are not used in the current component and can be removed
// import AddIcon from "@mui/icons-material/Add";
// import {
//   GridRowsProp,
//   GridRowModesModel,
//   GridRowModes,
//   GridSlotProps,
//   Toolbar as MuiToolbar,
// } from "@mui/x-data-grid";
// import { randomId } from "@mui/x-data-grid-generator";


// Import necessary hooks and components for the dashboard
import { useAuth } from "@/context/AuthContext"; // Assuming this path is correct
import { useRouter } from 'next/navigation';
import { useStudent } from "@/context/StudentContext"; // Assuming this path is correct
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip, // Alias Tooltip to avoid conflict with MUI Tooltip
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  Title as ChartTitle, // Import Title for chart titles
  TooltipItem // Import TooltipItem type for tooltip callbacks
} from "chart.js";
import useFeesStore, { useLoadFees } from "../dashboard/useFeesStore"; // Updated path to match the correct location
import Image from "next/image";
import { useEffect, useState } from "react";

// Register Chart.js components
ChartJS.register(ArcElement, ChartTooltip, Legend, BarElement, CategoryScale, LinearScale, ChartTitle);

// Main page component for the Dashboard
export default function Page() {
  // State variables for dashboard data
  const [adminName, setAdminName] = useState("Admin"); // Renamed for clarity
  const [adminImage, setAdminImage] = useState("/profile-placeholder.png"); // Default placeholder
  const [currentTime, setCurrentTime] = useState(new Date()); // Renamed for clarity
  const [selectedClass, setSelectedClass] = useState("");
  const { studentData } = useStudent(); // From StudentContext

  // Correctly typed data from useFeesStore
  const { paidFees, unpaidFees } = useFeesStore();
  useLoadFees(); // Hook to load fee data into the store

  // State for teacher and student counts (can be fetched or from context)
  const [maleTeachers, setMaleTeachers] = useState(0);
  const [femaleTeachers, setFemaleTeachers] = useState(0);
  const [maleStudentsGlobal, setMaleStudentsGlobal] = useState(0); // Renamed for clarity
  const [femaleStudentsGlobal, setFemaleStudentsGlobal] = useState(0); // Renamed for clarity

  // Calculate total teachers and students
  const totalTeachers = maleTeachers + femaleTeachers;
  const totalStudentsGlobal = maleStudentsGlobal + femaleStudentsGlobal; // Renamed

  // Effect to load admin data and set up clock interval
  useEffect(() => {
    setAdminName(localStorage.getItem("adminName") || "Admin");
    setAdminImage(localStorage.getItem("adminImage") || "/profile-placeholder.png"); // Use placeholder if no image

    // Example: Load teacher/student counts from localStorage or context if available
    setMaleTeachers(Number(localStorage.getItem("maleTeachersCount")) || 10); // Example value
    setFemaleTeachers(Number(localStorage.getItem("femaleTeachersCount")) || 15); // Example value
    setMaleStudentsGlobal(Number(localStorage.getItem("maleStudentsCount")) || 120); // Example value
    setFemaleStudentsGlobal(Number(localStorage.getItem("femaleStudentsCount")) || 130); // Example value

    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  // Effect to set default selected class when student data is available
  useEffect(() => {
    if (studentData && Object.keys(studentData).length > 0 && !selectedClass) {
      setSelectedClass(Object.keys(studentData)[0]);
    }
  }, [studentData, selectedClass]);

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
              // You can format the value, e.g., to currency
              // The parsed value for a pie chart is the numerical value of the slice
              label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed);
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

  // Authentication check
  // Safely access the user property using optional chaining
  // Define the expected type for the auth object
  interface AuthContextType {
    user: { id: string; name: string; email: string } | null; // Adjust fields as per your actual user object
  }
  
  const auth = useAuth();
  const typedAuth = auth ? (auth as AuthContextType) : null; // Safely cast only if auth is not null
  const user = auth?.user; // Safely access the user property
  // const user = auth?.user;

  const router = useRouter();

  // Effect to redirect to login if user is not authenticated
  useEffect(() => {
    // Explicitly check if user is null or undefined
    if (user == null) {
      router.push('/login'); // Assuming your login route is /login
    }
  }, [user, router]);

  // Render nothing if user is not authenticated (router.push handles the redirect)
  if (user == null) return null;


  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header section */}
        <header className="flex h-16 items-center gap-2 border-b bg-white px-4 sticky top-0 z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-6" /> {/* Adjusted height */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Admin Overview</BreadcrumbPage> {/* More descriptive */}
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {/* You can add more header items here, like user profile dropdown */}
        </header>

        {/* Main content area */}
        <main className="flex-1 bg-slate-100 p-4 md:p-6 lg:p-8"> {/* Use main tag and responsive padding */}
          {/* Welcome & Clock Container */}
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2 flex items-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 p-6 shadow-lg text-white">
              {adminImage && (
                <Image
                  src={adminImage}
                  alt="Admin Profile"
                  width={64} // Increased size
                  height={64}
                  className="rounded-full object-cover mr-5 border-2 border-blue-300"
                  onError={(e) => (e.currentTarget.src = "/profile-placeholder.png")} // Fallback
                />
              )}
              <div>
                <p className="text-2xl font-semibold">Welcome, {adminName}!</p>
                <p className="text-blue-200 text-sm">Here&apos;s your school overview.</p>
              </div>
            </div>

            <div className="flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 p-6 shadow-lg text-white">
              <Image src="/clock.png" alt="Clock" width={40} height={40} className="mr-3" />
              <h2 className="font-semibold text-3xl">
                {currentTime.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true })}
              </h2>
            </div>
          </div>

          {/* Stats Grid Container */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
            <StatCard
              title="Teachers"
              bgColor="bg-green-500" // Kept original for consistency, but could use Tailwind gradients
              textColor="text-white"
              stats={[
                { icon: "/male_teacher.png", label: "Male", value: maleTeachers },
                { icon: "/female_teacher.png", label: "Female", value: femaleTeachers },
                { icon: "/all.png", label: "Total", value: totalTeachers },
              ]}
            />
            <StatCard
              title="Students"
              bgColor="bg-sky-500" // Changed for variety
              textColor="text-white"
              stats={[
                { icon: "/male_student.png", label: "Male", value: maleStudentsGlobal },
                { icon: "/female_student.png", label: "Female", value: femaleStudentsGlobal },
                { icon: "/all.png", label: "Total", value: totalStudentsGlobal },
              ]}
            />
            {/* Fee Payment Chart Container */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg"> {/* Increased padding */}
              {/* Pie chart title is now part of pieOptions */}
              <div style={{ height: "250px" }}> {/* Adjusted height for better display */}
                <Pie data={pieData} options={pieOptions} />
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
             {/* Bar chart title is now part of barChartOptions */}
            <div className="mb-4 flex flex-col sm:flex-row gap-2 items-center justify-between">
              {/* Title is handled by chart options */}
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

            <div className="w-full h-[350px] md:h-[400px]"> {/* Adjusted height for bar chart */}
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
        onError={(e) => (e.currentTarget.style.display = 'none')} // Hide if image fails
      />
      <p className="text-sm text-white/90 font-medium">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar"; // Assuming this path is correct
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"; // Assuming this path is correct
import { Separator } from "@/components/ui/separator"; // Assuming this path is correct
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"; // Assuming this path is correct

// import Tooltip from "@mui/material/Tooltip"; // Still used for StatCard (though a custom tooltip might be better with Tailwind)


// These imports are not used in the current component and can be removed
// import AddIcon from "@mui/icons-material/Add";
// import {
//   GridRowsProp,
//   GridRowModesModel,
//   GridRowModes,
//   GridSlotProps,
//   Toolbar as MuiToolbar,
// } from "@mui/x-data-grid";
// import { randomId } from "@mui/x-data-grid-generator";


// Import necessary hooks and components for the dashboard
import { useAuth } from "@/context/AuthContext"; // Assuming this path is correct
import { useRouter } from 'next/navigation';
import { useStudent } from "@/context/StudentContext"; // Assuming this path is correct
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip, // Alias Tooltip to avoid conflict with MUI Tooltip
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  Title as ChartTitle, // Import Title for chart titles
  TooltipItem // Import TooltipItem type for tooltip callbacks
} from "chart.js";
import useFeesStore, { useLoadFees } from "../dashboard/useFeesStore"; // Updated path to match the correct location
import Image from "next/image";
import { useEffect, useState } from "react";

// Register Chart.js components
ChartJS.register(ArcElement, ChartTooltip, Legend, BarElement, CategoryScale, LinearScale, ChartTitle);

// Main page component for the Dashboard
export default function Page() {
  // State variables for dashboard data
  const [adminName, setAdminName] = useState("Admin"); // Renamed for clarity
  const [adminImage, setAdminImage] = useState("/profile-placeholder.png"); // Default placeholder
  const [currentTime, setCurrentTime] = useState(new Date()); // Renamed for clarity
  const [selectedClass, setSelectedClass] = useState("");
  const { studentData } = useStudent(); // From StudentContext

  // Correctly typed data from useFeesStore
  const { paidFees, unpaidFees } = useFeesStore();
  useLoadFees(); // Hook to load fee data into the store

  // State for teacher and student counts (can be fetched or from context)
  const [maleTeachers, setMaleTeachers] = useState(0);
  const [femaleTeachers, setFemaleTeachers] = useState(0);
  const [maleStudentsGlobal, setMaleStudentsGlobal] = useState(0); // Renamed for clarity
  const [femaleStudentsGlobal, setFemaleStudentsGlobal] = useState(0); // Renamed for clarity

  // Calculate total teachers and students
  const totalTeachers = maleTeachers + femaleTeachers;
  const totalStudentsGlobal = maleStudentsGlobal + femaleStudentsGlobal; // Renamed

  // Effect to load admin data and set up clock interval
  useEffect(() => {
    setAdminName(localStorage.getItem("adminName") || "Admin");
    setAdminImage(localStorage.getItem("adminImage") || "/profile-placeholder.png"); // Use placeholder if no image

    // Example: Load teacher/student counts from localStorage or context if available
    setMaleTeachers(Number(localStorage.getItem("maleTeachersCount")) || 10); // Example value
    setFemaleTeachers(Number(localStorage.getItem("femaleTeachersCount")) || 15); // Example value
    setMaleStudentsGlobal(Number(localStorage.getItem("maleStudentsCount")) || 120); // Example value
    setFemaleStudentsGlobal(Number(localStorage.getItem("femaleStudentsCount")) || 130); // Example value

    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  // Effect to set default selected class when student data is available
  useEffect(() => {
    if (studentData && Object.keys(studentData).length > 0 && !selectedClass) {
      setSelectedClass(Object.keys(studentData)[0]);
    }
  }, [studentData, selectedClass]);

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
              // You can format the value, e.g., to currency
              // The parsed value for a pie chart is the numerical value of the slice
              label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed);
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

  // Authentication check
  // Safely access the user property using optional chaining
  // Define the expected type for the auth object
  interface AuthContextType {
    user: { id: string; name: string; email: string } | null; // Adjust fields as per your actual user object
  }
  
  const auth = useAuth();
  const typedAuth = auth ? (auth as AuthContextType) : null; // Safely cast only if auth is not null
  const user = auth?.user; // Safely access the user property
  // const user = auth?.user;

  const router = useRouter();

  // Effect to redirect to login if user is not authenticated
  useEffect(() => {
    // Explicitly check if user is null or undefined
    if (user == null) {
      router.push('/login'); // Assuming your login route is /login
    }
  }, [user, router]);

  // Render nothing if user is not authenticated (router.push handles the redirect)
  if (user == null) return null;


  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header section */}
        <header className="flex h-16 items-center gap-2 border-b bg-white px-4 sticky top-0 z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-6" /> {/* Adjusted height */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Admin Overview</BreadcrumbPage> {/* More descriptive */}
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {/* You can add more header items here, like user profile dropdown */}
        </header>

        {/* Main content area */}
        <main className="flex-1 bg-slate-100 p-4 md:p-6 lg:p-8"> {/* Use main tag and responsive padding */}
          {/* Welcome & Clock Container */}
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2 flex items-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 p-6 shadow-lg text-white">
              {adminImage && (
                <Image
                  src={adminImage}
                  alt="Admin Profile"
                  width={64} // Increased size
                  height={64}
                  className="rounded-full object-cover mr-5 border-2 border-blue-300"
                  onError={(e) => (e.currentTarget.src = "/profile-placeholder.png")} // Fallback
                />
              )}
              <div>
                <p className="text-2xl font-semibold">Welcome, {adminName}!</p>
                <p className="text-blue-200 text-sm">Here&apos;s your school overview.</p>
              </div>
            </div>

            <div className="flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 p-6 shadow-lg text-white">
              <Image src="/clock.png" alt="Clock" width={40} height={40} className="mr-3" />
              <h2 className="font-semibold text-3xl">
                {currentTime.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true })}
              </h2>
            </div>
          </div>

          {/* Stats Grid Container */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
            <StatCard
              title="Teachers"
              bgColor="bg-green-500" // Kept original for consistency, but could use Tailwind gradients
              textColor="text-white"
              stats={[
                { icon: "/male_teacher.png", label: "Male", value: maleTeachers },
                { icon: "/female_teacher.png", label: "Female", value: femaleTeachers },
                { icon: "/all.png", label: "Total", value: totalTeachers },
              ]}
            />
            <StatCard
              title="Students"
              bgColor="bg-sky-500" // Changed for variety
              textColor="text-white"
              stats={[
                { icon: "/male_student.png", label: "Male", value: maleStudentsGlobal },
                { icon: "/female_student.png", label: "Female", value: femaleStudentsGlobal },
                { icon: "/all.png", label: "Total", value: totalStudentsGlobal },
              ]}
            />
            {/* Fee Payment Chart Container */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg"> {/* Increased padding */}
              {/* Pie chart title is now part of pieOptions */}
              <div style={{ height: "250px" }}> {/* Adjusted height for better display */}
                <Pie data={pieData} options={pieOptions} />
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
             {/* Bar chart title is now part of barChartOptions */}
            <div className="mb-4 flex flex-col sm:flex-row gap-2 items-center justify-between">
              {/* Title is handled by chart options */}
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

            <div className="w-full h-[350px] md:h-[400px]"> {/* Adjusted height for bar chart */}
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
        onError={(e) => (e.currentTarget.style.display = 'none')} // Hide if image fails
      />
      <p className="text-sm text-white/90 font-medium">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
