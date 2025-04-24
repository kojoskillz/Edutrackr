"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useStudent } from "@/context/StudentContext";
import useFeesStore from "../dashboard/useFeesStore";
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

export default function Page() {
  const [name, setName] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [maleTeachers, setMaleTeachers] = useState(0);
  const [femaleTeachers, setFemaleTeachers] = useState(0);
  const [maleStudent, setMaleStudent] = useState(0);
  const [femaleStudent, setFemaleStudent] = useState(0);
  const [paid, setPaid] = useState(70);
  const [unpaid, setUnpaid] = useState(30);
  const router = useRouter();
  const { updateFees } = useFeesStore();
  const { studentData, setStudentData } = useStudent();
  const [currentClass, setCurrentClass] = useState("Class A");
  const [newClassName, setNewClassName] = useState("");

  useEffect(() => {
    const savedStudentData = localStorage.getItem("studentData");
    if (savedStudentData) {
      setStudentData(JSON.parse(savedStudentData));
    }
  }, []);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    if (file) reader.readAsDataURL(file);
  };

  const handleSubmit1 = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    localStorage.setItem("adminName", name);
    localStorage.setItem("adminImage", image || "");
    toast.success("Profile updated successfully", { position: "top-right" });
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
    toast.success("Student counts updated successfully", { position: "top-right" });
  };

  const handleUpdate = () => {
    updateFees(paid, unpaid);
    toast.success("Fees updated successfully!", { position: "top-right" });
  };

  const createClass = () => {
    if (newClassName.trim() === "" || studentData[newClassName]) return;
    const updatedStudentData = {
      ...studentData,
      [newClassName]: { male: 0, female: 0 },
    };
    setStudentData(updatedStudentData);
    localStorage.setItem("studentData", JSON.stringify(updatedStudentData));
    setNewClassName("");
  };

  const deleteClass = (className: string) => {
    const updatedData = { ...studentData };
    delete updatedData[className];
    setStudentData(updatedData);
    localStorage.setItem("studentData", JSON.stringify(updatedData));
    toast.success(`${className} has been deleted!`, { position: "top-right" });
  };

  const updateData = (gender: "male" | "female", value: number) => {
    const updatedData = { ...studentData };
    updatedData[currentClass] = {
      ...updatedData[currentClass],
      [gender]: value,
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

        <div className="bg-gray-50 p-6 min-h-screen">
          <div>
            <h1 className="text-4xl font-semibold text-red-400 p-2">Update Form On Dashboard</h1>
            <h2 className="text-xl text-black/60 p-2 font-semibold">Update Admin Info, students, teachers, attendance, fees on dashboard</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-2 mt-6">
            <div className="bg-white w-[30rem] p-6 rounded-lg shadow-lg hover:scale-105 duration-300">
              <h2 className="text-xl font-semibold text-blue-600 mb-4">Update Admin Profile</h2>
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
                <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">
                  Update Profile
                </button>
              </form>
            </div>

            <div className="bg-white w-[30rem] p-6 rounded-lg shadow-lg hover:scale-105 duration-300">
              <h2 className="text-xl font-semibold text-blue-600 mb-4">Update Teacher Counts</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-between gap-4">
                  <label className="font-medium">Male Teachers</label>
                  <input type="number" value={maleTeachers} onChange={(e) => setMaleTeachers(Number(e.target.value))} className="p-1 bg-slate-100 border rounded-md w-1/2" />
                </div>
                <div className="flex justify-between gap-4">
                  <label className="font-medium">Female Teachers</label>
                  <input type="number" value={femaleTeachers} onChange={(e) => setFemaleTeachers(Number(e.target.value))} className="p-1 bg-slate-100 border rounded-md w-1/2" />
                </div>
                <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">Save Teacher Counts</button>
              </form>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-white w-[30rem] p-6 rounded-lg shadow-lg hover:scale-105 duration-300">
              <h2 className="text-xl font-semibold text-blue-600 mb-4">Update Student Counts</h2>
              <form onSubmit={handleSubmit2} className="space-y-4">
                <div className="flex justify-between gap-4">
                  <label className="font-medium">Male Students</label>
                  <input type="number" value={maleStudent} onChange={(e) => setMaleStudent(Number(e.target.value))} className="p-1 bg-slate-100 border rounded-md w-1/2" />
                </div>
                <div className="flex justify-between gap-4">
                  <label className="font-medium">Female Students</label>
                  <input type="number" value={femaleStudent} onChange={(e) => setFemaleStudent(Number(e.target.value))} className="p-1 bg-slate-100 border rounded-md w-1/2" />
                </div>
                <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">Save Student Counts</button>
              </form>
            </div>

            <div className="bg-white w-[30rem] p-6 rounded-lg shadow-lg hover:scale-105 duration-300">
              <h2 className="text-xl font-semibold text-blue-600 mb-4">Update Fees</h2>
              <div className="flex justify-between gap-4">
                <label className="font-medium">Paid Fees</label>
                <input type="number" value={paid} onChange={(e) => setPaid(Number(e.target.value))} className="p-1 bg-slate-100 border rounded-md w-1/2" />
              </div>
              <div className="flex justify-between gap-4 mt-4">
                <label className="font-medium">Unpaid Fees</label>
                <input type="number" value={unpaid} onChange={(e) => setUnpaid(Number(e.target.value))} className="p-1 bg-slate-100 border rounded-md w-1/2" />
              </div>
              <button onClick={handleUpdate} className="w-full mt-4 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">Update Fees</button>
            </div>
          </div>

          <div className="bg-white w-[30rem] p-6 rounded-lg shadow-lg mt-6">
            <h2 className="text-xl font-semibold text-blue-600 mb-4">Create or Delete Class</h2>
            <input type="text" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="New Class Name" className="w-full p-2 mb-4 bg-slate-100 border rounded-md" />
            <button onClick={createClass} className="w-full mb-4 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">Add Class</button>
            <select value={currentClass} onChange={(e) => setCurrentClass(e.target.value)} className="w-full p-2 mb-4 bg-slate-100 border rounded-md">
              {Object.keys(studentData).map((className) => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>
            <div className="space-y-4">
              <input type="number" value={studentData[currentClass]?.male || 0} onChange={(e) => updateData("male", Number(e.target.value))} className="w-full p-2 bg-slate-100 border rounded-md" placeholder="Male Students" />
              <input type="number" value={studentData[currentClass]?.female || 0} onChange={(e) => updateData("female", Number(e.target.value))} className="w-full p-2 bg-slate-100 border rounded-md" placeholder="Female Students" />
              <button onClick={() => deleteClass(currentClass)} className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600">Delete Class</button>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}