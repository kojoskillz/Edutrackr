"use client";

import * as React from "react";
// Removed unused useRouter import
// import { useRouter } from "next/navigation";
import {
    DataGrid,
    GridColDef,
    GridRowsProp,
    GridRowModes,
    GridRowModesModel, // rowModesModel is used internally by DataGrid when passed as a prop
    GridActionsCellItem,
    GridRowEditStopReasons,
    GridEventListener,
    GridRowModel,
    GridRowId,
    GridSlotProps,
    Toolbar,
    ToolbarButton,
} from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save"; // Correct import path
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from '@mui/icons-material/Visibility'; // Icon for viewing report card
import SchoolIcon from "@mui/icons-material/School"; // Icon for viewing students
import ContentCopyIcon from "@mui/icons-material/ContentCopy"; // Icon for copying
import CancelIcon from "@mui/icons-material/Close"; // Corrected import path

// Removed unused PrintIcon and DownloadIcon imports
// import PrintIcon from '@mui/icons-material/Print'; // Icon for printing
// import DownloadIcon from '@mui/icons-material/Download'; // Import DownloadIcon


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
// import { toast } from "react-toastify"; // toast is not used in this file
import "react-toastify/dist/ReactToastify.css"; // Still needed for the toast styles if used elsewhere in the app
import {
    Button, Typography,Modal, Box, Tooltip, Snackbar, Alert // Added Modal, Box, Tooltip, Snackbar, Alert imports
} from "@mui/material";

// Dynamically import excel libraries using standard import() syntax
// These will be loaded only when needed (e.g., when export functions are called)
// Use React.lazy or dynamic import with a check if needed, but for simple
// client-side use within event handlers, direct dynamic import is fine.
// Removed unused type imports: FileSaverTypes, XLSXTypes


import { DatePicker } from "@mui/x-date-pickers/DatePicker"; // Needed for student DOB
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"; // Needed for DatePicker
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"; // Needed for DatePicker
import dayjs from "dayjs"; // Needed for DatePicker
import { randomId } from "@mui/x-data-grid-generator";
import Image from "next/image"; // Import Next.js Image component


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

// Define the type for a Student row (Copied from the students page)
type StudentRow = {
  id: string;
  name: string;
  dob: string; // ISO string
  age: number;
  class: string; // This will store the class name
  gender?: string;
  image?: string; // DataURL
  isNew?: boolean;
};


// Helper function to calculate age from date of birth (Copied from the students page)
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
    // Add className for the student toolbar
    className?: string; // Optional as it's only for student toolbar
    // Add prop for copying all student names
    onCopyAllStudentNames: () => void;
  }
}

// Toolbar component for the Classes DataGrid, includes an "Add Class" button
function ClassEditToolbar(props: GridSlotProps["toolbar"]) {
  const { setRows, setRowModesModel } = props;
  return (
    <Toolbar>
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
    </Toolbar>
  );
}

// Toolbar component for the Students DataGrid, includes an "Add Student" and "Copy All" button
function StudentEditToolbar(props: GridSlotProps["toolbar"]) {
  const { setRows, setRowModesModel, className, onCopyAllStudentNames } = props; // Receive className and onCopyAllStudentNames props
  return (
    <Toolbar className="flex justify-between w-full">
      <div>
        <Tooltip title={`Add Student to ${className}`}>
          <ToolbarButton
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
                  class: className || "", // Set the class to the current class name, default to empty if not available
                  gender: "Male",
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
      </div>
      <div>
        <Tooltip title={`Copy All Student Names in ${className}`}>
          <ToolbarButton onClick={onCopyAllStudentNames}>
            <ContentCopyIcon fontSize="small" />
          </ToolbarButton>
        </Tooltip>
      </div>
    </Toolbar>
  );
}

