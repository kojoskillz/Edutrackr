"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
  GridSelectionModel,
} from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
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
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, InputLabel, FormControl } from "@mui/material";
//import * as FileSaver from 'file-saver'; // Removed direct import
//import * as XLSX from 'xlsx';   // Removed direct import

// Use dynamic import instead
const FileSaver = typeof window !== 'undefined' ? require('file-saver') : null;
const XLSX = typeof window !== 'undefined' ? require('xlsx') : null;

type StudentRow = {
  id: string;
  name: string;
  cat1?: number;
  cat2?: number;
  projectWork?: number;
  exams?: number;
  total?: number;
  position?: string;
  remarks?: string;
  isNew?: boolean;
};

type ClassData = {
  id: string;
  name: string;
};

export default function ClassPage() {
  const router = useRouter();
  const [rows, setRows] = React.useState<GridRowsProp<StudentRow>>([]);
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>();
  const [selectionModel, setSelectionModel] = React.useState<string[]>([]);
  const [isComponentMounted, setIsComponentMounted] = React.useState(false);
  const isMountedRef = React.useRef(false);

  const [selectedClassId, setSelectedClassId] = React.useState<string | null>(null);
  const [subject, setSubject] = React.useState("N/A");
  const [term, setTerm] = React.useState("N/A");
  const [year, setYear] = React.useState("N/A");
  const [subjectTeacher, setSubjectTeacher] = React.useState("N/A");
  const [className, setClassName] = React.useState("N/A");
  const [overallClassNumber, setOverallClassNumber] = React.useState<number | string>(0); // Changed to number | string

  const [openAddStudentDialog, setOpenAddStudentDialog] = React.useState(false);
  const [newStudentName, setNewStudentName] = React.useState("");
  const [openEditHeaderDialog, setOpenEditHeaderDialog] = React.useState(false);
  const [headerData, setHeaderData] = React.useState({
    subject: "N/A",
    term: "N/A",
    year: "N/A",
    subjectTeacher: "N/A",
    className: "N/A",
    overallClassNumber: 0, // Changed to 0
  });

  const [openCreateClassDialog, setOpenCreateClassDialog] = React.useState(false);
  const [newClassData, setNewClassData] = React.useState({
    name: "",
  });
  const [classes, setClasses] = React.useState<ClassData[]>([]);
  const [showClass, setShowClass] = React.useState(false);


  React.useEffect(() => {
    isMountedRef.current = true;
    setIsComponentMounted(true);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("resultSheetData");
      const savedClasses = localStorage.getItem("classes");
      const savedSelectedClassId = localStorage.getItem("selectedClassId");
      const savedSubject = localStorage.getItem("subject");
      const savedTerm = localStorage.getItem("term");
      const savedYear = localStorage.getItem("year");
      const savedSubjectTeacher = localStorage.getItem("subjectTeacher");
      const savedClassName = localStorage.getItem("className");
      const savedOverallClassNumber = localStorage.getItem("overallClassNumber");


      if (saved) {
        try {
          setRows(JSON.parse(saved));
        } catch (error) {
          console.error("Failed to parse saved data:", error);
          localStorage.removeItem("resultSheetData");
          setRows([]);
          toast.error("Invalid data found in local storage.  Cleared.");
        }
      }
      if (savedClasses) {
        try {
          setClasses(JSON.parse(savedClasses));
        } catch (error) {
          console.error("Failed to parse saved classes:", error);
          localStorage.removeItem("classes");
          setClasses([]);
          toast.error("Invalid class data found in local storage. Cleared.");
        }
      }
      if (savedSelectedClassId) {
        setSelectedClassId(savedSelectedClassId);
      }
      if (savedSubject) {
        setSubject(savedSubject);
      }
      if (savedTerm) {
        setTerm(savedTerm);
      }
      if (savedYear) {
        setYear(savedYear);
      }
      if (savedSubjectTeacher) {
        setSubjectTeacher(savedSubjectTeacher);
      }
      if (savedClassName) {
        setClassName(savedClassName);
      }
      if (savedOverallClassNumber) {
        setOverallClassNumber(JSON.parse(savedOverallClassNumber));
      }
    }
    setHeaderData({
      subject,
      term,
      year,
      subjectTeacher,
      className,
      overallClassNumber
    })
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (typeof window !== "undefined" && isComponentMounted) {
      localStorage.setItem("resultSheetData", JSON.stringify(rows));
      localStorage.setItem("classes", JSON.stringify(classes));
      localStorage.setItem("selectedClassId", selectedClassId || "");
      localStorage.setItem("subject", subject);
      localStorage.setItem("term", term);
      localStorage.setItem("year", year);
      localStorage.setItem("subjectTeacher", subjectTeacher);
      localStorage.setItem("className", className);
      localStorage.setItem("overallClassNumber", JSON.stringify(overallClassNumber));
    }
  }, [rows, isComponentMounted, classes, selectedClassId, subject, term, year, subjectTeacher, className, overallClassNumber]);

  const columns: GridColDef[] = React.useMemo(() => [
    { field: "name", headerName: "Name of Students", width: 200, editable: true },
    {
      field: "cat1",
      headerName: "CAT 1 (10)",
      width: 100,
      editable: true,
      type: "number",
      valueParser: (value) => Number(value) || 0,
    },
    {
      field: "cat2",
      headerName: "CAT 2 (20)",
      width: 100,
      editable: true,
      type: "number",
      valueParser: (value) => Number(value) || 0,
    },
    {
      field: "projectWork",
      headerName: "Project Work (20)",
      width: 120,
      editable: true,
      type: "number",
      valueParser: (value) => Number(value) || 0,
    },
    {
      field: "exams",
      headerName: "Exams (100)",
      width: 100,
      editable: true,
      type: "number",
      valueParser: (value) => Number(value) || 0,
    },
    {
      field: "total",
      headerName: "Total (100%)",
      width: 120,
      valueGetter: (params) => {
        if (params && params.row) {
          const cat1 = params.row.cat1 || 0;
          const cat2 = params.row.cat2 || 0;
          const projectWork = params.row.projectWork || 0;
          const exams = params.row.exams || 0;
          const total = cat1 + cat2 + projectWork + (exams / 2);
          return parseFloat(total.toFixed(2));
        }
        return 0;
      },
      sortable: true,
      editable: false, // Make 'Total' column not editable
    },
    { field: "position", headerName: "Position", width: 100, sortable: true, editable: false },
    { field: "remarks", headerName: "Remarks", width: 120, editable: true },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 100,
      getActions: ({ id }) => [
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Delete"
          onClick={handleDeleteSingle(id as string)}
        />,
      ],
    },
  ], []);

  const handleAddStudent = () => {
    setOpenAddStudentDialog(true);
  };

  const handleCloseAddStudentDialog = () => {
    setOpenAddStudentDialog(false);
    setNewStudentName("");
  };

  const handleSaveNewStudent = () => {
    if (newStudentName.trim() && isMountedRef.current) {
      const newId = crypto.randomUUID();
      setRows((prev) => [...prev, { id: newId, name: newStudentName, isNew: true }]);
      setRowModesModel((prev) => ({
        ...prev,
        [newId]: { mode: GridRowModes.Edit, fieldToFocus: "name" },
      }));
      handleCloseAddStudentDialog();
      toast.success(`${newStudentName} added`);
    } else if (!newStudentName.trim()) {
      toast.error("Student name cannot be empty");
    }
  };

  const handleDeleteSingle = (id: string) => () => {
    if (window.confirm("Delete this student's record?") && isMountedRef.current) {
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success("Student record deleted");
    }
  };

  const handleDeleteSelected = () => {
    if (!selectionModel.length) {
      toast.info("No students selected");
      return;
    }
    if (window.confirm(`Delete ${selectionModel.length} selected student records?`) && isMountedRef.current) {
      setRows((prev) => prev.filter((r) => !selectionModel.includes(r.id)));
      setSelectionModel([]);
      toast.success("Selected student records deleted");
    }
  };

  const handleSaveAll = () => {
    if (!isMountedRef.current) return;
    // Calculate totals before sorting and setting positions.
    const rowsWithTotals = rows.map(row => {
      const cat1 = row.cat1 || 0;
      const cat2 = row.cat2 || 0;
      const projectWork = row.projectWork || 0;
      const exams = row.exams || 0;
      const total = cat1 + cat2 + projectWork + (exams / 2);
      return { ...row, total: parseFloat(total.toFixed(2)) };
    });

    const sortedRows = [...rowsWithTotals].sort((a, b) => (b.total || 0) - (a.total || 0));
    const positionedRows = sortedRows.map((row, index) => {
      const position = index + 1;
      return {
        ...row,
        position: `${position}${getPositionSuffix(position)}`,
        remarks:
          row.total !== undefined
            ? row.total < 40
              ? "WEAK"
              : row.total < 60
                ? "AVERAGE"
                : "GOOD"
            : "N/A",
      };
    });

    // Calculate class average.
    let totalOfTotals = 0;
    positionedRows.forEach(row => {
      totalOfTotals += (row.total || 0);
    });
    const calculatedClassAverage = positionedRows.length > 0 ? (totalOfTotals / positionedRows.length).toFixed(2) : 0;
    setOverallClassNumber(calculatedClassAverage);


    setRows(positionedRows);
    if (typeof window !== "undefined") {
      localStorage.setItem("resultSheetData", JSON.stringify(positionedRows));
    }
    toast.success("Results saved");
  };

  const handleRowEditStop: GridEventListener<"rowEditStop"> = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const processRowUpdate = (newRow: GridRowModel<StudentRow>) => {
    if (!isMountedRef.current) return newRow;

    const cat1 = newRow.cat1 || 0;
    const cat2 = newRow.cat2 || 0;
    const projectWork = newRow.projectWork || 0;
    const exams = newRow.exams || 0;
    const total = cat1 + cat2 + projectWork + (exams / 2);
    const updatedRow = { ...newRow, total: parseFloat(total.toFixed(2)), isNew: false };
    setRows(rows.map((row) => (row.id === updatedRow.id ? updatedRow : row)));
    return updatedRow;
  };

  const getPositionSuffix = (position: number) => {
    if (position % 100 >= 11 && position % 100 <= 13) {
      return "TH";
    }
    switch (position % 10) {
      case 1:
        return "ST";
      case 2:
        return "ND";
      case 3:
        return "RD";
      default:
        return "TH";
    }
  };

  const handleEditHeader = () => {
    setOpenEditHeaderDialog(true);
  };

  const handleSaveHeader = () => {
    setSubject(headerData.subject);
    setTerm(headerData.term);
    setYear(headerData.year);
    setSubjectTeacher(headerData.subjectTeacher);
    setClassName(headerData.className);
    setOverallClassNumber(headerData.overallClassNumber); // Updated here
    setOpenEditHeaderDialog(false);
    toast.success("Header information updated");
    setShowClass(true); //show class
  };

  const handleCloseHeaderDialog = () => {
    setOpenEditHeaderDialog(false);
  };

  // Function to export data to Excel
  const exportToExcel = async () => {
    if (!rows.length) {
      toast.info("No data to export.");
      return;
    }

    if (typeof window === 'undefined') {
      toast.error("Exporting to Excel is not supported in this environment.");
      return;
    }

    // Dynamically import the libraries
    const module = await Promise.all([
      import('file-saver'),
      import('xlsx'),
    ]);

    const FileSaver = module[0];
    const XLSX = module[1];

    const worksheetData = [
      ['Name of Students', 'CAT 1 (10)', 'CAT 2 (20)', 'Project Work (20)', 'Exams (100)', 'Total (100%)', 'Position', 'Remarks'], // Header row
      ...rows.map(row => [
        row.name,
        row.cat1 || 0,
        row.cat2 || 0,
        row.projectWork || 0,
        row.exams || 0,
        row.total || 0,
        row.position || '',
        row.remarks || ''
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    FileSaver.saveAs(data, `Student_Results_${className}_${subject}.xlsx`); // Added filename
    toast.success("Data exported to Excel");
  };

  const handleCreateClass = () => {
    setOpenCreateClassDialog(true);
  };

  const handleSaveNewClass = () => {
    if (newClassData.name.trim() && isMountedRef.current) {
      const newClassId = crypto.randomUUID();
      const newClass: ClassData = {
        id: newClassId,
        name: newClassData.name,
      };
      setClasses((prevClasses) => [...prevClasses, newClass]);
      setSelectedClassId(newClassId); // Auto-select the new class
      setRows([]); // Clear data for the new class
      setSubject("");
      setTerm("");
      setYear("");
      setSubjectTeacher("");
      setClassName(newClassData.name);
      setOverallClassNumber(0);
      setOpenCreateClassDialog(false);
      setNewClassData({ name: "" }); // Reset form
      setShowClass(true);
      toast.success(`Class "${newClass.name}" created and selected.`);
    } else {
      toast.error("Class name cannot be empty.");
    }
  };

  const handleCloseCreateClassDialog = () => {
    setOpenCreateClassDialog(false);
    setNewClassData({ name: "" }); // Reset form
  };

  const handleClassSelection = (event: React.ChangeEvent<{ value: string }>) => {
    const selectedId = event.target.value;
    setSelectedClassId(selectedId);
    // Find the class name based on selectedId
    const selectedClass = classes.find((c) => c.id === selectedId);

    if (selectedClass) {
      setClassName(selectedClass.name);
    }
    setRows([]); // Clear data when switching classes.  You might want to load saved data instead.
    setSubject("");
    setTerm("");
    setYear("");
    setSubjectTeacher("");
    setOverallClassNumber(0);
    setShowClass(true);
  };

  const handleDeleteClass = () => {
    if (!selectedClassId) {
      toast.info("No class selected to delete.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete class "${className}"?  This will also delete all student records associated with this class.`) && isMountedRef.current) {
      setClasses(prevClasses => prevClasses.filter(c => c.id !== selectedClassId));
      setSelectedClassId(null); // Clear selection
      setRows([]);             // Clear displayed data
      setSubject("");
      setTerm("");
      setYear("");
      setSubjectTeacher("");
      setClassName("N/A");
      setOverallClassNumber(0);
      setShowClass(false);    // Hide the data table
      localStorage.removeItem("resultSheetData"); //clear the data.
      toast.success(`Class "${className}" and its associated data deleted.`);
    }
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
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Student Results</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

        </header>

        <div className="flex flex-col flex-1 bg-gray-100 p-4 space-y-4">
          <div className="flex items-center gap-4">
            <FormControl>
              <InputLabel id="class-select-label">Select Class</InputLabel>
              <Select
                labelId="class-select-label"
                id="class-select"
                value={selectedClassId || ""}
                onChange={handleClassSelection}
                style={{ minWidth: 200 }}
              >
                {classes.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button onClick={handleCreateClass} className="bg-blue-900 text-white">
              Create Class
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteClass}
              disabled={!selectedClassId}
            >
              Delete Class
            </Button>
          </div>

          {showClass && selectedClassId && (
            <>
              <Button onClick={handleEditHeader} className="ml-auto bg-blue-900 z-40 text-white">
                Edit Header
              </Button>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  Subject: <strong className="font-semibold">{subject}</strong>
                </div>
                <div>
                  Term: <strong className="font-semibold">{term}</strong>
                </div>
                <div>
                  Year: <strong className="font-semibold">{year}</strong>
                </div>
                <div>
                  Subject Teacher: <strong className="font-semibold">{subjectTeacher}</strong>
                </div>
                <div>
                  Class: <strong className="font-semibold">{className}</strong>
                </div>
                <div>
                  Overall Class Number: <strong className="font-semibold">{overallClassNumber}</strong> {/* Updated here */}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddStudent}>
                  Add Student
                </Button>
                <div className="space-x-2">
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteSelected}
                  >
                    Delete Selected
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveAll}
                  >
                    Save Results
                  </Button>
                  <Button  // Added Export Button
                    variant="contained"
                    color="secondary"
                    onClick={exportToExcel}
                  >
                    Export to Excel
                  </Button>
                </div>
              </div>

              {isComponentMounted && (
                <div className="h-[600px]">
                  <DataGrid
                    rows={rows}
                    columns={columns}
                    editMode="row"
                    rowModesModel={rowModesModel}
                    onRowModesModelChange={setRowModesModel}
                    onRowEditStop={handleRowEditStop}
                    processRowUpdate={processRowUpdate}
                    checkboxSelection
                    disableRowSelectionOnClick
                    selectionModel={selectionModel}
                    onSelectionModelChange={(newSelectionModel) => {
                      setSelectionModel(newSelectionModel);
                    }}
                    experimentalFeatures={{ newEditingApi: true }}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <Dialog open={openAddStudentDialog} onClose={handleCloseAddStudentDialog}>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="Student Name"
              type="text"
              fullWidth
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddStudentDialog}>Cancel</Button>
            <Button onClick={handleSaveNewStudent}>Add</Button>
          </DialogActions>
        </Dialog>
        <Dialog open={openEditHeaderDialog} onClose={handleCloseHeaderDialog}>
          <DialogTitle>Edit Header Information</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="subject"
              label="Subject"
              type="text"
              fullWidth
              value={headerData.subject}
              onChange={(e) => setHeaderData({ ...headerData, subject: e.target.value })}
            />
            <TextField
              margin="dense"
              id="term"
              label="Term"
              type="text"
              fullWidth
              value={headerData.term}
              onChange={(e) => setHeaderData({ ...headerData, term: e.target.value })}
            />
            <TextField
              margin="dense"
              id="year"
              label="Year"
              type="text"
              fullWidth
              value={headerData.overallClassNumber}
              onChange={(e) => setHeaderData({ ...headerData, overallClassNumber: e.target.value})}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseHeaderDialog}>Cancel</Button>
            <Button onClick={handleSaveHeader}>Save</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openCreateClassDialog} onClose={handleCloseCreateClassDialog}>
          <DialogTitle>Create New Class</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              id="name"
              label="Class Name"
              type="text"
              fullWidth
              value={newClassData.name}
              onChange={(e) => setNewClassData({ name: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCreateClassDialog}>Cancel</Button>
            <Button onClick={handleSaveNewClass}>Create</Button>
          </DialogActions>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}

