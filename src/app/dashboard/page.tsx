"use client";

import * as React from "react";
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

// import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
// import EditIcon from "@mui/icons-material/Edit";
// import DeleteIcon from "@mui/icons-material/DeleteOutlined";
// import SaveIcon from "@mui/material/Save"; // Correct import path
// import CancelIcon from "@mui/material/Close"; // Corrected import path
// import VisibilityIcon from "@mui/icons-material/Visibility";
// SchoolIcon is not used in the general students page, removed for clarity
// import SchoolIcon from "@mui/icons-material/School"; // Icon for viewing students
// import Modal from "@mui/material/Modal";
// import Typography from "@mui/material/Typography";

import {
  // DataGrid,
  GridRowsProp,
  GridRowModesModel,
  GridRowModes,
  // GridColDef,
  // GridActionsCellItem,
  // GridEventListener,
  // GridRowId,
  // GridRowModel,
  // GridRowEditStopReasons,
  GridSlotProps,
  Toolbar,
  ToolbarButton,
} from "@mui/x-data-grid";

// import { DatePicker } from "@mui/x-date-pickers/DatePicker";
// import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
// import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
// import dayjs from "dayjs";
import { randomId } from "@mui/x-data-grid-generator";

// Import necessary hooks and components for the dashboard
import { useAuth } from "@/context/AuthContext"; // Import useAuth hook
import { useRouter } from 'next/navigation'; // Import useRouter hook
import { useStudent } from "@/context/StudentContext"; // Import useStudent hook
import { Bar, Pie } from "react-chartjs-2"; // Import chart components
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip, // Alias Tooltip to avoid conflict with MUI Tooltip
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import useFeesStore, { useLoadFees } from "../dashboard/useFeesStore"; // Assuming this path is correct
import Image from "next/image"; // Import Image component
import { useEffect, useState } from "react"; // Import useEffect and useState hooks


// Register Chart.js components
ChartJS.register(ArcElement, ChartTooltip, Legend, BarElement, CategoryScale, LinearScale);


// Define the type for a Student row (Note: This type is likely not needed in the Dashboard page itself,
// but keeping it here as it was in the original code. It's more relevant for student data tables).
type StudentRow = {
  id: string;
  name: string;
  dob: string; // ISO string
  age: number;
  class: string;
  gender?: string;
  image?: string; // DataURL
  isNew?: boolean;
};

// Helper function to calculate age from date of birth (Also likely not needed on Dashboard)
const calculateAge = (dob: string) => {
  const b = new Date(dob),
    today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age;
};

// Declare module for ToolbarPropsOverrides (This is for DataGrid, likely not needed on Dashboard)
declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides {
    setRows: React.Dispatch<React.SetStateAction<GridRowsProp>>;
    setRowModesModel: React.Dispatch<React.SetStateAction<GridRowModesModel>>;
  }
}

// Toolbar component for the DataGrid (This is for DataGrid, likely not needed on Dashboard)
function EditToolbar(props: GridSlotProps["toolbar"]) {
  const { setRows, setRowModesModel } = props;
  return (
    <Toolbar>
      <Tooltip title="Add Student">
        <ToolbarButton
          onClick={() => {
            const id = randomId();
            // Add a new empty row with a unique ID and the 'isNew' flag
            setRows((r) => [
              ...r,
              {
                id,
                name: "",
                dob: "",
                age: 0,
                class: "", // Class is empty by default in the general list
                gender: "Male",
                isNew: true,
              },
            ]);
            // Set the new row to edit mode and focus on the 'name' field
            setRowModesModel((m) => ({
              ...m,
              [id]: { mode: GridRowModes.Edit, fieldToFocus: "name" },
            }));
          }}
        >
          <AddIcon fontSize="small" />
        </ToolbarButton>
      </Tooltip>
    </Toolbar>
  );
}

