/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect } from "react";
// Removed the useRouter import as it was not used in the component logic
// import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Ensure these imports are correct based on your project structure
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

// Define the structure for student data by class
interface StudentData {
  [className: string]: {
    male: number;
    female: number;
  };
}

// Note: The TypeScript error 'Property 'setPaidFees' does not exist on type 'FeesState''
// IS RESOLVED BY ADDING 'setPaidFees' and 'setUnpaidFees' to the FeesState interface
// in the file where useFeesStore is defined (e.g., ../dashboard/useFeesStore.ts).
// The code below assumes that fix has been made in the store definition.


export default function Page() {
  // State for Admin Profile
  const [name, setName] = useState("");
  const [image, setImage] = useState<string | null>(null);

  // State for Teacher Counts
  const [maleTeachers, setMaleTeachers] = useState(0);
  const [femaleTeachers, setFemaleTeachers] = useState(0);

  // State for overall Student Counts (These seem separate from the class-specific counts below)
  // Consider if these overall counts should be derived from the class-specific counts instead
  const [maleStudent, setMaleStudent] = useState(0);
  const [femaleStudent, setFemaleStudent] = useState(0);

  // Removed the unused router variable
  // const router = useRouter();

  // Accessing fees store and student context
  // Destructuring paidFees as paid, unpaidFees as unpaid,
  // AND getting the setter functions directly from the store.
  // This requires the FeesState type definition in useFeesStore.ts to include these setters.
  const { paidFees: paid, unpaidFees: unpaid } = useFeesStore();

  const { studentData, setStudentData } = useStudent();

  // State for managing classes and student data within classes
  const [currentClass, setCurrentClass] = useState("Class A"); // Default class
  const [newClassName, setNewClassName] = useState(""); // State for adding a new class name

  // Effect to load saved student data from localStorage on component mount
  useEffect(() => {
    const savedStudentData = localStorage.getItem("studentData");
    if (savedStudentData) {
      try {
        // Attempt to parse the saved data
        const parsedData: StudentData = JSON.parse(savedStudentData);
        setStudentData(parsedData);

        // Set the current class to the first one found in saved data, or default
        const firstClass = Object.keys(parsedData)[0];
        if (firstClass) {
          setCurrentClass(firstClass);
        } else {
          // If no classes saved but data was found (e.g., empty object), initialize with a default
          const defaultData = { "Class A": { male: 0, female: 0 } };
          setStudentData(defaultData);
          localStorage.setItem("studentData", JSON.stringify(defaultData)); // Also save default
          setCurrentClass("Class A");
        }
      } catch (error) {
        console.error("Failed to parse student data from localStorage:", error);
        // Handle potential parsing errors by clearing invalid data and initializing with default
        localStorage.removeItem("studentData");
        const defaultData = { "Class A": { male: 0, female: 0 } };
        setStudentData(defaultData);
        localStorage.setItem("studentData", JSON.stringify(defaultData)); // Also save default
        setCurrentClass("Class A");
      }
    } else {
      // If no data in localStorage, initialize with a default class
      const defaultData = { "Class A": { male: 0, female: 0 } };
      setStudentData(defaultData);
      localStorage.setItem("studentData", JSON.stringify(defaultData)); // Also save default
      setCurrentClass("Class A");
    }
  }, [setStudentData]); // Dependency array includes setStudentData

  // Load other data from localStorage on mount
  useEffect(() => {
    // Load admin profile data
    setName(localStorage.getItem("adminName") || "");
    setImage(localStorage.getItem("adminImage") || null);

    // Load teacher counts
    setMaleTeachers(Number(localStorage.getItem("maleTeachers") || "0"));
    setFemaleTeachers(Number(localStorage.getItem("femaleTeachers") || "0"));

    // Load overall student counts
    setMaleStudent(Number(localStorage.getItem("maleStudent") || "0"));
    setFemaleStudent(Number(localStorage.getItem("femaleStudent") || "0"));

    // Note: Fees data is managed by useFeesStore, assuming it loads its state internally
    // (e.g., from localStorage or a backend) upon initialization.
    // So, no need to load fees directly here from localStorage.

  }, []); // Empty dependency array means this effect runs only once on mount


  // Handler for admin profile image change
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    if (file) reader.readAsDataURL(file);
  };

  // Handler for submitting admin profile updates
  const handleSubmit1 = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    localStorage.setItem("adminName", name);
    localStorage.setItem("adminImage", image || "");
    toast.success("Admin Profile updated successfully", { position: "top-right" });
  };

  // Handler for submitting teacher count updates
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    localStorage.setItem("maleTeachers", maleTeachers.toString());
    localStorage.setItem("femaleTeachers", femaleTeachers.toString());
    toast.success("Teacher counts updated successfully", {
      position: "top-right",
    });
  };

  // Handler for submitting overall student count updates
  const handleSubmit2 = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    localStorage.setItem("maleStudent", maleStudent.toString());
    localStorage.setItem("femaleStudent", femaleStudent.toString());
    toast.success("Overall Student counts updated successfully", {
      position: "top-right",
    });
  };

  // Handler for updating fees - This now just shows a success message,
  // assuming the input fields already update the store state via setPaidFees and setUnpaidFees
  const handleUpdateFeesClick = () => {
     // Optional: Add logic here if you need a specific action on button click,
     // like saving the *current* store state (paid, unpaid) to a backend/localStorage
     // Example: localStorage.setItem("paidFees", paid.toString());
     // Example: localStorage.setItem("unpaidFees", unpaid.toString());
    toast.success("Fees updated successfully!", { position: "top-right" });
  };

  // Handler for creating a new class
  const createClass = () => {
    const trimmedClassName = newClassName.trim();
    // Prevent creating empty or duplicate class names
    if (trimmedClassName === "") {
      toast.error("Class name cannot be empty!", { position: "top-right" });
      return;
    }
    if (studentData[trimmedClassName]) {
      toast.error(`${trimmedClassName} already exists!`, { position: "top-right" });
      return;
    }

    const updatedStudentData = {
      ...studentData,
      [trimmedClassName]: { male: 0, female: 0 }, // Initialize new class with 0 students
    };
    setStudentData(updatedStudentData);
    localStorage.setItem("studentData", JSON.stringify(updatedStudentData));
    setNewClassName(""); // Clear the input field
    toast.success(`${trimmedClassName} created successfully!`, { position: "top-right" });
  };

  // Handler for deleting a class
  const deleteClass = (className: string) => {
    // Prevent deleting if it's the only class
    if (Object.keys(studentData).length <= 1) {
      toast.error("Cannot delete the last class!", { position: "top-right" });
      return;
    }
    const updatedData = { ...studentData };
    delete updatedData[className];
    setStudentData(updatedData);
    localStorage.setItem("studentData", JSON.stringify(updatedData));
    // Set current class to the first remaining class after deletion
    const remainingClasses = Object.keys(updatedData);
    if (remainingClasses.length > 0) {
      setCurrentClass(remainingClasses[0]);
    } else {
        // This case should theoretically not happen due to the check above,
        // but as a fallback, reset to a default state if somehow empty.
        const defaultData = { "Class A": { male: 0, female: 0 } };
        setStudentData(defaultData);
        localStorage.setItem("studentData", JSON.stringify(defaultData));
        setCurrentClass("Class A");
    }
    toast.success(`${className} has been deleted!`, { position: "top-right" });
  };

  // Handler for updating male/female student counts for the currently selected class
  const updateClassStudentCount = (gender: "male" | "female", value: number) => {
    // Ensure the value is not negative
    const safeValue = Math.max(0, value);
    const updatedData = { ...studentData };
    if (updatedData[currentClass]) {
      updatedData[currentClass] = {
        ...updatedData[currentClass],
        [gender]: safeValue,
      };
      setStudentData(updatedData);
      localStorage.setItem("studentData", JSON.stringify(updatedData));
    }
  };

  const {  } = useFeesStore();

  function setPaidFees(arg0: number): void {
    throw new Error("Function not implemented.");
  }

  function setUnpaidFees(arg0: number): void {
    throw new Error("Function not implemented.");
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

          {/* Centered and potentially responsive grid container */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-4xl"> {/* Use max-w-4xl for better control on large screens */}
            {/* Update Admin Profile */}
            <div className="bg-white p-6 rounded-lg shadow-lg hover:scale-105 duration-300 flex flex-col"> {/* Use flex-col for internal stacking */}
              <h2 className="text-xl font-semibold text-blue-600 mb-4 text-center"> {/* Center heading */}
                Update Admin Profile
              </h2>
              <form onSubmit={handleSubmit1} className="space-y-4 flex-grow flex flex-col justify-center"> {/* Center form content */}
                <label htmlFor="adminName" className="block text-sm font-medium text-gray-700">Admin Name:</label>
                <input
                  title="Admin Name"
                  placeholder="Enter admin name"
                  type="text"
                  id="adminName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-slate-100 border rounded-md"
                />
                <label htmlFor="adminImage" className="block text-sm font-medium text-gray-700">Admin Image:</label> {/* Added label for file input */}
                <input
                  type="file"
                  id="adminImage" // Added id for label association
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full p-2 bg-slate-100 border rounded-md"
                />
                 {/* Optional: Display current image */}
                 {image && (
                    <div className="mt-2 text-center">
                        <img src={image} alt="Admin Preview" className="mt-2 w-24 h-24 object-cover rounded-full inline-block" />
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

            {/* Update Teacher Counts */}
            <div className="bg-white p-6 rounded-lg shadow-lg hover:scale-105 duration-300 flex flex-col"> {/* Use flex-col for internal stacking */}
              <h2 className="text-xl font-semibold text-blue-600 mb-4 text-center"> {/* Center heading */}
                Update Teacher Counts
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4 flex-grow flex flex-col justify-center"> {/* Center form content */}
                <div className="flex justify-between items-center gap-4"> {/* Add items-center for vertical alignment */}
                  <label className="font-medium">Male Teachers</label>
                  <input
                    type="number"
                    value={maleTeachers}
                    onChange={(e) => setMaleTeachers(Number(e.target.value))}
                    className="p-1 bg-slate-100 border rounded-md w-1/2"
                    min="0" // Ensure counts are not negative
                    title="Male Teachers"
                    placeholder="Enter number of male teachers"
                  />
                </div>
                <div className="flex justify-between items-center gap-4"> {/* Add items-center for vertical alignment */}
                  <label className="font-medium">Female Teachers</label>
                  <input
                    type="number"
                    value={femaleTeachers}
                    onChange={(e) => setFemaleTeachers(Number(e.target.value))}
                    className="p-1 bg-slate-100 border rounded-md w-1/2"
                    min="0" // Ensure counts are not negative
                    title="Female Teachers"
                    placeholder="Enter number of female teachers"
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 w-full max-w-4xl"> {/* Use max-w-4xl for better control on large screens */}
            {/* Update Overall Student Counts (Note: These seem separate from class-specific counts) */}
            <div className="bg-white p-6 rounded-lg shadow-lg hover:scale-105 duration-300 flex flex-col"> {/* Use flex-col for internal stacking */}
              <h2 className="text-xl font-semibold text-blue-600 mb-4 text-center"> {/* Center heading */}
                Update Overall Student Counts
              </h2>
              <form onSubmit={handleSubmit2} className="space-y-4 flex-grow flex flex-col justify-center"> {/* Center form content */}
                <div className="flex justify-between items-center gap-4"> {/* Add items-center for vertical alignment */}
                  <label className="font-medium">Male Students</label>
                  <input
                    type="number"
                    value={maleStudent}
                    title="Male Students"
                    placeholder="Enter male Students"
                    onChange={(e) => setMaleStudent(Number(e.target.value))}
                    className="p-1 bg-slate-100 border rounded-md w-1/2"
                    min="0" // Ensure counts are not negative
                  />
                </div>
                <div className="flex justify-between items-center gap-4"> {/* Add items-center for vertical alignment */}
                  <label className="font-medium">Female Students</label>
                  <input
                    type="number"
                    value={femaleStudent}
                    title="Female Students"
                    placeholder="Enter Female Students"
                    onChange={(e) => setFemaleStudent(Number(e.target.value))}
                    className="p-1 bg-slate-100 border rounded-md w-1/2"
                    min="0" // Ensure counts are not negative
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

            {/* Update Fees */}
            <div className="bg-white p-6 rounded-lg shadow-lg hover:scale-105 duration-300 flex flex-col"> {/* Use flex-col for internal stacking */}
              <h2 className="text-xl font-semibold text-blue-600 mb-4 text-center"> {/* Center heading */}
                Update Fees
              </h2>
              <div className="flex-grow flex flex-col justify-center space-y-4"> {/* Center content and add space-y */}
                <div className="flex justify-between items-center gap-4"> {/* Add items-center for vertical alignment */}
                  <label className="font-medium">Paid Fees (%)</label>
                  <input
                    type="number"
                    title="Paid Fees"
                    placeholder="Paid Fees"
                    value={paid}
                    onChange={(e) => setPaidFees(Number(e.target.value))} // Use setPaidFees from the store
                    className="p-1 bg-slate-100 border rounded-md w-1/2"
                    min="0" // Add min and max for percentage
                    max="100"
                  />
                </div>
                <div className="flex justify-between items-center gap-4"> {/* Add items-center for vertical alignment */}
                  <label className="font-medium">Unpaid Fees (%)</label>
                  <input
                    type="number"
                    title="Unpaid Fees"
                    placeholder="Unpaid Fees"
                    value={unpaid}
                    onChange={(e) => setUnpaidFees(Number(e.target.value))} // Use setUnpaidFees from the store
                    className="p-1 bg-slate-100 border rounded-md w-1/2"
                    min="0" // Add min and max for percentage
                    max="100"
                  />
                </div>
                <button
                  onClick={handleUpdateFeesClick} // Call the handler
                  className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
                >
                  Update Fees
                </button>
              </div>
            </div>
          </div>

          {/* Create or Delete Class and Update Class-Specific Student Counts */}
          <div className="bg-white p-6 rounded-lg shadow-lg mt-6 w-full max-w-md mx-auto hover:scale-105 duration-300 flex flex-col"> {/* Use max-w-md and mx-auto for centering */}
            <h2 className="text-xl font-semibold text-blue-600 mb-4 text-center"> {/* Center heading */}
              Manage Classes and Students
            </h2>
            <div className="flex-grow flex flex-col justify-center space-y-4"> {/* Center content and add space-y */}
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
                {/* Map over the class names from studentData to create options */}
                {/* Add a check to ensure studentData is not null/undefined and has keys */}
                {Object.keys(studentData || {}).map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>

              {/* Inputs to update student counts for the selected class */}
              {/* Only show these inputs if a class is actually selected/available */}
              {currentClass && studentData && studentData[currentClass] && (
                 <>
                    <label className="font-medium">Students in {currentClass}:</label>
                    <input
                      type="number"
                      // Display the current male student count for the selected class, default to 0 if class data is missing
                      value={studentData[currentClass]?.male || 0}
                      onChange={(e) => updateClassStudentCount("male", Number(e.target.value))}
                      className="w-full p-2 bg-slate-100 border rounded-md"
                      title="Male Students in selected class"
                      placeholder="Male Students"
                      min="0" // Ensure student counts are not negative
                    />
                    <input
                      type="number"
                      // Display the current female student count for the selected class, default to 0 if class data is missing
                      value={studentData[currentClass]?.female || 0}
                      onChange={(e) => updateClassStudentCount("female", Number(e.target.value))}
                      className="w-full p-2 bg-slate-100 border rounded-md"
                      placeholder="Female Students"
                      min="0" // Ensure student counts are not negative
                    />

                    {/* Button to delete the currently selected class */}
                    <button
                      onClick={() => deleteClass(currentClass)}
                      className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600"
                    >
                      Delete Selected Class ({currentClass})
                    </button>
                 </>
              )}
                {/* Optional message if no classes exist */}
                {Object.keys(studentData || {}).length === 0 && (
                    <p className="text-center text-gray-500">No classes available. Add a new class above.</p>
                )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
