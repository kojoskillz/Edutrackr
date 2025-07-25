/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

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
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';

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
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Link from "next/link";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { randomId } from "@mui/x-data-grid-generator";
import Image from "next/image";
import { supabase } from '../Authentication-supabase/lib/supabase/supabaseClient';
import { User } from "@supabase/supabase-js";

type TeacherRow = {
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

function TeacherEditToolbar(props: GridSlotProps["toolbar"]) {
  const { 
    onAddTeacher,
    onCopyContactInfo,
    onPageChange,
    page,
    rowCount,
    pageSize
  } = props;

  const totalPages = Math.ceil(rowCount / pageSize);
  const isFirstPage = page === 0;
  const isLastPage = page >= totalPages - 1;

  return (
    <GridToolbarContainer className="flex justify-between w-full">
      <div className="flex items-center gap-4">
        <Tooltip title="Add Teacher">
          <ToolbarButton
            color="primary"
            size="small"
            className=" hover:bg-blue-600 transition-colors duration-200"
            onClick={onAddTeacher}
          >
            <AddIcon fontSize="small" /> Add Teacher
          </ToolbarButton>
        </Tooltip>

        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton 
            onClick={() => onPageChange(page - 1)} 
            disabled={isFirstPage}
            size="small"
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Typography variant="body2">
            Page {page + 1} of {totalPages}
          </Typography>
          <IconButton 
            onClick={() => onPageChange(page + 1)} 
            disabled={isLastPage}
            size="small"
          >
            <ArrowForwardIcon fontSize="small" />
          </IconButton>
        </Stack>
      </div>
      <div className="flex gap-2">
        <Tooltip title="Copy Teacher Contact Info">
          <ToolbarButton
            color="primary"
            size="small"
            className="rounded-lg hover:bg-gray-200 transition-colors duration-200"
            onClick={onCopyContactInfo}
          >
            <ContentCopyIcon fontSize="small" />
            Contact Info
          </ToolbarButton>
        </Tooltip>
      </div>
    </GridToolbarContainer>
  );
}

export default function TeachersPage() {
  const [user, setUser] = React.useState<User | null>(null);
  const [teacherRows, setTeacherRows] = React.useState<TeacherRow[]>([]);
  const [teacherSearchText, setTeacherSearchText] = React.useState("");
  const [viewTeacherRow, setViewTeacherRow] = React.useState<TeacherRow | null>(null);
  const [editTeacher, setEditTeacher] = React.useState<TeacherRow | null>(null);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [pdfPreview, setPdfPreview] = React.useState<string | null>(null);
  const [isTeacherIdValid, setIsTeacherIdValid] = React.useState(true);

  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [pagination, setPagination] = React.useState({
    page: 0,
    pageSize: 25,
    totalCount: 0,
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

  React.useEffect(() => {
    if (user) {
      fetchDataWithRetry();
    }
  }, [user, pagination.page, pagination.pageSize]);

  const handleSnackbarOpen = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const handleAddTeacher = () => {
    setEditTeacher({
      id: randomId(),
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
      created_at: new Date().toISOString(),
      user_id: user?.id
    });
    setOpenDialog(true);
  };

  const handleEditTeacher = (teacher: TeacherRow) => {
    setEditTeacher(teacher);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditTeacher(null);
    setImagePreview(null);
    setPdfPreview(null);
    setIsTeacherIdValid(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      if (editTeacher) {
        setEditTeacher({ ...editTeacher, image: reader.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPdfPreview(reader.result as string);
      if (editTeacher) {
        setEditTeacher({ ...editTeacher, appointmentLetter: reader.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  const checkTeacherIdUnique = async (teacherId: string, excludeId?: string) => {
    let query = supabase
      .from('teachers')
      .select('teacherId')
      .eq('teacherId', teacherId);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data } = await query.single();
    return !data;
  };

  const handleSaveTeacher = async () => {
    if (!editTeacher || !user) {
      handleSnackbarOpen("Invalid teacher data or user not authenticated");
      return;
    }

    if (!editTeacher.teacherId || editTeacher.teacherId.trim() === '') {
      handleSnackbarOpen("Teacher ID is required");
      setIsTeacherIdValid(false);
      return;
    }

    const isUnique = await checkTeacherIdUnique(
      editTeacher.teacherId, 
      editTeacher.id.startsWith('TCH-') ? undefined : editTeacher.id
    );

    if (!isUnique) {
      handleSnackbarOpen("Teacher ID already exists");
      setIsTeacherIdValid(false);
      return;
    }

    setIsTeacherIdValid(true);

    try {
      const dob = editTeacher.dob ? new Date(editTeacher.dob).toISOString() : new Date().toISOString();
      const appointmentDate = editTeacher.appointmentDate ? new Date(editTeacher.appointmentDate).toISOString() : new Date().toISOString();
      const firstRankDate = editTeacher.firstRankDate ? new Date(editTeacher.firstRankDate).toISOString() : new Date().toISOString();
      
      const updated: TeacherRow = {
        ...editTeacher,
        age: calculateAge(dob),
        dob,
        appointmentDate,
        firstRankDate,
        user_id: user.id
      };

      if (editTeacher.id.startsWith('TCH-')) {
        const { data, error } = await supabase
          .from('teachers')
          .insert(updated)
          .select();
        
        if (error) throw new Error(`Insert failed: ${error.message}`);
        
        setTeacherRows(prev => [...prev, data[0]]);
        handleSnackbarOpen('Teacher added successfully');
      } else {
        const { data, error } = await supabase
          .from('teachers')
          .update(updated)
          .eq('id', editTeacher.id)
          .select();
        
        if (error) throw new Error(`Update failed: ${error.message}`);
        
        setTeacherRows(prev => 
          prev.map(teacher => 
            teacher.id === editTeacher.id ? data[0] : teacher
          )
        );
        handleSnackbarOpen('Teacher updated successfully');
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving teacher:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save teacher";
      handleSnackbarOpen(errorMessage);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(`Delete failed: ${error.message}`);
      
      setTeacherRows(prev => prev.filter(teacher => teacher.id !== id));
      handleSnackbarOpen('Teacher deleted successfully');
    } catch (error) {
      console.error("Error deleting teacher:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete teacher";
      handleSnackbarOpen(errorMessage);
    }
  };

  const handleCopyContactInfo = async () => {
    const contactInfo = filteredTeachers.map(teacher => {
      return `${teacher.name}: ${teacher.contact || 'No phone'}, ${teacher.email || 'No email'}`;
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
      page: 0,
      loading: true
    }));
  };

  const filteredTeachers = teacherRows.filter((r) => {
    const t = teacherSearchText.toLowerCase();
    const row = r as TeacherRow;
    return (
      (row.name?.toLowerCase() ?? "").includes(t) ||
      (row.teacherId?.toLowerCase() ?? "").includes(t) ||
      (row.subject?.toLowerCase() ?? "").includes(t) ||
      (row.contact?.includes(t) ?? false) ||
      (row.email?.toLowerCase() ?? "").includes(t) ||
      (row.ssnitId?.includes(t) ?? false) ||
      (row.bankAccount?.includes(t) ?? false)
    );
  });

  const teacherColumns: GridColDef[] = [
    {
      field: "image",
      headerName: "Photo",
      width: 100,
      renderCell: (p) => {
        if (!p.value) return null;
        return (
          <Image 
            src={p.value} 
            alt="teacher photo" 
            width={32} 
            height={32} 
            className="h-8 w-8 rounded-full object-cover" 
          />
        );
      },
    },
    { field: "teacherId", headerName: "Teacher ID", width: 120 },
    { field: "name", headerName: "Name", width: 180 },
    {
      field: "dob",
      headerName: "Date of Birth",
      width: 160,
      renderCell: (p) => p.value ? new Date(p.value as string).toLocaleDateString("en-GB") : "",
    },
    { field: "age", headerName: "Age", width: 80, type: "number" },
    { field: "subject", headerName: "Subject", width: 150 },
    { field: "contact", headerName: "Contact", width: 150 },
    { field: "email", headerName: "Email", width: 200 },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 220,
      getActions: ({ row }) => {
        return [
          <GridActionsCellItem 
            key="viewAppointment" 
            icon={<PictureAsPdfIcon />} 
            label="View Appointment" 
            onClick={() => {
              if (row.appointmentLetter) {
                window.open(row.appointmentLetter, '_blank');
              } else {
                handleSnackbarOpen('No appointment letter available');
              }
            }} 
            color="inherit" 
          />,
          <GridActionsCellItem 
            key="copyContact" 
            icon={<ContentCopyIcon />} 
            label="Copy Contact" 
            onClick={() => {
              const contactInfo = `${row.name}: ${row.contact || 'No phone'}, ${row.email || 'No email'}`;
              navigator.clipboard.writeText(contactInfo)
                .then(() => handleSnackbarOpen('Copied contact info'))
                .catch(() => handleSnackbarOpen('Failed to copy contact info'));
            }} 
            color="inherit" 
          />,
          <GridActionsCellItem 
            key="view" 
            icon={<VisibilityIcon />} 
            label="View Teacher Details" 
            onClick={() => setViewTeacherRow(row)} 
          />,
          <GridActionsCellItem 
            key="edit" 
            icon={<EditIcon />} 
            label="Edit Teacher" 
            onClick={() => handleEditTeacher(row)} 
            color="inherit" 
          />,
          <GridActionsCellItem 
            key="delete" 
            icon={<DeleteIcon />} 
            label="Delete Teacher" 
            onClick={() => handleDeleteTeacher(row.id)} 
            color="inherit" 
          />,
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
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => fetchDataWithRetry()}
                sx={{ ml: 2 }}
              >
                Retry
              </Button>
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
                  <BreadcrumbPage>Teachers</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex flex-1 bg-blue-50 flex-col gap-4 p-4">
            <div className="flex justify-end mb-2">
              <input
                type="text"
                placeholder="Search Teachers..."
                value={teacherSearchText}
                onChange={(e) => setTeacherSearchText(e.target.value)}
                className="w-full md:w-1/3 px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Box sx={{ height: 600, width: "100%", "& .actions": { color: "text.secondary" }, "& .textPrimary": { color: "text.primary" } }}>
              <DataGrid
                rows={filteredTeachers}
                columns={teacherColumns}
                getRowId={(row) => row.id}
                slots={{ toolbar: TeacherEditToolbar }}
                slotProps={{ toolbar: {
                  onAddTeacher: handleAddTeacher,
                  onCopyContactInfo: handleCopyContactInfo,
                  onPageChange: handlePageChange,
                  page: pagination.page,
                  rowCount: pagination.totalCount,
                  pageSize: pagination.pageSize
                }}}
                showToolbar={true}
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

            {/* Teacher Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
              <DialogTitle>
                {editTeacher ? 'Edit Teacher' : 'Add New Teacher'}
                <IconButton
                  aria-label="close"
                  onClick={handleCloseDialog}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: (theme) => theme.palette.grey[500],
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent dividers sx={{ padding: '24px' }}>
                {editTeacher && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Column 1 */}
                    <div className="space-y-4">
                      <TextField
                        fullWidth
                        label="Teacher ID"
                        value={editTeacher.teacherId}
                        onChange={(e) => setEditTeacher({...editTeacher, teacherId: e.target.value})}
                        variant="outlined"
                        required
                        error={!isTeacherIdValid}
                        helperText={!isTeacherIdValid ? "Teacher ID must be unique" : ""}
                      />
                      
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={editTeacher.name}
                        onChange={(e) => setEditTeacher({...editTeacher, name: e.target.value})}
                        variant="outlined"
                        required
                      />
                      
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          label="Date of Birth"
                          value={dayjs(editTeacher.dob)}
                          onChange={(newValue) => {
                            if (newValue) {
                              const dob = newValue.format('YYYY-MM-DD');
                              setEditTeacher({
                                ...editTeacher,
                                dob,
                                age: calculateAge(dob)
                              });
                            }
                          }}
                          slotProps={{ 
                            textField: { 
                              fullWidth: true, 
                              variant: 'outlined' 
                            } 
                          }}
                        />
                      </LocalizationProvider>
                      
                      <TextField
                        fullWidth
                        label="Age"
                        value={editTeacher.age}
                        InputProps={{
                          readOnly: true,
                        }}
                        variant="outlined"
                      />
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-4">
                      <TextField
                        fullWidth
                        label="Subject"
                        value={editTeacher.subject}
                        onChange={(e) => setEditTeacher({...editTeacher, subject: e.target.value})}
                        variant="outlined"
                        required
                      />
                      
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          label="Appointment Date"
                          value={dayjs(editTeacher.appointmentDate)}
                          onChange={(newValue) => {
                            if (newValue) {
                              setEditTeacher({
                                ...editTeacher,
                                appointmentDate: newValue.format('YYYY-MM-DD')
                              });
                            }
                          }}
                          slotProps={{ 
                            textField: { 
                              fullWidth: true, 
                              variant: 'outlined' 
                            } 
                          }}
                        />
                      </LocalizationProvider>
                      
                      <TextField
                        fullWidth
                        label="SSNIT ID"
                        value={editTeacher.ssnitId}
                        onChange={(e) => setEditTeacher({...editTeacher, ssnitId: e.target.value})}
                        variant="outlined"
                      />
                      
                      <TextField
                        fullWidth
                        label="Bank Account"
                        value={editTeacher.bankAccount}
                        onChange={(e) => setEditTeacher({...editTeacher, bankAccount: e.target.value})}
                        variant="outlined"
                      />
                    </div>

                    {/* Column 3 */}
                    <div className="space-y-4">
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          label="First Rank Date"
                          value={dayjs(editTeacher.firstRankDate)}
                          onChange={(newValue) => {
                            if (newValue) {
                              setEditTeacher({
                                ...editTeacher,
                                firstRankDate: newValue.format('YYYY-MM-DD')
                              });
                            }
                          }}
                          slotProps={{ 
                            textField: { 
                              fullWidth: true, 
                              variant: 'outlined' 
                            } 
                          }}
                        />
                      </LocalizationProvider>
                      
                      <TextField
                        fullWidth
                        label="Contact Number"
                        value={editTeacher.contact}
                        onChange={(e) => setEditTeacher({...editTeacher, contact: e.target.value})}
                        variant="outlined"
                        InputProps={{
                          startAdornment: <InputAdornment position="start">+233</InputAdornment>,
                        }}
                      />
                      
                      <TextField
                        fullWidth
                        label="Email"
                        value={editTeacher.email}
                        onChange={(e) => setEditTeacher({...editTeacher, email: e.target.value})}
                        variant="outlined"
                        type="email"
                      />
                    </div>

                    {/* Column 4 */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Teacher Photo</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                        />
                        {(imagePreview || editTeacher.image) && (
                          <div className="mt-3 flex justify-center">
                            <Image 
                              src={imagePreview || editTeacher.image} 
                              alt="Teacher preview" 
                              width={100} 
                              height={100} 
                              className="h-24 w-24 rounded-full object-cover border"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Appointment Letter (PDF)</label>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handlePdfUpload}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                        />
                        {(pdfPreview || editTeacher.appointmentLetter) && (
                          <div className="mt-3">
                            <Button
                              variant="outlined"
                              startIcon={<PictureAsPdfIcon />}
                              onClick={() => window.open(pdfPreview || editTeacher.appointmentLetter, '_blank')}
                              fullWidth
                            >
                              View Appointment Letter
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
              <DialogActions sx={{ padding: '16px 24px' }}>
                <Button 
                  onClick={handleCloseDialog} 
                  variant="outlined"
                  sx={{ marginRight: '8px' }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveTeacher} 
                  variant="contained" 
                  color="primary"
                  startIcon={<SaveIcon />}
                >
                  Save Teacher
                </Button>
              </DialogActions>
            </Dialog>

            {/* Teacher Details Modal */}
            <Modal open={!!viewTeacherRow} onClose={() => setViewTeacherRow(null)}>
              <Box sx={{ 
                p: 3, 
                bgcolor: "background.paper", 
                borderRadius: 2, 
                boxShadow: 24, 
                width: 400, 
                maxWidth: '90vw',
                mx: "auto", 
                my: "10%",
                maxHeight: '80vh',
                overflowY: 'auto'
              }}>
                <Typography variant="h6" gutterBottom>Teacher Details</Typography>
                {viewTeacherRow && (
                  <div className="space-y-3">
                    {viewTeacherRow.image && (
                      <div className="flex justify-center mb-3">
                        <Image 
                          src={viewTeacherRow.image} 
                          alt="teacher photo" 
                          width={96} 
                          height={96} 
                          className="h-24 w-24 rounded-full object-cover" 
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-5">
                      <div><strong>Teacher ID:</strong></div>
                      <div>{viewTeacherRow.teacherId}</div>
                      
                      <div><strong>Name:</strong></div>
                      <div>{viewTeacherRow.name}</div>
                      
                      <div><strong>Date of Birth:</strong></div>
                      <div>{new Date(viewTeacherRow.dob).toLocaleDateString("en-GB")}</div>
                      
                      <div><strong>Age:</strong></div>
                      <div>{viewTeacherRow.age}</div>
                      
                      <div><strong>Subject:</strong></div>
                      <div>{viewTeacherRow.subject}</div>
                      
                      <div><strong>Appointment Date:</strong></div>
                      <div>{new Date(viewTeacherRow.appointmentDate).toLocaleDateString("en-GB")}</div>
                      
                      <div><strong>Contact:</strong></div>
                      <div>{viewTeacherRow.contact || 'N/A'}</div>
                      
                      <div><strong>Email:</strong></div>
                      <div>{viewTeacherRow.email || 'N/A'}</div>
                      
                      <div><strong>SSNIT ID:</strong></div>
                      <div>{viewTeacherRow.ssnitId || 'N/A'}</div>
                      
                      <div><strong>Bank Account:</strong></div>
                      <div>{viewTeacherRow.bankAccount || 'N/A'}</div>
                      
                      <div><strong>First Rank Date:</strong></div>
                      <div>{new Date(viewTeacherRow.firstRankDate).toLocaleDateString("en-GB")}</div>
                      
                      {viewTeacherRow.appointmentLetter && (
                        <>
                          <div><strong>Appointment Letter:</strong></div>
                          <div>
                            <Button 
                              variant="outlined" 
                              startIcon={<PictureAsPdfIcon />}
                              onClick={() => window.open(viewTeacherRow.appointmentLetter, '_blank')}
                            >
                              View Letter
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </Box>
            </Modal>

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
