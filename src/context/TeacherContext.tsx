// context/TeacherContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Teacher = {
  id: string;
  name: string;
  dob: string;
  age: number;
  appointmentDate: string;
};

type TeacherContextType = {
  teachers: Teacher[];
  addTeacher: (teacher: Teacher) => void;
  updateTeacher: (updated: Teacher) => void;
  deleteTeacher: (id: string) => void;
};

const TeacherContext = createContext<TeacherContextType | undefined>(undefined);

export const useTeachers = () => {
  const context = useContext(TeacherContext);
  if (!context) throw new Error("useTeachers must be used within a Provider");
  return context;
};

export const TeacherProvider = ({ children }: { children: React.ReactNode }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("teachers");
    if (stored) setTeachers(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("teachers", JSON.stringify(teachers));
  }, [teachers]);

  const addTeacher = (teacher: Teacher) => {
    setTeachers((prev) => [...prev, teacher]);
  };

  const updateTeacher = (updated: Teacher) => {
    setTeachers((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
  };

  const deleteTeacher = (id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <TeacherContext.Provider
      value={{ teachers, addTeacher, updateTeacher, deleteTeacher }}
    >
      {children}
    </TeacherContext.Provider>
  );
};
