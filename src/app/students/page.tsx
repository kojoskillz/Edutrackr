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


// --- Type Definitions ---

// Define the type for a Class row
type ClassRow = {
  id: string;
  name: string;
  teacher: string;
  description?: string;
  capacity?: number;
  isNew?: boolean;
};

// Define the type for a Student row, including new parent contact fields
type StudentRow = {
  id: string;
  name: string;
  dob: string; // ISO string
  age: number;
  class: string; // This will store the class name
  gender?: string;
  image?: string; // DataURL
  parentPhoneNumber?: string; // New field for parent's phone number
  parentEmail?: string; // New field for parent's email address
  isNew?: boolean;
};


// Helper function to calculate age from date of birth
const calculateAge = (dob: string) => {
  const b = new Date(dob),
    today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age;
};

// Declare module for ToolbarPropsOverrides (Updated to include className for student toolbar)
declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides {
    setRows: React.Dispatch<React.SetStateAction<GridRowsProp>>;
    setRowModesModel: React.Dispatch<React.SetStateAction<GridRowModesModel>>;
    className?: string;
    onCopyAllStudentNames: () => void;
    onCopyStudentContactInfo: () => void;
    onCopyStudentNameClassContactInfo: () => void; // New prop for copying name, class, phone, email
  }
}

