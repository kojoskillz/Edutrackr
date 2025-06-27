"use client";

import * as React from "react";
import { Dispatch, SetStateAction } from "react";
import {
    DataGrid,
    GridColDef,
    GridRowsProp,
    GridRowModes,
    GridRowModesModel,
    GridActionsCellItem,
    GridRowEditStopReasons,
    GridEventListener,
    GridRowModel,
    GridRowId,
    GridSlotProps,
    ToolbarButton,
    GridToolbarContainer,
} from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from '@mui/icons-material/Visibility';
import SchoolIcon from "@mui/icons-material/School";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CancelIcon from "@mui/icons-material/Close";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/app-sidebar";
import "react-toastify/dist/ReactToastify.css";
import {
    Button, Typography, Modal, Box, Tooltip, Snackbar, Alert
} from "@mui/material";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { randomId } from "@mui/x-data-grid-generator";
import Image from "next/image";
import { supabase } from '../Authentication-supabase/lib/supabase/supabaseClient';
import { User } from "@supabase/supabase-js";

type ClassRow = {
  id: string;
  name: string;
  teacher: string;
  description?: string;
  capacity?: number;
  isNew?: boolean;
  user_id?: string;
};

type StudentRow = GridRowModel & {
  id: string;
  name: string;
  dob: string;
  age: number;
  class: string;
  gender?: string;
  image?: string;
  parentPhoneNumber?: string;
  parentEmail?: string;
  isNew?: boolean;
  user_id?: string;
};

const calculateAge = (dob: string) => {
  const b = new Date(dob),
    today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age;
};

declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides {
    setRows: React.Dispatch<React.SetStateAction<GridRowsProp>>;
    setRowModesModel: React.Dispatch<React.SetStateAction<GridRowModesModel>>;
    className?: string;
    onCopyAllStudentNames: () => void;
    onCopyStudentContactInfo: () => void;
    onCopyStudentNameClassContactInfo: () => void;
  }
}

function ClassEditToolbar(props: GridSlotProps["toolbar"]) {
  const { setRows, setRowModesModel } = props;
  return (
    <GridToolbarContainer>
      <Tooltip title="Add Class">
        <ToolbarButton
          onClick={() => {
            const id = randomId();
            setRows((r: GridRowsProp) => [
              ...r,
              {
                id,
                name: "",
                teacher: "",
                description: "",
                capacity: 0,
                isNew: true,
                user_id: ""
              },
            ]);
            setRowModesModel((m) => ({
              ...m,
              [id]: { mode: GridRowModes.Edit, fieldToFocus: "name" },
            }));
          }}
        >
          <AddIcon fontSize="small" />
        </ToolbarButton>
      </Tooltip>
    </GridToolbarContainer>
  );
}

function StudentEditToolbar(props: GridSlotProps["toolbar"]) {
  const { setRows, setRowModesModel, className, onCopyAllStudentNames, onCopyStudentContactInfo, onCopyStudentNameClassContactInfo } = props;
  return (
    <GridToolbarContainer className="flex justify-between w-full">
      <div>
        <Tooltip title={`Add Student to ${className}`}>
          <ToolbarButton
            color="primary"
            size="small"
            className=" hover:bg-blue-600 transition-colors duration-200"
            onClick={() => {
              const id = randomId();
              setRows((r) => [
                ...r,
                {
                  id,
                  name: "",
                  dob: dayjs().format('YYYY-MM-DD'),
                  age: 0,
                  class: className || "",
                  gender: "Male",
                  parentPhoneNumber: "",
                  parentEmail: "",
                  isNew: true,
                  user_id: ""
                },
              ]);
              setRowModesModel((m) => ({
                ...m,
                [id]: { mode: GridRowModes.Edit, fieldToFocus: "name" },
              }));
            }}
          >
            <AddIcon fontSize="small" /> Add Student
          </ToolbarButton>
        </Tooltip>
      </div>
      <div className="flex gap-2">
        <Tooltip title={`Copy All Student Names in ${className}`}>
          <ToolbarButton
            color="primary"
            size="small"
            className="rounded-lg hover:bg-gray-200 transition-colors duration-200"
            onClick={onCopyAllStudentNames}
          >
            <ContentCopyIcon fontSize="small" />
            Names
          </ToolbarButton>
        </Tooltip>
        <Tooltip title={`Copy Student Names, Phone Numbers, and Emails in ${className}`}>
          <ToolbarButton
            color="primary"
            size="small"
            className="rounded-lg hover:bg-gray-200 transition-colors duration-200"
            onClick={onCopyStudentContactInfo}
          >
            <ContentCopyIcon fontSize="small" />
            Contact Info
          </ToolbarButton>
        </Tooltip>
        <Tooltip title={`Copy Student Names, Class, Phone Numbers, and Emails in ${className}`}>
          <ToolbarButton
            color="primary"
            size="small"
            className="rounded-lg hover:bg-gray-200 transition-colors duration-200"
            onClick={onCopyStudentNameClassContactInfo}
          >
            <ContentCopyIcon fontSize="small" />
            Class Contact Info
          </ToolbarButton>
        </Tooltip>
      </div>
    </GridToolbarContainer>
  );
}

