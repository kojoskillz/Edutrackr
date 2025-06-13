"use client";

import * as React from "react";
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

type StudentRow = {
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

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!user) {
          throw new Error("User not authenticated");
        }
        
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('*')
          .eq('user_id', user.id);
        
        if (classError) throw new Error(`Class fetch error: ${classError.message}`);
        
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id);
        
        if (studentError) throw new Error(`Student fetch error: ${studentError.message}`);

        setClassRows(classData || []);
        setAllStudents(studentData || []);

      } catch (error) {
        console.error("Error fetching data:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to load data";
        setError(errorMessage);
        handleSnackbarOpen(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

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
        ...newRow,
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
        ...newRow,
        dob,
        age: calculateAge(dob),
        isNew: false,
        user_id: user.id,
        class: selectedClassName || newRow.class
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
      const s = student as StudentRow;
      return `${s.name}, Class: ${s.class}, Phone: ${s.parentPhoneNumber || 'N/A'}, Email: ${s.parentEmail || 'N/A'}`;
    });

    if (combinedInfo.length > 0) {
      try {
        await navigator.clipboard.writeText(combinedInfo.join('\n'));
        handleSnackbarOpen(`Copied names, class, and contact info for ${combinedInfo.length} student(s)`);
      } catch (err) {
        console.error("Failed to copy combined info: ", err);
        handleSnackbarOpen("Failed to copy combined info. Please try again.");
      }
    } else {
      handleSnackbarOpen("No student data to copy");
    }
  };

  const studentActions = {
    edit: (id: GridRowId) => () =>
      setStudentRowModesModel((m) => ({ ...m, [id]: { mode: GridRowModes.Edit } })),
    save: (id: GridRowId) => () =>
      setStudentRowModesModel((m) => ({ ...m, [id]: { mode: GridRowModes.View } })),
    cancel: (id: GridRowId) => () => {
      setStudentRowModesModel((m) => ({
        ...m,
        [id]: { mode: GridRowModes.View, ignoreModifications: true },
      }));
      const row = allStudents.find((r) => r.id === id) as StudentRow;
      if (row?.isNew) {
        setAllStudents((r) => r.filter((x) => x.id !== id));
      }
    },
    delete: (id: GridRowId) => async () => {
      try {
        const { error } = await supabase
          .from('students')
          .delete()
          .eq('id', id);
        
        if (error) throw new Error(`Delete failed: ${error.message}`);
        
        setAllStudents((r) => r.filter((x) => x.id !== id));
        handleSnackbarOpen('Student deleted successfully');
      } catch (error) {
        console.error("Error deleting student:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to delete student";
        handleSnackbarOpen(errorMessage);
      }
    },
    view: (id: GridRowId) => () => {
      const row = allStudents.find((r) => r.id === id) as StudentRow;
      setViewStudentRow(row);
    },
    copyName: (id: GridRowId) => () => {
      const row = allStudents.find((r) => r.id === id) as StudentRow;
      if (row?.name) {
        handleCopySingleStudentName(row.name);
      }
    }
  };

  const filteredClasses = classRows.filter((r) => {
    const t = classSearchText.toLowerCase();
    const row = r as ClassRow;
    return (
      (row.name?.toLowerCase() ?? "").includes(t) ||
      (row.teacher?.toLowerCase() ?? "").includes(t) ||
      (row.description?.toLowerCase() ?? "").includes(t)
    );
  });

  const studentsForSelectedClass = React.useMemo(() => {
    const t = studentSearchText.toLowerCase();
    return allStudents.filter((r) => {
      const row = r as StudentRow;
      return row.class === selectedClassName && (
        (row.name?.toLowerCase() ?? "").includes(t) ||
        (row.class?.toLowerCase() ?? "").includes(t) ||
        (row.dob?.includes(t) ?? false) ||
        (row.gender?.toLowerCase() ?? "").includes(t) ||
        (row.parentPhoneNumber?.includes(t) ?? false) ||
        (row.parentEmail?.toLowerCase() ?? "").includes(t)
      );
    });
  }, [allStudents, selectedClassName, studentSearchText]);

  const classColumns: GridColDef[] = [
    { field: "name", headerName: "Class Name", width: 180, editable: true },
    { field: "teacher", headerName: "Teacher", width: 180, editable: true },
    { field: "description", headerName: "Description", width: 250, editable: true },
    { field: "capacity", headerName: "Capacity", width: 100, type: "number", editable: true },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 200,
      getActions: ({ id, row }) => {
        const isEdit = classRowModesModel[id]?.mode === GridRowModes.Edit;
        const classRow = row as ClassRow;

        return isEdit
          ? [
              <GridActionsCellItem key="save" icon={<SaveIcon />} label="Save" onClick={classActions.save(id)} color="primary" />,
              <GridActionsCellItem key="cancel" icon={<CancelIcon />} label="Cancel" onClick={classActions.cancel(id)} />,
            ]
          : [
              <GridActionsCellItem key="viewStudents" icon={<SchoolIcon />} label="View Students" onClick={classActions.viewStudents(id, classRow.name)} color="inherit" />,
              <GridActionsCellItem key="view" icon={<VisibilityIcon />} label="View Class Details" onClick={classActions.view(id)} />,
              <GridActionsCellItem key="edit" icon={<EditIcon />} label="Edit Class" onClick={classActions.edit(id)} color="inherit" />,
              <GridActionsCellItem key="delete" icon={<DeleteIcon />} label="Delete Class" onClick={classActions.delete(id)} color="inherit" />,
            ];
      },
    },
  ];

  const studentColumns: GridColDef[] = [
    {
      field: "image",
      headerName: "Photo",
      width: 100,
      editable: true,
      renderCell: (p) => {
        if (!p.value) return null;
        
        if (typeof p.value === 'string' && p.value.startsWith('data:image')) {
          return (
            <Image 
              src={p.value} 
              alt="student photo" 
              width={32} 
              height={32} 
              className="h-8 w-8 rounded-full object-cover" 
            />
          );
        }
        
        if (typeof p.value === 'string') {
          try {
            new URL(p.value);
            return (
              <Image 
                src={p.value} 
                alt="student photo" 
                width={32} 
                height={32} 
                className="h-8 w-8 rounded-full object-cover" 
              />
            );
          } catch {
            return null;
          }
        }
        
        return null;
      },
      renderEditCell: (params) => {
        const { id, field, api } = params;
        return (
          <input
            type="file"
            accept="image/*"
            title="Upload student photo"
            placeholder="Upload student photo"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onloadend = () => {
                api.setEditCellValue({ id, field, value: reader.result }, undefined);
              };
              reader.readAsDataURL(file);
            }}
          />
        );
      },
    },
    { field: "name", headerName: "Name", width: 180, editable: true },
    {
      field: "dob",
      headerName: "Date of Birth",
      width: 160,
      editable: true,
      renderCell: (p) => p.value ? new Date(p.value as string).toLocaleDateString("en-GB") : "",
      renderEditCell: (params) => {
        const { id, field, value, api } = params;
        return (
          <DatePicker
            value={value ? dayjs(value as string) : dayjs()}
            onChange={(v) => {
              api.setEditCellValue({ id, field, value: v?.toISOString() }, undefined);
            }}
            slotProps={{ textField: { variant: "standard", fullWidth: true } }}
          />
        );
      },
    },
    {
      field: "gender",
      headerName: "Gender",
      width: 120,
      editable: true,
      type: "singleSelect",
      valueOptions: ["Male", "Female", "Other"],
    },
    { field: "age", headerName: "Age", width: 80, type: "number", editable: false },
    { field: "class", headerName: "Class", width: 140, editable: false },
    { field: "parentPhoneNumber", headerName: "Parent Phone", width: 150, editable: true },
    { field: "parentEmail", headerName: "Parent Email", width: 200, editable: true },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 170,
      getActions: ({ id }) => {
        const isEdit = studentRowModesModel[id]?.mode === GridRowModes.Edit;

        return isEdit
          ? [
              <GridActionsCellItem key="save" icon={<SaveIcon />} label="Save" onClick={studentActions.save(id)} color="primary" />,
              <GridActionsCellItem key="cancel" icon={<CancelIcon />} label="Cancel" onClick={studentActions.cancel(id)} />,
            ]
          : [
              <GridActionsCellItem key="copyName" icon={<ContentCopyIcon />} label="Copy Name" onClick={studentActions.copyName(id)} color="inherit" />,
              <GridActionsCellItem key="view" icon={<VisibilityIcon />} label="View Student Details" onClick={studentActions.view(id)} />,
              <GridActionsCellItem key="edit" icon={<EditIcon />} label="Edit Student" onClick={studentActions.edit(id)} color="inherit" />,
              <GridActionsCellItem key="delete" icon={<DeleteIcon />} label="Delete Student" onClick={studentActions.delete(id)} color="inherit" />,
            ];
      },
    },
  ];

  if (isLoading) {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center h-full">
              <Typography variant="h6">Loading...</Typography>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </LocalizationProvider>
    );
  }

  if (error) {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center h-full">
              <Typography variant="h6" color="error">{error}</Typography>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </LocalizationProvider>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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
                  {showStudentsTable ? (
                    <BreadcrumbLink href="#" onClick={() => setShowStudentsTable(false)}>Classes</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>Classes</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {showStudentsTable && selectedClassName && (
                  <>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{selectedClassName} Students</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex flex-1 bg-blue-50 flex-col gap-4 p-4">
            {!showStudentsTable ? (
              <>
                <div className="flex justify-end mb-2">
                  <input
                    type="text"
                    placeholder="Search Classes..."
                    value={classSearchText}
                    onChange={(e) => setClassSearchText(e.target.value)}
                    className="w-full md:w-1/3 px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <Box sx={{ height: 600, width: "100%", "& .actions": { color: "text.secondary" }, "& .textPrimary": { color: "text.primary" } }}>
                  <DataGrid
                    rows={filteredClasses}
                    columns={classColumns}
                    editMode="row"
                    rowModesModel={classRowModesModel}
                    onRowModesModelChange={setClassRowModesModel}
                    onRowEditStop={handleClassRowEditStop}
                    processRowUpdate={processClassRowUpdate}
                    slots={{ toolbar: ClassEditToolbar }}
                    slotProps={{ 
                      toolbar: { 
                        setRows: setClassRows, 
                        setRowModesModel: setClassRowModesModel 
                      } 
                    }}
                    showToolbar
                    onProcessRowUpdateError={(error) => {
                      console.error('Row update failed:', error);
                      handleSnackbarOpen('Failed to save changes. Please try again.');
                    }}
                    sx={{
                      '& .MuiDataGrid-cell': {
                          padding: '8px 16px',
                      },
                      '& .MuiDataGrid-columnHeader': {
                        backgroundColor: '#f5f5f5',
                        fontWeight: 'bold',
                      },
                    }}
                  />

                  <Modal open={!!viewClassRow} onClose={() => setViewClassRow(null)}>
                    <Box sx={{ p: 3, bgcolor: "background.paper", borderRadius: 2, boxShadow: 24, width: 360, mx: "auto", my: "10%" }}>
                      <Typography variant="h6" gutterBottom>Class Details</Typography>
                      {viewClassRow && (
                        <div className="space-y-2">
                          <p><strong>Class Name:</strong> {viewClassRow.name}</p>
                          <p><strong>Teacher:</strong> {viewClassRow.teacher}</p>
                          {viewClassRow.description && <p><strong>Description:</strong> {viewClassRow.description}</p>}
                          {viewClassRow.capacity !== undefined && <p><strong>Capacity:</strong> {viewClassRow.capacity}</p>}
                        </div>
                      )}
                    </Box>
                  </Modal>
                </Box>
              </>
            ) : (
              <>
                <div className="flex justify-start mb-2">
                  <Button variant="outlined" onClick={() => setShowStudentsTable(false)}>
                    Back to Classes
                  </Button>
                </div>

                <div className="flex justify-end mb-2">
                  <input
                    type="text"
                    placeholder={`Search students in ${selectedClassName || ''}...`}
                    value={studentSearchText}
                    onChange={(e) => setStudentSearchText(e.target.value)}
                    className="w-full md:w-1/3 px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <Box sx={{ height: 600, width: "100%", "& .actions": { color: "text.secondary" }, "& .textPrimary": { color: "text.primary" } }}>
                  <DataGrid
                    rows={studentsForSelectedClass}
                    columns={studentColumns}
                    getRowId={(row) => row.id}
                    editMode="row"
                    rowModesModel={studentRowModesModel}
                    onRowModesModelChange={setStudentRowModesModel}
                    onRowEditStop={handleStudentRowEditStop}
                    processRowUpdate={processStudentRowUpdate}
                    slots={{ toolbar: StudentEditToolbar }}
                    slotProps={{ toolbar: {
                      setRows: setAllStudents,
                      setRowModesModel: setStudentRowModesModel,
                      className: selectedClassName || '',
                      onCopyAllStudentNames: handleCopyAllStudentNames,
                      onCopyStudentContactInfo: handleCopyStudentContactInfo,
                      onCopyStudentNameClassContactInfo: handleCopyStudentNameClassContactInfo
                    }}}
                    showToolbar={true}
                    onProcessRowUpdateError={(error) => {
                      console.error('Row update failed:', error);
                      handleSnackbarOpen('Failed to save student changes. Please try again.');
                    }}
                  />
                </Box>

                <Modal open={!!viewStudentRow} onClose={() => setViewStudentRow(null)}>
                  <Box sx={{ p: 3, bgcolor: "background.paper", borderRadius: 2, boxShadow: 24, width: 360, mx: "auto", my: "10%" }}>
                    <Typography variant="h6" gutterBottom>Student Details</Typography>
                    {viewStudentRow && (
                      <div className="space-y-2">
                        {viewStudentRow.image && (
                          <Image 
                            src={viewStudentRow.image} 
                            alt="student photo" 
                            width={64} 
                            height={64} 
                            className="h-16 w-16 rounded-full object-cover" 
                          />
                        )}
                        <p><strong>Name:</strong> {viewStudentRow.name}</p>
                        <p><strong>DOB:</strong> {new Date(viewStudentRow.dob).toLocaleDateString("en-GB")}</p>
                        <p><strong>Gender:</strong> {viewStudentRow.gender}</p>
                        <p><strong>Age:</strong> {viewStudentRow.age}</p>
                        <p><strong>Class:</strong> {viewStudentRow.class}</p>
                        <p><strong>Parent Phone:</strong> {viewStudentRow.parentPhoneNumber || 'N/A'}</p>
                        <p><strong>Parent Email:</strong> {viewStudentRow.parentEmail || 'N/A'}</p>
                      </div>
                    )}
                  </Box>
                </Modal>
              </>
            )}
            <Snackbar
              open={snackbarOpen}
              autoHideDuration={6000}
              onClose={handleSnackbarClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
              <Alert 
                onClose={handleSnackbarClose} 
                severity={snackbarMessage.includes('Failed') ? 'error' : 'success'} 
                sx={{ width: '100%' }}
              >
                {snackbarMessage}
              </Alert>
            </Snackbar>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </LocalizationProvider>
  );
}
