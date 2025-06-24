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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [isLoading, setIsLoading] = useState({
    profile: false,
    stats: false,
    classes: false,
    classUpdate: false
  });

  // Fetch Admin Profile
  useEffect(() => {
    const fetchAdminProfile = async () => {
      setIsLoading(prev => ({...prev, profile: true}));
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
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        toast.error(`Error fetching admin profile: ${errorMessage}`);
        console.error("Error fetching admin profile:", error);
      } finally {
        setIsLoading(prev => ({...prev, profile: false}));
      }
    };
    fetchAdminProfile();
  }, []);

  // Fetch School Statistics
  useEffect(() => {
    const fetchSchoolStatistics = async () => {
      setIsLoading(prev => ({...prev, stats: true}));
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
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast.error(`Error fetching school statistics: ${errorMessage}`);
        console.error("Error fetching school statistics:", error);
      } finally {
        setIsLoading(prev => ({...prev, stats: false}));
      }
    };
    fetchSchoolStatistics();
  }, [setPaidFees, setUnpaidFees]);

  // Fetch Class Student Data
  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(prev => ({...prev, classes: true}));
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Not authenticated");

        const { data, error } = await supabase
          .from("classes_update")
          .select("*")
          .eq("created_by", user.id);

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
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast.error(`Error fetching class data: ${errorMessage}`);
        console.error("Error fetching class data:", error);
      } finally {
        setIsLoading(prev => ({...prev, classes: false}));
      }
    };
    fetchClasses();
  }, [setStudentData]);

  // Handle Admin Image Upload
  const handleAdminImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(prev => ({...prev, profile: true}));
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Not authenticated");

      if (adminImage) {
        const oldImagePath = adminImage.split('/').pop();
        await supabase.storage.from('admin-avatars').remove([oldImagePath || '']);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `admin-avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('admin-avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('admin-avatars')
        .getPublicUrl(filePath);

      setAdminImage(publicUrl);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(`Error uploading image: ${errorMessage}`);
      console.error("Error uploading image:", error);
    } finally {
      setIsLoading(prev => ({...prev, profile: false}));
    }
  };

  // Handle Admin Profile Submission
  const handleSubmitAdminProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsLoading(prev => ({...prev, profile: true}));
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Not authenticated");

      const profileData = {
        admin_name: adminName,
        admin_image_url: adminImage,
        updated_at: new Date().toISOString(),
      };

      if (adminProfile) {
        const { error } = await supabase
          .from("admin_profiles")
          .update(profileData)
          .eq("id", user.id);

        if (error) throw error;
        toast.success("Admin Profile updated successfully!");
      } else {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(`Error updating admin profile: ${errorMessage}`);
      console.error("Error updating admin profile:", error);
    } finally {
      setIsLoading(prev => ({...prev, profile: false}));
    }
  };

  const handleSubmitSchoolStats = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsLoading(prev => ({...prev, stats: true}));
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Not authenticated or user not found");

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
        const { data, error } = await supabase
          .from("school_statistics")
          .insert({
            ...updatedStats,
            id: user.id
          })
          .select()
          .single();

        if (error) throw error;
        setSchoolStats(data);
        toast.success("School statistics created successfully!");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(`Error updating school statistics: ${errorMessage}`);
      console.error("Error updating school statistics:", error);
    } finally {
      setIsLoading(prev => ({...prev, stats: false}));
    }
  };

  const createClass = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedClassName = newClassName.trim();
    if (!trimmedClassName) {
      toast.error("Class name cannot be empty!");
      return;
    }
    
    try {
      setIsLoading(prev => ({...prev, classes: true}));
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("classes_update")
        .insert({
          class_name: trimmedClassName,
          male_students_count: 0,
          female_students_count: 0,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setStudentData(prev => ({
        ...prev,
        [data.class_name]: { male: 0, female: 0 }
      }));
      setCurrentClass(data.class_name);
      setNewClassName("");
      toast.success(`Class "${data.class_name}" created!`);
      
    } catch (error) {
      console.error("Class creation error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(`Failed to create class: ${errorMessage}`);
    } finally {
      setIsLoading(prev => ({...prev, classes: false}));
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
        setIsLoading(prev => ({...prev, classUpdate: true}));
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
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast.error(`Error updating student count: ${errorMessage}`);
        console.error("Error updating student count:", error);
      } finally {
        setIsLoading(prev => ({...prev, classUpdate: false}));
      }
    },
    [currentClass, studentData, setStudentData]
  );

  async function deleteClass(className: string): Promise<void> {
    if (!className) {
      toast.error("No class selected to delete.");
      return;
    }

    if (Object.keys(studentData || {}).length <= 1) {
      toast.error("At least one class must remain.");
      return;
    }

    try {
      setIsLoading(prev => ({...prev, classes: true}));
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Not authenticated");

      const { data: classRecord, error: fetchError } = await supabase
        .from("classes_update")
        .select("id")
        .eq("class_name", className)
        .eq("created_by", user.id)
        .maybeSingle();

      if (fetchError || !classRecord) throw fetchError || new Error("Class not found");

      const { error: deleteError } = await supabase
        .from("classes_update")
        .delete()
        .eq("id", classRecord.id);

      if (deleteError) throw deleteError;

      setStudentData(prev => {
        const updated = { ...prev };
        delete updated[className];
        return updated;
      });

      const remainingClasses = Object.keys(studentData).filter(c => c !== className);
      setCurrentClass(remainingClasses[0] || "");

      toast.success(`Class "${className}" deleted successfully!`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(`Failed to delete class: ${errorMessage}`);
      console.error("Delete class error:", error);
    } finally {
      setIsLoading(prev => ({...prev, classes: false}));
    }
  }

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

        <div className="bg-background p-6 min-h-screen flex flex-col items-center">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold tracking-tight">
              School Management Dashboard
            </h1>
            <h2 className="text-lg text-muted-foreground">
              Update admin information, student statistics, and school data
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-6xl">
            {/* Admin Profile Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  {adminProfile ? "Admin Profile" : "Create Admin Profile"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading.profile ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <form onSubmit={handleSubmitAdminProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminName">Admin Name</Label>
                      <Input
                        id="adminName"
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="adminImage">Profile Image</Label>
                      <Input
                        id="adminImage"
                        type="file"
                        accept="image/*"
                        onChange={handleAdminImageChange}
                      />
                    </div>
                    
                    {adminImage && (
                      <div className="flex justify-center">
                        <Avatar className="w-24 h-24">
                          <AvatarImage src={adminImage} alt="Admin Preview" />
                          <AvatarFallback>{adminName.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                    
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!adminName.trim() || isLoading.profile}
                    >
                      {adminProfile ? "Update Profile" : "Create Profile"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* School Statistics Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  School Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading.stats ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <form onSubmit={handleSubmitSchoolStats} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Male Teachers</Label>
                        <Input
                          type="number"
                          value={schoolStats?.total_male_teachers || 0}
                          onChange={(e) =>
                            setSchoolStats(prev => prev ? {
                              ...prev,
                              total_male_teachers: Number(e.target.value)
                            } : null)
                          }
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Female Teachers</Label>
                        <Input
                          type="number"
                          value={schoolStats?.total_female_teachers || 0}
                          onChange={(e) =>
                            setSchoolStats(prev => prev ? {
                              ...prev,
                              total_female_teachers: Number(e.target.value)
                            } : null)
                          }
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Male Students</Label>
                        <Input
                          type="number"
                          value={schoolStats?.overall_male_students || 0}
                          onChange={(e) =>
                            setSchoolStats(prev => prev ? {
                              ...prev,
                              overall_male_students: Number(e.target.value)
                            } : null)
                          }
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Female Students</Label>
                        <Input
                          type="number"
                          value={schoolStats?.overall_female_students || 0}
                          onChange={(e) =>
                            setSchoolStats(prev => prev ? {
                              ...prev,
                              overall_female_students: Number(e.target.value)
                            } : null)
                          }
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Paid Fees (%)</Label>
                        <Input
                          type="number"
                          value={paidFees}
                          onChange={(e) => setPaidFees(Number(e.target.value))}
                          min="0"
                          max="100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unpaid Fees (%)</Label>
                        <Input
                          type="number"
                          value={unpaidFees}
                          onChange={(e) => setUnpaidFees(Number(e.target.value))}
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading.stats}
                    >
                      Save School Statistics
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Class Management Section */}
          <Card className="w-full max-w-6xl mt-6">
            <CardHeader>
              <CardTitle className="text-center">
                Class Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading.classes ? (
                <div className="space-y-6">
                  <Skeleton className="h-10 w-full" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  <form onSubmit={createClass} className="flex gap-2">
                    <Input
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="New Class Name"
                      className="flex-grow"
                    />
                    <Button
                      type="submit"
                      disabled={!newClassName.trim() || isLoading.classes}
                    >
                      Add Class
                    </Button>
                  </form>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Select Class</Label>
                      <select
                        aria-label="Select Class"
                        value={currentClass}
                        onChange={(e) => setCurrentClass(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isLoading.classes || Object.keys(studentData || {}).length === 0}
                      >
                        {Object.keys(studentData || {}).length === 0 ? (
                          <option value="" disabled>No classes available</option>
                        ) : (
                          Object.keys(studentData || {}).map((className) => (
                            <option key={className} value={className}>{className}</option>
                          ))
                        )}
                      </select>
                    </div>

                    {currentClass && studentData?.[currentClass] && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="destructive"
                            className="w-full"
                            disabled={isLoading.classes || Object.keys(studentData || {}).length <= 1}
                          >
                            Delete Selected Class
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-4">
                            <h4 className="font-medium leading-none">Confirm Deletion</h4>
                            <p className="text-sm text-muted-foreground">
                              Are you sure you want to delete {currentClass}? This action cannot be undone.
                            </p>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                deleteClass(currentClass);
                              }}
                              className="w-full"
                            >
                              Confirm Delete
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>

                  {currentClass && studentData?.[currentClass] && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-center">Male Students</CardTitle>
                          </CardHeader>
                          <CardContent className="flex flex-col items-center space-y-4">
                            {isLoading.classUpdate ? (
                              <Skeleton className="h-10 w-24" />
                            ) : (
                              <Input
                                type="number"
                                value={studentData[currentClass].male || 0}
                                onChange={(e) => 
                                  updateClassStudentCount("male", Math.max(0, Number(e.target.value)))
                                }
                                min="0"
                                className="text-center text-xl font-bold w-24"
                              />
                            )}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-center">Female Students</CardTitle>
                          </CardHeader>
                          <CardContent className="flex flex-col items-center space-y-4">
                            {isLoading.classUpdate ? (
                              <Skeleton className="h-10 w-24" />
                            ) : (
                              <Input
                                type="number"
                                value={studentData[currentClass].female || 0}
                                onChange={(e) => 
                                  updateClassStudentCount("female", Math.max(0, Number(e.target.value)))
                                }
                                min="0"
                                className="text-center text-xl font-bold w-24"
                              />
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-center">Class Summary: {currentClass}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-sm text-muted-foreground">Male Students</p>
                              <p className="text-2xl font-bold">{studentData[currentClass].male || 0}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Female Students</p>
                              <p className="text-2xl font-bold">{studentData[currentClass].female || 0}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total Students</p>
                              <p className="text-2xl font-bold">
                                {(studentData[currentClass].male || 0) + (studentData[currentClass].female || 0)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {Object.keys(studentData || {}).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No classes available. Add a new class above.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