// Toolbar component for the Classes DataGrid, includes an "Add Class" button
function ClassEditToolbar(props: GridSlotProps["toolbar"]) {
  const { setRows, setRowModesModel } = props;
  return (
    <GridToolbarContainer>
      <Tooltip title="Add Class">
        <ToolbarButton
          onClick={() => {
            const id = randomId();
            // Add a new empty row with a unique ID and the 'isNew' flag for a class
            setRows((r: GridRowsProp) => [
              ...r,
              {
                id,
                name: "",
                teacher: "",
                description: "",
                capacity: 0,
                isNew: true,
              },
            ]);
            // Set the new row to edit mode and focus on the 'name' field
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

// Toolbar component for the Students DataGrid, includes "Add Student", "Copy All Names", and "Copy Contact Info" buttons
function StudentEditToolbar(props: GridSlotProps["toolbar"]) {
  const { setRows, setRowModesModel, className, onCopyAllStudentNames, onCopyStudentContactInfo, onCopyStudentNameClassContactInfo } = props;
  return (
    <GridToolbarContainer className="flex justify-between w-full">
      <div>
        <Tooltip title={`Add Student to ${className}`}>
          <ToolbarButton
            color="primary"
            size="small" // ADDED: Make the button smaller
            className=" hover:bg-blue-600 transition-colors duration-200"
            onClick={() => {
              const id = randomId();
              // Add a new empty row, pre-filling the class with the current className
              setRows((r) => [
                ...r,
                {
                  id,
                  name: "",
                  dob: "",
                  age: 0,
                  class: className || "",
                  gender: "Male",
                  parentPhoneNumber: "", // Initialize new fields
                  parentEmail: "", // Initialize new fields
                  isNew: true,
                },
              ]);
              // Set the new row to edit mode and focus on the 'name' field
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
        {/* Group copy buttons */}
        <Tooltip title={`Copy All Student Names in ${className}`}>
          <ToolbarButton
            color="primary"
            size="small" // ADDED: Make the button smaller
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
            size="small" // ADDED: Make the button smaller
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
            size="small" // ADDED: Make the button smaller
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

// Main page component for managing classes and students on one page
export default function ClassesPage() {
  // State for Class DataGrid
  const [classRows, setClassRows] = React.useState<GridRowsProp>([]);
  const [classRowModesModel, setClassRowModesModel] = React.useState<GridRowModesModel>(
    {}
  );
  const [classSearchText, setClassSearchText] = React.useState("");
  const [viewClassRow, setViewClassRow] = React.useState<ClassRow | null>(null);

  // State for Student DataGrid
  const [allStudents, setAllStudents] = React.useState<GridRowsProp>([]);
  const [studentRowModesModel, setStudentRowModesModel] = React.useState<GridRowModesModel>(
    {}
  );
  const [studentSearchText, setStudentSearchText] = React.useState("");
  const [viewStudentRow, setViewStudentRow] = React.useState<StudentRow | null>(null);

  // State to manage which table is visible
  const [showStudentsTable, setShowStudentsTable] = React.useState(false);
  const [selectedClassName, setSelectedClassName] = React.useState<string | null>(null);

  // State for copy feedback Snackbar
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState("");


  // Effect to load class data from localStorage on component mount
  React.useEffect(() => {
    const savedClasses = localStorage.getItem("classes");
    if (savedClasses) {
      try {
        setClassRows(JSON.parse(savedClasses));
      } catch (error) {
        console.error("Failed to parse class data from localStorage", error);
        setClassRows([]);
      }
    } else {
      setClassRows([]);
    }

    // Effect to load ALL student data from localStorage on component mount
    const savedStudents = localStorage.getItem("students");
    if (savedStudents) {
        try {
            setAllStudents(JSON.parse(savedStudents));
        } catch (error) {
            console.error("Failed to parse student data from localStorage", error);
            setAllStudents([]);
        }
    } else {
        setAllStudents([]);
    }

  }, []);

  // Effect to persist class data to localStorage whenever the 'classRows' state changes
  React.useEffect(() => {
    localStorage.setItem("classes", JSON.stringify(classRows));
  }, [classRows]);

    // Effect to persist ALL student data to localStorage whenever the 'allStudents' state changes
  React.useEffect(() => {
    localStorage.setItem("students", JSON.stringify(allStudents));
  }, [allStudents]);


  // Handler for when class row editing stops
  const handleClassRowEditStop: GridEventListener<"rowEditStop"> = (
    params,
    event
  ) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

    // Handler for when student row editing stops
  const handleStudentRowEditStop: GridEventListener<"rowEditStop"> = (
    params,
    event
  ) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  // Handler for opening the copy feedback Snackbar
  const handleSnackbarOpen = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  // Handler for closing the copy feedback Snackbar
  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // Action handlers for Class DataGrid rows (edit, save, cancel, delete, view, view students)
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
      // If the row was newly added, remove it on cancel
      const row = classRows.find((r) => r.id === id) as ClassRow;
      if (row?.isNew) {
        setClassRows((r) => r.filter((x) => x.id !== id));
      }
    },
    delete: (id: GridRowId) => () =>
      setClassRows((r) => r.filter((x) => x.id !== id)),
    view: (id: GridRowId) => () => {
      // Find the row and set it to be viewed in the modal
      const row = classRows.find((r) => r.id === id) as ClassRow;
      setViewClassRow(row);
    },
    // Action to view students for a specific class (switches to student table view)
    viewStudents: (id: GridRowId, className: string) => () => {
        setSelectedClassName(className);
        setShowStudentsTable(true);
    },
  };

  // Function to copy a single student name to the clipboard
  const handleCopySingleStudentName = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);
      handleSnackbarOpen(`Copied "${name}"`);
    } catch (err) {
      console.error("Failed to copy student name: ", err);
      handleSnackbarOpen("Failed to copy name. Please try again.");
    }
  };

    // Function to copy all visible student names to the clipboard
  const handleCopyAllStudentNames = async () => {
      const names = studentsForSelectedClass.map(student => (student as StudentRow).name);
      if (names.length > 0) {
          const namesString = names.join('\n');
          try {
              await navigator.clipboard.writeText(namesString);
              handleSnackbarOpen(`Copied ${names.length} student name(s)`);
          } catch (err) {
              console.error("Failed to copy all student names: ", err);
              handleSnackbarOpen("Failed to copy names. Please try again.");
          }
      } else {
          handleSnackbarOpen("No students to copy");
      }
  };

  // Function to copy student names, phone numbers, and emails to the clipboard
  const handleCopyStudentContactInfo = async () => {
    const contactInfo = studentsForSelectedClass.map(student => {
      const s = student as StudentRow;
      return `${s.name} - Phone: ${s.parentPhoneNumber || 'N/A'}, Email: ${s.parentEmail || 'N/A'}`;
    });

    if (contactInfo.length > 0) {
      const contactInfoString = contactInfo.join('\n');
      try {
          await navigator.clipboard.writeText(contactInfoString);
          handleSnackbarOpen(`Copied contact info for ${contactInfo.length} student(s)`);
      } catch (err) {
          console.error("Failed to copy contact info: ", err);
          handleSnackbarOpen("Failed to copy contact info. Please try again.");
      }
    } else {
      handleSnackbarOpen("No student contact info to copy");
    }
  };

  // Function to copy student names, class, phone numbers, and emails to the clipboard
  const handleCopyStudentNameClassContactInfo = async () => {
    const combinedInfo = studentsForSelectedClass.map(student => {
      const s = student as StudentRow;
      return `${s.name}, Class: ${s.class}, Phone: ${s.parentPhoneNumber || 'N/A'}, Email: ${s.parentEmail || 'N/A'}`;
    });

    if (combinedInfo.length > 0) {
      const combinedInfoString = combinedInfo.join('\n');
      try {
          await navigator.clipboard.writeText(combinedInfoString);
          handleSnackbarOpen(`Copied names, class, and contact info for ${combinedInfo.length} student(s)`);
      } catch (err) {
          console.error("Failed to copy combined info: ", err);
          handleSnackbarOpen("Failed to copy combined info. Please try again.");
      }
    } else {
      handleSnackbarOpen("No student data to copy");
    }
  };


  // Action handlers for Student DataGrid rows (edit, save, cancel, delete, view, copy)
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
      // If the row was newly added and belongs to this class, remove it on cancel
      const row = allStudents.find((r) => r.id === id) as StudentRow;
      if (row?.isNew && row.class === selectedClassName) {
        setAllStudents((r) => r.filter((x) => x.id !== id));
      } else if (row?.isNew) {
          // If it was a new row but somehow not assigned to this class, still remove it.
          setAllStudents((r) => r.filter((x) => x.id !== id));
      }
    },
    delete: (id: GridRowId) => () =>
      // Delete the student from the overall list
      setAllStudents((r) => r.filter((x) => x.id !== id)),
    view: (id: GridRowId) => () => {
      // Find the row and set it to be viewed in the modal
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


  // Function to process updates to a Class row after editing
  const processClassRowUpdate = (newRow: GridRowModel) => {
    const updated: ClassRow = {
      ...newRow,
      isNew: false, // Mark as not new after saving
    } as ClassRow;

    // Update the rows state with the modified row
    setClassRows((r) => r.map((x) => (x.id === newRow.id ? updated : x)));
    return updated;
  };

    // Function to process updates to a Student row after editing
  const processStudentRowUpdate = (newRow: GridRowModel) => {
    // Calculate age based on the updated DOB
    const updated: StudentRow = {
      ...newRow,
      age: calculateAge(newRow.dob as string),
      isNew: false,
    } as StudentRow;

    // Update the ALL students state with the modified row
    setAllStudents((r) => r.map((x) => (x.id === newRow.id ? updated : x)));
    return updated;
  };


  // Filter the Class rows based on the search text
  const filteredClasses = classRows.filter((r) => {
    const t = classSearchText.toLowerCase();
    const row = r as ClassRow;

    return (
      (row.name?.toLowerCase() ?? "").includes(t) ||
      (row.teacher?.toLowerCase() ?? "").includes(t) ||
      (row.description?.toLowerCase() ?? "").includes(t)
    );
  });

  // Filter the ALL students based on the selected class and search text
  const studentsForSelectedClass = React.useMemo(() => {
    const t = studentSearchText.toLowerCase();
      return allStudents.filter((r) => {
        const row = r as StudentRow;
        // Filter by selected class first, then by search text
        return row.class === selectedClassName && (
            (row.name?.toLowerCase() ?? "").includes(t) ||
            (row.class?.toLowerCase() ?? "").includes(t) ||
            (row.dob?.includes(t) ?? false) ||
            (row.gender?.toLowerCase() ?? "").includes(t) ||
            (row.parentPhoneNumber?.includes(t) ?? false) || // Search parent phone number
            (row.parentEmail?.toLowerCase() ?? "").includes(t) // Search parent email
        );
      });
  }, [allStudents, selectedClassName, studentSearchText]);


  // Define the columns for the Classes DataGrid
  const classColumns: GridColDef[] = [
    { field: "name", headerName: "Class Name", width: 180, editable: true },
    { field: "teacher", headerName: "Teacher", width: 180, editable: true },
    {
      field: "description",
      headerName: "Description",
      width: 250,
      editable: true,
    },
    {
      field: "capacity",
      headerName: "Capacity",
      width: 100,
      type: "number",
      editable: true,
    },
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
              <GridActionsCellItem
                key="save"
                icon={<SaveIcon />}
                label="Save"
                onClick={classActions.save(id)}
                color="primary"
              />,
              <GridActionsCellItem
                key="cancel"
                icon={<CancelIcon />}
                label="Cancel"
                onClick={classActions.cancel(id)}
              />,
            ]
          : [
               <GridActionsCellItem
                 key="viewStudents"
                 icon={<SchoolIcon />}
                 label="View Students"
                 onClick={classActions.viewStudents(id, classRow.name)}
                 color="inherit"
               />,
              <GridActionsCellItem
                key="view"
                icon={<VisibilityIcon />}
                label="View Class Details"
                onClick={classActions.view(id)}
              />,
              <GridActionsCellItem
                key="edit"
                icon={<EditIcon />}
                label="Edit Class"
                onClick={classActions.edit(id)}
                color="inherit"
              />,
              <GridActionsCellItem
                key="delete"
                icon={<DeleteIcon />}
                label="Delete Class"
                onClick={classActions.delete(id)}
                color="inherit"
              />,
            ];
      },
    },
  ];

    // Define the columns for the Students DataGrid, including new parent contact fields
  const studentColumns: GridColDef[] = [
    {
      field: "image",
      headerName: "Photo",
      width: 100,
      editable: true,
      renderCell: (p) =>
        p.value ? (
          <Image
            src={p.value as string}
            alt="student photo"
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : null,
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
                api.setEditCellValue(
                  { id, field, value: reader.result },
                  undefined
                );
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
      renderCell: (p) =>
        p.value ? new Date(p.value as string).toLocaleDateString("en-GB") : "",
      renderEditCell: (params) => {
        const { id, field, value, api } = params;
        return (
          <DatePicker
            value={value ? dayjs(value as string) : null}
            onChange={(v) => {
              api.setEditCellValue(
                { id, field, value: v?.toISOString() },
                undefined
              );
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
    {
      field: "age",
      headerName: "Age",
      width: 80,
      type: "number",
      editable: false,
    },
    {
        field: "class",
        headerName: "Class",
        width: 140,
        editable: false,
    },
    {
      field: "parentPhoneNumber", // New column for parent phone number
      headerName: "Parent Phone",
      width: 150,
      editable: true,
    },
    {
      field: "parentEmail", // New column for parent email
      headerName: "Parent Email",
      width: 200,
      editable: true,
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 170,
      getActions: ({ id }) => {
        const isEdit = studentRowModesModel[id]?.mode === GridRowModes.Edit;

        return isEdit
          ? [
              <GridActionsCellItem
                key="save"
                icon={<SaveIcon />}
                label="Save"
                onClick={studentActions.save(id)}
                color="primary"
              />,
              <GridActionsCellItem
                key="cancel"
                icon={<CancelIcon />}
                label="Cancel"
                onClick={studentActions.cancel(id)}
              />,
            ]
          : [
              <GridActionsCellItem
                  key="copyName"
                  icon={<ContentCopyIcon />}
                  label="Copy Name"
                  onClick={studentActions.copyName(id)}
                  color="inherit"
              />,
              <GridActionsCellItem
                key="view"
                icon={<VisibilityIcon />}
                label="View Student Details"
                onClick={studentActions.view(id)}
              />,
              <GridActionsCellItem
                key="edit"
                icon={<EditIcon />}
                label="Edit Student"
                onClick={studentActions.edit(id)}
                color="inherit"
              />,
              <GridActionsCellItem
                key="delete"
                icon={<DeleteIcon />}
                label="Delete Student"
                onClick={studentActions.delete(id)}
                color="inherit"
              />,
            ];
      },
    },
  ];


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

                    <Box
                      sx={{
                        height: 600,
                        width: "100%",
                        "& .actions": { color: "text.secondary" },
                        "& .textPrimary": { color: "text.primary" },
                      }}
                    >
                      <DataGrid
                        rows={filteredClasses}
                        columns={classColumns}
                        editMode="row"
                        rowModesModel={classRowModesModel}
                        onRowModesModelChange={setClassRowModesModel}
                        onRowEditStop={handleClassRowEditStop}
                        processRowUpdate={processClassRowUpdate}
                        slots={{ toolbar: ClassEditToolbar }}
                        slotProps={{ toolbar: { setRows: setClassRows, setRowModesModel: setClassRowModesModel } }}
                        showToolbar
                      />
                    </Box>

                    <Modal open={!!viewClassRow} onClose={() => setViewClassRow(null)}>
                      <Box
                        sx={{
                          p: 3,
                          bgcolor: "background.paper",
                          borderRadius: 2,
                          boxShadow: 24,
                          width: 360,
                          mx: "auto",
                          my: "10%",
                        }}
                      >
                        <Typography variant="h6" gutterBottom>
                          Class Details
                        </Typography>
                        {viewClassRow && (
                          <div className="space-y-2">
                            <p>
                              <strong>Class Name:</strong> {viewClassRow.name}
                            </p>
                            <p>
                              <strong>Teacher:</strong> {viewClassRow.teacher}
                            </p>
                            {viewClassRow.description && (
                              <p>
                                <strong>Description:</strong> {viewClassRow.description}
                              </p>
                            )}
                            {viewClassRow.capacity !== undefined && (
                              <p>
                                <strong>Capacity:</strong> {viewClassRow.capacity}
                              </p>
                            )}
                          </div>
                        )}
                      </Box>
                    </Modal>
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

                    <Box
                      sx={{
                        height: 600,
                        width: "100%",
                        "& .actions": { color: "text.secondary" },
                        "& .textPrimary": { color: "text.primary" },
                      }}
                    >
                      <DataGrid
                        rows={studentsForSelectedClass}
                        columns={studentColumns}
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
                      />
                    </Box>

                    <Modal open={!!viewStudentRow} onClose={() => setViewStudentRow(null)}>
                      <Box
                        sx={{
                          p: 3,
                          bgcolor: "background.paper",
                          borderRadius: 2,
                          boxShadow: 24,
                          width: 360,
                          mx: "auto",
                          my: "10%",
                        }}
                      >
                        <Typography variant="h6" gutterBottom>
                          Student Details
                        </Typography>
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
                            <p>
                              <strong>Name:</strong> {viewStudentRow.name}
                            </p>
                            <p>
                              <strong>DOB:</strong>{" "}
                              {new Date(viewStudentRow.dob).toLocaleDateString("en-GB")}
                            </p>
                            <p>
                              <strong>Gender:</strong> {viewStudentRow.gender}
                            </p>
                            <p>
                              <strong>Age:</strong> {viewStudentRow.age}
                            </p>
                            <p>
                              <strong>Class:</strong> {viewStudentRow.class}
                            </p>
                            <p>
                              <strong>Parent Phone:</strong> {viewStudentRow.parentPhoneNumber || 'N/A'}
                            </p>
                            <p>
                              <strong>Parent Email:</strong> {viewStudentRow.parentEmail || 'N/A'}
                            </p>
                          </div>
                        )}
                      </Box>
                    </Modal>
                </>
            )}
             <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </LocalizationProvider>
  );
}
