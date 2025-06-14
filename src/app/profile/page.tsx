"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useStudent } from "@/context/StudentContext"; // Assuming this context exists
import useFeesStore from "../dashboard/useFeesStore"; // Assuming this store exists
import { supabase } from '../Authentication-supabase/lib/supabase/supabaseClient'; 

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

// Define interfaces for your Supabase tables
interface ClassUpdate {
  id: string;
  class_name: string;
  male_students_count: number;
  female_students_count: number;
  created_at: string;
  updated_at: string;
}

interface SchoolStatistic {
  id: string;
  total_male_teachers: number;
  total_female_teachers: number;
  overall_male_students: number;
  overall_female_students: number;
  paid_fees_percentage: number;
  unpaid_fees_percentage: number;
  updated_at: string;
}

interface AdminProfile {
  id: string;
  admin_name: string;
  admin_image_url: string | null;
  updated_at: string;
}

export default function Page() {
  // State for Admin Profile
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [adminName, setAdminName] = useState("");
  const [adminImage, setAdminImage] = useState<string | null>(null);

  // State for School Statistics
  const [schoolStats, setSchoolStats] = useState<SchoolStatistic | null>(null);

  // Class-specific student data from context
  const { studentData, setStudentData } = useStudent(); // studentData will be StudentData
  const [currentClass, setCurrentClass] = useState(""); // Default to empty, will be set from fetched data
  const [newClassName, setNewClassName] = useState(""); // State for adding a new class name

  // Fees data from Zustand store
  const { paidFees, unpaidFees, setPaidFees, setUnpaidFees } = useFeesStore();

  // --- Data Fetching Effects ---

  // Fetch Admin Profile
  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        // Assuming there's only one admin profile, or you're fetching a specific one (e.g., by ID 'auth.uid()')
        // For simplicity, let's fetch the first one if multiple exist.
        const { data, error } = await supabase
          .from("admin_profiles")
          .select("*")
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const profile = data[0];
          setAdminProfile(profile);
          setAdminName(profile.admin_name);
          setAdminImage(profile.admin_image_url);
        } else {
          // If no admin profile exists, initialize a default one or leave fields blank
          setAdminName("");
          setAdminImage(null);
        }
      } catch (error: any) {
        toast.error(`Error fetching admin profile: ${error.message}`, {
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
        // Assuming there's only one row for school statistics
        const { data, error } = await supabase
          .from("school_statistics")
          .select("*")
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const stats = data[0];
          setSchoolStats(stats);
          // Set individual states for inputs for easier binding
          // These individual states are now redundant if schoolStats is used directly in inputs
          // However, for update handlers, it might be easier to use them for now.
          // In a more robust system, consider if inputs directly bind to `schoolStats` and update a temp object.
          // For now, mapping fetched data to existing individual states:
          // setMaleTeachers(stats.total_male_teachers);
          // setFemaleTeachers(stats.total_female_teachers);
          // setMaleStudent(stats.overall_male_students);
          // setFemaleStudent(stats.overall_female_students);
          setPaidFees(stats.paid_fees_percentage);
          setUnpaidFees(stats.unpaid_fees_percentage);
        } else {
          // If no stats entry, initialize with defaults (or leave states as 0)
          setPaidFees(0);
          setUnpaidFees(0);
        }
      } catch (error: any) {
        toast.error(`Error fetching school statistics: ${error.message}`, {
          position: "top-right",
        });
        console.error("Error fetching school statistics:", error);
      }
    };
    fetchSchoolStatistics();
  }, [setPaidFees, setUnpaidFees]); // Include setters for fees store as dependencies

  // Fetch Class Student Data
  // This effect will run on component mount and whenever setStudentData is stable.
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const { data, error } = await supabase
          .from("classes_update")
          .select("class_name, male_students_count, female_students_count");

        if (error) throw error;

        if (data) {
          const fetchedStudentData: {
            [className: string]: { male: number; female: number };
          } = {};
          data.forEach((cls) => {
            fetchedStudentData[cls.class_name] = {
              male: cls.male_students_count,
              female: cls.female_students_count,
            };
          });
          setStudentData(fetchedStudentData);

          // Set current class to the first one fetched, or default
          const firstClass = Object.keys(fetchedStudentData)[0];
          if (firstClass) {
            setCurrentClass(firstClass);
          } else {
            // If no classes exist, set a default "Class A" if desired
            // Or leave currentClass empty and prompt user to create one
            setCurrentClass("");
          }
        }
      } catch (error: any) {
        toast.error(`Error fetching class data: ${error.message}`, {
          position: "top-right",
        });
        console.error("Error fetching class data:", error);
      }
    };

    fetchClasses();
  }, [setStudentData]); // Dependency array includes setStudentData

  // --- Handlers for Supabase Operations ---

  // Admin Profile Handlers
  const handleAdminImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setAdminImage(reader.result as string);
    };
    if (file) reader.readAsDataURL(file);
  };

  const handleSubmitAdminProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (adminProfile) {
        // Update existing profile
        const { error } = await supabase
          .from("admin_profiles")
          .update({
            admin_name: adminName,
            admin_image_url: adminImage,
            updated_at: new Date().toISOString(),
          })
          .eq("id", adminProfile.id); // Update by ID

        if (error) throw error;
        toast.success("Admin Profile updated successfully!", {
          position: "top-right",
        });
      } else {
        // Insert new profile if none exists
        const { data, error } = await supabase.from("admin_profiles").insert({
          admin_name: adminName,
          admin_image_url: adminImage,
        }).select(); // Select the newly inserted data to get the ID

        if (error) throw error;
        if (data && data.length > 0) {
          setAdminProfile(data[0]); // Save the newly created profile data
          toast.success("Admin Profile created successfully!", {
            position: "top-right",
          });
        }
      }
    } catch (error: any) {
      toast.error(`Error updating admin profile: ${error.message}`, {
        position: "top-right",
      });
      console.error("Error updating admin profile:", error);
    }
  };

  // School Statistics Handlers (Teachers and Overall Students)
  const handleSubmitSchoolStats = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // Get values from the inputs, which are bound to schoolStats state or temporary states if preferred
      // For now, let's derive from current state of schoolStats or fallback to 0
      const maleTeachers = schoolStats?.total_male_teachers || 0;
      const femaleTeachers = schoolStats?.total_female_teachers || 0;
      const maleStudents = schoolStats?.overall_male_students || 0;
      const femaleStudents = schoolStats?.overall_female_students || 0;

      const updatedStats = {
        total_male_teachers: maleTeachers,
        total_female_teachers: femaleTeachers,
        overall_male_students: maleStudents,
        overall_female_students: femaleStudents,
        paid_fees_percentage: paidFees, // Use values from useFeesStore
        unpaid_fees_percentage: unpaidFees, // Use values from useFeesStore
        updated_at: new Date().toISOString(),
      };

      if (schoolStats) {
        // Update existing row
        const { error } = await supabase
          .from("school_statistics")
          .update(updatedStats)
          .eq("id", schoolStats.id);

        if (error) throw error;
        toast.success("School statistics updated successfully!", {
          position: "top-right",
        });
      } else {
        // Insert new row (first time)
        const { data, error } = await supabase
          .from("school_statistics")
          .insert(updatedStats)
          .select();

        if (error) throw error;
        if (data && data.length > 0) {
          setSchoolStats(data[0]); // Store the newly created stats
          toast.success("School statistics created successfully!", {
            position: "top-right",
          });
        }
      }
    } catch (error: any) {
      toast.error(`Error updating school statistics: ${error.message}`, {
        position: "top-right",
      });
      console.error("Error updating school statistics:", error);
    }
  };

  // Fees Update Handler (now part of handleSubmitSchoolStats)
  // Re-evaluating this: Since paidFees and unpaidFees are from useFeesStore,
  // and the table `school_statistics` holds these values, the `handleSubmitSchoolStats`
  // should ideally cover updating these too. The button `Update Fees` can trigger that same submit.
  const handleUpdateFeesClick = () => {
    handleSubmitSchoolStats(
      new Event("submit") as unknown as React.FormEvent<HTMLFormElement>
    ); // Manually trigger the submit form for stats
  };

  // Class Management Handlers
  const createClass = async () => {
    const trimmedClassName = newClassName.trim();
    if (trimmedClassName === "") {
      toast.error("Class name cannot be empty!", { position: "top-right" });
      return;
    }
    if (studentData[trimmedClassName]) {
      toast.error(`${trimmedClassName} already exists!`, {
        position: "top-right",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("classes_update")
        .insert({
          class_name: trimmedClassName,
          male_students_count: 0,
          female_students_count: 0,
        })
        .select(); // Select to get the full inserted row (including id, created_at, updated_at)

      if (error) throw error;

      if (data && data.length > 0) {
        const newClass = data[0];
        const updatedStudentData = {
          ...studentData,
          [newClass.class_name]: {
            male: newClass.male_students_count,
            female: newClass.female_students_count,
          },
        };
        setStudentData(updatedStudentData);
        setCurrentClass(newClass.class_name); // Automatically select the new class
        setNewClassName("");
        toast.success(`${newClass.class_name} created successfully!`, {
          position: "top-right",
        });
      }
    } catch (error: any) {
      toast.error(`Error creating class: ${error.message}`, {
        position: "top-right",
      });
      console.error("Error creating class:", error);
    }
  };

  const deleteClass = async (className: string) => {
    if (Object.keys(studentData).length <= 1) {
      toast.error("Cannot delete the last class!", { position: "top-right" });
      return;
    }

    try {
      const { error } = await supabase
        .from("classes_update")
        .delete()
        .eq("class_name", className); // Delete by class_name

      if (error) throw error;

      const updatedData = { ...studentData };
      delete updatedData[className];
      setStudentData(updatedData);

      // Set current class to the first remaining class after deletion
      const remainingClasses = Object.keys(updatedData);
      if (remainingClasses.length > 0) {
        setCurrentClass(remainingClasses[0]);
      } else {
        setCurrentClass(""); // No classes left
      }
      toast.success(`${className} has been deleted!`, {
        position: "top-right",
      });
    } catch (error: any) {
      toast.error(`Error deleting class: ${error.message}`, {
        position: "top-right",
      });
      console.error("Error deleting class:", error);
    }
  };

  // Handler for updating male/female student counts for the currently selected class
  // This needs to fetch the specific class's ID to update it.
  const updateClassStudentCount = useCallback(
    async (gender: "male" | "female", value: number) => {
      const safeValue = Math.max(0, value);
      if (!currentClass) {
        toast.error("Please select a class first.", { position: "top-right" });
        return;
      }

      try {
        // Fetch the ID of the current class based on its name
        const { data: existingClass, error: fetchError } = await supabase
          .from("classes_update")
          .select("id, male_students_count, female_students_count")
          .eq("class_name", currentClass)
          .single(); // Use single() to expect one result

        if (fetchError) throw fetchError;
        if (!existingClass) {
          toast.error(`Class "${currentClass}" not found.`, {
            position: "top-right",
          });
          return;
        }

        const updateData: {
          male_students_count?: number;
          female_students_count?: number;
          updated_at: string;
        } = { updated_at: new Date().toISOString() };

        if (gender === "male") {
          updateData.male_students_count = safeValue;
        } else {
          updateData.female_students_count = safeValue;
        }

        const { error: updateError } = await supabase
          .from("classes_update")
          .update(updateData)
          .eq("id", existingClass.id); // Update by the fetched ID

        if (updateError) throw updateError;

        // Optimistically update local state after successful Supabase update
        const updatedStudentData = { ...studentData };
        if (updatedStudentData[currentClass]) {
          updatedStudentData[currentClass] = {
            ...updatedStudentData[currentClass],
            [gender]: safeValue,
          };
          setStudentData(updatedStudentData);
        }
        toast.success(
          `Student count for ${currentClass} updated successfully!`,
          { position: "top-right" }
        );
      } catch (error: any) {
        toast.error(`Error updating student count: ${error.message}`, {
          position: "top-right",
        });
        console.error("Error updating student count:", error);
      }
    },
    [currentClass, studentData, setStudentData]
  ); // Dependencies for useCallback

  return (
    <SidebarProvider>
      <AppSidebar />
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
                <BreadcrumbPage>Profile</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="bg-gray-50 p-6 min-h-screen flex flex-col items-center">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-semibold text-red-400 p-2">
              Update Form On Dashboard
            </h1>
            <h2 className="text-xl text-black/60 p-2 font-semibold">
              Update Admin Info, students, teachers, attendance, fees on
              dashboard
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-4xl">
            {/* Update Admin Profile */}
            <div className="bg-white p-6 rounded-lg shadow-lg hover:scale-105 duration-300 flex flex-col">
              <h2 className="text-xl font-semibold text-blue-600 mb-4 text-center">
                Update Admin Profile
              </h2>
              <form
                onSubmit={handleSubmitAdminProfile}
                className="space-y-4 flex-grow flex flex-col justify-center"
              >
                <label
                  htmlFor="adminName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Admin Name:
                </label>
                <input
                  title="Admin Name"
                  placeholder="Enter admin name"
                  type="text"
                  id="adminName"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full p-2 bg-slate-100 border rounded-md"
                />
                <label
                  htmlFor="adminImage"
                  className="block text-sm font-medium text-gray-700"
                >
                  Admin Image:
                </label>
                <input
                  type="file"
                  id="adminImage"
                  accept="image/*"
                  onChange={handleAdminImageChange}
                  className="w-full p-2 bg-slate-100 border rounded-md"
                />
                {adminImage && (
                  <div className="mt-2 text-center">
                    <img
                      src={adminImage}
                      alt="Admin Preview"
                      className="mt-2 w-24 h-24 object-cover rounded-full inline-block"
                    />
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
                >
                  Update Profile
                </button>
              </form>
            </div>

            {/* Update Teacher Counts and Overall Student Counts (Combined into School Statistics) */}
            <div className="bg-white p-6 rounded-lg shadow-lg hover:scale-105 duration-300 flex flex-col">
              <h2 className="text-xl font-semibold text-blue-600 mb-4 text-center">
                Update School Statistics
              </h2>
              <form
                onSubmit={handleSubmitSchoolStats}
                className="space-y-4 flex-grow flex flex-col justify-center"
              >
                {/* Teacher Counts */}
                <div className="flex justify-between items-center gap-4">
                  <label className="font-medium">Male Teachers</label>
                  <input
                    type="number"
                    value={schoolStats?.total_male_teachers || 0}
                    onChange={(e) =>
                      setSchoolStats((prev) =>
                        prev
                          ? { ...prev, total_male_teachers: Number(e.target.value) }
                          : null
                      )
                    }
                    className="p-1 bg-slate-100 border rounded-md w-1/2"
                    min="0"
                    title="Male Teachers"
                    placeholder="Enter number of male teachers"
                  />
                </div>
                <div className="flex justify-between items-center gap-4">
                  <label className="font-medium">Female Teachers</label>
                  <input
                    type="number"
                    value={schoolStats?.total_female_teachers || 0}
                    onChange={(e) =>
                      setSchoolStats((prev) =>
                        prev
                          ? { ...prev, total_female_teachers: Number(e.target.value) }
                          : null
                      )
                    }
                    className="p-1 bg-slate-100 border rounded-md w-1/2"
                    min="0"
                    title="Female Teachers"
                    placeholder="Enter number of female teachers"
                  />
                </div>

                {/* Overall Student Counts */}
                <div className="flex justify-between items-center gap-4">
                  <label className="font-medium">Overall Male Students</label>
                  <input
                    type="number"
                    value={schoolStats?.overall_male_students || 0}
                    onChange={(e) =>
                      setSchoolStats((prev) =>
                        prev
                          ? { ...prev, overall_male_students: Number(e.target.value) }
                          : null
                      )
                    }
                    title="Overall Male Students"
                    placeholder="Enter overall male students"
                    className="p-1 bg-slate-100 border rounded-md w-1/2"
                    min="0"
                  />
                </div>
                <div className="flex justify-between items-center gap-4">
                  <label className="font-medium">Overall Female Students</label>
                  <input
                    type="number"
                    value={schoolStats?.overall_female_students || 0}
                    onChange={(e) =>
                      setSchoolStats((prev) =>
                        prev
                          ? {
                              ...prev,
                              overall_female_students: Number(e.target.value),
                            }
                          : null
                      )
                    }
                    title="Overall Female Students"
                    placeholder="Enter overall female students"
                    className="p-1 bg-slate-100 border rounded-md w-1/2"
                    min="0"
                  />
                </div>

                {/* Fees Percentage */}
                <div className="flex justify-between items-center gap-4">
                  <label className="font-medium">Paid Fees (%)</label>
                  <input
                    type="number"
                    title="Paid Fees"
                    placeholder="Paid Fees"
                    value={paidFees}
                    onChange={(e) => setPaidFees(Number(e.target.value))}
                    className="p-1 bg-slate-100 border rounded-md w-1/2"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="flex justify-between items-center gap-4">
                  <label className="font-medium">Unpaid Fees (%)</label>
                  <input
                    type="number"
                    title="Unpaid Fees"
                    placeholder="Unpaid Fees"
                    value={unpaidFees}
                    onChange={(e) => setUnpaidFees(Number(e.target.value))}
                    className="p-1 bg-slate-100 border rounded-md w-1/2"
                    min="0"
                    max="100"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
                >
                  Save School Statistics
                </button>
              </form>
            </div>
          </div>

          {/* Create or Delete Class and Update Class-Specific Student Counts */}
          <div className="bg-white p-6 rounded-lg shadow-lg mt-6 w-full max-w-md mx-auto hover:scale-105 duration-300 flex flex-col">
            <h2 className="text-xl font-semibold text-blue-600 mb-4 text-center">
              Manage Classes and Students
            </h2>
            <div className="flex-grow flex flex-col justify-center space-y-4">
              {/* Input and button for creating a new class */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="New Class Name"
                  className="flex-grow p-2 bg-slate-100 border rounded-md"
                />
                <button
                  onClick={createClass}
                  className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
                >
                  Add Class
                </button>
              </div>

              {/* Dropdown to select the current class */}
              <label className="font-medium">Select Class:</label>
              <select
                title="Select Class"
                value={currentClass}
                onChange={(e) => setCurrentClass(e.target.value)}
                className="w-full p-2 bg-slate-100 border rounded-md"
              >
                {Object.keys(studentData || {}).length === 0 ? (
                  <option value="" disabled>
                    No classes available
                  </option>
                ) : (
                  Object.keys(studentData || {}).map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))
                )}
              </select>

              {currentClass && studentData && studentData[currentClass] && (
                <>
                  <label className="font-medium">
                    Students in {currentClass}:
                  </label>
                  <input
                    type="number"
                    value={studentData[currentClass]?.male || 0}
                    onChange={(e) =>
                      updateClassStudentCount("male", Number(e.target.value))
                    }
                    className="w-full p-2 bg-slate-100 border rounded-md"
                    title="Male Students in selected class"
                    placeholder="Male Students"
                    min="0"
                  />
                  <input
                    type="number"
                    value={studentData[currentClass]?.female || 0}
                    onChange={(e) =>
                      updateClassStudentCount("female", Number(e.target.value))
                    }
                    className="w-full p-2 bg-slate-100 border rounded-md"
                    placeholder="Female Students"
                    min="0"
                  />

                  <button
                    onClick={() => deleteClass(currentClass)}
                    className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600"
                  >
                    Delete Selected Class ({currentClass})
                  </button>
                </>
              )}
              {Object.keys(studentData || {}).length === 0 && (
                <p className="text-center text-gray-500">
                  No classes available. Add a new class above.
                </p>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
