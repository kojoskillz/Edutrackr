"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { Grid } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";

import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridEventListener,
  GridRowEditStopReasons,
  GridRowId,
  GridRowModes,
  GridRowModesModel,
  GridRowModel,
} from "@mui/x-data-grid";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// shape of a teacher row
type TeacherRow = {
  id: number | string;
  teacherId: string;
  name: string;
  age: number;
  subject: string;
  image: string;
  dob: string;
  appointmentLetter: string;
  ssnitId: string;
  bankAccount: string;
  firstRankDate: string;
  contact: string;
  isNew?: boolean;
};

const STORAGE_KEY = "teachersData";

export default function TeachersPage() {
  // load initial rows from localStorage or fallback to empty array
  const [rows, setRows] = React.useState<TeacherRow[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return [];
  });

  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>(
    {}
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = React.useState(false);
  const [selectedTeacher, setSelectedTeacher] = React.useState<TeacherRow | null>(
    null
  );

  const [newTeacher, setNewTeacher] = React.useState<Omit<TeacherRow, "id">>({
    teacherId: "",
    name: "",
    age: 0,
    subject: "",
    image: "",
    dob: "",
    appointmentLetter: "",
    ssnitId: "",
    bankAccount: "",
    firstRankDate: "",
    contact: "",
  });

  // auto-save to localStorage on every rows change
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    }
  }, [rows]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewTeacher((t) => ({ ...t, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRowEditStop: GridEventListener<"rowEditStop"> = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick = (id: GridRowId) => () =>
    setRowModesModel((m) => ({ ...m, [id]: { mode: GridRowModes.Edit } }));

  const handleSaveClick = (id: GridRowId) => () =>
    setRowModesModel((m) => ({ ...m, [id]: { mode: GridRowModes.View } }));

  const handleDeleteClick = (id: GridRowId) => () => {
    if (window.confirm("Delete this teacher?")) {
      setRows((r) => r.filter((row) => row.id !== id));
      toast.success("Teacher deleted");
    }
  };

  const handleCancelClick = (id: GridRowId) => () => {
    setRowModesModel((m) => ({
      ...m,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    }));
    // if it was a newly created row, remove it
    const row = rows.find((r) => r.id === id);
    if (row?.isNew) {
      setRows((r) => r.filter((x) => x.id !== id));
    }
  };

  const processRowUpdate = (newRow: GridRowModel) => {
    const updated: TeacherRow = { ...newRow, isNew: false } as TeacherRow;
    setRows((r) => r.map((x) => (x.id === updated.id ? updated : x)));
    return updated;
  };

  const handleAddTeacher = () => {
    const id = crypto.randomUUID();
    setRows((prev) => [
      ...prev,
      { id, ...newTeacher, isNew: true },
    ]);
    setNewTeacher({
      teacherId: "",
      name: "",
      age: 0,
      subject: "",
      image: "",
      dob: "",
      appointmentLetter: "",
      ssnitId: "",
      bankAccount: "",
      firstRankDate: "",
      contact: "",
    });
    setAddModalOpen(false);
    toast.success("Teacher added");
  };

  const handleViewClick = (id: GridRowId) => () => {
    const t = rows.find((x) => x.id === id) || null;
    setSelectedTeacher(t);
    setDetailsModalOpen(true);
  };

  const filteredRows = rows.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: GridColDef[] = [
    { field: "teacherId", headerName: "ID", width: 100, editable: true },
    { field: "name", headerName: "Name", width: 180, editable: true },
    { field: "age", headerName: "Age", width: 80, editable: true, type: "number" },
    { field: "subject", headerName: "Subject", width: 180, editable: true },
    { field: "contact", headerName: "Contact", width: 140, editable: true },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 150,
      getActions: ({ id }) => {
        const isEditing = rowModesModel[id]?.mode === GridRowModes.Edit;
        return isEditing
          ? [
              <GridActionsCellItem
                key="save"
                icon={<SaveIcon sx={{ color: "green" }} />}
                label="Save"
                onClick={handleSaveClick(id)}
              />,
              <GridActionsCellItem
                key="cancel"
                icon={<CancelIcon />}
                label="Cancel"
                onClick={handleCancelClick(id)}
              />,
            ]
          : [
              <GridActionsCellItem
                key="view"
                icon={<VisibilityIcon />}
                label="View"
                onClick={handleViewClick(id)}
              />,
              <GridActionsCellItem
                key="edit"
                icon={<EditIcon />}
                label="Edit"
                onClick={handleEditClick(id)}
              />,
              <GridActionsCellItem
                key="delete"
                icon={<DeleteIcon />}
                label="Delete"
                onClick={handleDeleteClick(id)}
              />,
            ];
      },
    },
  ];

  return (
    <SidebarProvider>
      <AppSidebar/>
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1"/>
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="#">Dashboard</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator/>
              <BreadcrumbItem><BreadcrumbPage>Teachers</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col bg-gray-100 p-4">
          <div className="mb-4 flex justify-between items-center">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded border px-3 py-2"
            />
            <div className="flex gap-2">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddModalOpen(true)}
              >
                Add Teacher
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<SaveIcon />}
                onClick={() => {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
                  toast.success("All changes saved");
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>

          <Box sx={{ background: "white", borderRadius: 2 }}>
            <DataGrid
              autoHeight
              rows={filteredRows}
              columns={columns}
              editMode="row"
              rowModesModel={rowModesModel}
              onRowEditStop={handleRowEditStop}
              processRowUpdate={processRowUpdate}
              onRowModesModelChange={setRowModesModel}
              disableRowSelectionOnClick
            />
          </Box>
        </div>

        {/* Add Teacher Modal */}
        <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)}>
          <Box sx={{
              position: "absolute",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 450, bgcolor: "background.paper",
              boxShadow: 24, p: 3, borderRadius: 2
            }}>
            <h2 className="text-xl font-semibold mb-4">Add New Teacher</h2>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Teacher ID"
                  value={newTeacher.teacherId}
                  onChange={e => setNewTeacher(t => ({...t, teacherId: e.target.value}))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Name"
                  value={newTeacher.name}
                  onChange={e => setNewTeacher(t => ({...t, name: e.target.value}))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth label="Age" type="number"
                  value={newTeacher.age}
                  onChange={e => setNewTeacher(t => ({...t, age: Number(e.target.value)}))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth label="Subject"
                  value={newTeacher.subject}
                  onChange={e => setNewTeacher(t => ({...t, subject: e.target.value}))}
                />
              </Grid>
              <Grid item xs={12}>
                <input
                  type="file" accept="image/*"
                  onChange={handleImageChange}
                  className="mb-2"
                />
              </Grid>
              {newTeacher.image && (
                <Grid item xs={12}>
                  <img
                    src={newTeacher.image}
                    alt="Preview"
                    className="h-24 w-24 object-cover rounded"
                  />
                </Grid>
              )}
              <Grid item xs={6}>
                <TextField
                  fullWidth label="DOB" type="date"
                  InputLabelProps={{ shrink: true }}
                  value={newTeacher.dob}
                  onChange={e => setNewTeacher(t => ({...t, dob: e.target.value}))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth label="Appointment Date" type="date"
                  InputLabelProps={{ shrink: true }}
                  value={newTeacher.appointmentLetter}
                  onChange={e => setNewTeacher(t => ({...t, appointmentLetter: e.target.value}))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth label="First Rank Date" type="date"
                  InputLabelProps={{ shrink: true }}
                  value={newTeacher.firstRankDate}
                  onChange={e => setNewTeacher(t => ({...t, firstRankDate: e.target.value}))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth label="SSNIT ID"
                  value={newTeacher.ssnitId}
                  onChange={e => setNewTeacher(t => ({...t, ssnitId: e.target.value}))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth label="Bank Account"
                  value={newTeacher.bankAccount}
                  onChange={e => setNewTeacher(t => ({...t, bankAccount: e.target.value}))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth label="Contact"
                  value={newTeacher.contact}
                  onChange={e => setNewTeacher(t => ({...t, contact: e.target.value}))}
                />
              </Grid>
              <Grid item xs={12} className="flex justify-end gap-2">
                <Button variant="outlined" onClick={() => setAddModalOpen(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleAddTeacher}>Add</Button>
              </Grid>
            </Grid>
          </Box>
        </Modal>

        {/* View Teacher Modal */}
        <Modal open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)}>
          <Box sx={{
              position: "absolute",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 450, bgcolor: "background.paper",
              boxShadow: 24, p: 3, borderRadius: 2
            }}>
            <h2 className="text-xl font-semibold mb-4">Teacher Details</h2>
            {selectedTeacher ? (
              <Grid container spacing={2}>
                {Object.entries(selectedTeacher).map(([key, val]) =>
                  key !== "id" && key !== "isNew" ? (
                    <Grid item xs={12} key={key}>
                      <TextField
                        fullWidth
                        label={key}
                        value={String(val)}
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                  ) : null
                )}
                {selectedTeacher.image && (
                  <Grid item xs={12}>
                    <img
                      src={selectedTeacher.image}
                      alt="Teacher"
                      className="h-24 w-24 object-cover rounded"
                    />
                  </Grid>
                )}
                <Grid item xs={12} className="text-right">
                  <Button variant="contained" onClick={() => setDetailsModalOpen(false)}>
                    Close
                  </Button>
                </Grid>
              </Grid>
            ) : (
              <p>Loading...</p>
            )}
          </Box>
        </Modal>
      </SidebarInset>
    </SidebarProvider>
  );
}
