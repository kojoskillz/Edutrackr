"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useStudent } from "@/context/StudentContext";
import useFeesStore, { default as FeesState } from "../dashboard/useFeesStore";
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

interface StudentData {
  [className: string]: {
    male: number;
    female: number;
  };
}

export default function Page() {
  const [name, setName] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [maleTeachers, setMaleTeachers] = useState(0);
  const [femaleTeachers, setFemaleTeachers] = useState(0);
  const [maleStudent, setMaleStudent] = useState(0);
  const [femaleStudent, setFemaleStudent] = useState(0);
  const [paid, setPaid] = useState(70);
  const [unpaid, setUnpaid] = useState(30);

  const { paid: currentPaid, unpaid: currentUnpaid, updateFees } = useFeesStore(
    (state: typeof FeesState) => ({
      paid: state.paid,
      unpaid: state.unpaid,
      updateFees: state.updateFees,
    })
  );

  const { studentData, setStudentData } = useStudent();
  const [currentClass, setCurrentClass] = useState("Class A");
  const [newClassName, setNewClassName] = useState("");

  useEffect(() => {
    const savedStudentData = localStorage.getItem("studentData");
    if (savedStudentData) {
      try {
        const parsedData: StudentData = JSON.parse(savedStudentData);
        setStudentData(parsedData);
        const firstClass = Object.keys(parsedData)[0];
        setCurrentClass(firstClass || "Class A");
      } catch (error) {
        console.error("Failed to parse student data:", error);
        localStorage.removeItem("studentData");
        const defaultData = { "Class A": { male: 0, female: 0 } };
        setStudentData(defaultData);
        setCurrentClass("Class A");
      }
    } else {
      const defaultData = { "Class A": { male: 0, female: 0 } };
      setStudentData(defaultData);
      setCurrentClass("Class A");
    }
  }, [setStudentData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit1 = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    localStorage.setItem("adminName", name);
    localStorage.setItem("adminImage", image || "");
    toast.success("Admin Profile updated successfully", { position: "top-right" });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    localStorage.setItem("maleTeachers", maleTeachers.toString());
    localStorage.setItem("femaleTeachers", femaleTeachers.toString());
    toast.success("Teacher counts updated successfully", { position: "top-right" });
  };

  const handleSubmit2 = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    localStorage.setItem("maleStudent", maleStudent.toString());
    localStorage.setItem("femaleStudent", femaleStudent.toString());
    toast.success("Overall Student counts updated successfully", { position: "top-right" });
  };

  const handleUpdate = () => {
    updateFees(paid, unpaid);
    toast.success("Fees updated successfully!", { position: "top-right" });
  };

  const createClass = () => {
    if (newClassName.trim() === "" || studentData[newClassName]) {
      if (newClassName.trim() !== "") {
        toast.error(`${newClassName} already exists!`, { position: "top-right" });
      }
      return;
    }
    const updatedStudentData = {
      ...studentData,
      [newClassName]: { male: 0, female: 0 },
    };
    setStudentData(updatedStudentData);
    localStorage.setItem("studentData", JSON.stringify(updatedStudentData));
    setNewClassName("");
    toast.success(`${newClassName} created successfully!`, { position: "top-right" });
  };

  const deleteClass = (className: string) => {
    if (Object.keys(studentData).length <= 1) {
      toast.error("Cannot delete the last class!", { position: "top-right" });
      return;
    }
    const updatedData = { ...studentData };
    delete updatedData[className];
    setStudentData(updatedData);
    localStorage.setItem("studentData", JSON.stringify(updatedData));
    const remainingClasses = Object.keys(updatedData);
    setCurrentClass(remainingClasses[0]);
    toast.success(`${className} has been deleted!`, { position: "top-right" });
  };

  const updateData = (gender: "male" | "female", value: number) => {
    const safeValue = Math.max(0, value);
    const updatedData = {
      ...studentData,
      [currentClass]: {
        ...studentData[currentClass],
        [gender]: safeValue,
      },
    };
    setStudentData(updatedData);
    localStorage.setItem("studentData", JSON.stringify(updatedData));
  };

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-4xl">
            {/* Admin Profile */}
            <div className="bg-white p-6 rounded-lg shadow-lg hover:scale-105 duration-300">
              <h2 className="text-xl font-semibold text-blue-600 mb-4 text-center">
                Update Admin Profile
              </h2>
              <form onSubmit={handleSubmit1} className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-slate-100 border rounded-md"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full p-2 bg-slate-100 border rounded-md"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
                >
                  Update Profile
                </button>
              </form>
            </div>

            {/* Teacher Counts */}
            <div className="bg-white p-6 rounded-lg shadow-lg hover:scale-105 duration-300">
              <h2 className="text-xl font-semibold text-blue-600 mb-4 text-center">
                Update Teacher Counts
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-between items-center gap-4">
                  <label className="font-medium">Male Teachers</label>
                  <input
                    type="number"
                    value={maleTeachers}
                    onChange={(e) => setMaleTeachers(Number(e.target.value))}
                    className="p-1 bg-slate-100 border rounded-md w-1/2"
                  />
                </div>
                <div className="flex justify-between items-center gap-4">
                  <label className="font-medium">Female Teachers</label>
                  <input
                    type="number"
                    value={femaleTeachers}
                    onChange={(e) => setFemaleTeachers(Number(e.target.value))}
                    className="p-1 bg-slate-100 border rounded-md w-1/2"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
                >
                  Save Teacher Counts
                </button>
              </form>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 w-full max-w-4xl">
            {/* Overall Student Counts */}
            <div className="bg-white p-6 rounded-lg shadow-lg hover:scale-105 duration-300">
              <h2 className="text-xl font-semibold text-blue-600 mb-4 text-center">
                Update Overall Student Counts
              </h2>
              <form onSubmit={handleSubmit2} className="space-y-4">
                <div className="flex justify-between items-center gap-4">
                  <label className="font-medium">Male Students</label>
                  <input
                    type="number"
                    value={maleStudent}
                    onChange={(e) => setMaleStudent(Number(e.target.value))}
                    className="p-1 bg-slate-100 border rounded-md w-1/2"
                  />
                </div>
                <div className="flex justify-between items-center gap-4">
                  <label className="font-medium">Female Students</label>
                  <input
                    type="number"
                    value={femaleStudent}
                    onChange={(e) => setFemaleStudent(Number(e.target.value))}
                    className="p-1 bg-slate-100 border rounded-md w-1/2"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
                >
                  Save Overall Student Counts
                </button>
              </form>
            </div>

            {/* Fees */}
            <div className="bg-white p-6 rounded-lg shadow-lg hover:scale-105 duration-300">
              <h2 className="text-xl font-semibold text-blue-600 mb-4 text-center">
                Update Fees
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center gap-4">
                  <label className="font-medium">Paid Fees (%)</label>
                  <input
                    type="number"
                    value={paid}
                    onChange={(e) => setPaid(Number(e.target.value))}
                    className="p-1 bg-slate-100 border rounded-md w-1/2"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="flex justify-between items-center gap-4">
                  <label className="font-medium">Unpaid Fees (%)</label>
                  <input
                    type="number"
                    value={unpaid}
                    onChange={(e) => setUnpaid(Number(e.target.value))}
                    className="p-1 bg-slate-100 border rounded-md w-1/2"
                    min="0"
                    max="100"
                  />
                </div>
                <button
                  onClick={handleUpdate}
                  className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
                >
                  Update Fees
                </button>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
