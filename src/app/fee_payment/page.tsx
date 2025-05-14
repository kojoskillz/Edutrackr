"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar"; // Assuming this path is correct
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"; // Assuming this path is correct
import { Separator } from "@/components/ui/separator"; // Assuming this path is correct
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"; // Assuming this path is correct

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

// Import Material UI Icons
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIconOutlined from "@mui/icons-material/Cancel";
import { Menu, MenuItem, Button } from "@mui/material"; // For the dropdown

// Define the type for a single fee row
type FeeRow = {
  id: string;
  name: string;
  class: string;
  contact: string;
  paid: number;
  due: number;
  isNew?: boolean; // Optional flag for new rows
};

// Main FeesPage component
export default function FeesPage() {
  // State for the data grid rows
  const [rows, setRows] = React.useState<GridRowsProp>([]);
  // State to manage the edit mode of rows
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({});
  // State for the search input value
  const [searchText, setSearchText] = React.useState("");
  // State for the selected currency, defaulting to Naira
  const [currency, setCurrency] = React.useState<"₦" | "GH₵" | "$">("₦");
  // State to manage the anchor element for the currency dropdown menu
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  // Effect to load saved data from localStorage on component mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("feeRows");
      if (saved) setRows(JSON.parse(saved));
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect to save data to localStorage whenever the 'rows' state changes
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("feeRows", JSON.stringify(rows));
    }
  }, [rows]); // Dependency array includes 'rows'

  // Handler for stopping row editing
  const handleRowEditStop: GridEventListener<"rowEditStop"> = (params, event) => {
    // Prevent default behavior if focus leaves the row while editing
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  // Handler for processing updates to a row
  const processRowUpdate = (newRow: GridRowModel) => {
    // Cast newRow to FeeRow to satisfy TypeScript, assuming it has all properties
    const updatedRow = newRow as FeeRow;

    // Create an updated row object, ensuring paid and due are numbers and including other properties
    const updated: FeeRow = {
      ...updatedRow, // Spread all properties from the row
      paid: Number(updatedRow.paid), // Ensure paid is a number
      due: Number(updatedRow.due),   // Ensure due is a number
      isNew: false, // Mark as not new after saving
    };
    // Update the rows state with the modified row
    setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
    return updated; // Return the updated row
  };

  // Handler to set a row to edit mode
  const handleEditClick = (id: GridRowId) => () =>
    setRowModesModel((model) => ({ ...model, [id]: { mode: GridRowModes.Edit } }));

  // Handler to set a row back to view mode (after saving)
  const handleSaveClick = (id: GridRowId) => () =>
    setRowModesModel((model) => ({ ...model, [id]: { mode: GridRowModes.View } }));

  // Handler to delete a row
  const handleDeleteClick = (id: GridRowId) => () =>
    setRows((prev) => prev.filter((row) => row.id !== id)); // Filter out the row with the given id

  // Handler to cancel editing a row
  const handleCancelClick = (id: GridRowId) => () => {
    // Set the row back to view mode, ignoring modifications
    setRowModesModel((model) => ({
      ...model,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    }));
    // Find the row
    const row = rows.find((r) => r.id === id);
    // If the row was new and editing is cancelled, remove it
    if (row?.isNew) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // Filter rows based on the search text
  const filteredRows = rows.filter((row) => {
    const search = searchText.toLowerCase();
    return (
      row.name.toLowerCase().includes(search) ||
      row.class.toLowerCase().includes(search) ||
      row.contact.toLowerCase().includes(search)
    );
  });

  // Filter rows to get only the unpaid students
  const unpaidRows = rows.filter((row) => Number(row.paid) < Number(row.due));

  // Define the columns for the DataGrid
  const columns: GridColDef[] = [
    { field: "name", headerName: "Name", width: 160, editable: true },
    { field: "class", headerName: "Class", width: 120, editable: true },
    { field: "contact", headerName: "Contact", width: 140, editable: true },
    {
      field: "due",
      headerName: `Due (${currency})`, // Display currency in header
      width: 100,
      type: "number",
      editable: true,
    },
    {
      field: "paid",
      headerName: `Paid (${currency})`, // Display currency in header
      width: 100,
      type: "number",
      editable: true,
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      // Value getter to determine status based on paid vs due
      valueGetter: (params: GridValueGetterParams) => {
        const paid = Number(params.row?.paid ?? 0);
        const due = Number(params.row?.due ?? 0);
        return paid >= due ? "Paid" : "Unpaid";
      },
      // Custom render cell to display status with icons and colors
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
      // Get actions based on whether the row is in edit mode
      getActions: ({ id }) => {
        const isInEdit = rowModesModel[id]?.mode === GridRowModes.Edit;
        return isInEdit
          ? [
              <GridActionsCellItem key="save" icon={<SaveIcon />} label="Save" onClick={handleSaveClick(id)} />,
              <GridActionsCellItem key="cancel" icon={<CancelIcon />} label="Cancel" onClick={handleCancelClick(id)} />,
            ]
          : [
              <GridActionsCellItem key="edit" icon={<EditIcon />} label="Edit" onClick={handleEditClick(id)} />,
              <GridActionsCellItem key="delete" icon={<DeleteIcon />} label="Delete" onClick={handleDeleteClick(id)} />,
            ];
      },
    },
  ];

  // Handler to open the currency menu
  const handleCurrencyMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // Handler to close the currency menu and set the selected currency
  const handleCurrencyMenuClose = (currency: "₦" | "GH₵" | "$") => {
    setCurrency(currency);
    setAnchorEl(null);
  };

  return (
    <SidebarProvider>
      {/* Sidebar component */}
      <AppSidebar />
      <SidebarInset>
        {/* Header section */}
        <header className="flex h-16 items-center gap-2 border-b px-4">
          {/* Sidebar trigger button */}
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          {/* Breadcrumb navigation */}
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

        {/* Main content area */}
        <div className="flex flex-1 flex-col bg-gray-100 p-4">
          {/* Top Controls: Search, Add Button, Currency Dropdown */}
          <div className="mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            {/* Search input */}
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by name, class, or contact..."
              className="w-full md:w-1/3 px-3 py-2 border rounded"
            />

            {/* Button to create a new student row */}
            <button
              onClick={() => {
                const id = crypto.randomUUID(); // Generate a unique ID
                // Add a new row to the state
                setRows((prev) => [
                  ...prev,
                  {
                    id,
                    name: "",
                    class: "",
                    contact: "",
                    paid: 0,
                    due: 10000,
                    isNew: true, // Mark as new
                  },
                ]);
                // Set the new row to edit mode and focus the name field
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

            {/* Currency Dropdown Button */}
            <Button onClick={handleCurrencyMenuClick} variant="contained" size="small">
              Currency: {currency}
            </Button>
            {/* Currency Dropdown Menu */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)} // Open if anchorEl is not null
              onClose={() => setAnchorEl(null)} // Close when clicking outside
            >
              <MenuItem onClick={() => handleCurrencyMenuClose("₦")}>Naira (₦)</MenuItem>
              <MenuItem onClick={() => handleCurrencyMenuClose("GH₵")}>Ghana Cedi (GH₵)</MenuItem>
              <MenuItem onClick={() => handleCurrencyMenuClose("$")}>Dollar ($)</MenuItem>
            </Menu>
          </div>

          {/* Data Table (DataGrid) */}
          <Box sx={{ height: 500, width: "100%" }}>
            <DataGrid
              rows={filteredRows} // Use filtered rows for display
              columns={columns}
              editMode="row"
              rowModesModel={rowModesModel}
              onRowEditStop={handleRowEditStop}
              processRowUpdate={processRowUpdate}
              onRowModesModelChange={setRowModesModel}
              // Function to determine row class name based on payment status
              getRowClassName={(params) =>
                Number(params.row.paid ?? 0) >= Number(params.row.due ?? 0)
                  ? "bg-green-200" // Green background for paid
                  : "bg-red-200" // Red background for unpaid
              }
              disableRowSelectionOnClick // Disable row selection on click
            />
          </Box>

          {/* Unpaid Section - Only show if there are unpaid students */}
          {unpaidRows.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-3 text-red-600">
                Unpaid Students ({unpaidRows.length})
              </h2>
              <ul className="space-y-2">
                {/* Map over unpaidRows to display each unpaid student */}
                {unpaidRows.map((student) => (
                  // Added the unique key prop using student.id
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