export default function ClassesPage() {
  const [user, setUser] = React.useState<User | null>(null);
  const [classRows, setClassRows] = React.useState<ClassRow[]>([]);
  const [classRowModesModel, setClassRowModesModel] = React.useState<GridRowModesModel>({});
  const [classSearchText, setClassSearchText] = React.useState("");
  const [viewClassRow, setViewClassRow] = React.useState<ClassRow | null>(null);

  const [allStudents, setAllStudents] = React.useState<StudentRow[]>([]);
  const [studentRowModesModel, setStudentRowModesModel] = React.useState<GridRowModesModel>({});
  const [studentSearchText, setStudentSearchText] = React.useState("");
  const [viewStudentRow, setViewStudentRow] = React.useState<StudentRow | null>(null);

  const [showStudentsTable, setShowStudentsTable] = React.useState(false);
  const [selectedClassName, setSelectedClassName] = React.useState<string | null>(null);

  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Pagination state
  const [studentPagination, setStudentPagination] = React.useState({
    page: 0,
    pageSize: 25,
    hasMore: true,
    loading: false
  });

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw new Error(`Authentication error: ${error.message}`);
        setUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        setError(error instanceof Error ? error.message : "Failed to load user session");
        handleSnackbarOpen(error instanceof Error ? error.message : "Failed to load user session");
      }
    };
    
    fetchUser();
  }, []);

  const fetchClasses = async () => {
    try {
      if (!user) throw new Error("User not authenticated");
      
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      
      if (classError) throw new Error(`Class fetch error: ${classError.message}`);
      
      return classData || [];
    } catch (error) {
      console.error("Error fetching classes:", error);
      throw error;
    }
  };

  const fetchStudents = async (page = 0, pageSize = 25) => {
    try {
      if (!user) throw new Error("User not authenticated");
      
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      const { data: studentData, error: studentError, count } = await supabase
        .from('students')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('name', { ascending: true })
        .range(from, to);
      
      if (studentError) throw new Error(`Student fetch error: ${studentError.message}`);
      
      return {
        data: studentData || [],
        hasMore: (count || 0) > to + 1
      };
    } catch (error) {
      console.error("Error fetching students:", error);
      throw error;
    }
  };

  const fetchDataWithRetry = async (retries = 3, delay = 1000) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // First try to fetch classes
      let attempts = 0;
      let classes: ClassRow[] = [];
      while (attempts < retries) {
        try {
          classes = await fetchClasses();
          break;
        } catch (error) {
          attempts++;
          if (attempts >= retries) throw error;
          await new Promise(res => setTimeout(res, delay * attempts));
        }
      }
      
      // Then try to fetch students with pagination
      attempts = 0;
      let students: StudentRow[] = [];
      let hasMore = true;
      while (attempts < retries && hasMore) {
        try {
          const result = await fetchStudents(studentPagination.page, studentPagination.pageSize);
          students = result.data;
          hasMore = result.hasMore;
          break;
        } catch (error) {
          attempts++;
          if (attempts >= retries) throw error;
          await new Promise(res => setTimeout(res, delay * attempts));
        }
      }
      
      setClassRows(classes);
      setAllStudents(students);
      setStudentPagination(prev => ({
        ...prev,
        hasMore,
        loading: false
      }));
      
    } catch (error) {
      console.error("Error fetching data:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load data";
      setError(errorMessage);
      handleSnackbarOpen(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (user) {
      fetchDataWithRetry();
    }
  }, [user, studentPagination.page, studentPagination.pageSize]);

  const handleClassRowEditStop: GridEventListener<"rowEditStop"> = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleStudentRowEditStop: GridEventListener<"rowEditStop"> = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleSnackbarOpen = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const processClassRowUpdate = async (newRow: GridRowModel) => {
    if (!user) {
      const errorMsg = "User not authenticated";
      handleSnackbarOpen(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const updated: ClassRow = {
        id: newRow.id as string,
        name: newRow.name as string,
        teacher: newRow.teacher as string,
        description: newRow.description,
        capacity: newRow.capacity,
        isNew: false,
        user_id: user.id
      };

      if (newRow.isNew) {
        const { data, error } = await supabase
          .from('classes')
          .insert(updated)
          .select();
        
        if (error) throw new Error(`Insert failed: ${error.message}`);
        
        setClassRows(prevClasses => 
          prevClasses.map(cls => cls.id === newRow.id ? data[0] : cls)
        );
        handleSnackbarOpen('Class added successfully');
        return data[0];
      } else {
        const { data, error } = await supabase
          .from('classes')
          .update(updated)
          .eq('id', newRow.id)
          .select();
        
        if (error) throw new Error(`Update failed: ${error.message}`);
        
        setClassRows(prevClasses => 
          prevClasses.map(cls => cls.id === newRow.id ? data[0] : cls)
        );
        handleSnackbarOpen('Class updated successfully');
        return data[0];
      }
    } catch (error) {
      console.error("Error saving class:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save class";
      handleSnackbarOpen(errorMessage);
      throw error;
    }
  };

  const processStudentRowUpdate = async (newRow: GridRowModel) => {
    if (!user) {
      const errorMsg = "User not authenticated";
      handleSnackbarOpen(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const dob = newRow.dob ? new Date(newRow.dob).toISOString() : new Date().toISOString();
      
      const updated: StudentRow = {
        id: newRow.id as string,
        name: newRow.name as string,
        dob,
        age: calculateAge(dob),
        class: selectedClassName || newRow.class as string,
        gender: newRow.gender as string | undefined,
        image: newRow.image as string | undefined,
        parentPhoneNumber: newRow.parentPhoneNumber as string | undefined,
        parentEmail: newRow.parentEmail as string | undefined,
        isNew: false,
        user_id: user.id
      };

      if (newRow.isNew) {
        const { data, error } = await supabase
          .from('students')
          .insert(updated)
          .select();
        
        if (error) throw new Error(`Insert failed: ${error.message}`);
        
        setAllStudents(prevStudents => 
          prevStudents.map(student => 
            student.id === newRow.id ? data[0] : student
          )
        );
        handleSnackbarOpen('Student added successfully');
        return data[0];
      } else {
        const { data, error } = await supabase
          .from('students')
          .update(updated)
          .eq('id', newRow.id)
          .select();
        
        if (error) throw new Error(`Update failed: ${error.message}`);
        
        setAllStudents(prevStudents => 
          prevStudents.map(student => 
            student.id === newRow.id ? data[0] : student
          )
        );
        handleSnackbarOpen('Student updated successfully');
        return data[0];
      }
    } catch (error) {
      console.error("Error saving student:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save student";
      handleSnackbarOpen(errorMessage);
      throw error;
    }
  };

  const classActions = {
    edit: (id: GridRowId) => () =>
      setClassRowModesModel((m) => ({ ...m, [id]: { mode: GridRowModes.Edit } })),
    save: (id: GridRowId) => () =>
      setClassRowModesModel((m) => ({ ...m, [id]: { mode: GridRowModes.View } })),
    cancel: (id: GridRowId) => () => {
      setClassRowModesModel((m) => ({
        ...m,
        [id]: { mode: GridRowModes.View, ignoreModifications: true },
      }));
      const row = classRows.find((r) => r.id === id) as ClassRow;
      if (row?.isNew) {
        setClassRows((r) => r.filter((x) => x.id !== id));
      }
    },
    delete: (id: GridRowId) => async () => {
      try {
        const { error } = await supabase
          .from('classes')
          .delete()
          .eq('id', id);
        
        if (error) throw new Error(`Delete failed: ${error.message}`);
        
        setClassRows((r) => r.filter((x) => x.id !== id));
        handleSnackbarOpen('Class deleted successfully');
      } catch (error) {
        console.error("Error deleting class:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to delete class";
        handleSnackbarOpen(errorMessage);
      }
    },
    view: (id: GridRowId) => () => {
      const row = classRows.find((r) => r.id === id) as ClassRow;
      setViewClassRow(row);
    },
    viewStudents: (id: GridRowId, className: string) => () => {
      setSelectedClassName(className);
      setShowStudentsTable(true);
    },
  };

  const handleCopySingleStudentName = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);
      handleSnackbarOpen(`Copied "${name}"`);
    } catch (err) {
      console.error("Failed to copy student name: ", err);
      handleSnackbarOpen("Failed to copy name. Please try again.");
    }
  };

  const handleCopyAllStudentNames = async () => {
    const names = studentsForSelectedClass.map(student => (student as StudentRow).name);
    if (names.length > 0) {
      try {
        await navigator.clipboard.writeText(names.join('\n'));
        handleSnackbarOpen(`Copied ${names.length} student name(s)`);
      } catch (err) {
        console.error("Failed to copy all student names: ", err);
        handleSnackbarOpen("Failed to copy names. Please try again.");
      }
    } else {
      handleSnackbarOpen("No students to copy");
    }
  };

  const handleCopyStudentContactInfo = async () => {
    const contactInfo = studentsForSelectedClass.map(student => {
      const s = student as StudentRow;
      return `${s.name} - Phone: ${s.parentPhoneNumber || 'N/A'}, Email: ${s.parentEmail || 'N/A'}`;
    });

    if (contactInfo.length > 0) {
      try {
        await navigator.clipboard.writeText(contactInfo.join('\n'));
        handleSnackbarOpen(`Copied contact info for ${contactInfo.length} student(s)`);
      } catch (err) {
        console.error("Failed to copy contact info: ", err);
        handleSnackbarOpen("Failed to copy contact info. Please try again.");
      }
    } else {
      handleSnackbarOpen("No student contact info to copy");
    }
  };

  const handleCopyStudentNameClassContactInfo = async () => {
    const combinedInfo = studentsForSelectedClass.map(student => {
      const s = stude
