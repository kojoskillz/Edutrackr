"use client";

import * as React from "react";
import { useRouter } from "next/navigation"; // Assuming Next.js routing
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
    GridRowSelectionModel, // Updated import for v6+
} from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"; // Assuming custom UI components
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb"; // Assuming custom UI components
import { Separator } from "@/components/ui/separator"; // Assuming custom UI components
import { AppSidebar } from "@/components/app-sidebar"; // Assuming custom UI components
import { toast } from "react-toastify"; // For user notifications
import "react-toastify/dist/ReactToastify.css";
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, InputLabel, FormControl, SelectChangeEvent } from "@mui/material"; // Material UI components

// Dynamically import excel libraries only on the client-side
const FileSaver = typeof window !== 'undefined' ? require('file-saver') : null;
const XLSX = typeof window !== 'undefined' ? require('xlsx') : null;

// --- Type Definitions ---

// Defines the structure for each student row in the DataGrid
type StudentRow = {
    id: string; // Unique identifier for the row
    name: string; // Student's name
    cat1?: number; // Score for Continuous Assessment Test 1
    cat2?: number; // Score for Continuous Assessment Test 2
    projectWork?: number; // Score for Project Work
    exams?: number; // Score for Exams
    total?: number; // Calculated total score
    position?: string; // Calculated position (e.g., "1ST", "2ND")
    remarks?: string; // Calculated remarks (e.g., "GOOD", "AVERAGE", "WEAK")
    isNew?: boolean; // Flag to indicate if the row is newly added and needs initial editing
};

// Defines the structure for class data
type ClassData = {
    id: string; // Unique identifier for the class
    name: string; // Name of the class
};

// Defines the structure for subject information, linked to a class
type SubjectInfo = {
    id: string; // Unique identifier for the subject
    name: string; // Name of the subject
    classId: string; // ID of the class this subject belongs to
    subjectTeacher: string; // Name of the teacher for this subject
    term: string; // Academic term (e.g., "Term 1", "First Semester")
    year: string; // Academic year (e.g., "2024/2025")
};

// --- React Component ---

