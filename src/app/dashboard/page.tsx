"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Image from "next/image";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from 'next/link';

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useStudent } from "@/context/StudentContext";
import useFeesStore from "../dashboard/useFeesStore";

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

import { Calendar } from "@/components/ui/calendar";
import { supabase } from "../Authentication-supabase/lib/supabase/supabaseClient";

// Register Chart.js components
ChartJS.register(ArcElement, ChartTooltip, Legend, BarElement, CategoryScale, LinearScale, ChartTitle);

interface StudentData {
  [className: string]: {
    male: number;
    female: number;
  };
}

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

interface CalendarEvent {
  id?: string;
  title: string;
  date: Date;
  description?: string;
}

const PROFILE_PLACEHOLDER_IMAGE = "/profile-placeholder.png";
const CLOCK_IMAGE = "/clock.png";
const MALE_TEACHER_IMAGE = "/male_teacher.png";
const FEMALE_TEACHER_IMAGE = "/female_teacher.png";
const MALE_STUDENT_IMAGE = "/male_student.png";
const FEMALE_STUDENT_IMAGE = "/female_student.png";
const ALL_IMAGE = "/all.png";

export default function Page() {
  const [adminName, setAdminName] = useState("Admin");
  const [adminImage, setAdminImage] = useState(PROFILE_PLACEHOLDER_IMAGE);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState("");
  const [maleTeachers, setMaleTeachers] = useState(0);
  const [femaleTeachers, setFemaleTeachers] = useState(0);
  const [maleStudentsGlobal, setMaleStudentsGlobal] = useState(0);
  const [femaleStudentsGlobal, setFemaleStudentsGlobal] = useState(0);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [newEvent, setNewEvent] = useState<Omit<CalendarEvent, 'id'>>({ 
    title: '', 
    date: new Date(), 
    description: '' 
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const { studentData, setStudentData } = useStudent();
  const { paidFees, unpaidFees, setPaidFees, setUnpaidFees } = useFeesStore();

  const totalTeachers = maleTeachers + femaleTeachers;
  const totalStudentsGlobal = maleStudentsGlobal + femaleStudentsGlobal;

  interface AuthContextType {
    user: { id: string; name: string; email: string } | null;
  }
  const auth = useAuth() as AuthContextType | null;
  const user = auth?.user;
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.push('../Authentication-supabase/login');
    }
  }, [user, router]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Admin Profile
  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const { data, error } = await supabase
          .from<"admin_profiles", SupabaseAdminProfile>("admin_profiles")
          .select("admin_name, admin_image_url")
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setAdminName(data.admin_name || "Admin");
          setAdminImage(data.admin_image_url || PROFILE_PLACEHOLDER_IMAGE);
        } else {
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

  // Fetch School Statistics
  useEffect(() => {
    const fetchSchoolStatistics = async () => {
      try {
        const { data, error } = await supabase
          .from("school_statistics")
          .select("*")
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
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
  }, [setPaidFees, setUnpaidFees]);

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
  }, [setStudentData]);

  // Fetch Calendar Events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('calendar_events')
          .select('*');

        if (error) {
          throw error;
        }

        if (data) {
          setEvents(data.map(event => ({
            ...event,
            date: new Date(event.date)
          })));
        }
      } catch (error) {
        console.error("Error fetching events:", error);
        toast.error("Failed to load calendar events");
      }
    };
    fetchEvents();
  }, []);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setNewEvent(prev => ({ ...prev, date }));
    setIsPopoverOpen(true);
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.date) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert([{
          title: newEvent.title,
          date: newEvent.date.toISOString(),
          description: newEvent.description || null
        }])
        .select();

      if (error) throw error;

      if (data) {
        const addedEvent = {
          ...data[0],
          date: new Date(data[0].date)
        };
        setEvents([...events, addedEvent]);
        setNewEvent({ title: '', date: new Date(), description: '' });
        setIsPopoverOpen(false);
        toast.success("Event added successfully!");
      }
    } catch (error) {
      console.error("Error adding event:", error);
      toast.error("Failed to add event");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setEvents(events.filter(event => event.id !== eventId));
      toast.success("Event deleted successfully!");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  const barChartData = {
    labels: ["Male", "Female"],
    datasets: [
      {
        label: `Students in ${selectedClass || "Selected Class"}`,
        data: [
          studentData?.[selectedClass]?.male || 0,
          studentData?.[selectedClass]?.female || 0,
        ],
        backgroundColor: ["#3B82F6", "#EC4899"],
        borderColor: ["#2563EB", "#DB2777"],
        borderWidth: 1,
        borderRadius: 8,
        barThickness: 100,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: {
            size: 14,
            family: "Inter, sans-serif",
          },
          color: '#4B5563',
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
        color: '#1F2937',
        padding: {
          top: 10,
          bottom: 20,
        }
      },
      tooltip: {
        backgroundColor: '#FFFFFF',
        titleColor: '#1F2937',
        bodyColor: '#4B5563',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 6,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: '#4B5563',
          font: {
            family: "Inter, sans-serif",
          }
        },
        grid: {
          color: '#E5E7EB',
        },
      },
      x: {
        ticks: {
          color: '#4B5563',
          font: {
            family: "Inter, sans-serif",
          }
        },
        grid: {
          display: false,
        },
      },
    },
  };

  const pieData = {
    labels: ["Paid Fees", "Unpaid Fees"],
    datasets: [
      {
        data: [paidFees, unpaidFees],
        backgroundColor: ["#10B981", "#EF4444"],
        borderColor: ["#FFFFFF", "#FFFFFF"],
        borderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

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
          color: '#4B5563',
          boxWidth: 15,
          padding: 20,
        },
      },
      title: {
        display: true,
        text: 'Fee Payment Status',
        font: {
          size: 16,
          weight: 'bold' as const,
          family: "Inter, sans-serif",
        },
        color: '#1F2937',
        padding: {
          top: 10,
          bottom: 10,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'pie'>) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
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

  if (user === null) return null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 border-b bg-white px-4 sticky top-0 z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-6" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
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
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
              <div style={{ height: "250px" }}>
                <Pie data={pieData} options={pieOptions} />
              </div>
            </div>
          </div>

          {/* Calendar and Bar Chart Container */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Bar Chart Section */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg lg:col-span-2">
              <div className="mb-4 flex flex-col sm:flex-row gap-2 items-center justify-between">
                <div></div>
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

            {/* Calendar Section */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">School Calendar</h2>
              
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <div>
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(date) => {
                        if (date) {
                          setDate(date);
                          handleDateClick(date);
                        }
                      }}
                      className="rounded-md border mb-4"
                      modifiers={{
                        hasEvent: events.map(event => event.date),
                      }}
                      modifiersStyles={{
                        hasEvent: {
                          border: '2px solid #3B82F6',
                          borderRadius: '4px',
                        }
                      }}
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-full p-4" align="start" side="bottom">
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Add Event</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                        <Input
                          placeholder="Enter event title"
                          value={newEvent.title}
                          onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <div className="flex items-center gap-2 p-2 border rounded-md">
                          <CalendarIcon className="h-4 w-4 opacity-70" />
                          <span className="text-sm">
                            {selectedDate?.toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                        <Textarea
                          placeholder="Enter event description"
                          value={newEvent.description || ''}
                          onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => setIsPopoverOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddEvent}>
                        Save Event
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Event List */}
              <div className="mt-4">
                <h3 className="font-medium text-gray-700 mb-2">Upcoming Events</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {events.length > 0 ? (
                    events
                      .sort((a, b) => a.date.getTime() - b.date.getTime())
                      .map((event, index) => (
                        <div key={index} className="p-3 border rounded-md hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-blue-600">{event.title}</div>
                              <div className="text-sm text-gray-500 mt-1">
                                {event.date.toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              {event.description && (
                                <div className="text-sm text-gray-600 mt-1">{event.description}</div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => event.id && handleDeleteEvent(event.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-gray-500 text-sm p-2">No upcoming events</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

interface StatCardProps {
  title: string;
  bgColor: string;
  textColor: string;
  stats: { icon: string; label: string; value: number }[];
  borderRadius?: string;
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