// Main page component for managing classes and students on one page
export default function ClassesPage() {
  // State for Class DataGrid
  const [classRows, setClassRows] = React.useState<GridRowsProp>([]); // State for DataGrid rows (classes)
  const [classRowModesModel, setClassRowModesModel] = React.useState<GridRowModesModel>(
    {}
  ); // State for managing class row edit modes
  const [classSearchText, setClassSearchText] = React.useState(""); // State for class search input
  const [viewClassRow, setViewClassRow] = React.useState<ClassRow | null>(null); // State for the class row being viewed in the modal

  // State for Student DataGrid (Copied from the students page)
  const [allStudents, setAllStudents] = React.useState<GridRowsProp>([]); // State for ALL student data
  const [studentRowModesModel, setStudentRowModesModel] = React.useState<GridRowModesModel>(
    {}
  ); // State for managing student row edit modes
  const [studentSearchText, setStudentSearchText] = React.useState(""); // State for student search input
  const [viewStudentRow, setViewStudentRow] = React.useState<StudentRow | null>(null); // State for the student row being viewed in the modal

  // State to manage which table is visible
  const [showStudentsTable, setShowStudentsTable] = React.useState(false);
  // selectedClassId was unused, removed. selectedClassName is used for filtering students.
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

  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect to persist class data to localStorage whenever the 'classRows' state changes
  React.useEffect(() => {
    localStorage.setItem("classes", JSON.stringify(classRows));
  }, [classRows]); // Dependency array ensures this runs whenever 'classRows' changes

    // Effect to persist ALL student data to localStorage whenever the 'allStudents' state changes
  React.useEffect(() => {
    localStorage.setItem("students", JSON.stringify(allStudents));
  }, [allStudents]); // Dependency array ensures this runs whenever 'allStudents' changes


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
        // Removed setSelectedClassId as it was unused
        setSelectedClassName(className);
        setShowStudentsTable(true);
    },
  };

  // Function to copy a single student name to the clipboard
  const handleCopySingleStudentName = (name: string) => {
    navigator.clipboard.writeText(name).then(() => {
      handleSnackbarOpen(`Copied "${name}"`); // Escaped quotes
    }).catch(err => {
      console.error("Failed to copy student name: ", err);
      handleSnackbarOpen("Failed to copy name");
    });
  };

    // Function to copy all visible student names to the clipboard
  const handleCopyAllStudentNames = () => {
      const names = studentsForSelectedClass.map(student => (student as StudentRow).name);
      if (names.length > 0) {
          const namesString = names.join('\n'); // Join names with newlines
          navigator.clipboard.writeText(namesString).then(() => {
              handleSnackbarOpen(`Copied ${names.length} student name(s)`); // Escaped quotes
          }).catch(err => {
              console.error("Failed to copy all student names: ", err);
              handleSnackbarOpen("Failed to copy names");
          });
      } else {
          handleSnackbarOpen("No students to copy");
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
    } as ClassRow; // Cast to ClassRow

    // Update the rows state with the modified row
    setClassRows((r) => r.map((x) => (x.id === newRow.id ? updated : x)));
    return updated; // Return the updated row
  };

    // Function to process updates to a Student row after editing
  const processStudentRowUpdate = (newRow: GridRowModel) => {
    // Calculate age based on the updated DOB
    const updated: StudentRow = {
      ...newRow,
      age: calculateAge(newRow.dob as string), // Ensure dob is treated as string
      isNew: false, // Mark as not new after saving
    } as StudentRow; // Cast to StudentRow

    // Update the ALL students state with the modified row
    setAllStudents((r) => r.map((x) => (x.id === newRow.id ? updated : x)));
    return updated; // Return the updated row
  };


  // Filter the Class rows based on the search text
  const filteredClasses = classRows.filter((r) => {
    const t = classSearchText.toLowerCase();
    const row = r as ClassRow; // Cast for type safety

    return (
      (row.name?.toLowerCase() ?? "").includes(t) || // Check class name
      (row.teacher?.toLowerCase() ?? "").includes(t) || // Check teacher name
      (row.description?.toLowerCase() ?? "").includes(t) // Check description
    );
  });

  // Filter the ALL students based on the selected class and search text
  const studentsForSelectedClass = React.useMemo(() => {
    const t = studentSearchText.toLowerCase();
      return allStudents.filter((r) => {
        const row = r as StudentRow; // Cast for type safety
        // Filter by selected class first, then by search text
        return row.class === selectedClassName && (
            (row.name?.toLowerCase() ?? "").includes(t) || // Check name
            (row.class?.toLowerCase() ?? "").includes(t) || // Check class (redundant after class filter, but good for robustness)
            (row.dob?.includes(t) ?? false) || // Check date of birth string
            (row.gender?.toLowerCase() ?? "").includes(t) // Check gender
        );
      });
  }, [allStudents, selectedClassName, studentSearchText]); // Recalculate when allStudents, selectedClassName, or studentSearchText changes


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
      width: 200, // Increased width to accommodate the new action
      getActions: ({ id, row }) => {
        const isEdit = classRowModesModel[id]?.mode === GridRowModes.Edit;
        const classRow = row as ClassRow; // Cast row to ClassRow

        // Render different actions based on whether the row is in edit mode
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
               // This action now triggers showing the student table on the same page
               <GridActionsCellItem
                 key="viewStudents"
                 icon={<SchoolIcon />}
                 label="View Students"
                 onClick={classActions.viewStudents(id, classRow.name)} // Call the action to switch view
                 color="inherit"
               />,
              <GridActionsCellItem
                key="view"
                icon={<VisibilityIcon />}
                label="View Class Details" // Updated label for clarity
                onClick={classActions.view(id)}
              />,
              <GridActionsCellItem
                key="edit"
                icon={<EditIcon />}
                label="Edit Class" // Updated label for clarity
                onClick={classActions.edit(id)}
                color="inherit"
              />,
              <GridActionsCellItem
                key="delete"
                icon={<DeleteIcon />}
                label="Delete Class" // Updated label for clarity
                onClick={classActions.delete(id)}
                color="inherit"
              />,
            ];
      },
    },
  ];

    // Define the columns for the Students DataGrid (Copied from the students page)
  const studentColumns: GridColDef[] = [
    {
      field: "image",
      headerName: "Photo",
      width: 100,
      editable: true,
      renderCell: (p) =>
        // Render image if available
        // Using Next.js <Image /> for optimized image rendering.
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
        // Render a file input for image selection in edit mode
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
                // Set the cell value to the data URL of the selected image
                api.setEditCellValue(
                  { id, field, value: reader.result },
                  undefined
                );
              };
              reader.readAsDataURL(file); // Read the file as a data URL
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
      // Render the date in a human-readable format
      renderCell: (p) =>
        p.value ? new Date(p.value as string).toLocaleDateString("en-GB") : "",
      renderEditCell: (params) => {
        const { id, field, value, api } = params;
        // Render a DatePicker for editing the date of birth
        return (
          <DatePicker
            value={value ? dayjs(value as string) : null} // Use dayjs for DatePicker value
            onChange={(v) => {
              // Set the cell value to the ISO string of the selected date
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
      type: "singleSelect", // Use a single select dropdown for gender
      valueOptions: ["Male", "Female", "Other"], // Define available options
    },
    {
      field: "age",
      headerName: "Age",
      width: 80,
      type: "number",
      editable: false, // Age is calculated, not directly editable
    },
    {
        // The class field is included but not editable on this page
        // as students are managed *within* a specific class context here.
        field: "class",
        headerName: "Class",
        width: 140,
        editable: false, // Not editable in this view
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 170, // Increased width to accommodate the new action
      getActions: ({ id }) => { // Removed 'row' parameter
        const isEdit = studentRowModesModel[id]?.mode === GridRowModes.Edit;
         // studentRow was unused, removed.
        // const studentRow = allStudents.find((r) => r.id === id) as StudentRow; // Moved lookup inside specific action handlers if needed

        // Render different actions based on whether the row is in edit mode
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
    // LocalizationProvider is needed for the DatePicker component (used in student table)
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* Header section with sidebar trigger and breadcrumb */}
          <header className="flex h-16 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Dashboard</BreadcrumbLink> {/* Update href as needed */}
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    {/* Breadcrumb link back to classes if viewing students */}
                   {showStudentsTable ? (
                        <BreadcrumbLink href="#" onClick={() => setShowStudentsTable(false)}>Classes</BreadcrumbLink>
                   ) : (
                        <BreadcrumbPage>Classes</BreadcrumbPage>
                   )}
                  </BreadcrumbItem>
                  {/* Show current class in breadcrumb if viewing students */}
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

          {/* Main content area */}
          <div className="flex flex-1 bg-gray-300 flex-col gap-4 p-4">

            {/* Conditional Rendering: Show Classes Table or Students Table */}
            {!showStudentsTable ? (
                // --- Classes Table View ---
                <>
                    {/* Search input for Classes */}
                    <div className="flex justify-end mb-2">
                        <input
                            type="text"
                            placeholder="Search Classes..."
                            value={classSearchText}
                            onChange={(e) => setClassSearchText(e.target.value)}
                            className="w-full md:w-1/3 px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* DataGrid container for Classes */}
                    <Box
                      sx={{
                        height: 600,
                        width: "100%",
                        "& .actions": { color: "text.secondary" },
                        "& .textPrimary": { color: "text.primary" },
                      }}
                    >
                      {/* Material UI DataGrid component for Classes */}
                      <DataGrid
                        rows={filteredClasses} // Use filtered class rows
                        columns={classColumns}
                        editMode="row" // Enable row editing
                        rowModesModel={classRowModesModel}
                        onRowModesModelChange={setClassRowModesModel}
                        onRowEditStop={handleClassRowEditStop}
                        processRowUpdate={processClassRowUpdate} // Function to call after row update
                        slots={{ toolbar: ClassEditToolbar }} // Use custom toolbar (contains the Add Class button)
                        slotProps={{ toolbar: { setRows: setClassRows, setRowModesModel: setClassRowModesModel } }} // Pass props to toolbar
                        showToolbar // Display the toolbar
                      />
                    </Box>

                    {/* Modal for viewing class details */}
                    <Modal open={!!viewClassRow} onClose={() => setViewClassRow(null)}>
                      <Box
                        sx={{
                          p: 3,
                          bgcolor: "background.paper",
                          borderRadius: 2,
                          boxShadow: 24,
                          width: 360,
                          mx: "auto", // Center the modal horizontally
                          my: "10%", // Position the modal vertically
                        }}
                      >
                        <Typography variant="h6" gutterBottom>
                          Class Details
                        </Typography>
                        {viewClassRow && (
                          <div className="space-y-2">
                            {/* Display class details */}
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
                // --- Students Table View ---
                <>
                    {/* Back to Classes Button */}
                    <div className="flex justify-start mb-2">
                        <Button variant="outlined" onClick={() => setShowStudentsTable(false)}>
                            Back to Classes
                        </Button>
                    </div>

                    {/* Search input for Students */}
                    <div className="flex justify-end mb-2">
                        <input
                            type="text"
                            placeholder={`Search students in ${selectedClassName || ''}...`} // Dynamic placeholder
                            value={studentSearchText}
                            onChange={(e) => setStudentSearchText(e.target.value)}
                            className="w-full md:w-1/3 px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* DataGrid container for Students */}
                    <Box
                      sx={{
                        height: 600,
                        width: "100%",
                        "& .actions": { color: "text.secondary" },
                        "& .textPrimary": { color: "text.primary" },
                      }}
                    >
                      {/* Material UI DataGrid component for Students */}
                      <DataGrid
                        rows={studentsForSelectedClass} // Use filtered student rows for the selected class
                        columns={studentColumns}
                        editMode="row" // Enable row editing
                        rowModesModel={studentRowModesModel}
                        onRowModesModelChange={setStudentRowModesModel}
                        onRowEditStop={handleStudentRowEditStop}
                        processRowUpdate={processStudentRowUpdate} // Function to call after row update
                        slots={{ toolbar: StudentEditToolbar }} // Use custom toolbar (contains the Add Student and Copy All button)
                        slotProps={{ toolbar: { setRows: setAllStudents, setRowModesModel: setStudentRowModesModel, className: selectedClassName || '', onCopyAllStudentNames: handleCopyAllStudentNames } }} // Pass props including className and copy handler
                      />
                    </Box>

                    {/* Modal for viewing student details */}
                    <Modal open={!!viewStudentRow} onClose={() => setViewStudentRow(null)}>
                      <Box
                        sx={{
                          p: 3,
                          bgcolor: "background.paper",
                          borderRadius: 2,
                          boxShadow: 24,
                          width: 360,
                          mx: "auto", // Center the modal horizontally
                          my: "10%", // Position the modal vertically
                        }}
                      >
                        <Typography variant="h6" gutterBottom>
                          Student Details
                        </Typography>
                        {viewStudentRow && (
                          <div className="space-y-2">
                            {/* Display student image if available */}
                            {/* Using <img> tag here as this is a standalone React component,
                                not a Next.js application where next/image would be preferred for optimization. */}
                            {viewStudentRow.image && (
                              <Image
                                src={viewStudentRow.image}
                                alt="student photo"
                                width={64}
                                height={64}
                                className="h-16 w-16 rounded-full object-cover"
                              />
                            )}
                            {/* Display student details */}
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
                          </div>
                        )}
                      </Box>
                    </Modal>
                </>
            )}
             {/* Snackbar for copy feedback */}
             <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000} // Auto-hide after 3 seconds
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