export default function ClassPage() {
    // --- State Variables ---
    const router = useRouter(); // Hook for navigation (if using Next.js)

    // DataGrid state
    const [rows, setRows] = React.useState<GridRowsProp<StudentRow>>([]); // Holds the student data for the selected class/subject
    const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({}); // Controls edit/view mode for each row
    const [selectionModel, setSelectionModel] = React.useState<GridRowSelectionModel>([]); // Holds the IDs of selected rows (controlled selection)

    // Component lifecycle and mounting state
    const [isComponentMounted, setIsComponentMounted] = React.useState(false); // Tracks if the component has mounted (for localStorage access)
    const isMountedRef = React.useRef(false); // Ref to track mount status, useful in async operations or callbacks

    // Selection state
    const [selectedClassId, setSelectedClassId] = React.useState<string | null>(null); // ID of the currently selected class
    const [selectedSubjectId, setSelectedSubjectId] = React.useState<string | null>(null); // ID of the currently selected subject

    // Data state
    const [classes, setClasses] = React.useState<ClassData[]>([]); // List of all created classes
    const [subjects, setSubjects] = React.useState<SubjectInfo[]>([]); // List of all created subjects

    // Derived state for display purposes (updated when class/subject changes)
    const [className, setClassName] = React.useState("N/A"); // Display name of the selected class
    const [subjectName, setSubjectName] = React.useState("N/A"); // Display name of the selected subject
    const [term, setTerm] = React.useState("N/A"); // Display term for the selected subject
    const [year, setYear] = React.useState("N/A"); // Display year for the selected subject
    const [subjectTeacher, setSubjectTeacher] = React.useState("N/A"); // Display teacher for the selected subject
    const [overallClassAverage, setOverallClassAverage] = React.useState<number | string>(0); // Calculated average score for the current rows

    // Dialog states
    const [openAddStudentDialog, setOpenAddStudentDialog] = React.useState(false); // Controls visibility of the "Add Student" dialog
    const [newStudentName, setNewStudentName] = React.useState(""); // Input field state for the new student's name
    const [openEditSubjectDialog, setOpenEditSubjectDialog] = React.useState(false); // Controls visibility of the "Edit Subject Details" dialog
    const [subjectEditData, setSubjectEditData] = React.useState<Omit<SubjectInfo, 'id' | 'classId'>>({ // State for the edit subject form fields
        name: "",
        subjectTeacher: "",
        term: "",
        year: "",
    });
    const [openCreateClassDialog, setOpenCreateClassDialog] = React.useState(false); // Controls visibility of the "Create Class" dialog
    const [newClassData, setNewClassData] = React.useState({ name: "" }); // Input field state for the new class name
    const [openAddSubjectDialog, setOpenAddSubjectDialog] = React.useState(false); // Controls visibility of the "Add Subject" dialog
    const [newSubjectData, setNewSubjectData] = React.useState({ // State for the add subject form fields
        name: "",
        subjectTeacher: "",
        term: "",
        year: "",
    });

    // --- Helper Functions ---

    /**
     * Generates a unique localStorage key for storing student data
     * based on the selected class and subject IDs.
     * @param classId The ID of the selected class.
     * @param subjectId The ID of the selected subject.
     * @returns A string key or null if IDs are missing.
     */
    const getStudentDataKey = (classId: string | null, subjectId: string | null): string | null => {
        if (!classId || !subjectId) return null;
        return `resultSheetData-${classId}-${subjectId}`;
    };

    /**
     * Calculates the average 'total' score from the provided rows
     * and updates the `overallClassAverage` state.
     * @param currentRows An array of StudentRow objects.
     */
    const calculateAndSetAverage = (currentRows: StudentRow[]) => {
        if (!currentRows || currentRows.length === 0) {
            setOverallClassAverage(0); // Set average to 0 if no rows
            return;
        }
        let totalOfTotals = 0;
        currentRows.forEach(row => {
            // Ensure total is calculated correctly if not already present on the row object
            const cat1 = row.cat1 || 0;
            const cat2 = row.cat2 || 0;
            const projectWork = row.projectWork || 0;
            const exams = row.exams || 0;
            // Use existing total if available, otherwise calculate it
            const total = row.total ?? (cat1 + cat2 + projectWork + (exams / 2));
            totalOfTotals += total;
        });
        // Calculate average and format to 2 decimal places
        const calculatedAverage = (totalOfTotals / currentRows.length).toFixed(2);
        setOverallClassAverage(calculatedAverage);
    };

    /**
     * Generates the correct ordinal suffix (ST, ND, RD, TH) for a given position number.
     * @param position The position number.
     * @returns The ordinal suffix string.
     */
    const getPositionSuffix = (position: number): string => {
        // Handle special cases for 11th, 12th, 13th
        if (position % 100 >= 11 && position % 100 <= 13) {
            return "TH";
        }
        // Handle general cases based on the last digit
        switch (position % 10) {
            case 1: return "ST";
            case 2: return "ND";
            case 3: return "RD";
            default: return "TH";
        }
    };


    // --- Effects ---

    /**
     * Effect Hook: Runs once on component mount.
     * - Sets the mounted ref and state.
     * - Loads saved data (classes, subjects, selections) from localStorage.
     * - Handles potential parsing errors.
     * - Loads student rows if a class and subject were previously selected.
     */
    React.useEffect(() => {
        isMountedRef.current = true;
        setIsComponentMounted(true); // Indicate component is ready for client-side operations

        // Proceed only if running in a browser environment
        if (typeof window !== "undefined") {
            // Load core data: classes and subjects
            const savedClasses = localStorage.getItem("classes");
            const savedSubjects = localStorage.getItem("subjects");
            let loadedClasses: ClassData[] = [];
            let loadedSubjects: SubjectInfo[] = [];

            if (savedClasses) {
                try {
                    loadedClasses = JSON.parse(savedClasses);
                    setClasses(loadedClasses);
                } catch (error) {
                    console.error("Failed to parse saved classes:", error);
                    localStorage.removeItem("classes"); // Clear invalid data
                    toast.error("Invalid class data found. Cleared.");
                }
            }
            if (savedSubjects) {
                try {
                    loadedSubjects = JSON.parse(savedSubjects);
                    setSubjects(loadedSubjects);
                } catch (error) {
                    console.error("Failed to parse saved subjects:", error);
                    localStorage.removeItem("subjects"); // Clear invalid data
                    toast.error("Invalid subject data found. Cleared.");
                }
            }

            // Load last selections
            const savedSelectedClassId = localStorage.getItem("selectedClassId");
            const savedSelectedSubjectId = localStorage.getItem("selectedSubjectId");

            if (savedSelectedClassId) {
                // Validate saved class ID against loaded classes
                const validClass = loadedClasses.find(c => c.id === savedSelectedClassId);
                if (validClass) {
                    setSelectedClassId(savedSelectedClassId);
                    setClassName(validClass.name);

                    // Only proceed to load subject if class was valid and selected
                    if (savedSelectedSubjectId) {
                        // Validate saved subject ID against loaded subjects AND the selected class
                        const validSubject = loadedSubjects.find(s => s.id === savedSelectedSubjectId && s.classId === savedSelectedClassId);
                        if (validSubject) {
                            setSelectedSubjectId(savedSelectedSubjectId);
                            // Set subject details for display
                            setSubjectName(validSubject.name);
                            setTerm(validSubject.term);
                            setYear(validSubject.year);
                            setSubjectTeacher(validSubject.subjectTeacher);

                            // Load student data specific to this class/subject
                            const studentDataKey = getStudentDataKey(savedSelectedClassId, savedSelectedSubjectId);
                            if (studentDataKey) {
                                const savedRows = localStorage.getItem(studentDataKey);
                                if (savedRows) {
                                    try {
                                        const parsedRows: StudentRow[] = JSON.parse(savedRows);
                                        setRows(parsedRows);
                                        calculateAndSetAverage(parsedRows); // Calculate average for loaded data
                                    } catch (error) {
                                        console.error("Failed to parse saved rows:", error);
                                        localStorage.removeItem(studentDataKey); // Clear invalid data
                                        toast.error("Invalid student data found. Cleared.");
                                    }
                                }
                            }
                        } else {
                            // Saved subject ID is invalid or doesn't belong to the selected class
                            localStorage.removeItem("selectedSubjectId"); // Clear invalid selection
                        }
                    }
                } else {
                    // Saved class ID is invalid
                    localStorage.removeItem("selectedClassId");
                    localStorage.removeItem("selectedSubjectId"); // Also clear subject if class is invalid
                }
            }
        }

        // Cleanup function: Set mounted ref to false when component unmounts
        return () => {
            isMountedRef.current = false;
        };
        // Empty dependency array ensures this effect runs only once on mount
    }, []);

    /**
     * Effect Hook: Runs whenever key data or selections change.
     * - Saves the current state (classes, subjects, selections, rows) to localStorage.
     * - Ensures this only runs after the component has mounted.
     */
    React.useEffect(() => {
        // Only save if the component is mounted and running client-side
        if (typeof window !== "undefined" && isComponentMounted) {
            localStorage.setItem("classes", JSON.stringify(classes));
            localStorage.setItem("subjects", JSON.stringify(subjects));
            localStorage.setItem("selectedClassId", selectedClassId || ""); // Save empty string if null
            localStorage.setItem("selectedSubjectId", selectedSubjectId || ""); // Save empty string if null

            // Save student data ONLY if a class and subject are selected, using the specific key
            const studentDataKey = getStudentDataKey(selectedClassId, selectedSubjectId);
            if (studentDataKey) {
                localStorage.setItem(studentDataKey, JSON.stringify(rows));
            }
            // Note: Overall average is calculated dynamically, not saved directly here.
        }
        // Dependencies: This effect re-runs if any of these values change
    }, [rows, classes, subjects, selectedClassId, selectedSubjectId, isComponentMounted]);


    // --- DataGrid Column Definitions ---

    /**
     * Memoized definition of the columns for the DataGrid.
     * Includes configuration for headers, fields, types, editing, sorting, and actions.
     */
    const columns: GridColDef<StudentRow>[] = React.useMemo(() => [
        // Student Name Column
        { field: "name", headerName: "Name of Students", width: 200, editable: true },
        // CAT 1 Score Column
        {
            field: "cat1", headerName: "CAT 1 (10)", width: 100, editable: true, type: "number",
            // Ensure input is treated as a number, default to 0 if invalid
            valueParser: (value) => Number(value) || 0,
        },
        // CAT 2 Score Column
        {
            field: "cat2", headerName: "CAT 2 (20)", width: 100, editable: true, type: "number",
            valueParser: (value) => Number(value) || 0,
        },
        // Project Work Score Column
        {
            field: "projectWork", headerName: "Project Work (20)", width: 120, editable: true, type: "number",
            valueParser: (value) => Number(value) || 0,
        },
        // Exams Score Column
        {
            field: "exams", headerName: "Exams (100)", width: 100, editable: true, type: "number",
            valueParser: (value) => Number(value) || 0,
        },
        // Total Score Column (Calculated, Not Editable)
        {
            field: "total",
            headerName: "Total (100%)",
            width: 120,
            editable: false, // This column is calculated, so users cannot edit it directly
            sortable: true, // Allow sorting by total score
            // Dynamically calculates the total based on other scores in the row
            valueGetter: (value, row) => {
                const cat1 = row.cat1 || 0;
                const cat2 = row.cat2 || 0;
                const projectWork = row.projectWork || 0;
                const exams = row.exams || 0;
                // Formula: CAT1 + CAT2 + Project + (Exams / 2)
                const total = cat1 + cat2 + projectWork + (exams / 2);
                return parseFloat(total.toFixed(2)); // Format to 2 decimal places
            },
        },
        // Position Column (Calculated, Not Editable)
        { field: "position", headerName: "Position", width: 100, sortable: true, editable: false },
        // Remarks Column (Calculated, but Editable)
        { field: "remarks", headerName: "Remarks", width: 120, editable: true },
        // Actions Column (Delete button)
        {
            field: "actions",
            type: "actions",
            headerName: "Actions",
            width: 100,
            // Defines the actions available for each row (in this case, just Delete)
            getActions: ({ id }) => [
                <GridActionsCellItem
                    key={`delete-${id}`} // Add unique key
                    icon={<DeleteIcon />}
                    label="Delete"
                    onClick={handleDeleteSingle(id as string)} // Calls the delete handler for this specific row
                    color="inherit"
                />,
            ],
        },
    ], []); // Empty dependency array means columns are defined once

    // --- Event Handlers & Logic ---

    // --- Class Management Handlers ---

    /** Opens the "Create New Class" dialog. */
    const handleCreateClass = () => {
        setOpenCreateClassDialog(true);
    };

    /** Closes the "Create New Class" dialog and resets its form. */
    const handleCloseCreateClassDialog = () => {
        setOpenCreateClassDialog(false);
        setNewClassData({ name: "" }); // Reset input field
    };

    /** Saves the new class, updates state and localStorage, and selects the new class. */
    const handleSaveNewClass = () => {
        // Validate input and ensure component is mounted
        if (newClassData.name.trim() && isMountedRef.current) {
            const newClassId = crypto.randomUUID(); // Generate a unique ID
            const newClass: ClassData = { id: newClassId, name: newClassData.name.trim() };

            // Update classes state
            setClasses((prevClasses) => [...prevClasses, newClass]);

            // Automatically select the newly created class
            setSelectedClassId(newClassId);
            setSelectedSubjectId(null); // Reset subject selection

            // Clear data associated with the previous selection
            setRows([]);
            setSelectionModel([]); // Reset grid selection
            setSubjectName("N/A");
            setTerm("N/A");
            setYear("N/A");
            setSubjectTeacher("N/A");
            setClassName(newClass.name); // Update displayed class name
            setOverallClassAverage(0); // Reset average

            handleCloseCreateClassDialog(); // Close the dialog
            toast.success(`Class "${newClass.name}" created. Select or add a subject.`);
        } else if (!newClassData.name.trim()) {
            toast.error("Class name cannot be empty.");
        }
    };

    /** Handles selection changes in the Class dropdown. */
    const handleClassSelection = (event: SelectChangeEvent<string>) => {
        const selectedId = event.target.value;
        if (!selectedId) { // Handle case where user deselects (might not happen with standard Select)
             setSelectedClassId(null);
             setSelectedSubjectId(null);
             setClassName("N/A");
             setRows([]);
             setSelectionModel([]);
             // Reset all subject-related display info
             setSubjectName("N/A");
             setTerm("N/A");
             setYear("N/A");
             setSubjectTeacher("N/A");
             setOverallClassAverage(0);
             return;
        }

        setSelectedClassId(selectedId);
        setSelectedSubjectId(null); // Reset subject when class changes

        // Find the selected class object to get its name
        const selectedClass = classes.find((c) => c.id === selectedId);
        setClassName(selectedClass ? selectedClass.name : "N/A");

        // Clear data and display related to the previous selection
        setRows([]);
        setSelectionModel([]); // Reset selection model
        setSubjectName("N/A");
        setTerm("N/A");
        setYear("N/A");
        setSubjectTeacher("N/A");
        setOverallClassAverage(0);
    };

    /** Deletes the selected class, its subjects, and all associated student data. */
     const handleDeleteClass = () => {
         if (!selectedClassId) {
             toast.info("No class selected to delete.");
             return;
         }

         // Confirmation dialog
         if (window.confirm(`ARE YOU SURE?\n\nDeleting class "${className}" will permanently remove:\n- The class itself\n- All subjects within this class\n- All student records for all subjects in this class.\n\nThis action cannot be undone.`) && isMountedRef.current) {

             // Find subjects associated with this class to remove their data
             const subjectsToDelete = subjects.filter(s => s.classId === selectedClassId);

             // Remove student data for each subject of this class from localStorage
             subjectsToDelete.forEach(subject => {
                 const studentDataKey = getStudentDataKey(selectedClassId, subject.id);
                 if (studentDataKey && typeof window !== 'undefined') {
                     localStorage.removeItem(studentDataKey);
                 }
             });

             // --- Update State ---
             // Remove the class
             setClasses(prevClasses => prevClasses.filter(c => c.id !== selectedClassId));
             // Remove associated subjects
             setSubjects(prevSubjects => prevSubjects.filter(s => s.classId !== selectedClassId));

             // Reset selections and displayed data
             setSelectedClassId(null);
             setSelectedSubjectId(null);
             setRows([]);
             setSelectionModel([]); // Reset selection model
             setSubjectName("N/A");
             setTerm("N/A");
             setYear("N/A");
             setSubjectTeacher("N/A");
             setClassName("N/A");
             setOverallClassAverage(0);

             toast.success(`Class "${className}" and all its data deleted.`);
         }
     };

    // --- Subject Management Handlers ---

    /** Opens the "Add New Subject" dialog. Requires a class to be selected first. */
    const handleAddSubject = () => {
        if (!selectedClassId) {
            toast.error("Please select a class first before adding a subject.");
            return;
        }
        // Reset the form fields for the new subject dialog
        setNewSubjectData({ name: "", subjectTeacher: "", term: "", year: "" });
        setOpenAddSubjectDialog(true);
    };

    /** Closes the "Add New Subject" dialog. */
    const handleCloseAddSubjectDialog = () => {
        setOpenAddSubjectDialog(false);
        // Optionally reset form data here too if needed
        // setNewSubjectData({ name: "", subjectTeacher: "", term: "", year: "" });
    };

    /** Saves the new subject, links it to the selected class, and updates state. */
    const handleSaveNewSubject = () => {
        // Validate input, ensure class is selected and component is mounted
        if (newSubjectData.name.trim() && selectedClassId && isMountedRef.current) {
            const newSubjectId = crypto.randomUUID(); // Generate unique ID
            const newSubject: SubjectInfo = {
                id: newSubjectId,
                classId: selectedClassId, // Link to the currently selected class
                name: newSubjectData.name.trim(),
                subjectTeacher: newSubjectData.subjectTeacher.trim(),
                term: newSubjectData.term.trim(),
                year: newSubjectData.year.trim(),
            };

            // Update subjects state
            setSubjects((prev) => [...prev, newSubject]);

            // Automatically select the newly added subject
            setSelectedSubjectId(newSubjectId);

            // Clear rows for the new subject and reset grid selection
            setRows([]);
            setSelectionModel([]); // Reset selection model

            // Update displayed header info for the new subject
            setSubjectName(newSubject.name);
            setTerm(newSubject.term);
            setYear(newSubject.year);
            setSubjectTeacher(newSubject.subjectTeacher);
            setOverallClassAverage(0); // Reset average

            handleCloseAddSubjectDialog(); // Close the dialog
            toast.success(`Subject "${newSubject.name}" added to class "${className}".`);
        } else if (!newSubjectData.name.trim()) {
            toast.error("Subject name cannot be empty.");
        } else if (!selectedClassId) {
             toast.error("Cannot save subject without a selected class."); // Should be prevented by UI but good check
        }
    };

    /** Handles selection changes in the Subject dropdown. */
    const handleSubjectSelection = (event: SelectChangeEvent<string>) => {
        const selectedId = event.target.value;
         if (!selectedId) { // Handle deselection
             setSelectedSubjectId(null);
             setRows([]);
             setSelectionModel([]);
             setSubjectName("N/A");
             setTerm("N/A");
             setYear("N/A");
             setSubjectTeacher("N/A");
             setOverallClassAverage(0);
             return;
         }

        setSelectedSubjectId(selectedId);

        // Find the selected subject object to get its details
        const selectedSubject = subjects.find((s) => s.id === selectedId);
        if (selectedSubject) {
            // Update displayed header information
            setSubjectName(selectedSubject.name);
            setTerm(selectedSubject.term);
            setYear(selectedSubject.year);
            setSubjectTeacher(selectedSubject.subjectTeacher);

            setSelectionModel([]); // Reset selection model before loading new rows

            // Load student data for this specific class/subject combination from localStorage
            const studentDataKey = getStudentDataKey(selectedClassId, selectedId);
            if (studentDataKey && typeof window !== 'undefined') {
                const savedRows = localStorage.getItem(studentDataKey);
                if (savedRows) {
                    try {
                        const parsedRows = JSON.parse(savedRows);
                        setRows(parsedRows);
                        calculateAndSetAverage(parsedRows); // Calculate average for the loaded data
                    } catch (error) {
                        console.error("Failed to parse student data on subject selection:", error);
                        setRows([]); // Clear rows on error
                        setOverallClassAverage(0);
                        toast.error("Could not load student data for this subject.");
                    }
                } else {
                    // No saved data found for this class/subject combination
                    setRows([]);
                    setOverallClassAverage(0);
                }
            } else {
                 // Should not happen if class/subject are selected, but safety check
                 setRows([]);
                 setOverallClassAverage(0);
            }
        } else {
            // Subject not found (e.g., if data is inconsistent)
            setRows([]);
            setSelectionModel([]); // Reset selection model
            setSubjectName("N/A");
            setTerm("N/A");
            setYear("N/A");
            setSubjectTeacher("N/A");
            setOverallClassAverage(0);
        }
    };

    /** Opens the "Edit Subject Details" dialog, pre-filled with current subject info. */
    const handleEditSubjectDetails = () => {
        // Find the currently selected subject's data
        const currentSubject = subjects.find(s => s.id === selectedSubjectId);
        if (!currentSubject) {
            toast.error("No subject selected to edit.");
            return;
        }
        // Pre-fill the edit dialog state with the current subject's details
        setSubjectEditData({
            name: currentSubject.name,
            subjectTeacher: currentSubject.subjectTeacher,
            term: currentSubject.term,
            year: currentSubject.year,
        });
        setOpenEditSubjectDialog(true); // Open the dialog
    };

    /** Closes the "Edit Subject Details" dialog. */
    const handleCloseEditSubjectDialog = () => {
        setOpenEditSubjectDialog(false);
    };

    /** Saves the updated subject details to state and localStorage. */
    const handleSaveSubjectDetails = () => {
        // Ensure a subject is selected and component is mounted
        if (!selectedSubjectId || !isMountedRef.current) return;

        // Update the subjects array in state
        setSubjects(prevSubjects =>
            prevSubjects.map(s =>
                s.id === selectedSubjectId
                    ? { ...s, ...subjectEditData } // Merge existing subject data with edited data
                    : s // Keep other subjects unchanged
            )
        );

        // Update the displayed header info immediately to reflect changes
        setSubjectName(subjectEditData.name);
        setTerm(subjectEditData.term);
        setYear(subjectEditData.year);
        setSubjectTeacher(subjectEditData.subjectTeacher);

        handleCloseEditSubjectDialog(); // Close the dialog
        toast.success("Subject details updated");
    };

    /** Deletes the selected subject and its associated student data. */
     const handleDeleteSubject = () => {
         if (!selectedSubjectId || !selectedClassId) {
             toast.info("No subject selected to delete.");
             return;
         }
         // Find the subject object to get its name for the confirmation message
         const subjectToDelete = subjects.find(s => s.id === selectedSubjectId);
         if (!subjectToDelete) return; // Safety check

         // Confirmation dialog
         if (window.confirm(`ARE YOU SURE?\n\nDeleting subject "${subjectToDelete.name}" for class "${className}" will permanently remove:\n- The subject itself\n- All student records associated with this specific subject.\n\nThis action cannot be undone.`) && isMountedRef.current) {

             // Remove student data for this specific subject from localStorage
             const studentDataKey = getStudentDataKey(selectedClassId, selectedSubjectId);
             if (studentDataKey && typeof window !== 'undefined') {
                 localStorage.removeItem(studentDataKey);
             }

             // --- Update State ---
             // Remove the subject from the subjects array
             setSubjects(prevSubjects => prevSubjects.filter(s => s.id !== selectedSubjectId));

             // Reset selection and displayed data related to the deleted subject
             setSelectedSubjectId(null);
             setRows([]);
             setSelectionModel([]); // Reset selection model
             setSubjectName("N/A");
             setTerm("N/A");
             setYear("N/A");
             setSubjectTeacher("N/A");
             setOverallClassAverage(0);

             toast.success(`Subject "${subjectToDelete.name}" and its data deleted.`);
         }
     };

    // --- Student Management Handlers ---

    /** Opens the "Add New Student" dialog. Requires class and subject selection. */
    const handleAddStudent = () => {
        if (!selectedClassId || !selectedSubjectId) {
             toast.error("Please select a class and a subject before adding students.");
             return;
        }
        setNewStudentName(""); // Clear previous input
        setOpenAddStudentDialog(true);
    };

    /** Closes the "Add New Student" dialog. */
    const handleCloseAddStudentDialog = () => {
        setOpenAddStudentDialog(false);
        // setNewStudentName(""); // Optionally clear name on cancel too
    };

    /** Adds a new student row to the grid, ready for editing. */
    const handleSaveNewStudent = () => {
        // Ensure class/subject selected and component mounted
        if (!selectedClassId || !selectedSubjectId) {
             toast.error("Cannot add student without selecting class and subject.");
             return;
        }
        // Validate student name
        if (newStudentName.trim() && isMountedRef.current) {
            const newId = crypto.randomUUID(); // Generate unique ID for the new row
            // Add the new student row to the state
            // Mark as `isNew: true` to potentially trigger edit mode automatically
            setRows((prev) => [...prev, { id: newId, name: newStudentName.trim(), isNew: true }]);
            // Set the edit mode for the newly added row, focusing the 'name' field
            setRowModesModel((prev) => ({
                ...prev,
                [newId]: { mode: GridRowModes.Edit, fieldToFocus: "name" },
            }));
            handleCloseAddStudentDialog(); // Close the dialog
            toast.success(`Student "${newStudentName.trim()}" added.`);
        } else if (!newStudentName.trim()) {
            toast.error("Student name cannot be empty");
        }
    };

    /** Returns a handler function to delete a specific student row by ID. */
    const handleDeleteSingle = (id: string) => () => {
        // Confirmation dialog
        if (window.confirm("Delete this student's record?") && isMountedRef.current) {
            // Update the rows state by filtering out the row with the matching ID
            setRows((prev) => {
                const newRows = prev.filter((r) => r.id !== id);
                calculateAndSetAverage(newRows); // Recalculate average after deletion
                return newRows;
            });
            toast.success("Student record deleted");
        }
    };

    /** Deletes all currently selected student rows. */
    const handleDeleteSelected = () => {
        if (selectionModel.length === 0) {
            toast.info("No students selected to delete.");
            return;
        }
        // Confirmation dialog
        if (window.confirm(`Delete ${selectionModel.length} selected student record(s)?`) && isMountedRef.current) {
            // Update rows state by filtering out rows whose IDs are in the selectionModel
            setRows((prev) => {
                 const newRows = prev.filter((r) => !selectionModel.includes(r.id));
                 calculateAndSetAverage(newRows); // Recalculate average after deletion
                 return newRows;
            });
            setSelectionModel([]); // Clear the selection model after deletion
            toast.success("Selected student records deleted");
        }
    };

    /**
     * Processes row updates after editing in the DataGrid.
     * Calculates the total score for the updated row.
     * Updates the `rows` state and recalculates the overall average.
     * @param newRow The row data after editing.
     * @param oldRow The row data before editing.
     * @returns The processed row data to be committed to the grid state.
     */
     const processRowUpdate = (newRow: GridRowModel<StudentRow>, oldRow: GridRowModel<StudentRow>): Promise<StudentRow> | StudentRow => {
         // Ensure component is mounted before processing update
         if (!isMountedRef.current) return oldRow; // Return old row if not mounted

         // Calculate the total score based on the updated row data
         const cat1 = Number(newRow.cat1 || 0);
         const cat2 = Number(newRow.cat2 || 0);
         const projectWork = Number(newRow.projectWork || 0);
         const exams = Number(newRow.exams || 0);
         const total = cat1 + cat2 + projectWork + (exams / 2);

         // Create the final updated row object, including the calculated total and marking `isNew` as false
         const updatedRow = { ...newRow, total: parseFloat(total.toFixed(2)), isNew: false };

         // Update the main `rows` state
         setRows(currentRows => {
             // Map through existing rows, replacing the edited row with the updated version
             const newRows = currentRows.map((row) => (row.id === updatedRow.id ? updatedRow : row));
             calculateAndSetAverage(newRows); // Recalculate the overall average with the updated data
             return newRows; // Return the new array of rows to update the state
         });

         // Return the updated row so the DataGrid can finalize the edit process
         // For async operations, you would return a Promise here.
         return updatedRow;
     };

     /**
      * Handles the event when row editing stops.
      * Prevents the default behavior if the stop reason was focus moving out,
      * ensuring edits are committed via `processRowUpdate`.
      */
    const handleRowEditStop: GridEventListener<"rowEditStop"> = (params, event) => {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            // Prevent MUI's default behavior of reverting the edit when focus moves out
            event.defaultMuiPrevented = true;
        }
    };

    /**
     * Saves all current results:
     * - Recalculates totals, positions, and remarks for all rows.
     * - Updates the `rows` state with the calculated values.
     * - Recalculates the overall class average.
     * - Saves the updated rows to localStorage.
     */
    const handleSaveAll = () => {
        if (!isMountedRef.current) return; // Ensure component is mounted
        if (!selectedClassId || !selectedSubjectId) {
            toast.error("Cannot save results without selecting a class and subject.");
            return;
        }

        // Step 1: Ensure totals are fresh before sorting (using the valueGetter logic)
        const rowsWithFreshTotals = rows.map(row => {
            const cat1 = row.cat1 || 0;
            const cat2 = row.cat2 || 0;
            const projectWork = row.projectWork || 0;
            const exams = row.exams || 0;
            const total = cat1 + cat2 + projectWork + (exams / 2);
            return { ...row, total: parseFloat(total.toFixed(2)) };
        });

        // Step 2: Sort rows by total score in descending order
        const sortedRows = [...rowsWithFreshTotals].sort((a, b) => (b.total ?? 0) - (a.total ?? 0));

        // Step 3: Calculate position and remarks based on sorted order and total score
        const positionedRows = sortedRows.map((row, index) => {
            const position = index + 1; // Position is index + 1
            const total = row.total ?? 0; // Ensure total is a number
            // Determine remarks based on total score thresholds
            const remarks = total < 40 ? "WEAK" : total < 60 ? "AVERAGE" : "GOOD";
            return {
                ...row,
                position: `${position}${getPositionSuffix(position)}`, // Add ordinal suffix
                remarks: remarks,
            };
        });

        // Step 4: Update the state with the fully processed rows
        setRows(positionedRows);

        // Step 5: Recalculate and set the overall average based on the final rows
        calculateAndSetAverage(positionedRows);

        // Step 6: Save the processed rows to localStorage using the specific key
        const studentDataKey = getStudentDataKey(selectedClassId, selectedSubjectId);
        if (studentDataKey && typeof window !== "undefined") {
             localStorage.setItem(studentDataKey, JSON.stringify(positionedRows));
        }

        toast.success("Results saved, positions and remarks updated.");
    };

    // --- Excel Export Handler ---

    /** Exports the current student data grid to an Excel (.xlsx) file. */
    const exportToExcel = async () => {
        // Check if there's data to export
        if (rows.length === 0) {
            toast.info("No student data to export.");
            return;
        }
        // Ensure class and subject are selected
        if (!selectedClassId || !selectedSubjectId) {
             toast.error("Please select a class and subject before exporting.");
             return;
        }
        // Ensure running client-side and libraries are available
        if (typeof window === 'undefined' || !FileSaver || !XLSX) {
            toast.error("Exporting to Excel is not supported or libraries not loaded.");
            return;
        }

        try {
            // Prepare data for the worksheet
            const worksheetData = [
                 // Header row matching the grid columns
                ['Name of Students', 'CAT 1 (10)', 'CAT 2 (20)', 'Project Work (20)', 'Exams (100)', 'Total (100%)', 'Position', 'Remarks'],
                // Map each row object to an array of values for the worksheet
                ...rows.map(row => [
                    row.name,
                    row.cat1 || 0, // Default to 0 if undefined
                    row.cat2 || 0,
                    row.projectWork || 0,
                    row.exams || 0,
                    row.total || 0,
                    row.position || '', // Default to empty string
                    row.remarks || ''
                ])
            ];

            // Create worksheet and workbook
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Student Results"); // Sheet name

            // Generate Excel file buffer
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

            // Create a Blob from the buffer
            const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

            // Get current class and subject names for the filename
            const currentClassName = classes.find(c => c.id === selectedClassId)?.name || "Class";
            const currentSubjectName = subjects.find(s => s.id === selectedSubjectId)?.name || "Subject";
            const filename = `Student_Results_${currentClassName}_${currentSubjectName}.xlsx`;

            // Use FileSaver to trigger download
            FileSaver.saveAs(dataBlob, filename);

            toast.success("Data exported to Excel successfully.");
        } catch (error) {
            console.error("Excel export failed:", error);
            toast.error("Failed to export data to Excel.");
        }
    };

    // --- Derived Data for Rendering ---

    /** Memoized list of subjects available for the currently selected class. */
    const availableSubjects = React.useMemo(() => {
        // Filter the main subjects list based on the selectedClassId
        return subjects.filter(s => s.classId === selectedClassId);
    }, [subjects, selectedClassId]); // Recalculate only when subjects or selectedClassId changes


    // --- JSX Rendering ---
    return (
        // Provides context for the sidebar components
        <SidebarProvider>
            {/* Application Sidebar Component */}
            <AppSidebar />
            {/* Main content area, inset from the sidebar */}
            <SidebarInset>
                {/* Header Section */}
                <header className="flex h-16 items-center gap-2 border-b bg-white px-4 sticky top-0 z-30">
                    {/* Sidebar toggle button */}
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    {/* Breadcrumb Navigation */}
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="#">Dashboard</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem><BreadcrumbPage>Student Results</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    {/* Add other header elements here if needed */}
                </header>

                {/* Main Content Body */}
                <div className="flex flex-col flex-1 bg-gray-100 p-4 space-y-4">

                    {/* Row 1: Class and Subject Selection & Management */}
                    <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded shadow">
                        {/* Class Selection Dropdown */}
                        <FormControl sx={{ minWidth: 200 }}> {/* Use sx prop for styling MUI components */}
                            <InputLabel id="class-select-label">Select Class</InputLabel>
                            <Select
                                labelId="class-select-label"
                                id="class-select"
                                value={selectedClassId || ""} // Controlled component
                                onChange={handleClassSelection}
                                label="Select Class" // Required for InputLabel association
                            >
                                {/* Default/Placeholder Option (Optional) */}
                                {/* <MenuItem value=""><em>None</em></MenuItem> */}
                                {classes.map((c) => (
                                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {/* Create Class Button */}
                        <Button onClick={handleCreateClass} variant="contained" color="primary">
                            Create Class
                        </Button>
                        {/* Delete Class Button (Enabled only if a class is selected) */}
                        <Button
                            variant="outlined" // Use outlined for delete actions?
                            color="error"
                            onClick={handleDeleteClass}
                            disabled={!selectedClassId}
                            startIcon={<DeleteIcon />}
                        >
                            Delete Class
                        </Button>

                        {/* Subject Selection Area (Shown only if a class is selected) */}
                        {selectedClassId && (
                            <>
                                {/* Subject Selection Dropdown */}
                                <FormControl sx={{ minWidth: 200 }} disabled={!selectedClassId}>
                                    <InputLabel id="subject-select-label">Select Subject</InputLabel>
                                    <Select
                                        labelId="subject-select-label"
                                        id="subject-select"
                                        value={selectedSubjectId || ""} // Controlled component
                                        onChange={handleSubjectSelection}
                                        label="Select Subject" // Required for InputLabel
                                    >
                                        {/* Default/Placeholder Option (Optional) */}
                                        {/* <MenuItem value=""><em>None</em></MenuItem> */}
                                        {availableSubjects.map((s) => (
                                            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                {/* Add Subject Button */}
                                <Button
                                    onClick={handleAddSubject}
                                    variant="contained"
                                    color="secondary" // Use secondary color for adding subjects
                                    disabled={!selectedClassId} // Should always be enabled if this section is visible
                                >
                                    Add Subject
                                </Button>
                                {/* Delete Subject Button (Enabled only if a subject is selected) */}
                                <Button
                                    variant="outlined" // Use outlined for delete actions?
                                    color="error"
                                    onClick={handleDeleteSubject}
                                    disabled={!selectedSubjectId}
                                    startIcon={<DeleteIcon />}
                                >
                                    Delete Subject
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Row 2: Data Grid and Header Area (Shown only if class AND subject are selected) */}
                    {selectedClassId && selectedSubjectId && (
                        <>
                             {/* Header Display Section */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-white rounded shadow relative">
                                {/* Edit Subject Details Button (Positioned top-right) */}
                                <Button
                                    onClick={handleEditSubjectDetails}
                                    className="absolute top-2 right-2 z-10" // Use className for Tailwind positioning
                                    variant="contained"
                                    size="small"
                                    startIcon={<EditIcon />}
                                    sx={{ backgroundColor: 'rgb(30 58 138)', '&:hover': { backgroundColor: 'rgb(30 64 175)' } }} // Example sx styling for button
                                >
                                    Edit Details
                                </Button>
                                {/* Displaying Class/Subject Info */}
                                <div className="text-sm">Class: <strong className="font-semibold">{className}</strong></div>
                                <div className="text-sm">Subject: <strong className="font-semibold">{subjectName}</strong></div>
                                <div className="text-sm">Term: <strong className="font-semibold">{term}</strong></div>
                                <div className="text-sm">Year: <strong className="font-semibold">{year}</strong></div>
                                <div className="text-sm">Subject Teacher: <strong className="font-semibold">{subjectTeacher}</strong></div>
                                <div className="text-sm">Class Average: <strong className="font-semibold">{overallClassAverage}%</strong></div>
                            </div>

                            {/* Action Buttons for Student Data */}
                            <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                                {/* Add Student Button */}
                                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddStudent}>
                                    Add Student
                                </Button>
                                {/* Group for other actions */}
                                <div className="flex flex-wrap gap-2">
                                    {/* Delete Selected Students Button */}
                                    <Button
                                        variant="contained" color="error" startIcon={<DeleteIcon />}
                                        onClick={handleDeleteSelected} disabled={selectionModel.length === 0} // Disable if no rows selected
                                    >
                                        Delete Selected
                                    </Button>
                                    {/* Save Results Button */}
                                    <Button
                                        variant="contained" color="success" startIcon={<SaveIcon />}
                                        onClick={handleSaveAll} disabled={rows.length === 0} // Disable if no rows exist
                                    >
                                        Save Results
                                    </Button>
                                    {/* Export to Excel Button */}
                                    <Button
                                        variant="contained" color="secondary" onClick={exportToExcel}
                                        disabled={rows.length === 0} // Disable if no rows exist
                                    >
                                        Export to Excel
                                    </Button>
                                </div>
                            </div>

                             {/* Data Grid Section */}
                            {isComponentMounted && ( // Render grid only after component mount to avoid SSR issues
                                <div style={{ height: 600, width: '100%' }}>
                                <DataGrid
                                  rows={rows}
                                  columns={columns}
                                  checkboxSelection // Enable row selection if needed
                                  selectionModel={selectionModel}
                                  onSelectionModelChange={(newSelectionModel) => {
                                    setSelectionModel(newSelectionModel as number[]);
                                  }}
                                  getRowId={(row) => row.id} // Ensure you have a unique 'id' field in your data
                                />
                              </div>
                            )}
                        </>
                    )}
                     {/* Message shown if class is selected but no subject is selected */}
                     {selectedClassId && !selectedSubjectId && (
                        <div className="text-center p-6 bg-white rounded shadow text-gray-600">
                            Please select or add a subject for the class "{className}" to view or manage student results.
                        </div>
                     )}
                     {/* Message shown if no class is selected */}
                      {!selectedClassId && (
                        <div className="text-center p-6 bg-white rounded shadow text-gray-600">
                            Please select or create a class to begin.
                        </div>
                      )}

                </div> {/* End Main Content Body */}

                {/* --- Dialog Components --- */}

                {/* Add Student Dialog */}
                <Dialog open={openAddStudentDialog} onClose={handleCloseAddStudentDialog} maxWidth="xs" fullWidth>
                    <DialogTitle>Add New Student</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus // Focus this field when dialog opens
                            margin="dense"
                            id="new-student-name"
                            label="Student Name"
                            type="text"
                            fullWidth
                            variant="outlined" // Use outlined variant
                            value={newStudentName}
                            onChange={(e) => setNewStudentName(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseAddStudentDialog}>Cancel</Button>
                        <Button onClick={handleSaveNewStudent} variant="contained">Add</Button>
                    </DialogActions>
                </Dialog>

                {/* Edit Subject Details Dialog */}
                <Dialog open={openEditSubjectDialog} onClose={handleCloseEditSubjectDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>Edit Subject Details for {subjectName}</DialogTitle>
                    <DialogContent>
                        {/* Subject Name Field */}
                        <TextField autoFocus margin="dense" id="edit-subjectName" label="Subject Name" type="text" fullWidth variant="outlined"
                            value={subjectEditData.name} onChange={(e) => setSubjectEditData({ ...subjectEditData, name: e.target.value })}/>
                        {/* Subject Teacher Field */}
                        <TextField margin="dense" id="edit-subjectTeacher" label="Subject Teacher" type="text" fullWidth variant="outlined"
                            value={subjectEditData.subjectTeacher} onChange={(e) => setSubjectEditData({ ...subjectEditData, subjectTeacher: e.target.value })}/>
                        {/* Term Field */}
                        <TextField margin="dense" id="edit-term" label="Term" type="text" fullWidth variant="outlined"
                            value={subjectEditData.term} onChange={(e) => setSubjectEditData({ ...subjectEditData, term: e.target.value })}/>
                        {/* Year Field */}
                        <TextField margin="dense" id="edit-year" label="Year" type="text" fullWidth variant="outlined"
                            value={subjectEditData.year} onChange={(e) => setSubjectEditData({ ...subjectEditData, year: e.target.value })}/>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseEditSubjectDialog}>Cancel</Button>
                        <Button onClick={handleSaveSubjectDetails} variant="contained">Save Changes</Button>
                    </DialogActions>
                </Dialog>

                {/* Create Class Dialog */}
                <Dialog open={openCreateClassDialog} onClose={handleCloseCreateClassDialog} maxWidth="xs" fullWidth>
                    <DialogTitle>Create New Class</DialogTitle>
                    <DialogContent>
                        <TextField autoFocus margin="dense" id="create-className" label="Class Name" type="text" fullWidth variant="outlined"
                            value={newClassData.name} onChange={(e) => setNewClassData({ name: e.target.value })}/>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseCreateClassDialog}>Cancel</Button>
                        <Button onClick={handleSaveNewClass} variant="contained">Create</Button>
                    </DialogActions>
                </Dialog>

                 {/* Add Subject Dialog */}
                 <Dialog open={openAddSubjectDialog} onClose={handleCloseAddSubjectDialog} maxWidth="sm" fullWidth>
                     <DialogTitle>Add New Subject to "{className}"</DialogTitle>
                     <DialogContent>
                         {/* Subject Name Field */}
                         <TextField autoFocus margin="dense" id="add-newSubjectName" label="Subject Name" type="text" fullWidth variant="outlined"
                             value={newSubjectData.name} onChange={(e) => setNewSubjectData({ ...newSubjectData, name: e.target.value })}/>
                         {/* Subject Teacher Field */}
                         <TextField margin="dense" id="add-newSubjectTeacher" label="Subject Teacher" type="text" fullWidth variant="outlined"
                             value={newSubjectData.subjectTeacher} onChange={(e) => setNewSubjectData({ ...newSubjectData, subjectTeacher: e.target.value })}/>
                         {/* Term Field */}
                         <TextField margin="dense" id="add-newTerm" label="Term" type="text" fullWidth variant="outlined"
                             value={newSubjectData.term} onChange={(e) => setNewSubjectData({ ...newSubjectData, term: e.target.value })}/>
                         {/* Year Field */}
                         <TextField margin="dense" id="add-newYear" label="Year" type="text" fullWidth variant="outlined"
                             value={newSubjectData.year} onChange={(e) => setNewSubjectData({ ...newSubjectData, year: e.target.value })}/>
                     </DialogContent>
                     <DialogActions>
                         <Button onClick={handleCloseAddSubjectDialog}>Cancel</Button>
                         <Button onClick={handleSaveNewSubject} variant="contained">Add Subject</Button>
                     </DialogActions>
                 </Dialog>

            </SidebarInset> {/* End Main content area */}
        </SidebarProvider> // End Sidebar context
    ); // End component return
} // End ClassPage component
