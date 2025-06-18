"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useStudent } from "@/context/StudentContext";
import useFeesStore from "../dashboard/useFeesStore";
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
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [adminName, setAdminName] = useState("");
  const [adminImage, setAdminImage] = useState<string | null>(null);
  const [schoolStats, setSchoolStats] = useState<SchoolStatistic | null>(null);
  const { studentData, setStudentData } = useStudent();
  const [currentClass, setCurrentClass] = useState("");
  const [newClassName, setNewClassName] = useState("");
  const { paidFees, unpaidFees, setPaidFees, setUnpaidFees } = useFeesStore();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Admin Profile - Updated to use current user's ID
  useEffect(() => {
    const fetchAdminProfile = async () => {
      setIsLoading(true);
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Not authenticated");

        const { data, error } = await supabase
          .from("admin_profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setAdminProfile(data);
          setAdminName(data.admin_name);
          setAdminImage(data.admin_image_url);
        } else {
          setAdminName(user.email || "");
        }
      } catch (error: any) {
        toast.error(`Error fetching admin profile: ${error.message}`);
        console.error("Error fetching admin profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdminProfile();
  }, []);

  // Fetch School Statistics
  useEffect(() => {
    const fetchSchoolStatistics = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("school_statistics")
          .select("*")
          .limit(1);

        if (error) throw error;

        if (data?.length) {
          setSchoolStats(data[0]);
          setPaidFees(data[0].paid_fees_percentage);
          setUnpaidFees(data[0].unpaid_fees_percentage);
        } else {
          setPaidFees(0);
          setUnpaidFees(0);
        }
      } catch (error: any) {
        toast.error(`Error fetching school statistics: ${error.message}`);
        console.error("Error fetching school statistics:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchoolStatistics();
  }, [setPaidFees, setUnpaidFees]);

  // Fetch Class Student Data
  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("classes_update")
          .select("class_name, male_students_count, female_students_count");

        if (error) throw error;

        if (data) {
          const fetchedStudentData: Record<string, { male: number; female: number }> = {};
          data.forEach((cls) => {
            fetchedStudentData[cls.class_name] = {
              male: cls.male_students_count,
              female: cls.female_students_count,
            };
          });
          setStudentData(fetchedStudentData);
          setCurrentClass(Object.keys(fetchedStudentData)[0] || "");
        }
      } catch (error: any) {
        toast.error(`Error fetching class data: ${error.message}`);
        console.error("Error fetching class data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClasses();
  }, [setStudentData]);

  // Handle Admin Image Upload with Supabase Storage
  const handleAdminImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Not authenticated");

      // Delete old image if exists
      if (adminImage) {
        const oldImagePath = adminImage.split('/').pop();
        await supabase.storage.from('admin-avatars').remove([oldImagePath || '']);
      }

      // Upload new image
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `admin-avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('admin-avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('admin-avatars')
        .getPublicUrl(filePath);

      setAdminImage(publicUrl);
      
    } catch (error: any) {
      toast.error(`Error uploading image: ${error.message}`);
      console.error("Error uploading image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Admin Profile Submission
  const handleSubmitAdminProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Not authenticated");

      const profileData = {
        admin_name: adminName,
        admin_image_url: adminImage,
        updated_at: new Date().toISOString(),
      };

      if (adminProfile) {
        // Update existing profile
        const { error } = await supabase
          .from("admin_profiles")
          .update(profileData)
          .eq("id", user.id);

        if (error) throw error;
        toast.success("Admin Profile updated successfully!");
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from("admin_profiles")
          .insert({
            id: user.id,
            ...profileData
          })
          .select()
          .single();

        if (error) throw error;
        setAdminProfile(data);
        toast.success("Admin Profile created successfully!");
      }
    } catch (error: any) {
      toast.error(`Error updating admin profile: ${error.message}`);
      console.error("Error updating admin profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

const handleSubmitSchoolStats = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  try {
    setIsLoading(true);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Add proper error handling for authentication
    if (authError || !user) {
      throw new Error("Not authenticated or user not found");
    }

    const updatedStats = {
      total_male_teachers: schoolStats?.total_male_teachers || 0,
      total_female_teachers: schoolStats?.total_female_teachers || 0,
      overall_male_students: schoolStats?.overall_male_students || 0,
      overall_female_students: schoolStats?.overall_female_students || 0,
      paid_fees_percentage: paidFees,
      unpaid_fees_percentage: unpaidFees,
      updated_at: new Date().toISOString(),
    };

    if (schoolStats) {
      const { error } = await supabase
        .from("school_statistics")
        .update(updatedStats)
        .eq("id", schoolStats.id);

      if (error) throw error;
      toast.success("School statistics updated successfully!");
    } else {
      // Ensure we have a valid user ID when creating new stats
      const { data, error } = await supabase
        .from("school_statistics")
        .insert({
          ...updatedStats,
          id: user.id // Or generate a new UUID if needed
        })
        .select()
        .single();

      if (error) throw error;
      setSchoolStats(data);
      toast.success("School statistics created successfully!");
    }
  } catch (error: any) {
    toast.error(`Error updating school statistics: ${error.message}`);
    console.error("Error updating school statistics:", error);
  } finally {
    setIsLoading(false);
  }
};

  // Class Management Functions
  const createClass = async () => {
    const trimmedClassName = newClassName.trim();
    if (!trimmedClassName) {
      toast.error("Class name cannot be empty!");
      return;
    }
    if (studentData[trimmedClassName]) {
      toast.error(`${trimmedClassName} already exists!`);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("classes_update")
        .insert({
          class_name: trimmedClassName,
          male_students_count: 0,
          female_students_count: 0,
        })
        .select()
        .single();

      if (error) throw error;

      setStudentData({
        ...studentData,
        [data.class_name]: { male: 0, female: 0 }
      });
      setCurrentClass(data.class_name);
      setNewClassName("");
      toast.success(`${data.class_name} created successfully!`);
    } catch (error: any) {
      toast.error(`Error creating class: ${error.message}`);
      console.error("Error creating class:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteClass = async (className: string) => {
    if (Object.keys(studentData).length <= 1) {
      toast.error("Cannot delete the last class!");
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from("classes_update")
        .delete()
        .eq("class_name", className);

      if (error) throw error;

      const updatedData = { ...studentData };
      delete updatedData[className];
      setStudentData(updatedData);
      setCurrentClass(Object.keys(updatedData)[0] || "");
      toast.success(`${className} has been deleted!`);
    } catch (error: any) {
      toast.error(`Error deleting class: ${error.message}`);
      console.error("Error deleting class:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateClassStudentCount = useCallback(
    async (gender: "male" | "female", value: number) => {
      const safeValue = Math.max(0, value);
      if (!currentClass) {
        toast.error("Please select a class first.");
        return;
      }

      try {
        setIsLoading(true);
        const { data: existingClass, error: fetchError } = await supabase
          .from("classes_update")
          .select("id")
          .eq("class_name", currentClass)
          .single();

        if (fetchError || !existingClass) throw fetchError || new Error("Class not found");

        const updateData = {
          [`${gender}_students_count`]: safeValue,
          updated_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
          .from("classes_update")
          .update(updateData)
          .eq("id", existingClass.id);

        if (updateError) throw updateError;

        setStudentData(prev => ({
          ...prev,
          [currentClass]: {
            ...prev[currentClass],
            [gender]: safeValue
          }
        }));
        toast.success(`Student count for ${currentClass} updated successfully!`);
      } catch (error: any) {
        toast.error(`Error updating student count: ${error.message}`);
        console.error("Error updating student count:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [currentClass, studentData, setStudentData]
  );

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
              Update Admin Info, students, teachers, attendance, fees on dashboard
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-4xl">
                {/* Admin Profile Section */}
                <div className="bg-white p-6 rounded-lg shadow-lg hover:scale-105 duration-300 flex flex-col">
                  <h2 className="text-xl font-semibold text-blue-600 mb-4 text-center">
                    {adminProfile ? "Update Admin Profile" : "Create Admin Profile"}
                  </h2>
                  <form onSubmit={handleSubmitAdminProfile} className="space-y-4 flex-grow flex flex-col justify-center">
                    <label className="block text-sm font-medium text-gray-700">
                      Admin Name:
                    </label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full p-2 bg-slate-100 border rounded-md"
                      required
                    />
                    
                    <label className="block text-sm font-medium text-gray-700">
                      Admin Image:
                    </label>
                    <input
                      type="file"
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
                      className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
                      disabled={!adminName.trim() || isLoading}
                    >
                      {adminProfile ? "Update Profile" : "Create Profile"}
                    </button>
                  </form>
                </div>

                {/* School Statistics Section */}
                <div className="bg-white p-6 rounded-lg shadow-lg hover:scale-105 duration-300 flex flex-col">
                  <h2 className="text-xl font-semibold text-blue-600 mb-4 text-center">
                    Update School Statistics
                  </h2>
                  <form onSubmit={handleSubmitSchoolStats} className="space-y-4 flex-grow flex flex-col justify-center">
                    {/* Teacher Counts */}
                    <div className="flex justify-between items-center gap-4">
                      <label className="font-medium">Male Teachers</label>
                      <input
                        type="number"
                        value={schoolStats?.total_male_teachers || 0}
                        onChange={(e) =>
                          setSchoolStats(prev => ({
                            ...(prev || {}),
                            total_male_teachers: Number(e.target.value)
                          }))
                        }
                        className="p-1 bg-slate-100 border rounded-md w-1/2"
                        min="0"
                      />
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <label className="font-medium">Female Teachers</label>
                      <input
                        type="number"
                        value={schoolStats?.total_female_teachers || 0}
                        onChange={(e) =>
                          setSchoolStats(prev => ({
                            ...(prev || {}),
                            total_female_teachers: Number(e.target.value)
                          }))
                        }
                        className="p-1 bg-slate-100 border rounded-md w-1/2"
                        min="0"
                      />
                    </div>

                    {/* Student Counts */}
                    <div className="flex justify-between items-center gap-4">
                      <label className="font-medium">Overall Male Students</label>
                      <input
                        type="number"
                        value={schoolStats?.overall_male_students || 0}
                        onChange={(e) =>
                          setSchoolStats(prev => ({
                            ...(prev || {}),
                            overall_male_students: Number(e.target.value)
                          }))
                        }
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
                          setSchoolStats(prev => ({
                            ...(prev || {}),
                            overall_female_students: Number(e.target.value)
                          }))
                        }
                        className="p-1 bg-slate-100 border rounded-md w-1/2"
                        min="0"
                      />
                    </div>

                    {/* Fees Percentage */}
                    <div className="flex justify-between items-center gap-4">
                      <label className="font-medium">Paid Fees (%)</label>
                      <input
                        type="number"
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
                        value={unpaidFees}
                        onChange={(e) => setUnpaidFees(Number(e.target.value))}
                        className="p-1 bg-slate-100 border rounded-md w-1/2"
                        min="0"
                        max="100"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      Save School Statistics
                    </button>
                  </form>
                </div>
              </div>

              {/* Class Management Section */}
              <div className="bg-white p-6 rounded-lg shadow-lg mt-6 w-full max-w-md mx-auto hover:scale-105 duration-300 flex flex-col">
                <h2 className="text-xl font-semibold text-blue-600 mb-4 text-center">
                  Manage Classes and Students
                </h2>
                <div className="flex-grow flex flex-col justify-center space-y-4">
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
                      className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:opacity-50"
                      disabled={!newClassName.trim() || isLoading}
                    >
                      Add Class
                    </button>
                  </div>

                  <label className="font-medium">Select Class:</label>
                  <select
                    value={currentClass}
                    onChange={(e) => setCurrentClass(e.target.value)}
                    className="w-full p-2 bg-slate-100 border rounded-md"
                    disabled={isLoading || Object.keys(studentData || {}).length === 0}
                  >
                    {Object.keys(studentData || {}).length === 0 ? (
                      <option value="" disabled>No classes available</option>
                    ) : (
                      Object.keys(studentData || {}).map((className) => (
                        <option key={className} value={className}>{className}</option>
                      ))
                    )}
                  </select>

                  {currentClass && studentData?.[currentClass] && (
                    <>
                      <label className="font-medium">Students in {currentClass}:</label>
                      <input
                        type="number"
                        value={studentData[currentClass].male || 0}
                        onChange={(e) => updateClassStudentCount("male", Number(e.target.value))}
                        className="w-full p-2 bg-slate-100 border rounded-md"
                        min="0"
                        disabled={isLoading}
                      />
                      <input
                        type="number"
                        value={studentData[currentClass].female || 0}
                        onChange={(e) => updateClassStudentCount("female", Number(e.target.value))}
                        className="w-full p-2 bg-slate-100 border rounded-md"
                        min="0"
                        disabled={isLoading}
                      />

                      <button
                        onClick={() => deleteClass(currentClass)}
                        className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 disabled:opacity-50"
                        disabled={isLoading || Object.keys(studentData || {}).length <= 1}
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
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
