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
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';

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

export default function ClassPage() {
  const router = useRouter();
  const [rows, setRows] = React.useState<GridRowsProp<StudentRow>>([]);
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>();
  const [selectionModel, setSelectionModel] = React.useState<string[]>([]);
  const [isComponentMounted, setIsComponentMounted] = React.useState(false);
  const isMountedRef = React.useRef(false);

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

    React.useEffect(() => {
    isMountedRef.current = true;
    setIsComponentMounted(true);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("resultSheetData");
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
    }
  }, [rows, isComponentMounted]);

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
  };

  const handleCloseHeaderDialog = () => {
    setOpenEditHeaderDialog(false);
  };

  // Function to export data to Excel
  const exportToExcel = () => {
    if (!rows.length) {
      toast.info("No data to export.");
      return;
    }

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
                      value={headerData.year}
                      onChange={(e) => setHeaderData({ ...headerData, year: e.target.value })}
                  />
                  <TextField
                      margin="dense"
                      id="subjectTeacher"
                      label="Subject Teacher"
                      type="text"
                      fullWidth
                      value={headerData.subjectTeacher}
                      onChange={(e) => setHeaderData({ ...headerData, subjectTeacher: e.target.value })}
                  />
                  <TextField
                      margin="dense"
                      id="className"
                      label="Class"
                      type="text"
                      fullWidth
                      value={headerData.className}
                      onChange={(e) => setHeaderData({ ...headerData, className: e.target.value })}
                  />
                  <TextField
                      margin="dense"
                      id="overallClassNumber"
                      label="Overall Class Number"
                      type="text"
                      fullWidth
                      value={headerData.overallClassNumber}
                      onChange={(e) => setHeaderData({ ...headerData, overallClassNumber: e.target.value })}
                  />
              </DialogContent>
              <DialogActions>
                  <Button onClick={handleCloseHeaderDialog}>Cancel</Button>
                  <Button onClick={handleSaveHeader}>Save</Button>
              </DialogActions>
          </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}