// Main page component for the Dashboard
export default function Page() {
  // State variables for dashboard data
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [time, setTime] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState("");
  const { studentData } = useStudent();
  const { unpaidFees } = useFeesStore();
  const [maleTeachers, setMaleTeachers] = useState(0);
  const [femaleTeachers, setFemaleTeachers] = useState(0);
  const [maleStudent, setMaleStudent] = useState(0);
  const [femaleStudent, setFemaleStudent] = useState(0);

  // Load fees data
  useLoadFees();

  // Calculate total teachers and students
  const totalTeachers = maleTeachers + femaleTeachers;
  const totalStudent = maleStudent + femaleStudent;

  // Effect to load admin data and set up clock interval
  useEffect(() => {
    setName(localStorage.getItem("adminName") || "Admin Name");
    setImage(localStorage.getItem("adminImage") || "");
    setMaleTeachers(Number(localStorage.getItem("maleTeachers")) || 0);
    setFemaleTeachers(Number(localStorage.getItem("femaleTeachers")) || 0);
    setMaleStudent(Number(localStorage.getItem("maleStudent")) || 0);
    setFemaleStudent(Number(localStorage.getItem("femaleStudent")) || 0);

    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  // Effect to set default selected class when student data is available
  useEffect(() => {
    if (studentData && Object.keys(studentData).length > 0) {
      setSelectedClass(Object.keys(studentData)[0]);
    }
  }, [studentData]); // Dependency on studentData

  // Prepare data for the bar chart (Students Enrollment Per Class)
  const barChartData = {
    labels: ["Male", "Female"],
    datasets: [
      {
        label: `Students in ${selectedClass}`,
        data: [
          studentData?.[selectedClass]?.male || 0, // Use optional chaining for safety
          studentData?.[selectedClass]?.female || 0, // Use optional chaining for safety
        ],
        backgroundColor: ["#1E40AF", "#D946EF"],
        borderColor: ["#1E3A8A", "#9D174D"],
        borderWidth: 2,
        borderRadius: 12,
        hoverBackgroundColor: "#3B82F6",
        hoverBorderColor: "#2563EB",
      },
    ],
  };

  // Prepare data for the pie chart (Fee Payment)
  const pieData = {
    labels: ["Paid Fees", "Unpaid Fees"],
    datasets: [
      {
        data: [paidFees, unpaidFees],
        backgroundColor: ["#B9A4FFFF", "#7047ED"],
        borderWidth: 3,
      },
    ],
  };

  // Options for the pie chart
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  // authentication check
  const { user } = useAuth(); // Use the imported useAuth hook
  const router = useRouter(); // Use the imported useRouter hook

  // Effect to redirect to login if user is not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]); // Dependencies on user and router

  // Render nothing if user is not authenticated (router.push handles the redirect)
  if (!user) return null;


  return (
    // LocalizationProvider is needed for the DatePicker component (if used, but not on this Dashboard)
    // <LocalizationProvider dateAdapter={AdapterDayjs}>
    <SidebarProvider>
      <AppSidebar />
      {/* <h1 className="text-2xl mb-4">Welcome, {user.username}</h1>
       <button onClick={logout} className="p-2 bg-red-500 text-white">
         Logout
       </button> */}
      <SidebarInset>
        {/* Header section with sidebar trigger and breadcrumb */}
        <header className="flex h-16 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                {/* Updated href to point to the actual dashboard route */}
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Admin</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Main content area */}
        <div className="flex flex-1 bg-gray-300 flex-col gap-4 p-4">
          {/* Welcome & Clock Container - Added rounded-lg and shadow-md */}
          <div className="flex gap-10 rounded-lg">
            <div className="bg-yellow-300 w-[25rem] h-16 flex items-center justify-center text-black/70 rounded-lg"> {/* Apply rounded-l-lg here */}
              {image && (
                <img
                  src={image}
                  alt="Profile"
                  className="rounded-full w-12 h-12 object-cover mr-4"
                />
              )}
              <p className="font-semibold text-xl">Welcome {name}!</p>
            </div>

            <div className="bg-purple-500 lg:w-[51rem] w-full h-16 flex items-center justify-center rounded-lg"> {/* Apply rounded-r-lg here */}
              <Image src="/clock.png" alt="Clock" width={40} height={40} />
              <h2 className="text-white font-semibold text-3xl ml-4">
                {time.toLocaleTimeString("en-US", { hour12: true })}
              </h2>
            </div>
          </div>

          {/* Grid Stats Container - Added rounded-lg and shadow-md */}
          <div className="grid auto-rows-min gap-4 md:grid-cols-3 rounded-lg">
            <StatCard
              title="Teachers"
              bgColor="bg-green-500"
              textColor="text-green-200"
              // Allow overriding default rounded-lg with a specific borderRadius prop
              borderRadius="10px"
              stats={[
                { icon: "/male_teacher.png", label: "Male", value: maleTeachers },
                { icon: "/female_teacher.png", label: "Female", value: femaleTeachers },
                { icon: "/all.png", label: "Total", value: totalTeachers },
              ]}
            />
            <StatCard
              title="Students"
              bgColor="bg-blue-500"
              textColor="text-blue-200"
               // Allow overriding default rounded-lg with a specific borderRadius prop
              borderRadius="10px"
              stats={[
                { icon: "/male_student.png", label: "Male", value: maleStudent },
                { icon: "/female_student.png", label: "Female", value: femaleStudent },
                { icon: "/all.png", label: "Total", value: totalStudent },
              ]}
            />
            {/* Fee Payment Chart Container - Added rounded-lg and shadow-md */}
            <div className="bg-white aspect-video p-4 rounded-lg shadow-md">
              <h1 className="text-xl text-purple-900/40 font-semibold">Fee Payment</h1>
              <div style={{ width: "100%", height: "150px" }}>
                <Pie data={pieData} options={pieOptions} />
              </div>
            </div>
          </div>

          {/* Bar Chart Container - Added rounded-lg and shadow-md */}
          <div className="bg-white p-5 flex flex-col gap-4 rounded-lg shadow-md">
            <h1 className="text-3xl font-semibold text-black/70">
              Students Enrollment Per Class
            </h1>

            <div className="flex gap-2 items-center">
              <label className="font-medium text-lg">Select Class:</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="p-2 rounded bg-slate-100 border border-gray-300" // Added border
              >
                {/* Check if studentData is available before mapping */}
                {studentData && Object.keys(studentData).map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-[500px]"> {/* Adjusted width for better responsiveness */}
              <Bar
                data={barChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: "top" },
                    title: { display: true, text: `Students in ${selectedClass}` },
                  },
                   scales: { // Added scales for better chart axis control
                      y: {
                          beginAtZero: true,
                          precision: 0 // Ensure whole numbers for student count
                      }
                   }
                }}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
    // </LocalizationProvider> {/* LocalizationProvider is not needed here */}
  );
}

// StatCard with multiple Stat entries
function StatCard({
  title,
  bgColor,
  textColor,
  stats,
  borderRadius // Added borderRadius prop
}: {
  title: string;
  bgColor: string;
  textColor: string;
  stats: { icon: string; label: string; value: number }[];
  borderRadius?: string; // Define type for borderRadius prop
}) {
  return (
    // StatCard itself is a container, added rounded-lg and shadow-md here
    // Apply borderRadius style if provided, otherwise use rounded-lg class
    <div
      className={`${bgColor} aspect-video p-4 shadow-md ${borderRadius ? '' : 'rounded-lg'}`}
      style={{ borderRadius: borderRadius || undefined }} // Apply inline style if borderRadius prop is provided
    >
      <h1 className={`text-xl ${textColor} font-semibold mb-4`}>{title}</h1>
      <div className="flex justify-around">
        {stats.map((s) => (
          <Stat key={s.label} icon={s.icon} label={s.label} value={s.value} />
        ))}
      </div>
    </div>
  );
}

// Single Stat Item
function Stat({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="grid items-center text-center">
      {/* Using next/image component for icons */}
      <Image src={icon} alt={label} width={40} height={40} className="mx-auto" />
      <h2 className="text-sm text-white font-semibold">{label}</h2>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
