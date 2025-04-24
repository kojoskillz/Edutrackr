"use client";


import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation'
import { useStudent } from "@/context/StudentContext";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import useFeesStore, { useLoadFees } from "../dashboard/useFeesStore";
import Image from "next/image";
import { useEffect, useState } from "react";
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

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export default function Page() {
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [time, setTime] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState("");
  const { studentData } = useStudent();
  const { paidFees, unpaidFees } = useFeesStore();
  const [maleTeachers, setMaleTeachers] = useState(0);
  const [femaleTeachers, setFemaleTeachers] = useState(0);
  const [maleStudent, setMaleStudent] = useState(0);
  const [femaleStudent, setFemaleStudent] = useState(0);

  useLoadFees();

  const totalTeachers = maleTeachers + femaleTeachers;
  const totalStudent = maleStudent + femaleStudent;

  useEffect(() => {
    setName(localStorage.getItem("adminName") || "Admin Name");
    setImage(localStorage.getItem("adminImage") || "");
    setMaleTeachers(Number(localStorage.getItem("maleTeachers")) || 0);
    setFemaleTeachers(Number(localStorage.getItem("femaleTeachers")) || 0);
    setMaleStudent(Number(localStorage.getItem("maleStudent")) || 0);
    setFemaleStudent(Number(localStorage.getItem("femaleStudent")) || 0);

    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Set default selected class
    if (studentData && Object.keys(studentData).length > 0) {
      setSelectedClass(Object.keys(studentData)[0]);
    }
  }, [studentData]);

  // if (!studentData || Object.keys(studentData).length === 0)
  //   return <p>Loading student data...</p>;

  const barChartData = {
    labels: ["Male", "Female"],
    datasets: [
      {
        label: `Students in ${selectedClass}`,
        data: [
          studentData[selectedClass]?.male || 0,
          studentData[selectedClass]?.female || 0,
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

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  // authentication
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user])

  if (!user) return null

  return (
    <SidebarProvider>
      <AppSidebar />
      {/* <h1 className="text-2xl mb-4">Welcome, {user.username}</h1>
      <button onClick={logout} className="p-2 bg-red-500 text-white">
        Logout
      </button> */}
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Admin</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 bg-gray-300 flex-col gap-4 p-4">
          {/* Welcome & Clock */}
          <div className="flex gap-6">
            <div className="bg-yellow-300 w-[25rem] h-16 flex items-center justify-center text-black/70">
              {image && (
                <img
                  src={image}
                  alt="Profile"
                  className="rounded-full w-12 h-12 object-cover mr-4"
                />
              )}
              <p className="font-semibold text-xl">Welcome {name}!</p>
            </div>

            <div className="bg-purple-500 lg:w-[51rem] w-full h-16 flex items-center justify-center">
              <Image src="/clock.png" alt="Clock" width={40} height={40} />
              <h2 className="text-white font-semibold text-3xl ml-4">
                {time.toLocaleTimeString("en-US", { hour12: true })}
              </h2>
            </div>
          </div>

          {/* Grid Stats */}
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <StatCard
              title="Teachers"
              bgColor="bg-green-500"
              textColor="text-green-200"
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
              stats={[
                { icon: "/male_student.png", label: "Male", value: maleStudent },
                { icon: "/female_student.png", label: "Female", value: femaleStudent },
                { icon: "/all.png", label: "Total", value: totalStudent },
              ]}
            />
            <div className="bg-white aspect-video p-4">
              <h1 className="text-xl text-purple-900/40 font-semibold">Fee Payment</h1>
              <div style={{ width: "100%", height: "150px" }}>
                <Pie data={pieData} options={pieOptions} />
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white p-5 flex flex-col gap-4">
            <h1 className="text-3xl font-semibold text-black/70">
              Students Enrollment Per Class
            </h1>

            <div className="flex gap-2 items-center">
              <label className="font-medium text-lg">Select Class:</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="p-2 rounded bg-slate-100"
              >
                {Object.keys(studentData).map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-[500px]">
              <Bar
                data={barChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: "top" },
                    title: { display: true, text: `Students in ${selectedClass}` },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// StatCard with multiple Stat entries
function StatCard({
  title,
  bgColor,
  textColor,
  stats,
}: {
  title: string;
  bgColor: string;
  textColor: string;
  stats: { icon: string; label: string; value: number }[];
}) {
  return (
    <div className={`${bgColor} aspect-video p-4`}>
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
      <Image src={icon} alt={label} width={40} height={40} className="mx-auto" />
      <h2 className="text-sm text-white font-semibold">{label}</h2>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
