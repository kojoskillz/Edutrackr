/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";


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

// Material-UI components
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

// Material-UI Icons
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";

// Custom Toast Notification System (replaces react-toastify to avoid CSS import errors)
const useToast = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info" | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
      setToastType(null);
    }, 3000); // Hide after 3 seconds
  }, []);

  return { toastMessage, toastType, showToast };
};

// --- MOCK SUPABASE CLIENT ---
// This mock is included to resolve compilation errors caused by unresolved external imports.
// In a real application, you would replace this with your actual Supabase client configured
// in a separate file (e.g., ../Authentication-supabase/lib/supabaseClient.ts).
const mockSupabase = {
  from: (tableName: string) => ({
    select: async () => {
      console.log(`Mock Supabase: Selecting from ${tableName}`);
      // Removed initial mock data, returning an empty array
      return {
        data: [] as TeacherRow[],
        error: null
      };
    },
    insert: async (data: Omit<TeacherRow, 'id'>[]) => {
      console.log(`Mock Supabase: Inserting into ${tableName}`, data);
      const newId = `mock-id-${Date.now()}`;
      return { data: [{ id: newId, ...data[0] }], error: null };
    },
    update: async (data: Partial<TeacherRow>) => {
      console.log(`Mock Supabase: Updating ${tableName}`, data);
      return { data: [data], error: null };
    },
    delete: () => ({
      eq: async (column: string, value: any) => {
        console.log(`Mock Supabase: Deleting from ${tableName} where ${column} = ${value}`);
        return { data: [], error: null };
      }
    }),
    eq: (column: string, value: string | number | boolean | undefined) => ({
      select: async () => { console.log(`Mock Supabase: Selecting where ${column} = ${value}`); return { data: [], error: null }; },
      update: async (data: Partial<TeacherRow>) => { console.log(`Mock Supabase: Updating where ${column} = ${value}`, data); return { data: [data], error: null }; },
    }),
  }),
  storage: {
    from: (bucketName: string) => ({
      upload: async (path: string, file: File, options: { cacheControl: string; upsert: boolean }) => {
        console.log(`Mock Supabase: Uploading to ${bucketName}/${path}`, file);
        return { data: { path: path }, error: null };
      },
      getPublicUrl: (path: string) => ({
        data: { publicUrl: `https://mock-storage-url.com/${path}` }
      }),
    }),
  },
};

const supabase = mockSupabase;
// import { supabase } from "../Authentication-supabase/lib/supabaseClient"; // 
// --- END MOCK SUPABASE CLIENT ---

// Shape of a teacher row
type TeacherRow = {
  id: string; // Supabase row IDs are typically strings (UUIDs)
  teacherId: string;
  name: string;
  age: number;
  subject: string;
  image: string; // URL for the teacher's image uploaded to Supabase Storage
  dob: string;
  appointmentLetter: string;
  ssnitId: string;
  bankAccount: string;
  firstRankDate: string;
  contact: string;
  isNew?: boolean; // Used for local UI state, not stored in DB
};

const TEACHERS_COLLECTION = "teachers"; // This will be your Supabase table name
const TEACHER_IMAGE_BUCKET = "teacher_images"; // Your Supabase Storage bucket name

