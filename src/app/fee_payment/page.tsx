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
import {
  DataGrid,
  GridRowsProp,
  GridColDef,
  GridRowModesModel,
  GridRowModes,
  GridActionsCellItem,
  GridRowEditStopReasons,
  GridEventListener,
  GridRowId,
  GridRowModel,
} from "@mui/x-data-grid";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIconOutlined from "@mui/icons-material/Cancel";
import { Menu, MenuItem, Button } from "@mui/material"; // For the dropdown

type FeeRow = {
  id: string;
  name: string;
  class: string;
  contact: string;
  paid: number;
  due: number;
  isNew?: boolean;
};

export default function FeesPage() {
  const [rows, setRows] = React.useState<GridRowsProp>([]);
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({});
  const [searchText, setSearchText] = React.useState("");
  const [currency, setCurrency] = React.useState<"₦" | "GH₵" | "$">("₦"); // Default to Naira
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null); // For the dropdown

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("feeRows");
      if (saved) setRows(JSON.parse(saved));
    }
  }, []);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("feeRows", JSON.stringify(rows));
    }
  }, [rows]);

  const handleRowEditStop: GridEventListener<"rowEditStop"> = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const processRowUpdate = (newRow: GridRowModel) => {
    const updated: FeeRow = {
      ...newRow,
      paid: Number(newRow.paid),
      due: Number(newRow.due),
      isNew: false,
    };
    setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
    return updated;
  };

  const handleEditClick = (id: GridRowId) => () =>
    setRowModesModel((model) => ({ ...model, [id]: { mode: GridRowModes.Edit } }));

  const handleSaveClick = (id: GridRowId) => () =>
    setRowModesModel((model) => ({ ...model, [id]: { mode: GridRowModes.View } }));

  const handleDeleteClick = (id: GridRowId) => () =>
    setRows((prev) => prev.filter((row) => row.id !== id));

  const handleCancelClick = (id: GridRowId) => () => {
    setRowModesModel((model) => ({
      ...model,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    }));
    const row = rows.find((r) => r.id === id);
    if (row?.isNew) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const filteredRows = rows.filter((row) => {
    const search = searchText.toLowerCase();
    return (
      row.name.toLowerCase().includes(search) ||
      row.class.toLowerCase().includes(search) ||
      row.contact.toLowerCase().includes(search)
    );
  });

  const unpaidRows = rows.filter((row) => Number(row.paid) < Number(row.due));

  const columns: GridColDef[] = [
    { field: "name", headerName: "Name", width: 160, editable: true },
    { field: "class", headerName: "Class", width: 120, editable: true },
    { field: "contact", headerName: "Contact", width: 140, editable: true },
    {
      field: "due",
      headerName: `Due (${currency})`,
      width: 100,
      type: "number",
      editable: true,
    },
    {
      field: "paid",
      headerName: `Paid (${currency})`,
      width: 100,
      type: "number",
      editable: true,
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      valueGetter: (params) => {
        const paid = Number(params?.row?.paid ?? 0);
        const due = Number(params?.row?.due ?? 0);
        return paid >= due ? "Paid" : "Unpaid";
      },
      renderCell: (params) =>
        params.value === "Paid" ? (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircleIcon fontSize="small" /> Paid
          </span>
        ) : (
          <span className="flex items-center gap-1 text-red-600">
            <CancelIconOutlined fontSize="small" /> Unpaid
          </span>
        ),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 140,
      getActions: ({ id }) => {
        const isInEdit = rowModesModel[id]?.mode === GridRowModes.Edit;
        return isInEdit
          ? [
              <GridActionsCellItem icon={<SaveIcon />} label="Save" onClick={handleSaveClick(id)} />,
              <GridActionsCellItem icon={<CancelIcon />} label="Cancel" onClick={handleCancelClick(id)} />,
            ]
          : [
              <GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={handleEditClick(id)} />,
              <GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={handleDeleteClick(id)} />,
            ];
      },
    },
  ];

  const handleCurrencyMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCurrencyMenuClose = (currency: "₦" | "GH₵" | "$") => {
    setCurrency(currency);
    setAnchorEl(null);
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
                <BreadcrumbPage>Fees</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col bg-gray-100 p-4">
          {/* Top Controls */}
          <div className="mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by name, class, or contact..."
              className="w-full md:w-1/3 px-3 py-2 border rounded"
            />

            <button
              onClick={() => {
                const id = crypto.randomUUID();
                setRows((prev) => [
                  ...prev,
                  {
                    id,
                    name: "",
                    class: "",
                    contact: "",
                    paid: 0,
                    due: 10000,
                    isNew: true,
                  },
                ]);
                setRowModesModel((prev) => ({
                  ...prev,
                  [id]: { mode: GridRowModes.Edit, fieldToFocus: "name" },
                }));
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              <AddIcon fontSize="small" className="mr-1" />
              Create New Student
            </button>

            {/* Currency Dropdown */}
            <Button onClick={handleCurrencyMenuClick} variant="contained" size="small">
              Currency: {currency}
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem onClick={() => handleCurrencyMenuClose("₦")}>Naira (₦)</MenuItem>
              <MenuItem onClick={() => handleCurrencyMenuClose("GH₵")}>Ghana Cedi (GH₵)</MenuItem>
              <MenuItem onClick={() => handleCurrencyMenuClose("$")}>Dollar ($)</MenuItem>
            </Menu>
          </div>

          {/* Data Table */}
          <Box sx={{ height: 500, width: "100%" }}>
            <DataGrid
              rows={filteredRows}
              columns={columns}
              editMode="row"
              rowModesModel={rowModesModel}
              onRowEditStop={handleRowEditStop}
              processRowUpdate={processRowUpdate}
              onRowModesModelChange={setRowModesModel}
              getRowClassName={(params) =>
                Number(params.row.paid ?? 0) >= Number(params.row.due ?? 0)
                  ? "bg-green-200"
                  : "bg-red-200"
              }
              disableRowSelectionOnClick
            />
          </Box>

          {/* Unpaid Section */}
          {unpaidRows.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-3 text-red-600">
                Unpaid Students ({unpaidRows.length})
              </h2>
              <ul className="space-y-2">
                {unpaidRows.map((student) => (
                  <li
                    key={student.id}
                    className="p-4 bg-white rounded border-l-4 border-red-600 shadow-sm"
                  >
                    <p><strong>Name:</strong> {student.name}</p>
                    <p><strong>Class:</strong> {student.class}</p>
                    <p><strong>Contact:</strong> {student.contact}</p>
                    <p>
                      <strong>Paid:</strong> {currency}{student.paid} / <strong>Due:</strong> {currency}{student.due}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

