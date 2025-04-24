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
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";

import {
  DataGrid,
  GridRowsProp,
  GridRowModesModel,
  GridRowModes,
  GridColDef,
  GridActionsCellItem,
  GridEventListener,
  GridRowId,
  GridRowModel,
  GridRowEditStopReasons,
  GridSlotProps,
  Toolbar,
  ToolbarButton,
} from "@mui/x-data-grid";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { randomId } from "@mui/x-data-grid-generator";

type StudentRow = {
  id: string;
  name: string;
  dob: string;       // ISO string
  age: number;
  class: string;
  gender?: string;
  image?: string;    // DataURL
  isNew?: boolean;
};

const calculateAge = (dob: string) => {
  const b = new Date(dob), today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age;
};

declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides {
    setRows: React.Dispatch<React.SetStateAction<GridRowsProp>>;
    setRowModesModel: React.Dispatch<React.SetStateAction<GridRowModesModel>>;
  }
}

function EditToolbar(props: GridSlotProps["toolbar"]) {
  const { setRows, setRowModesModel } = props;
  return (
    <Toolbar>
      <Tooltip title="Add Student">
        <ToolbarButton
          onClick={() => {
            const id = randomId();
            setRows((r) => [
              ...r,
              { id, name: "", dob: "", age: 0, class: "", gender: "Male", isNew: true },
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
    </Toolbar>
  );
}

export default function Page() {
  const [rows, setRows] = React.useState<GridRowsProp>([]);
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({});
  const [searchText, setSearchText] = React.useState("");
  const [viewRow, setViewRow] = React.useState<StudentRow | null>(null);

  // Load saved on mount
  React.useEffect(() => {
    const saved = localStorage.getItem("students");
    if (saved) {
      setRows(JSON.parse(saved));
    } else {
      // initialize empty
      setRows([]);
    }
  }, []);

  // Persist whenever rows change
  React.useEffect(() => {
    localStorage.setItem("students", JSON.stringify(rows));
  }, [rows]);

  const handleRowEditStop: GridEventListener<"rowEditStop"> = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

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
      const row = rows.find((r) => r.id === id) as StudentRow;
      if (row?.isNew) {
        setRows((r) => r.filter((x) => x.id !== id));
      }
    },
    delete: (id: GridRowId) => () =>
      setRows((r) => r.filter((x) => x.id !== id)),
    view: (id: GridRowId) => () => {
      const row = rows.find((r) => r.id === id) as StudentRow;
      setViewRow(row);
    },
  };

  const processRowUpdate = (newRow: GridRowModel) => {
    const updated: StudentRow = {
      ...newRow,
      age: calculateAge(newRow.dob),
      isNew: false,
    };
    setRows((r) => r.map((x) => (x.id === newRow.id ? updated : x)));
    return updated;
  };

  const filtered = rows.filter((r) => {
    const t = searchText.toLowerCase();
    return (
      r.name.toLowerCase().includes(t) ||
      r.class.toLowerCase().includes(t) ||
      r.dob.includes(t) ||
      (r.gender?.toLowerCase().includes(t) ?? false)
    );
  });

  const columns: GridColDef[] = [
    {
      field: "image",
      headerName: "Photo",
      width: 100,
      editable: true,
      renderCell: (p) =>
        p.value ? (
          <img
            src={p.value as string}
            alt="stud"
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : null,
      renderEditCell: (params) => {
        const { id, field, api } = params;
        return (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onloadend = () => {
                api.setEditCellValue(
                  { id, field, value: reader.result },
                  reader.result
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
        new Date(p.value as string).toLocaleDateString("en-GB"),
      renderEditCell: (params) => {
        const { id, field, value, api } = params;
        return (
          <DatePicker
            value={value ? dayjs(value as string) : null}
            onChange={(v) => {
              api.setEditCellValue(
                { id, field, value: v?.toISOString() },
                v
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
    { field: "age", headerName: "Age", width: 80, type: "number", editable: false },
    {
      field: "class",
      headerName: "Class",
      width: 140,
      editable: true,
      type: "singleSelect",
      valueOptions: ["Basic 1", "Basic 2", "Basic 3", "Basic 4", "Basic 5","Basic 6", "Basic 7","Basic 8","Basic 9"],
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 140,
      getActions: ({ id }) => {
        const isEdit = rowModesModel[id]?.mode === GridRowModes.Edit;
        return isEdit
          ? [
              <GridActionsCellItem
                key="save"
                icon={<SaveIcon />}
                label="Save"
                onClick={actions.save(id)}
                color="primary"
              />,
              <GridActionsCellItem
                key="cancel"
                icon={<CancelIcon />}
                label="Cancel"
                onClick={actions.cancel(id)}
              />,
            ]
          : [
              <GridActionsCellItem
                key="view"
                icon={<VisibilityIcon />}
                label="View"
                onClick={actions.view(id)}
              />,
              <GridActionsCellItem
                key="edit"
                icon={<EditIcon />}
                label="Edit"
                onClick={actions.edit(id)}
                color="inherit"
              />,
              <GridActionsCellItem
                key="delete"
                icon={<DeleteIcon />}
                label="Delete"
                onClick={actions.delete(id)}
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
                  <BreadcrumbPage>Students</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex flex-1 bg-gray-300 flex-col gap-4 p-4">
            <div className="flex justify-end mb-2">
              <input
                type="text"
                placeholder="Search..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
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
                rows={filtered}
                columns={columns}
                editMode="row"
                rowModesModel={rowModesModel}
                onRowModesModelChange={setRowModesModel}
                onRowEditStop={handleRowEditStop}
                processRowUpdate={processRowUpdate}
                slots={{ toolbar: EditToolbar }}
                slotProps={{ toolbar: { setRows, setRowModesModel } }}
                showToolbar
              />
            </Box>

            <Modal open={!!viewRow} onClose={() => setViewRow(null)}>
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
                {viewRow && (
                  <div className="space-y-2">
                    {viewRow.image && (
                      <img
                        src={viewRow.image}
                        alt="stud"
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    )}
                    <p>
                      <strong>Name:</strong> {viewRow.name}
                    </p>
                    <p>
                      <strong>DOB:</strong>{" "}
                      {new Date(viewRow.dob).toLocaleDateString("en-GB")}
                    </p>
                    <p>
                      <strong>Gender:</strong> {viewRow.gender}
                    </p>
                    <p>
                      <strong>Age:</strong> {viewRow.age}
                    </p>
                    <p>
                      <strong>Class:</strong> {viewRow.class}
                    </p>
                  </div>
                )}
              </Box>
            </Modal>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </LocalizationProvider>
  );
}
