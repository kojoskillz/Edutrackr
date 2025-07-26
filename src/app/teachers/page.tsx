/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import * as React from "react";
import { useState, useEffect } from "react";
import {
    DataGrid,
    GridColDef,
    GridRowModes,
    GridRowModesModel,
    GridActionsCellItem,
    GridRowEditStopReasons,
    GridEventListener,
    GridRowModel,
    GridRowId,
    GridToolbarContainer,
    GridValidRowModel
} from "@mui/x-data-grid";
import { 
    Add as AddIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    Edit as EditIcon,
    Visibility as VisibilityIcon,
    ContentCopy as ContentCopyIcon,
    Close as CancelIcon,
    ArrowBack as ArrowBackIcon,
    ArrowForward as ArrowForwardIcon,
    Description as DescriptionIcon,
    Download as DownloadIcon
} from "@mui/icons-material";
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
import {
    Button,
    Typography,
    Box,
    Tooltip,
    Snackbar,
    Alert,
    IconButton,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    TextField,
    // FormControl,
    // InputLabel,
    // Select,
    // MenuItem,
    Avatar,
    Menu,
    MenuItem as MuiMenuItem
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { randomId } from "@mui/x-data-grid-generator";
import { supabase } from '../Authentication-supabase/lib/supabase/supabaseClient';
import { User } from "@supabase/supabase-js";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { GridToolbarProps } from "@mui/x-data-grid";

type TeacherRow = GridValidRowModel & {
  id: string;
  teacherId: string;
  name: string;
  age: number;
  subject: string;
  image: string;
  dob: string;
  appointmentDate: string;
  appointmentLetter: string;
  ssnitId: string;
  bankAccount: string;
  firstRankDate: string;
  contact: string;
  email: string;
  created_at: string;
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

type CustomToolbarProps = GridToolbarProps & {
    setRows: React.Dispatch<React.SetStateAction<readonly GridValidRowModel[]>>;
    setRowModesModel: React.Dispatch<React.SetStateAction<GridRowModesModel>>;
    onCopyAllTeacherNames: () => void;
    onCopyTeacherContactInfo: () => void;
    onDownload: (format: 'csv' | 'excel' | 'pdf') => void;
    page: number;
    rowCount: number;
    pageSize: number;
};

function TeacherEditToolbar(props: CustomToolbarProps) {
  const { 
    setRows, 
    setRowModesModel, 
    onCopyAllTeacherNames, 
    onCopyTeacherContactInfo,
    onDownload,
    page,
    rowCount,
    pageSize
  } = props;

  const totalPages = Math.ceil(rowCount / pageSize);
  const isFirstPage = page === 0;
  const isLastPage = page >= totalPages - 1;

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleDownloadClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleDownloadClose = () => {
    setAnchorEl(null);
  };

  const handleDownload = (format: 'csv' | 'excel' | 'pdf') => {
    onDownload(format);
    handleDownloadClose();
  };

  function handlePageChange(arg0: number): void {
    throw new Error("Function not implemented.");
  }

  return (
    <GridToolbarContainer sx={{ justifyContent: 'space-between', padding: '8px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Tooltip title="Add Teacher">
          <Button
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              const id = randomId();
              setRows((oldRows) => [
                ...oldRows,
                {
                  id,
                  teacherId: `TCH-${Math.floor(1000 + Math.random() * 9000)}`,
                  name: "",
                  age: 0,
                  subject: "",
                  image: "",
                  dob: dayjs().format('YYYY-MM-DD'),
                  appointmentDate: dayjs().format('YYYY-MM-DD'),
                  appointmentLetter: "",
                  ssnitId: "",
                  bankAccount: "",
                  firstRankDate: dayjs().format('YYYY-MM-DD'),
                  contact: "",
                  email: "",
                  user_id: "",
                  created_at: ""
                },
              ]);
              setRowModesModel((oldModel) => ({
                ...oldModel,
                [id]: { mode: GridRowModes.Edit, fieldToFocus: "name" },
              }));
            }}
          >
            Add Teacher
          </Button>
        </Tooltip>

        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton 
            onClick={() => handlePageChange(page - 1)} 
            disabled={isFirstPage}
            size="small"
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Typography variant="body2">
            Page {page + 1} of {totalPages}
          </Typography>
          <IconButton 
            onClick={() => handlePageChange(page + 1)} 
            disabled={isLastPage}
            size="small"
          >
            <ArrowForwardIcon fontSize="small" />
          </IconButton>
        </Stack>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button
          color="primary"
          size="small"
          startIcon={<DownloadIcon />}
          onClick={handleDownloadClick}
          sx={{ textTransform: 'none' }}
        >
          Download
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleDownloadClose}
        >
          <MuiMenuItem onClick={() => handleDownload('csv')}>Download as CSV</MuiMenuItem>
          <MuiMenuItem onClick={() => handleDownload('excel')}>Download as Excel</MuiMenuItem>
          <MuiMenuItem onClick={() => handleDownload('pdf')}>Download as PDF</MuiMenuItem>
        </Menu>

        <Tooltip title="Copy All Teacher Names">
          <Button
            color="primary"
            size="small"
            startIcon={<ContentCopyIcon />}
            onClick={onCopyAllTeacherNames}
            sx={{ textTransform: 'none' }}
          >
            Names
          </Button>
        </Tooltip>
        <Tooltip title="Copy Teacher Contact Info">
          <Button
            color="primary"
            size="small"
            startIcon={<ContentCopyIcon />}
            onClick={onCopyTeacherContactInfo}
            sx={{ textTransform: 'none' }}
          >
            Contact Info
          </Button>
        </Tooltip>
      </div>
    </GridToolbarContainer>
  );
}

export default function TeachersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [teacherRows, setTeacherRows] = useState<TeacherRow[]>([]);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const [searchText, setSearchText] = useState("");
  const [viewRow, setViewRow] = useState<TeacherRow | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [teacherToSave, setTeacherToSave] = useState<TeacherRow | null>(null);
  const [addTeacherOpen, setAddTeacherOpen] = useState(false);
  const [newTeacher, setNewTeacher] = useState<Partial<TeacherRow>>({
    teacherId: `TCH-${Math.floor(1000 + Math.random() * 9000)}`,
    name: "",
    age: 0,
    subject: "",
    image: "",
    dob: dayjs().format('YYYY-MM-DD'),
    appointmentDate: dayjs().format('YYYY-MM-DD'),
    appointmentLetter: "",
    ssnitId: "",
    bankAccount: "",
    firstRankDate: dayjs().format('YYYY-MM-DD'),
    contact: "",
    email: "",
  });

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 25,
    totalCount: 0,
    loading: false
  });

  useEffect(() => {
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

  const fetchTeachers = async (page = 0, pageSize = 25) => {
    try {
      if (!user) throw new Error("User not authenticated");
      
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      const { data: teacherData, error: teacherError, count } = await supabase
        .from('teachers')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('name', { ascending: true })
        .range(from, to);
      
      if (teacherError) throw new Error(`Teacher fetch error: ${teacherError.message}`);
      
      return {
        data: teacherData || [],
        count: count || 0
      };
    } catch (error) {
      console.error("Error fetching teachers:", error);
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
      
      let attempts = 0;
      let teachers: TeacherRow[] = [];
      let totalCount = 0;
      while (attempts < retries) {
        try {
          const result = await fetchTeachers(pagination.page, pagination.pageSize);
          teachers = result.data;
          totalCount = result.count;
          break;
        } catch (error) {
          attempts++;
          if (attempts >= retries) throw error;
          await new Promise(res => setTimeout(res, delay * attempts));
        }
      }
      
      setTeacherRows(teachers);
      setPagination(prev => ({
        ...prev,
        totalCount,
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

  useEffect(() => {
    if (user) {
      fetchDataWithRetry();
    }
  }, [user, pagination.page, pagination.pageSize]);

  const handleRowEditStop: GridEventListener<"rowEditStop"> = (params, event) => {
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

  const processRowUpdate = async (newRow: GridRowModel) => {
    if (!user) {
      const errorMsg = "User not authenticated";
      handleSnackbarOpen(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const dob = newRow.dob ? new Date(newRow.dob).toISOString() : new Date().toISOString();
      const appointmentDate = newRow.appointmentDate ? new Date(newRow.appointmentDate).toISOString() : new Date().toISOString();
      const firstRankDate = newRow.firstRankDate ? new Date(newRow.firstRankDate).toISOString() : new Date().toISOString();
      
      const updated: TeacherRow = {
        id: newRow.id as string,
        teacherId: newRow.teacherId as string,
        name: newRow.name as string,
        age: calculateAge(dob),
        subject: newRow.subject as string,
        image: newRow.image as string,
        dob,
        appointmentDate,
        appointmentLetter: newRow.appointmentLetter as string,
        ssnitId: newRow.ssnitId as string,
        bankAccount: newRow.bankAccount as string,
        firstRankDate,
        contact: newRow.contact as string,
        email: newRow.email as string,
        created_at: newRow.created_at || new Date().toISOString(),
        user_id: user.id
      };

      setTeacherToSave(updated);
      setSaveModalOpen(true);
      
      return updated;
    } catch (error) {
      console.error("Error preparing teacher update:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to prepare teacher update";
      handleSnackbarOpen(errorMessage);
      throw error;
    }
  };

  const handleConfirmSave = async () => {
    if (!teacherToSave) return;

    try {
      if (teacherToSave) {
        const { data, error } = await supabase
          .from('teachers')
          .insert(teacherToSave)
          .select();
        
        if (error) throw new Error(`Insert failed: ${error.message}`);
        
        setTeacherRows(prevTeachers => 
          prevTeachers.map(teacher => 
            teacher.id === teacherToSave.id ? data[0] : teacher
          )
        );
        handleSnackbarOpen('Teacher added successfully');
      } else {
        const { data, error } = await supabase
          .from('teachers')
          .update(teacherToSave)
          .eq('id', (teacherToSave as { id: string }).id)
          .select();

        if (error) throw new Error(`Update failed: ${error.message}`);
        if (data && data.length > 0) {
          setTeacherRows(prevTeachers => 
            prevTeachers.map(teacher => 
              (teacher as { id?: string }).id === (teacherToSave as { id?: string }).id ? data[0] : teacher
            )
          );
        }
        handleSnackbarOpen('Teacher updated successfully');
      }
    } catch (error) {
      console.error("Error saving teacher:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save teacher";
      handleSnackbarOpen(errorMessage);
    } finally {
      setSaveModalOpen(false);
      setTeacherToSave(null);
    }
  };

  const handleCancelSave = () => {
    setSaveModalOpen(false);
    setTeacherToSave(null);
    handleSnackbarOpen('Changes discarded');
  };

  const handleAddTeacher = () => {
    setNewTeacher({
      teacherId: `TCH-${Math.floor(1000 + Math.random() * 9000)}`,
      name: "",
      age: 0,
      subject: "",
      image: "",
      dob: dayjs().format('YYYY-MM-DD'),
      appointmentDate: dayjs().format('YYYY-MM-DD'),
      appointmentLetter: "",
      ssnitId: "",
      bankAccount: "",
      firstRankDate: dayjs().format('YYYY-MM-DD'),
      contact: "",
      email: "",
    });
    setAddTeacherOpen(true);
  };

  const handleSaveNewTeacher = async () => {
    if (!user || !newTeacher) return;

    try {
      const dob = newTeacher.dob ? new Date(newTeacher.dob).toISOString() : new Date().toISOString();
      const appointmentDate = newTeacher.appointmentDate ? new Date(newTeacher.appointmentDate).toISOString() : new Date().toISOString();
      const firstRankDate = newTeacher.firstRankDate ? new Date(newTeacher.firstRankDate).toISOString() : new Date().toISOString();
      
      const teacherToAdd: TeacherRow = {
        id: randomId(),
        teacherId: newTeacher.teacherId || `TCH-${Math.floor(1000 + Math.random() * 9000)}`,
        name: newTeacher.name || "",
        age: calculateAge(dob),
        subject: newTeacher.subject || "",
        image: newTeacher.image || "",
        dob,
        appointmentDate,
        appointmentLetter: newTeacher.appointmentLetter || "",
        ssnitId: newTeacher.ssnitId || "",
        bankAccount: newTeacher.bankAccount || "",
        firstRankDate,
        contact: newTeacher.contact || "",
        email: newTeacher.email || "",
        created_at: new Date().toISOString(),
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('teachers')
        .insert(teacherToAdd)
        .select();
      
      if (error) throw new Error(`Insert failed: ${error.message}`);
      
      setTeacherRows(prevTeachers => [...prevTeachers, data[0]]);
      handleSnackbarOpen('Teacher added successfully');
      setAddTeacherOpen(false);
    } catch (error) {
      console.error("Error adding teacher:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to add teacher";
      handleSnackbarOpen(errorMessage);
    }
  };

  const handleDeleteClick = (id: string) => {
    setTeacherToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!teacherToDelete) return;

    try {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', teacherToDelete);
      
      if (error) throw new Error(`Delete failed: ${error.message}`);
      
      setTeacherRows((r) => r.filter((x) => x.id !== teacherToDelete));
      handleSnackbarOpen('Teacher deleted successfully');
    } catch (error) {
      console.error("Error deleting teacher:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete teacher";
      handleSnackbarOpen(errorMessage);
    } finally {
      setDeleteConfirmOpen(false);
      setTeacherToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setTeacherToDelete(null);
  };

  const handleCopySingleTeacherName = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);
      handleSnackbarOpen(`Copied "${name}"`);
    } catch (err) {
      console.error("Failed to copy teacher name: ", err);
      handleSnackbarOpen("Failed to copy name. Please try again.");
    }
  };

  const handleCopyAllTeacherNames = async () => {
    const names = filteredTeachers.map(teacher => teacher.name);
    if (names.length > 0) {
      try {
        await navigator.clipboard.writeText(names.join('\n'));
        handleSnackbarOpen(`Copied ${names.length} teacher name(s)`);
      } catch (err) {
        console.error("Failed to copy all teacher names: ", err);
        handleSnackbarOpen("Failed to copy names. Please try again.");
      }
    } else {
      handleSnackbarOpen("No teachers to copy");
    }
  };

  const handleCopyTeacherContactInfo = async () => {
    const contactInfo = filteredTeachers.map(teacher => {
      return `${teacher.name} - Phone: ${teacher.contact || 'N/A'}, Email: ${teacher.email || 'N/A'}`;
    });

    if (contactInfo.length > 0) {
      try {
        await navigator.clipboard.writeText(contactInfo.join('\n'));
        handleSnackbarOpen(`Copied contact info for ${contactInfo.length} teacher(s)`);
      } catch (err) {
        console.error("Failed to copy contact info: ", err);
        handleSnackbarOpen("Failed to copy contact info. Please try again.");
      }
    } else {
      handleSnackbarOpen("No teacher contact info to copy");
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage,
      loading: true
    }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({
      ...prev,
      pageSize: newPageSize,
      page: 0, // Reset to first page
      loading: true
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageDataUrl = reader.result as string;
        setNewTeacher(prev => ({ ...prev, image: imageDataUrl }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      handleSnackbarOpen("Failed to upload image. Please try again.");
    }
  };

  const downloadCSV = (data: TeacherRow[]) => {
    const headers = [
      'Teacher ID', 'Name', 'Age', 'Subject', 'Date of Birth', 
      'Appointment Date', 'SSNIT ID', 'Bank Account', 
      'First Rank Date', 'Contact', 'Email'
    ];
    
    const csvContent = [
      headers.join(','),
      ...data.map(teacher => [
        teacher.teacherId,
        `"${teacher.name}"`,
        teacher.age,
        `"${teacher.subject}"`,
        new Date(teacher.dob).toLocaleDateString("en-GB"),
        new Date(teacher.appointmentDate).toLocaleDateString("en-GB"),
        teacher.ssnitId,
        teacher.bankAccount,
        new Date(teacher.firstRankDate).toLocaleDateString("en-GB"),
        teacher.contact,
        teacher.email
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'teachers.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadExcel = (data: TeacherRow[]) => {
    const worksheet = XLSX.utils.json_to_sheet(
      data.map(teacher => ({
        'Teacher ID': teacher.teacherId,
        'Name': teacher.name,
        'Age': teacher.age,
        'Subject': teacher.subject,
        'Date of Birth': new Date(teacher.dob).toLocaleDateString("en-GB"),
        'Appointment Date': new Date(teacher.appointmentDate).toLocaleDateString("en-GB"),
        'SSNIT ID': teacher.ssnitId,
        'Bank Account': teacher.bankAccount,
        'First Rank Date': new Date(teacher.firstRankDate).toLocaleDateString("en-GB"),
        'Contact': teacher.contact,
        'Email': teacher.email
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Teachers');
    XLSX.writeFile(workbook, 'teachers.xlsx');
  };

  const downloadPDF = (data: TeacherRow[]) => {
    const doc = new jsPDF();
    const title = 'Teachers List';
    const headers = [
      ['Teacher ID', 'Name', 'Age', 'Subject', 'Contact', 'Email']
    ];
    
    const pdfData = data.map(teacher => [
      teacher.teacherId,
      teacher.name,
      teacher.age.toString(),
      teacher.subject,
      teacher.contact,
      teacher.email
    ]);

    doc.text(title, 14, 16);
    (doc as any).autoTable({
      head: headers,
      body: pdfData,
      startY: 20,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { cellPadding: 3, fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 30 },
        2: { cellWidth: 15 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
        5: { cellWidth: 40 }
      }
    });

    doc.save('teachers.pdf');
  };

  const handleDownload = (format: 'csv' | 'excel' | 'pdf') => {
    try {
      switch (format) {
        case 'csv':
          downloadCSV(filteredTeachers);
          break;
        case 'excel':
          downloadExcel(filteredTeachers);
          break;
        case 'pdf':
          downloadPDF(filteredTeachers);
          break;
      }
      handleSnackbarOpen(`Teachers data downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Download failed:', error);
      handleSnackbarOpen('Failed to download. Please try again.');
    }
  };

  const filteredTeachers = teacherRows.filter((teacher) => {
    const t = searchText.toLowerCase();
    return (
      (teacher.name?.toLowerCase() ?? "").includes(t) ||
      (teacher.teacherId?.toLowerCase() ?? "").includes(t) ||
      (teacher.subject?.toLowerCase() ?? "").includes(t) ||
      (teacher.contact?.includes(t) ?? false) ||
      (teacher.email?.toLowerCase() ?? "").includes(t) ||
      (teacher.ssnitId?.includes(t) ?? false) ||
      (teacher.bankAccount?.includes(t) ?? false)
    );
  });

  const columns: GridColDef[] = [
    {
      field: "image",
      headerName: "Photo",
      width: 100,
      editable: true,
      renderCell: (params) => {
        if (!params.value) return <Avatar sx={{ width: 32, height: 32 }} />;
        
        if (typeof params.value === 'string' && params.value.startsWith('data:image')) {
          return <Avatar src={params.value} sx={{ width: 32, height: 32 }} />;
        }
        
        if (typeof params.value === 'string') {
          try {
            new URL(params.value);
            return <Avatar src={params.value} sx={{ width: 32, height: 32 }} />;
          } catch {
            return <Avatar sx={{ width: 32, height: 32 }} />;
          }
        }
        
        return <Avatar sx={{ width: 32, height: 32 }} />;
      },
      renderEditCell: (params) => (
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onloadend = () => {
                params.api.setEditCellValue({ 
                  id: params.id, 
                  field: params.field, 
                  value: reader.result 
                }, undefined);
              };
              reader.readAsDataURL(file);
            }
          }}
        />
      )
    },
    { 
      field: "teacherId", 
      headerName: "Teacher ID", 
      width: 120, 
      editable: true,
      renderEditCell: (params) => (
        <TextField
          value={params.value || ''}
          onChange={(e) => params.api.setEditCellValue({ 
            id: params.id, 
            field: params.field, 
            value: e.target.value 
          }, undefined)}
          fullWidth
        />
      )
    },
    { field: "name", headerName: "Name", width: 180, editable: true },
    {
      field: "dob",
      headerName: "Date of Birth",
      width: 160,
      editable: true,
      renderCell: (params) => params.value ? new Date(params.value as string).toLocaleDateString("en-GB") : "",
      renderEditCell: (params) => (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            value={params.value ? dayjs(params.value as string) : dayjs()}
            onChange={(v) => {
              params.api.setEditCellValue({ 
                id: params.id, 
                field: params.field, 
                value: v?.toISOString() 
              }, undefined);
              if (v) {
                params.api.setEditCellValue({ 
                  id: params.id, 
                  field: "age", 
                  value: calculateAge(v.toISOString()) 
                }, undefined);
              }
            }}
            slotProps={{ textField: { variant: "standard", fullWidth: true } }}
          />
        </LocalizationProvider>
      ),
    },
    { field: "age", headerName: "Age", width: 80, type: "number", editable: false },
    { field: "subject", headerName: "Subject", width: 140, editable: true },
    {
      field: "appointmentDate",
      headerName: "Appointment Date",
      width: 160,
      editable: true,
      renderCell: (params) => params.value ? new Date(params.value as string).toLocaleDateString("en-GB") : "",
      renderEditCell: (params) => (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            value={params.value ? dayjs(params.value as string) : dayjs()}
            onChange={(v) => {
              params.api.setEditCellValue({ 
                id: params.id, 
                field: params.field, 
                value: v?.toISOString() 
              }, undefined);
            }}
            slotProps={{ textField: { variant: "standard", fullWidth: true } }}
          />
        </LocalizationProvider>
      ),
    },
    {
      field: "appointmentLetter",
      headerName: "Appointment Letter",
      width: 180,
      editable: true,
      renderCell: (params) => params.value ? "Available" : "Not Available",
    },
    { field: "ssnitId", headerName: "SSNIT ID", width: 120, editable: true },
    { field: "bankAccount", headerName: "Bank Account", width: 150, editable: true },
    {
      field: "firstRankDate",
      headerName: "First Rank Date",
      width: 160,
      editable: true,
      renderCell: (params) => params.value ? new Date(params.value as string).toLocaleDateString("en-GB") : "",
      renderEditCell: (params) => (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            value={params.value ? dayjs(params.value as string) : dayjs()}
            onChange={(v) => {
              params.api.setEditCellValue({ 
                id: params.id, 
                field: params.field, 
                value: v?.toISOString() 
              }, undefined);
            }}
            slotProps={{ textField: { variant: "standard", fullWidth: true } }}
          />
        </LocalizationProvider>
      ),
    },
    { field: "contact", headerName: "Contact", width: 120, editable: true },
    { field: "email", headerName: "Email", width: 200, editable: true },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 220,
      getActions: (params) => {
        const isEdit = rowModesModel[params.id]?.mode === GridRowModes.Edit;

        return isEdit
          ? [
              <GridActionsCellItem 
                key="save" 
                icon={<SaveIcon />} 
                label="Save" 
                onClick={actions.save(params.id)} 
                color="primary" 
              />,
              <GridActionsCellItem 
                key="cancel" 
                icon={<CancelIcon />} 
                label="Cancel" 
                onClick={actions.cancel(params.id)} 
              />,
            ]
          : [
              <GridActionsCellItem 
                key="viewLetter" 
                icon={<DescriptionIcon />} 
                label="View Appointment Letter" 
                onClick={actions.viewAppointmentLetter(params.id)} 
                color="inherit" 
              />,
              <GridActionsCellItem 
                key="copyName" 
                icon={<ContentCopyIcon />} 
                label="Copy Name" 
                onClick={actions.copyName(params.id)} 
                color="inherit" 
              />,
              <GridActionsCellItem 
                key="view" 
                icon={<VisibilityIcon />} 
                label="View Teacher Details" 
                onClick={actions.view(params.id)} 
              />,
              <GridActionsCellItem 
                key="edit" 
                icon={<EditIcon />} 
                label="Edit Teacher" 
                onClick={actions.edit(params.id)} 
                color="inherit" 
              />,
              <GridActionsCellItem 
                key="delete" 
                icon={<DeleteIcon />} 
                label="Delete Teacher" 
                onClick={actions.delete(params.id)} 
                color="inherit" 
              />,
            ];
      },
    },
  ];

  const actions = {
    edit: (id: GridRowId) => () =>
      setRowModesModel((m) => ({ ...m, [id]: { mode: GridRowModes.Edit } })),
    save: (id: GridRowId) => () =>
      setRowModesModel((m) => ({ ...m, [id]: { mode: GridRowModes.View } })),
    cancel: (id: GridRowId) => () => {
      setRowModesModel((m) => ({
        ...m,
        [id]: { mode: GridRowModes.View, ignoreModifications: true },
      }));
      const row = teacherRows.find((r) => r.id === id) as TeacherRow;
      if (row) {
        setTeacherRows((r) => r.filter((x) => x.id !== id));
      }
    },
    delete: (id: GridRowId) => () => {
      handleDeleteClick(id as string);
    },
    view: (id: GridRowId) => () => {
      const row = teacherRows.find((r) => r.id === id) as TeacherRow;
      setViewRow(row);
    },
    copyName: (id: GridRowId) => () => {
      const row = teacherRows.find((r) => r.id === id) as TeacherRow;
      if (row?.name) {
        handleCopySingleTeacherName(row.name);
      }
    },
    viewAppointmentLetter: (id: GridRowId) => () => {
      const row = teacherRows.find((r) => r.id === id) as TeacherRow;
      if (row?.appointmentLetter) {
        window.open(row.appointmentLetter, '_blank');
      } else {
        handleSnackbarOpen("No appointment letter available");
      }
    }
  };

  if (isLoading) {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Typography variant="h6">Loading...</Typography>
        </Box>
      </LocalizationProvider>
    );
  }

  if (error) {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" color="error">{error}</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => fetchDataWithRetry()}
          >
            Retry
          </Button>
        </Box>
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
                      <BreadcrumbPage>Teachers</BreadcrumbPage>
                    </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
            Teacher Management
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search Teachers..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              sx={{ width: 300 }}
            />
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleAddTeacher}
            >
              Add Teacher
            </Button>
          </Box>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <DataGrid
            rows={filteredTeachers}
            columns={columns}
            getRowId={(row) => row.id}
            editMode="row"
            rowModesModel={rowModesModel}
            onRowModesModelChange={setRowModesModel}
            onRowEditStop={handleRowEditStop}
            processRowUpdate={processRowUpdate}
            slots={{
                toolbar: (props) => (
                    <TeacherEditToolbar
                        onCopyAllTeacherNames={handleCopyAllTeacherNames}
                        onCopyTeacherContactInfo={handleCopyTeacherContactInfo}
                        onDownload={handleDownload}
                        {...props}
                    />
                )
            }}
            slotProps={{
                toolbar: {
                  setRows: setTeacherRows,
                  setRowModesModel: setRowModesModel, 
                  onCopyAllTeacherNames: handleCopyAllTeacherNames,
                  onCopyTeacherContactInfo: handleCopyTeacherContactInfo,
                  onDownload: handleDownload,
                  page: pagination.page,
                  rowCount: pagination.totalCount,
                  pageSize: pagination.pageSize,
                } as unknown as CustomToolbarProps, // Cast to the new type
            }}
            pagination
            paginationMode="server"
            rowCount={pagination.totalCount}
            pageSizeOptions={[25, 50, 100]}
            paginationModel={{
                page: pagination.page,
                pageSize: pagination.pageSize
            }}
            onPaginationModelChange={(model) => {
                handlePageChange(model.page);
                if (model.pageSize !== pagination.pageSize) {
                    handlePageSizeChange(model.pageSize);
                }
            }}
            loading={pagination.loading}
            onProcessRowUpdateError={(error: any) => {
              console.error('Row update failed:', error);
              handleSnackbarOpen('Failed to save teacher changes. Please try again.');
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
        </Box>

        {/* Add Teacher Dialog */}
        <Dialog
          open={addTeacherOpen}
          onClose={() => setAddTeacherOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Add New Teacher</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <TextField
                label="Teacher ID"
                value={newTeacher?.teacherId || ''}
                onChange={(e) => setNewTeacher({...newTeacher, teacherId: e.target.value})}
                fullWidth
              />
              <TextField
                label="Name"
                value={newTeacher?.name || ''}
                onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                fullWidth
                required
              />
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date of Birth"
                  value={newTeacher?.dob ? dayjs(newTeacher.dob) : dayjs()}
                  onChange={(date) => setNewTeacher({
                    ...newTeacher, 
                    dob: date?.format('YYYY-MM-DD') || '',
                    age: date ? calculateAge(date.format('YYYY-MM-DD')) : 0
                  })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
              <TextField
                label="Age"
                value={newTeacher?.age || 0}
                disabled
                fullWidth
              />
              <TextField
                label="Subject"
                value={newTeacher?.subject || ''}
                onChange={(e) => setNewTeacher({...newTeacher, subject: e.target.value})}
                fullWidth
              />
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Appointment Date"
                  value={newTeacher?.appointmentDate ? dayjs(newTeacher.appointmentDate) : dayjs()}
                  onChange={(date) => setNewTeacher({
                    ...newTeacher, 
                    appointmentDate: date?.format('YYYY-MM-DD') || ''
                  })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
              <TextField
                label="SSNIT ID"
                value={newTeacher?.ssnitId || ''}
                onChange={(e) => setNewTeacher({...newTeacher, ssnitId: e.target.value})}
                fullWidth
              />
              <TextField
                label="Bank Account"
                value={newTeacher?.bankAccount || ''}
                onChange={(e) => setNewTeacher({...newTeacher, bankAccount: e.target.value})}
                fullWidth
              />
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="First Rank Date"
                  value={newTeacher?.firstRankDate ? dayjs(newTeacher.firstRankDate) : dayjs()}
                  onChange={(date) => setNewTeacher({
                    ...newTeacher, 
                    firstRankDate: date?.format('YYYY-MM-DD') || ''
                  })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
              <TextField
                label="Contact"
                value={newTeacher?.contact || ''}
                onChange={(e) => setNewTeacher({...newTeacher, contact: e.target.value})}
                fullWidth
              />
              <TextField
                label="Email"
                value={newTeacher?.email || ''}
                onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                fullWidth
              />
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Teacher Image</Typography>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                {newTeacher?.image && (
                  <Avatar 
                    src={newTeacher.image} 
                    sx={{ width: 80, height: 80, mt: 2 }} 
                  />
                )}
              </Box>
              <TextField
                type="file"
                label="Appointment Letter"
                InputLabelProps={{ shrink: true }}
                onChange={(e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setNewTeacher({...newTeacher, appointmentLetter: reader.result as string});
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={() => setAddTeacherOpen(false)} 
              variant="outlined" 
              color="inherit"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveNewTeacher} 
              variant="contained" 
              color="primary"
              disabled={!newTeacher?.name}
            >
              Save Teacher
            </Button>
          </DialogActions>
        </Dialog>

        {/* Save Confirmation Dialog */}
        <Dialog
          open={saveModalOpen}
          onClose={handleCancelSave}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Confirm Save</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Are you sure you want to save these changes?
            </DialogContentText>
            {teacherToSave && (
              <Box sx={{ 
                backgroundColor: '#f5f5f5', 
                p: 2, 
                borderRadius: 1,
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 1
              }}>
                <Typography variant="body2"><strong>Name:</strong> {teacherToSave.name}</Typography>
                <Typography variant="body2"><strong>Teacher ID:</strong> {teacherToSave.teacherId}</Typography>
                <Typography variant="body2"><strong>Subject:</strong> {teacherToSave.subject}</Typography>
                <Typography variant="body2"><strong>Age:</strong> {teacherToSave.age}</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={handleCancelSave} 
              variant="outlined" 
              color="inherit"
              sx={{ mr: 1 }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmSave} 
              variant="contained" 
              color="primary"
              autoFocus
            >
              Confirm Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={handleCancelDelete}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ color: 'error.main' }}>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Are you sure you want to delete this teacher? This action cannot be undone.
            </DialogContentText>
            {teacherToDelete && (
              <Box sx={{ 
                backgroundColor: '#f5f5f5', 
                p: 2, 
                borderRadius: 1,
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 1
              }}>
                <Typography variant="body2">
                  <strong>Teacher:</strong> {teacherRows.find(t => t.id === teacherToDelete)?.name || 'Unknown'}
                </Typography>
                <Typography variant="body2">
                  <strong>ID:</strong> {teacherToDelete}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={handleCancelDelete} 
              variant="outlined" 
              color="inherit"
              sx={{ mr: 1 }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmDelete} 
              variant="contained" 
              color="error"
              autoFocus
            >
              Confirm Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Teacher Details Dialog */}
        <Dialog
          open={!!viewRow}
          onClose={() => setViewRow(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Teacher Details</DialogTitle>
          <DialogContent>
            {viewRow && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  {viewRow.image ? (
                    <Avatar src={viewRow.image} sx={{ width: 120, height: 120 }} />
                  ) : (
                    <Avatar sx={{ width: 120, height: 120 }}>{viewRow.name.charAt(0)}</Avatar>
                  )}
                </Box>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: 2,
                  '& > div': {
                    backgroundColor: '#f9f9f9',
                    p: 2,
                    borderRadius: 1
                  }
                }}>
                  <div>
                    <Typography variant="subtitle2" color="text.secondary">Teacher ID</Typography>
                    <Typography variant="body1">{viewRow.teacherId}</Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                    <Typography variant="body1">{viewRow.name}</Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2" color="text.secondary">Date of Birth</Typography>
                    <Typography variant="body1">
                      {new Date(viewRow.dob).toLocaleDateString("en-GB")}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2" color="text.secondary">Age</Typography>
                    <Typography variant="body1">{viewRow.age}</Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2" color="text.secondary">Subject</Typography>
                    <Typography variant="body1">{viewRow.subject}</Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2" color="text.secondary">Appointment Date</Typography>
                    <Typography variant="body1">
                      {new Date(viewRow.appointmentDate).toLocaleDateString("en-GB")}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2" color="text.secondary">SSNIT ID</Typography>
                    <Typography variant="body1">{viewRow.ssnitId || 'N/A'}</Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2" color="text.secondary">Bank Account</Typography>
                    <Typography variant="body1">{viewRow.bankAccount || 'N/A'}</Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2" color="text.secondary">First Rank Date</Typography>
                    <Typography variant="body1">
                      {new Date(viewRow.firstRankDate).toLocaleDateString("en-GB")}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2" color="text.secondary">Contact</Typography>
                    <Typography variant="body1">{viewRow.contact || 'N/A'}</Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{viewRow.email || 'N/A'}</Typography>
                  </div>
                  {viewRow.appointmentLetter && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <Button 
                        fullWidth
                        variant="outlined" 
                        startIcon={<DescriptionIcon />}
                        onClick={() => window.open(viewRow.appointmentLetter, '_blank')}
                      >
                        View Appointment Letter
                      </Button>
                    </div>
                  )}
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => setViewRow(null)} 
              variant="outlined" 
              color="inherit"
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

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
      </Box>
      </SidebarInset>
      </SidebarProvider>
    </LocalizationProvider>
  );
}
