"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type StudentData = {
  [className: string]: { male: number; female: number };
};

interface StudentContextProps {
  studentData: StudentData;
  setStudentData: React.Dispatch<React.SetStateAction<StudentData>>;
  addClass: (className: string) => void;
}

const StudentContext = createContext<StudentContextProps | undefined>(undefined);

export const StudentProvider = ({ children }: { children: React.ReactNode }) => {
  // Instantly initialize from localStorage during first render
  const [studentData, setStudentData] = useState<StudentData>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("studentData");
        return saved ? JSON.parse(saved) : {};
      } catch (err) {
        console.error("Failed to load student data:", err);
        return {};
      }
    }
    return {};
  });

  // Automatically save to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem("studentData", JSON.stringify(studentData));
    } catch (err) {
      console.error("Failed to save student data:", err);
    }
  }, [studentData]);

  const addClass = (className: string) => {
    setStudentData((prev) => ({
      ...prev,
      [className]: { male: 0, female: 0 },
    }));
  };

  return (
    <StudentContext.Provider value={{ studentData, setStudentData, addClass }}>
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (!context) throw new Error("useStudent must be used within a StudentProvider");
  return context;
};