export default function TeachersPage() {
  const [rows, setRows] = useState<TeacherRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherRow | null>(
    null
  );
  const [editingTeacher, setEditingTeacher] = useState<TeacherRow | null>(null); // For in-table editing


  const [newTeacher, setNewTeacher] = useState<Omit<TeacherRow, "id">>({
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

  const { toastMessage, toastType, showToast } = useToast();


  // Load teachers from Supabase (mock) on component mount
  React.useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const { data, error } = await supabase.from(TEACHERS_COLLECTION).select();

        if (error) {
          throw error;
        }

        const teachers: TeacherRow[] = data.map(item => ({
          id: item.id,
          teacherId: item.teacherId,
          name: item.name,
          age: item.age,
          subject: item.subject,
          image: item.image,
          dob: item.dob,
          appointmentLetter: item.appointmentLetter,
          ssnitId: item.ssnitId,
          bankAccount: item.bankAccount,
          firstRankDate: item.firstRankDate,
          contact: item.contact,
        }));
        setRows(teachers);
        showToast("Teachers loaded successfully!", "success");
      } catch (error: unknown) {
        console.error("Error fetching teachers: ", (error as Error).message || error);
        showToast("Failed to load teachers.", "error");
      }
    };

    fetchTeachers();
  }, [showToast]);

  // Handle image file selection and upload to Supabase Storage (mock)
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Attempting image upload..."); // Debugging log
    const file = e.target.files?.[0];
    if (file) {
      const filePath = `${Date.now()}_${file.name}`;

      try {
        const { data, error } = await supabase.storage
          .from(TEACHER_IMAGE_BUCKET)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          console.error("Supabase Storage Upload Error:", error); // Specific error log
          throw error;
        }
        console.log("Supabase Storage Upload Success Data:", data); // Debugging log

        const { data: publicUrlData } = supabase.storage
          .from(TEACHER_IMAGE_BUCKET)
          .getPublicUrl(filePath);

        if (!publicUrlData || !publicUrlData.publicUrl) {
          throw new Error("Failed to get public URL for the uploaded image.");
        }
        console.log("Public URL Data:", publicUrlData); // Debugging log

        setNewTeacher((t) => ({ ...t, image: publicUrlData.publicUrl }));
        showToast("Image uploaded successfully!", "success");
      } catch (error: unknown) {
        console.error("Error uploading image: ", (error as Error).message || error);
        showToast("Failed to upload image.", "error");
      }
    }
  };

  // Handle deletion of a teacher from Supabase (mock)
  const handleDeleteClick = async (id: string) => {
    console.log("Attempting to delete teacher with ID:", id); // Debugging log
    showToast("Attempting to delete teacher. This action is irreversible.", "info");

    try {
      const { error } = await supabase
        .from(TEACHERS_COLLECTION)
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Supabase Delete Error:", error); // Specific error log
        throw error;
      }
      console.log("Supabase Delete Success."); // Debugging log

      setRows((r) => r.filter((row) => row.id !== id));
      showToast("Teacher deleted successfully!", "success");
    } catch (error: unknown) {
      console.error("Error deleting teacher: ", (error as Error).message || error);
      showToast("Failed to delete teacher.", "error");
    }
  };

  // Handle adding a new teacher to Supabase (mock)
  const handleAddTeacher = async () => {
    console.log("Attempting to add teacher:", newTeacher); // Debugging log
    try {
      const { data, error } = await supabase
        .from(TEACHERS_COLLECTION)
        .insert([newTeacher]);

      if (error) {
        console.error("Supabase Insert Error:", error); // Specific error log
        throw error;
      }
      console.log("Supabase Insert Success Data:", data); // Debugging log

      const addedTeacher: TeacherRow = {
        id: data && data.length > 0 && data[0].id ? data[0].id : `new-mock-${Date.now()}`,
        ...newTeacher,
        isNew: false
      };

      setRows((prev) => [...prev, addedTeacher]);
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
      showToast("Teacher added successfully!", "success");
    } catch (error: unknown) {
      console.error("Error adding teacher: ", (error as Error).message || error);
      showToast("Failed to add teacher.", "error");
    }
  };

  const handleViewClick = (id: string) => () => {
    const t = rows.find((x) => x.id === id) || null;
    setSelectedTeacher(t);
    setDetailsModalOpen(true);
  };

  const handleEditRowClick = (id: string) => () => {
    const teacherToEdit = rows.find(r => r.id === id);
    if (teacherToEdit) {
      setEditingTeacher({ ...teacherToEdit }); // Create a copy for editing
    }
  };

  const handleSaveEditClick = async () => {
    console.log("Attempting to save edited teacher:", editingTeacher); // Debugging log
    if (!editingTeacher) return;

    try {
      const { data, error } = await supabase
        .from(TEACHERS_COLLECTION)
        .eq('id', editingTeacher.id)
        .update({
          teacherId: editingTeacher.teacherId,
          name: editingTeacher.name,
          age: editingTeacher.age,
          subject: editingTeacher.subject,
          image: editingTeacher.image,
          dob: editingTeacher.dob,
          appointmentLetter: editingTeacher.appointmentLetter,
          ssnitId: editingTeacher.ssnitId,
          bankAccount: editingTeacher.bankAccount,
          firstRankDate: editingTeacher.firstRankDate,
          contact: editingTeacher.contact,
        });

      if (error) {
        console.error("Supabase Update Error:", error); // Specific error log
        throw error;
      }
      console.log("Supabase Update Success Data:", data); // Debugging log

      setRows((r) => r.map((x) => (x.id === editingTeacher.id ? editingTeacher : x)));
      setEditingTeacher(null); // Exit editing mode
      showToast("Teacher updated successfully!", "success");
    } catch (error: unknown) {
      console.error("Error updating teacher: ", (error as Error).message || error);
      showToast("Failed to update teacher.", "error");
    }
  };

  const handleCancelEditClick = () => {
    setEditingTeacher(null); // Exit editing mode without saving
  };

  const filteredRows = rows.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.teacherId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

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


      <div className="flex flex-1 flex-col bg-gray-50 p-6">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <input
            type="text"
            id="search"
            placeholder="Search by name, ID, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-full sm:max-w-xs"
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddModalOpen(true)}
            sx={{
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#115293',
              },
              borderRadius: '8px',
              padding: '10px 20px',
              fontWeight: 'bold',
            }}
          >
            Add Teacher
          </Button>
        </div>

        {/* Custom HTML Table (replaces DataGrid) */}
        <Box sx={{ background: "white", borderRadius: 2, boxShadow: 3, overflowX: 'auto' }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teacher ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRows.length > 0 ? (
                filteredRows.map((teacher) => (
                  <tr key={teacher.id}>
                    {editingTeacher && editingTeacher.id === teacher.id ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <TextField
                            value={editingTeacher.teacherId}
                            onChange={(e) => setEditingTeacher(prev => prev ? { ...prev, teacherId: e.target.value } : null)}
                            size="small"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <TextField
                            value={editingTeacher.name}
                            onChange={(e) => setEditingTeacher(prev => prev ? { ...prev, name: e.target.value } : null)}
                            size="small"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <TextField
                            type="number"
                            value={editingTeacher.age}
                            onChange={(e) => setEditingTeacher(prev => prev ? { ...prev, age: Number(e.target.value) } : null)}
                            size="small"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <TextField
                            value={editingTeacher.subject}
                            onChange={(e) => setEditingTeacher(prev => prev ? { ...prev, subject: e.target.value } : null)}
                            size="small"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <TextField
                            value={editingTeacher.contact}
                            onChange={(e) => setEditingTeacher(prev => prev ? { ...prev, contact: e.target.value } : null)}
                            size="small"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button onClick={handleSaveEditClick} size="small" sx={{ color: 'green', minWidth: 0, padding: '6px' }}>
                            <SaveIcon />
                          </Button>
                          <Button onClick={handleCancelEditClick} size="small" sx={{ color: 'gray', minWidth: 0, padding: '6px', ml: 1 }}>
                            <CancelIcon />
                          </Button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.teacherId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.age}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.subject}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.contact}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button onClick={handleViewClick(teacher.id)} size="small" sx={{ color: '#1976d2', minWidth: 0, padding: '6px' }}>
                            <VisibilityIcon />
                          </Button>
                          <Button onClick={handleEditRowClick(teacher.id)} size="small" sx={{ color: 'orange', minWidth: 0, padding: '6px', ml: 1 }}>
                            <EditIcon />
                          </Button>
                          <Button onClick={() => handleDeleteClick(teacher.id)} size="small" sx={{ color: 'red', minWidth: 0, padding: '6px', ml: 1 }}>
                            <DeleteIcon />
                          </Button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No teachers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Box>
      </div>

      {/* Add Teacher Modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)}>
        <Box sx={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: '90%', sm: 450 }, // Responsive width
            bgcolor: "background.paper",
            boxShadow: 24, p: 3, borderRadius: 2,
            maxHeight: '90vh', overflowY: 'auto'
          }}>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Teacher</h2>
          <div className="grid grid-cols-1 gap-4 p-4">
            <TextField
              fullWidth label="Teacher ID"
              value={newTeacher.teacherId}
              onChange={e => setNewTeacher(t => ({...t, teacherId: e.target.value}))}
              variant="outlined"
            />
            <TextField
              fullWidth label="Name"
              value={newTeacher.name}
              onChange={e => setNewTeacher(t => ({...t, name: e.target.value}))}
              variant="outlined"
            />
            <TextField
              fullWidth label="Age" type="number"
              value={newTeacher.age}
              onChange={e => setNewTeacher(t => ({...t, age: Number(e.target.value)}))}
              variant="outlined"
            />
            <TextField
              fullWidth label="Subject"
              value={newTeacher.subject}
              onChange={e => setNewTeacher(t => ({...t, subject: e.target.value}))}
              variant="outlined"
            />
            <div>
              <label htmlFor="teacherImageUpload" className="block text-sm font-medium text-gray-700 mb-1">Teacher Image Upload</label>
              <input
                type="file"
                id="teacherImageUpload"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              {newTeacher.image && (
                <div className="mt-2 text-center">
                  <img
                    src={newTeacher.image}
                    alt="Preview"
                    width={96}
                    height={96}
                    className="h-24 w-24 object-cover rounded mx-auto border border-gray-200"
                    onError={(e) => { e.currentTarget.src = "https://placehold.co/96x96/e0e0e0/ffffff?text=No+Image"; }}
                  />
                </div>
              )}
            </div>
            <TextField
              fullWidth label="DOB" type="date"
              InputLabelProps={{ shrink: true }}
              value={newTeacher.dob}
              onChange={e => setNewTeacher(t => ({...t, dob: e.target.value}))}
              variant="outlined"
            />
            <TextField
              fullWidth label="Appointment Date" type="date"
              InputLabelProps={{ shrink: true }}
              value={newTeacher.appointmentLetter}
              onChange={e => setNewTeacher(t => ({...t, appointmentLetter: e.target.value}))}
              variant="outlined"
            />
            <TextField
              fullWidth label="First Rank Date" type="date"
              InputLabelProps={{ shrink: true }}
              value={newTeacher.firstRankDate}
              onChange={e => setNewTeacher(t => ({...t, firstRankDate: e.target.value}))}
              variant="outlined"
            />
            <TextField
              fullWidth label="SSNIT ID"
              value={newTeacher.ssnitId}
              onChange={e => setNewTeacher(t => ({...t, ssnitId: e.target.value}))}
              variant="outlined"
            />
            <TextField
              fullWidth label="Bank Account"
              value={newTeacher.bankAccount}
              onChange={e => setNewTeacher(t => ({...t, bankAccount: e.target.value}))}
              variant="outlined"
            />
            <TextField
              fullWidth label="Contact"
              value={newTeacher.contact}
              onChange={e => setNewTeacher(t => ({...t, contact: e.target.value}))}
              variant="outlined"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outlined" onClick={() => setAddModalOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleAddTeacher}>Add</Button>
            </div>
          </div>
        </Box>
      </Modal>

      {/* View Teacher Modal */}
      <Modal open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)}>
        <Box sx={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: '90%', sm: 450 }, // Responsive width
            bgcolor: "background.paper",
            boxShadow: 24, p: 3, borderRadius: 2,
            maxHeight: '90vh', overflowY: 'auto'
          }}>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Teacher Details</h2>
          {selectedTeacher ? (
            <div className="flex flex-col gap-4 p-4">
              {selectedTeacher.image && (
                <div className="flex justify-center mb-4">
                  <img
                    src={selectedTeacher.image}
                    alt={`${selectedTeacher.name}'s image`}
                    className="h-32 w-32 object-cover rounded-full border-2 border-blue-500 shadow-md"
                    onError={(e) => { e.currentTarget.src = "https://placehold.co/96x96/e0e0e0/ffffff?text=No+Image"; }}
                  />
                </div>
              )}
              {Object.entries(selectedTeacher).map(([key, val]) =>
                key !== "id" && key !== "isNew" && key !== "image" ? (
                  <div key={key}>
                    <TextField
                      fullWidth
                      label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                      value={String(val)}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                    />
                  </div>
                ) : null
              )}
              <div className="text-right mt-4">
                <Button variant="contained" onClick={() => setDetailsModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <p className="p-4 text-gray-600">Loading...</p>
          )}
        </Box>
      </Modal>
        </SidebarInset>
    </SidebarProvider>
  );
}
