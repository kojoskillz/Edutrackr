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
    GridRowSelectionModel,
} from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from '@mui/icons-material/Visibility'; // Icon for viewing report card
import PrintIcon from '@mui/icons-material/Print'; // Icon for printing

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
import {
    Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
    Select, MenuItem, InputLabel, FormControl, SelectChangeEvent, Card, CardContent, Typography, CardMedia, TextareaAutosize
} from "@mui/material";
// Dynamically import excel libraries only on the client-side
const FileSaver = typeof window !== 'undefined' ? require('file-saver') : null;
const XLSX = typeof window !== 'undefined' ? require('xlsx') : null;

// --- Type Definitions ---

// Defines the structure for a student, now stored at the class level
type Student = {
    id: string; // Unique identifier for the student
    name: string; // Student's name
    imageUrl?: string; // Added field for student image (base64 or URL) - Stored per student
    overallRemarks?: string; // Added field for overall remarks for the student in this class
};


// Defines the structure for each student row in the DataGrid (per subject)
// This will now merge student details from the class list with subject-specific scores
type StudentRow = Student & { // Inherit properties from Student type
    // Subject-specific scores and calculated fields
    cat1?: number; // Score for Continuous Assessment Test 1
    cat2?: number; // Score for Continuous Assessment Test 2
    projectWork?: number; // Score for Project Work
    exams?: number; // Score for Exams
    total?: number; // Calculated total score for this subject
    position?: string; // Calculated position in this subject
    remarks?: string; // Calculated remarks for this subject
    isNew?: boolean; // Flag to indicate if the row is newly added and needs initial editing (per subject view)
};

// Defines the structure for class data, now including a list of students
type ClassData = {
    id: string; // Unique identifier for the class
    name: string; // Name of the class
    students: Student[]; // List of students in this class
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

// Type for the aggregated student report card data
type StudentReportCardData = {
    studentId: string;
    studentName: string;
    className: string;
    term: string;
    year: string;
    imageUrl?: string;
    overallRemarks?: string;
    subjectResults: {
        subjectId: string;
        subjectName: string;
        subjectTeacher: string;
        cat1?: number;
        cat2?: number;
        projectWork?: number;
        exams?: number;
        total?: number;
        position?: string;
    }[];
    // Could add overall total, average, position across all subjects here if needed
};

// Define a type for the overall student result row (for overall ranking view)
type OverallStudentRow = {
    id: string; // Student ID
    name: string; // Student Name
    overallTotalScore: number; // Sum of total scores across all subjects
    overallAverage: number; // Average score across all subjects
    overallRank: string; // Overall rank in the class
    subjectTotals: { [subjectId: string]: number }; // Object to hold total scores for each subject
};


// --- React Component ---

export default function ClassPage() {
    // --- State Variables ---
    const router = useRouter(); // Hook for navigation (if using Next.js)

    // DataGrid state (still represents the current subject's view)
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
    // Classes now include the list of students
    const [classes, setClasses] = React.useState<ClassData[]>([]); // List of all created classes
    const [subjects, setSubjects] = React.useState<SubjectInfo[]>([]); // List of all created subjects

    // Derived state for display purposes (updated when class/subject changes)
    const [className, setClassName] = React.useState("N/A"); // Display name of the selected class
    const [subjectName, setSubjectName] = React.useState("N/A"); // Display name of the selected subject
    const [term, setTerm] = React.useState("N/A"); // Display term for the selected subject
    const [year, setYear] = React.useState("N/A"); // Display year for the selected subject
    const [subjectTeacher, setSubjectTeacher] = React.useState("N/A"); // Display teacher for the selected subject
    const [overallClassAverage, setOverallClassAverage] = React.useState<number | string>(0); // Calculated average score for the current rows (per subject)

    // --- State for Overall Ranking ---
    const [overallResults, setOverallResults] = React.useState<OverallStudentRow[]>([]); // Holds the overall results data for the class
    const [showOverallResults, setShowOverallResults] = React.useState(false); // Controls visibility of the overall results section
    const [dynamicOverallColumns, setDynamicOverallColumns] = React.useState<GridColDef<OverallStudentRow>[]>([]); // Holds dynamically generated subject columns


    // Dialog states
    const [openAddStudentDialog, setOpenAddStudentDialog] = React.useState(false); // Controls visibility of the "Add Student" dialog (single student)
    const [newStudentName, setNewStudentName] = React.useState(""); // Input field state for the new student's name (single student)
    const [openPasteNamesDialog, setOpenPasteNamesDialog] = React.useState(false); // Controls visibility of the "Paste Names" dialog
    const [pastedNames, setPastedNames] = React.useState(""); // State for the pasted names text area
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

    // Report Card State
    const [openReportCardDialog, setOpenReportCardDialog] = React.useState(false); // Controls visibility of the Report Card dialog
    const [currentStudentReport, setCurrentStudentReport] = React.useState<StudentReportCardData | null>(null); // Holds data for the student whose report card is open (aggregated)
    // Report card image and remarks are now stored per student in the classes state,
    // but we'll use state here for editing within the dialog.
    const [reportCardImage, setReportCardImage] = React.useState<string | null>(null); // Holds the image URL/base64 for the report card
    const [reportCardOverallRemarks, setReportCardOverallRemarks] = React.useState<string>(""); // Holds the overall remarks for the report card

    // Ref for the printable report card content
    const reportCardRef = React.useRef<HTMLDivElement>(null);
    // Ref for the printable overall ranking content
    const overallRankingRef = React.useRef<HTMLDivElement>(null);


    // --- Helper Functions ---

    /**
     * Generates a unique localStorage key for storing subject-specific student data
     * based on the selected class and subject IDs.
     * @param classId The ID of the selected class.
     * @param subjectId The ID of the selected subject.
     * @returns A string key or null if IDs are missing.
     */
    const getSubjectStudentDataKey = (classId: string | null, subjectId: string | null): string | null => {
        if (!classId || !subjectId) return null;
        return `subjectStudentData-${classId}-${subjectId}`;
    };

     /**
     * Generates a unique localStorage key for storing the classes data (including students).
     */
    const getClassesDataKey = (): string => {
        return "classesData"; // Using a single key for all classes and their students
    };


    /**
     * Calculates the average 'total' score from the provided rows
     * and updates the `overallClassAverage` state (per subject).
     * @param currentRows An array of StudentRow objects.
     */
    const calculateAndSetAverage = (currentRows: StudentRow[]) => {
        if (!currentRows || currentRows.length === 0) {
            setOverallClassAverage(0); // Set average to 0 if no rows
            return;
        }
        let totalOfTotals = 0;
        currentRows.forEach(row => {
            // Use existing total if available, otherwise calculate it
            const cat1 = row.cat1 || 0;
            const cat2 = row.cat2 || 0;
            const projectWork = row.projectWork || 0;
            const exams = row.exams || 0;

            // Ensure calculation matches the DataGrid valueGetter logic
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
    const getOrdinalSuffix = (position: number): string => {
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


    // --- Helper Function for Overall Ranking ---
    /**
     * Aggregates student data from all subjects for a given class
     * and calculates overall total, average, and rank.
     * Also generates dynamic columns for each subject.
     * @param classId The ID of the class to process.
     * @param allSubjects Array of all subjects.
     * @param classesData Array of all classes (to get student list).
     * @param getSubjectStudentDataKey Function to get localStorage key for subject data.
     * @returns An object containing rankedResults (OverallStudentRow[]) and subjectColumns (GridColDef[]).
     */
    const calculateOverallResults = (classId: string, allSubjects: SubjectInfo[], classesData: ClassData[], getSubjectStudentDataKey: (classId: string, subjectId: string) => string | null): { rankedResults: OverallStudentRow[], subjectColumns: GridColDef<OverallStudentRow>[] } => {
        const studentsOverallData: { [studentId: string]: { name: string; totalScores: number[]; subjectCount: number; subjectTotals: { [subjectId: string]: number } } } = {};

        // Find the selected class to get its student list
        const selectedClass = classesData.find(c => c.id === classId);
        const studentsInClass = selectedClass?.students || [];

        if (studentsInClass.length === 0) {
             return { rankedResults: [], subjectColumns: [] }; // No students in class
        }

        // Initialize overall data structure with all students from the class
        studentsInClass.forEach(student => {
             studentsOverallData[student.id] = {
                 name: student.name,
                 totalScores: [],
                 subjectCount: 0,
                 subjectTotals: {},
             };
        });


        // Filter subjects belonging to the selected class
        const subjectsForClass = allSubjects.filter(subject => subject.classId === classId);

        subjectsForClass.forEach(subject => {
            const subjectStudentDataKey = getSubjectStudentDataKey(classId, subject.id);
            if (subjectStudentDataKey && typeof window !== 'undefined') {
                const savedRows = localStorage.getItem(subjectStudentDataKey);
                if (savedRows) {
                    try {
                        const subjectRows: StudentRow[] = JSON.parse(savedRows); // Assuming StudentRow structure
                        subjectRows.forEach(studentRow => {
                            const studentId = studentRow.id;
                            const subjectTotal = studentRow.total ?? 0; // Use subject total, default to 0

                            // Only process if the student exists in the class's student list
                            if (studentsOverallData[studentId]) {
                                studentsOverallData[studentId].totalScores.push(subjectTotal);
                                studentsOverallData[studentId].subjectCount++;
                                studentsOverallData[studentId].subjectTotals[subject.id] = subjectTotal; // Store subject total
                            }
                        });
                    } catch (error) {
                        console.error(`Failed to parse student data for subject ${subject.name}:`, error);
                        // Continue processing other subjects
                    }
                }
            }
        });

        // Convert aggregated data into the OverallStudentRow format and calculate overall average
        const overallResults: OverallStudentRow[] = Object.keys(studentsOverallData).map(studentId => {
            const data = studentsOverallData[studentId];
            const overallTotalScore = data.totalScores.reduce((sum, score) => sum + score, 0);
            // Calculate average only if there are subjects with data
            const overallAverage = data.subjectCount > 0 ? overallTotalScore / data.subjectCount : 0;

            return {
                id: studentId,
                name: data.name,
                overallTotalScore: parseFloat(overallTotalScore.toFixed(2)), // Format total
                overallAverage: parseFloat(overallAverage.toFixed(2)), // Format average
                overallRank: "N/A", // Placeholder, will be calculated next
                subjectTotals: data.subjectTotals, // Include subject totals
            };
        });

        // Sort by overall total score in descending order to determine rank
        overallResults.sort((a, b) => b.overallTotalScore - a.overallTotalScore);

        // Calculate overall rank
        const rankedResults = overallResults.map((row, index) => {
            const rank = index + 1;
            // You might want to handle ties here if needed (e.g., same rank for same score)
            // For simplicity, this assigns unique ranks based on sort order.
            return {
                ...row,
                overallRank: `${rank}${getOrdinalSuffix(rank)}`,
            };
        });

        // --- Generate Dynamic Subject Columns ---
        const subjectColumns: GridColDef<OverallStudentRow>[] = subjectsForClass.map(subject => ({
            field: subject.id, // Use subject ID as the field name
            headerName: `${subject.name} Total`, // Header will be Subject Name + " Total"
            width: 150,
            type: 'number',
            editable: false, // Subject totals are calculated, not edited here
            sortable: true,
            // Value getter to display the total score for this subject from the subjectTotals object
            valueGetter: (value, row) => row.subjectTotals[subject.id] ?? 0, // Default to 0 if no data for this subject
        }));


        return { rankedResults, subjectColumns };
    };


    // --- Report Card Handlers ---

    /** Returns a handler function to open the report card for a specific student ID.
     */
    const handleViewReportCard = React.useCallback((studentId: string) => () => {
        if (!selectedClassId || !isComponentMounted) {
            toast.error("Please select a class first.");
            return;
        }

        // Find the student's overall details from the classes state
        const currentClass = classes.find(c => c.id === selectedClassId);
        const studentDetails = currentClass?.students.find(s => s.id === studentId);

        if (!studentDetails) {
            toast.error("Student data not found in the selected class.");
            return;
        }

        const studentName = studentDetails.name;
        const studentImageUrl = studentDetails.imageUrl;
        const studentOverallRemarks = studentDetails.overallRemarks;


        // Aggregate results from ALL subjects for this class
        const subjectsForClass = subjects.filter(s => s.classId === selectedClassId);
        const aggregatedSubjectResults: StudentReportCardData['subjectResults'] = [];

        subjectsForClass.forEach(subject => {
            const subjectStudentDataKey = getSubjectStudentDataKey(selectedClassId, subject.id);
            if (subjectStudentDataKey && typeof window !== 'undefined') {
                const savedRows = localStorage.getItem(subjectStudentDataKey);
                if (savedRows) {
                    try {
                        const subjectRows: StudentRow[] = JSON.parse(savedRows);
                        // Find the student's data in this specific subject's rows
                        const studentSubjectRow = subjectRows.find(row => row.id === studentId);


                        if (studentSubjectRow) {
                            aggregatedSubjectResults.push({
                                subjectId: subject.id,
                                subjectName: subject.name,
                                subjectTeacher: subject.subjectTeacher,
                                cat1: studentSubjectRow.cat1,
                                cat2: studentSubjectRow.cat2,
                                projectWork: studentSubjectRow.projectWork,
                                exams: studentSubjectRow.exams,
                                total: studentSubjectRow.total,
                                position: studentSubjectRow.position,
                            });
                        }
                    } catch (error) {
                        console.error(`Failed to parse student data for subject ${subject.name}:`, error);
                        // Continue to the next subject even if one fails
                    }
                }
            }
        });

        // Find the class details
        const currentClassDetails = classes.find(c => c.id === selectedClassId);
        // Find the term and year from any subject in the class (assuming they are consistent)
        const anySubjectInClass = subjectsForClass.length > 0 ? subjectsForClass[0] : null;
        const term = anySubjectInClass?.term || "N/A";
        const year = anySubjectInClass?.year || "N/A";


        // Construct the aggregated report card data
        const reportData: StudentReportCardData = {
            studentId: studentId,
            studentName: studentName,
            className: currentClassDetails?.name || "N/A",
            term: term,
            year: year,
            imageUrl: studentImageUrl, // Use the image URL from the student details in classes state
            overallRemarks: studentOverallRemarks, // Use overall remarks from the student details in classes state
            subjectResults: aggregatedSubjectResults,
        };

        setCurrentStudentReport(reportData); // Set the aggregated report data
        setReportCardImage(reportData.imageUrl || null); // Set the image state for the dialog
        setReportCardOverallRemarks(reportData.overallRemarks || ""); // Set the remarks state for the dialog
        setOpenReportCardDialog(true); // Open the dialog

    }, [selectedClassId, rows, subjects, classes, isComponentMounted]); // Dependencies


    /** Closes the Report Card dialog and resets related state.
     */
    const handleCloseReportCardDialog = () => {
        setOpenReportCardDialog(false);
        setCurrentStudentReport(null); // Clear the current student data
        setReportCardImage(null); // Clear the image state
        setReportCardOverallRemarks(""); // Clear the remarks state
    };

    /** Handles changes to the Overall Remarks field within the Report Card dialog.
     */
    const handleReportCardOverallRemarksChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setReportCardOverallRemarks(event.target.value);
    };

    /** Handles image file selection for the Report Card.
     */
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Store the image as a base64 data URL
                setReportCardImage(reader.result as string);
            };
            reader.readAsDataURL(file); // Read the file as a data URL
        }
    };

    /** Saves the changes made in the Report Card dialog (overall remarks and image)
     * to the student's data within the classes state.
     */
    const handleSaveReportCard = () => {
        if (currentStudentReport && selectedClassId && isMountedRef.current) {
            // Find the current class
            const currentClassIndex = classes.findIndex(c => c.id === selectedClassId);

            if (currentClassIndex !== -1) {
                // Find the student within the class's student list
                const studentIndex = classes[currentClassIndex].students.findIndex(
                    student => student.id === currentStudentReport.studentId
                );

                if (studentIndex !== -1) {
                    // Create an updated student object with new remarks and image
                    const updatedStudent = {
                        ...classes[currentClassIndex].students[studentIndex],
                        overallRemarks: reportCardOverallRemarks,
                        imageUrl: reportCardImage,
                    };

                    // Create a new classes array with the updated student
                    const updatedClasses = classes.map((cls, index) => {
                        if (index === currentClassIndex) {
                            return {
                                ...cls,
                                students: cls.students.map(student =>
                                    student.id === updatedStudent.id ? updatedStudent : student
                                ),
                            };
                        }
                        return cls;
                    });

                    // Update the classes state
                    setClasses(updatedClasses);

                    // Also update the current rows state if the student is present
                    setRows(prevRows =>
                        prevRows.map(row =>
                            row.id === currentStudentReport.studentId
                                ? { ...row, overallRemarks: reportCardOverallRemarks, imageUrl: reportCardImage }
                                : row
                        )
                    );


                    toast.success("Report card details saved.");
                    handleCloseReportCardDialog(); // Close the dialog

                } else {
                    toast.error("Could not find student in class data to save.");
                }
            } else {
                toast.error("Could not find class to save report card details.");
            }
        } else {
            toast.error("Cannot save report card details (student data or selection missing).");
        }
    };


    /** Handles printing the report card content.
     */
    const handlePrintReportCard = () => {
        if (reportCardRef.current) {
            const printContent = reportCardRef.current.innerHTML;
            const originalContent = document.body.innerHTML;
            const originalTitle = document.title; // Save original title

            // Temporarily replace the body's content with the report card content for printing
            document.body.innerHTML = printContent;
            // Set a print-friendly title
            document.title = `Report Card - ${currentStudentReport?.studentName || 'Student'}`;


            // Add a style block to hide elements not needed for printing (like the dialog overlay, buttons etc.)
            // Also, add styles for the report card itself to ensure it lays out well in print
            const printStyles = `
                <style>
                    @media print {

                        /* Hide everything except the report card content */
                        body > *:not(#report-card-content) {
                            display: none !important;
                        }

                        #report-card-content {
                            display: block !important;
                            width: 100%;
                            margin: 0 auto; /* Center the content if less than 100% width */
                            padding: 10mm; /* Add some padding for print margins */
                            box-sizing: border-box; /* Include padding in width */
                            font-family: sans-serif; /* Specify a common font */
                            color: #000; /* Ensure text is black */
                        }

                        /* Ensure card elements don't add extra space/borders in print */
                        .MuiCard-root, .MuiCardContent-root {
                            border: none !important;
                            box-shadow: none !important;
                            padding: 0 !important;
                            margin: 0 !important;
                        }

                        /* Basic typography reset/styling */
                        h1, h2, h6, p, strong {
                           color: #000 !important; /* Force black text */
                           margin-bottom: 0.5em; /* Add some space below headings/paragraphs */
                        }
                         h6 { font-size: 1.1em; margin-top: 1em; }
                         p { font-size: 0.9em; }


                        /* Flex/Grid adjustments for print */
                        .flex { display: flex !important; }
                        .grid { display: grid !important; }
                        .flex-col { flex-direction: column !important; }
                         .md\\:flex-row { flex-direction: row !important; }
                         .items-center { align-items: center !important; }
                         .gap-4 { gap: 1rem !important; }
                         .mb-4 { margin-bottom: 1rem !important; }
                         .p-4 { padding: 1rem !important; }
                         .p-3 { padding: 0.75rem !important; }
                         .p-2 { padding: 0.5rem !important; }
                         .space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem !important; margin-bottom: 0 !important; }
                         .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                         .md\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
                         .flex-shrink-0 { flex-shrink: 0 !important; }
                         .flex-grow { flex-grow: 1 !important; }
                         .justify-center { justify-content: center !important; }

                        /* Image styling */
                         img {
                             display: block !important;
                             max-width: 100% !important;
                             height: auto !important;
                             object-fit: cover !important;
                         }
                         .rounded-full { border-radius: 9999px !important; }
                         .h-32 { height: 8rem !important; } /* Tailwind h-32 */
                         .w-32 { width: 8rem !important; } /* Tailwind w-32 */
                         .border-2 { border-width: 2px !important; }
                         .border-blue-500 { border-color: #3b82f6 !important; } /* Tailwind blue-500 */


                        /* Separator styling */
                        .MuiDivider-root, .separator {
                            border-top: 1px solid #ccc !important;
                            margin: 1em 0 !important;
                        }

                        /* Hide elements with print-hide class */
                        .print-hide {
                            display: none !important;
                        }

                        /* Elements only visible in print */
                        .print-only {
                            display: block !important;
                        }

                        /* Specific overrides for dialog/modal elements that might sneak in */
                        .MuiDialog-container, .MuiDialog-paper, .MuiModal-backdrop {
                             display: none !important;
                        }

                    }
                </style>
            `;
            // Append print styles to the head
            const styleElement = document.createElement('style');
            styleElement.innerHTML = printStyles;
            document.head.appendChild(styleElement);


            window.print();

            // Restore the original content and title after printing
            document.body.innerHTML = originalContent;
            document.title = originalTitle;

            // Remove the added print styles
            if (document.head.contains(styleElement)) {
                 document.head.removeChild(styleElement);
            }


            // A small delay might be needed to ensure the DOM is fully restored before other actions
            // This is often necessary in SPAs where React needs to re-render the original content.
            // The current approach of replacing innerHTML is quite disruptive to React.
            // A better approach for complex apps might involve rendering a dedicated print component
            // in a new window or iframe, or using a library designed for printing React components.
            // However, for this simple approach, this might suffice.
             setTimeout(() => {
                 // You might need to re-initialize some JS components if they were affected
                 // For this simple case, just restoring innerHTML might be enough.
             }, 50); // Adjusted delay slightly


        } else {
            toast.error("Report card content not available for printing.");
        }
    };


    /** Returns a handler function to delete a specific student row by ID.
     * Deletes the student from the class list and all subject data for that class.
     */
    const handleDeleteSingle = React.useCallback((id: string) => () => {
        if (!selectedClassId || !isMountedRef.current) return;

        // Confirmation dialog
        if (window.confirm("Delete this student's record from this class and all subjects?") && isMountedRef.current) {

            // 1. Remove student from the class's student list in the classes state
            setClasses(prevClasses =>
                prevClasses.map(cls => {
                    if (cls.id === selectedClassId) {
                        return {
                            ...cls,
                            students: cls.students.filter(student => student.id !== id),
                        };
                    }
                    return cls;
                })
            );

            // 2. Remove student's data from the current subject's rows state
            setRows((prev) => {
                const newRows = prev.filter((r) => r.id !== id); // Use strict equality for exact ID match
                calculateAndSetAverage(newRows); // Recalculate average after deletion
                return newRows;
            });

            // 3. Remove student's data from ALL subject localStorage entries for this class
            const subjectsForClass = subjects.filter(s => s.classId === selectedClassId);
            subjectsForClass.forEach(subject => {
                const subjectStudentDataKey = getSubjectStudentDataKey(selectedClassId, subject.id);
                 if (subjectStudentDataKey && typeof window !== 'undefined') {
                    const savedRows = localStorage.getItem(subjectStudentDataKey);
                    if (savedRows) {
                        try {
                            let subjectRows: StudentRow[] = JSON.parse(savedRows);
                            const updatedSubjectRows = subjectRows.filter(row => row.id !== id);
                            localStorage.setItem(subjectStudentDataKey, JSON.stringify(updatedSubjectRows));
                        } catch (error) {
                            console.error(`Failed to update student data for subject ${subject.name} on delete:`, error);
                        }
                    }
                 }
            });


            toast.success("Student record deleted from class and all subjects.");
        }
    }, [selectedClassId, subjects, calculateAndSetAverage]); // Dependencies


    // --- Effects ---

    /**
     * Effect Hook: Runs once on component mount.
     * - Sets the mounted ref and state.
     * - Loads saved data (classes, subjects, selections) from localStorage.
     * - Handles potential parsing errors.
     * - Loads student rows for the last selected class/subject if available.
     */
    React.useEffect(() => {
        isMountedRef.current = true;
        setIsComponentMounted(true); // Indicate component is ready for client-side operations

        // Proceed only if running in a browser environment
        if (typeof window !== "undefined") {
            // Load core data: classes (including students) and subjects
            const savedClassesData = localStorage.getItem(getClassesDataKey());
            const savedSubjects = localStorage.getItem("subjects");
            let loadedClasses: ClassData[] = [];
            let loadedSubjects: SubjectInfo[] = [];

            if (savedClassesData) {
                try {
                    loadedClasses = JSON.parse(savedClassesData);
                    // Ensure 'students' array exists for backward compatibility if loading old data format
                    loadedClasses = loadedClasses.map(cls => ({
                         ...cls,
                         students: cls.students || [] // Ensure students array is initialized
                    }));
                    setClasses(loadedClasses);
                } catch (error) {
                    console.error("Failed to parse saved classes data:", error);
                    localStorage.removeItem(getClassesDataKey()); // Clear invalid data
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
                        const validSubject = loadedSubjects.find(s => s.id ===
                            savedSelectedSubjectId && s.classId === savedSelectedClassId);
                        if (validSubject) {
                            setSelectedSubjectId(savedSelectedSubjectId);
                            // Set subject details for display
                            setSubjectName(validSubject.name);
                            setTerm(validSubject.term);
                            setYear(validSubject.year);
                            setSubjectTeacher(validSubject.subjectTeacher);

                            // Load student data for this specific class/subject
                            const subjectStudentDataKey = getSubjectStudentDataKey(savedSelectedClassId, savedSelectedSubjectId);
                            if (subjectStudentDataKey) {
                                const savedRows = localStorage.getItem(subjectStudentDataKey);
                                let subjectRows: StudentRow[] = savedRows ? JSON.parse(savedRows) : [];

                                // Get the list of students for the selected class
                                const studentsInClass = validClass.students || [];

                                // Merge class student list with subject-specific data
                                const mergedRows: StudentRow[] = studentsInClass.map(student => {
                                    const subjectData = subjectRows.find(row => row.id === student.id);
                                    return {
                                        ...student, // Include student details from the class list
                                        cat1: subjectData?.cat1,
                                        cat2: subjectData?.cat2,
                                        projectWork: subjectData?.projectWork,
                                        exams: subjectData?.exams,
                                        total: subjectData?.total,
                                        position: subjectData?.position,
                                        remarks: subjectData?.remarks,
                                        isNew: subjectData?.isNew, // Preserve isNew flag if it existed
                                    };
                                });

                                setRows(mergedRows);
                                calculateAndSetAverage(mergedRows); // Calculate average for loaded data

                            } else {
                                // Should not happen if class/subject are selected, but safety check
                                setRows([]);
                                setOverallClassAverage(0);
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
            // Save classes data (including students) using the dedicated key
            localStorage.setItem(getClassesDataKey(), JSON.stringify(classes));
            localStorage.setItem("subjects", JSON.stringify(subjects));
            localStorage.setItem("selectedClassId", selectedClassId || ""); // Save empty string if null
            localStorage.setItem("selectedSubjectId", selectedSubjectId || ""); // Save empty string if null

            // Save subject-specific student data ONLY if a class and subject are selected
            const subjectStudentDataKey = getSubjectStudentDataKey(selectedClassId, selectedSubjectId);
            if (subjectStudentDataKey) {
                 // Filter out only the subject-specific fields before saving
                 const subjectSpecificRows = rows.map(row => ({
                     id: row.id,
                     cat1: row.cat1,
                     cat2: row.cat2,
                     projectWork: row.projectWork,
                     exams: row.exams,
                     total: row.total,
                     position: row.position,
                     remarks: row.remarks,
                     isNew: row.isNew,
                     // Do NOT save name, imageUrl, overallRemarks here as they are in the classes state
                 }));
                localStorage.setItem(subjectStudentDataKey, JSON.stringify(subjectSpecificRows));
            }
        }
        // Dependencies: This effect re-runs if any of these values change
    }, [rows, classes, subjects, selectedClassId, selectedSubjectId, isComponentMounted]);


    // --- Effect to Calculate Overall Results ---
    React.useEffect(() => {
        // Calculate overall results and dynamic columns whenever the selected class changes or subjects data changes
        // This ensures the overall ranking data is fresh when the user switches to the overall view.
        if (selectedClassId && isComponentMounted) {
            const { rankedResults, subjectColumns } = calculateOverallResults(selectedClassId, subjects, classes, getSubjectStudentDataKey);
            setOverallResults(rankedResults);
            setDynamicOverallColumns(subjectColumns); // Set the dynamically generated columns
        } else {
            setOverallResults([]); // Clear overall results if no class is selected
            setDynamicOverallColumns([]); // Clear dynamic columns
        }
    }, [selectedClassId, subjects, classes, isComponentMounted]); // Dependencies now include 'classes'


    // --- DataGrid Column Definitions ---

    /**
     * Memoized definition of the columns for the DataGrid (per subject view).
     * Includes configuration for headers, fields, types, editing, sorting, and actions.
     */
    const columns: GridColDef<StudentRow>[] = React.useMemo(() => [
        // Student Name Column (Not editable here, name is managed at class level)
        { field: "name", headerName: "Name of Students", width: 200, editable: false },
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
        // Actions Column (View Report Card, Delete)
        {
            field: "actions",
            type: "actions",
            headerName: "Actions",
            width: 150, // Increased width to accommodate two icons
            // Defines the actions available for each row
            getActions: ({ id }) => [
                // View Report Card Action
                <GridActionsCellItem
                    key={`view-${id}`}
                    icon={<VisibilityIcon />}
                    label="View Report Card"
                    onClick={handleViewReportCard(id as string)} // Calls the handler to open report card
                    color="primary" // Use primary color for view action
                />,
                // Delete Action
                <GridActionsCellItem
                    key={`delete-${id}`}
                    icon={<DeleteIcon />}
                    label="Delete"
                    onClick={handleDeleteSingle(id as string)} // Calls the delete handler
                    color="inherit"
                />,
            ],
        },
    ], [handleViewReportCard, handleDeleteSingle]); // Dependencies include handlers used in getActions

    // --- DataGrid Column Definitions for Overall Ranking ---
    const overallColumns: GridColDef<OverallStudentRow>[] = React.useMemo(() => {
        // Base columns for overall ranking
        const baseColumns: GridColDef<OverallStudentRow>[] = [
            { field: "name", headerName: "Student Name", width: 250 },
            // Subject total columns will be inserted here dynamically
            { field: "overallTotalScore", headerName: "Overall Total", width: 150, type: "number" },
            { field: "overallAverage", headerName: "Overall Average (%)", width: 150, type: "number" },
            { field: "overallRank", headerName: "Overall Rank", width: 120 },
        ];

        // Combine dynamic subject columns with base columns
        // Insert subject columns before Overall Total
        const combinedColumns: GridColDef<OverallStudentRow>[] = [
            ...baseColumns.slice(0, 1), // 'Student Name' column
            ...dynamicOverallColumns, // Dynamically generated subject columns
            ...baseColumns.slice(1), // Remaining base columns (Overall Total, Average, Rank)
        ];

        return combinedColumns;
    }, [dynamicOverallColumns]); // Recalculate columns when dynamicOverallColumns changes


    // --- Event Handlers & Logic ---

    // --- Class Management Handlers ---

    /** Opens the "Create New Class" dialog.
     */
    const handleCreateClass = () => {
        setOpenCreateClassDialog(true);
    };

    /** Closes the "Create New Class" dialog and resets its form.
     */
    const handleCloseCreateClassDialog = () => {
        setOpenCreateClassDialog(false);
        setNewClassData({ name: "" }); // Reset input field
    };

    /** Saves the new class, updates state and localStorage, and selects the new class.
     */
    const handleSaveNewClass = () => {
        // Validate input and ensure component is mounted
        if (newClassData.name.trim() && isMountedRef.current) {
            const newClassId = crypto.randomUUID(); // Generate a unique ID
            const newClass: ClassData = { id: newClassId, name: newClassData.name.trim(), students: [] }; // Initialize with empty students array
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
            setShowOverallResults(false); // Hide overall results view when class changes
            setOverallResults([]); // Clear overall results
            setDynamicOverallColumns([]); // Clear dynamic columns


            handleCloseCreateClassDialog(); // Close the dialog
            toast.success(`Class "${newClass.name}" created. Select or add a subject.`);
        } else if (!newClassData.name.trim()) {
            toast.error("Class name cannot be empty.");
        }
    };

    /** Handles selection changes in the Class dropdown.
     */
    const handleClassSelection = (event: SelectChangeEvent<string>) => {
        const selectedId = event.target.value;
        if (!selectedId) { // Handle case where user deselects (might not happen with standard Select)
            setSelectedClassId(null);
            setSelectedSubjectId(null);
            setClassName("N/A");
            setRows([]);
            setSelectionModel([]); // Reset grid selection
            // Reset all subject-related display info
            setSubjectName("N/A");
            setTerm("N/A");
            setYear("N/A");
            setSubjectTeacher("N/A");
            setOverallClassAverage(0);
            setShowOverallResults(false); // Hide overall results view when class changes
            setOverallResults([]); // Clear overall results
            setDynamicOverallColumns([]); // Clear dynamic columns
            return;
        }

        setSelectedClassId(selectedId);
        setSelectedSubjectId(null); // Reset subject when class changes

        // Find the selected class object to get its name and student list
        const selectedClass = classes.find((c) => c.id === selectedId);
        setClassName(selectedClass ? selectedClass.name : "N/A");

        // Clear data and display related to the previous selection
        setRows([]); // Clear rows as we are changing class
        setSelectionModel([]); // Reset selection model
        setSubjectName("N/A");
        setTerm("N/A");
        setYear("N/A");
        setSubjectTeacher("N/A");
        setOverallClassAverage(0);
        setShowOverallResults(false); // Hide overall results view when class changes
        // Overall results and dynamic columns will be calculated by the effect hook
    };

    /** Deletes the selected class, its subjects, and all associated student data.
     */
    const handleDeleteClass = () => {
        if (!selectedClassId) {
            toast.info("No class selected to delete.");
            return;
        }

        // Confirmation dialog
        if (window.confirm(`ARE YOU SURE?\n\nDeleting class "${className}" will permanently remove:\n- The class itself\n- All subjects within this class\n- All student records for all subjects in this class.\n\nThis action cannot be undone.`) && isMountedRef.current) {

            // Find subjects associated with this class to remove their data
            const subjectsToDelete = subjects.filter(s => s.classId === selectedClassId);
            // Remove subject-specific student data for each subject of this class from localStorage
            subjectsToDelete.forEach(subject => {
                const subjectStudentDataKey = getSubjectStudentDataKey(selectedClassId, subject.id);
                if (subjectStudentDataKey && typeof window !== 'undefined') {
                    localStorage.removeItem(subjectStudentDataKey);
                }
            });

            // --- Update State ---
            // Remove the class from the classes array (this also removes its student list)
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
            setOverallResults([]); // Clear overall results
            setDynamicOverallColumns([]); // Clear dynamic columns
            setShowOverallResults(false); // Hide overall results view

            toast.success(`Class "${className}" and all its data deleted.`);
        }
    };


    // --- Subject Management Handlers ---

    /** Opens the "Add New Subject" dialog.
     * Requires a class to be selected first. */
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

    /** Saves the new subject, links it to the selected class, and updates state.
     */
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
            setShowOverallResults(false); // Hide overall results view when subject changes
            // Overall results and dynamic columns will be calculated by the effect hook

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
            setShowOverallResults(false); // Hide overall results view when subject changes
            return;
        }

        setSelectedSubjectId(selectedId);
        // Find the selected subject object to get its details
        const selectedSubject = subjects.find((s) => s.id === selectedId);
        const currentClass = classes.find(c => c.id === selectedClassId);

        if (selectedSubject && currentClass) {
            // Update displayed header information
            setSubjectName(selectedSubject.name);
            setTerm(selectedSubject.term);
            setYear(selectedSubject.year);
            setSubjectTeacher(selectedSubject.subjectTeacher);

            setSelectionModel([]); // Reset selection model before loading new rows
            setShowOverallResults(false); // Hide overall results view when subject changes

            // Load student data for this specific class/subject combination from localStorage
            const subjectStudentDataKey = getSubjectStudentDataKey(selectedClassId, selectedId);
            let subjectRows: StudentRow[] = [];
            if (subjectStudentDataKey && typeof window !== 'undefined') {
                const savedRows = localStorage.getItem(subjectStudentDataKey);
                if (savedRows) {
                    try {
                        subjectRows = JSON.parse(savedRows);
                    } catch (error) {
                        console.error("Failed to parse subject student data on subject selection:", error);
                        toast.error("Could not load student data for this subject.");
                    }
                }
            }

            // Get the list of students for the selected class
            const studentsInClass = currentClass.students || [];

            // Merge class student list with subject-specific data
            const mergedRows: StudentRow[] = studentsInClass.map(student => {
                const subjectData = subjectRows.find(row => row.id === student.id);
                return {
                    ...student, // Include student details from the class list (id, name, imageUrl, overallRemarks)
                    cat1: subjectData?.cat1,
                    cat2: subjectData?.cat2,
                    projectWork: subjectData?.projectWork,
                    exams: subjectData?.exams,
                    total: subjectData?.total,
                    position: subjectData?.position,
                    remarks: subjectData?.remarks,
                    isNew: subjectData?.isNew, // Preserve isNew flag if it existed
                };
            });

            setRows(mergedRows);
            calculateAndSetAverage(mergedRows); // Calculate average for the loaded data

        } else {
            // Subject or Class not found (e.g., if data is inconsistent)
            setRows([]);
            setSelectionModel([]); // Reset selection model
            setSubjectName("N/A");
            setTerm("N/A");
            setYear("N/A");
            setSubjectTeacher("N/A");
            setOverallClassAverage(0);
            setShowOverallResults(false); // Hide overall results view
        }
    };


    /** Opens the "Edit Subject Details" dialog, pre-filled with current subject info.
     */
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

    /** Closes the "Edit Subject Details" dialog.
     */
    const handleCloseEditSubjectDialog = () => {
        setOpenEditSubjectDialog(false);
    };


    /** Saves the updated subject details to state and localStorage.
     */
    const handleSaveSubjectDetails = () => {
        // Ensure a subject is selected and component is mounted
        if (!selectedSubjectId || !isMountedRef.current) return;

        // Update the subjects array in state
        setSubjects(prevSubjects =>
            prevSubjects.map(s =>
                s.id === selectedSubjectId
                    ? { ...s, ...subjectEditData } // Merge existing subject data with edited data
                    : s
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


    /** Deletes the selected subject and its associated student data.
     */
    const handleDeleteSubject = () => {
        if (!selectedSubjectId || !selectedClassId) {
            toast.info("No subject selected to delete.");
            return;
        }
        // Find the subject object to get its name for the confirmation message
        const subjectToDelete = subjects.find(s => s.id === selectedSubjectId);
        if (!subjectToDelete) return; // Safety check

        // Confirmation dialog
        if (window.confirm(`ARE YOU SURE?\n\nDeleting subject "${subjectToDelete.name}" for class "${className}" will permanently remove:\n- The subject itself\n- All student records associated with this specific subject.\n\nThis action cannot to undo.`) && isMountedRef.current) {

            // Remove subject-specific student data for this specific subject from localStorage
            const subjectStudentDataKey = getSubjectStudentDataKey(selectedClassId, selectedSubjectId);
            if (subjectStudentDataKey && typeof window !== 'undefined') {
                localStorage.removeItem(subjectStudentDataKey);
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
            setShowOverallResults(false); // Hide overall results view
            // Overall results and dynamic columns will be recalculated by the effect hook

            toast.success(`Subject "${subjectToDelete.name}" and its data deleted.`);
        }
    };


    // --- Student Management Handlers ---

    /** Opens the "Add New Student" dialog (for a single student).
     * Requires class selection.
     * Note: Adding a single student now adds them to the class list, not just the current subject.
     */
    const handleAddStudent = () => {
        if (!selectedClassId) {
            toast.error("Please select a class before adding students.");
            return;
        }
        setNewStudentName(""); // Clear previous input
        setOpenAddStudentDialog(true);
    };

    /** Closes the "Add New Student" dialog.
     */
    const handleCloseAddStudentDialog = () => {
        setOpenAddStudentDialog(false);
        // setNewStudentName(""); // Optionally clear name on cancel too
    };

    /** Adds a new student to the class's student list and updates the current subject's grid.
     */
    const handleSaveNewStudent = () => {
        // Ensure class selected and component mounted
        if (!selectedClassId || !isMountedRef.current) {
            toast.error("Cannot add student without selecting a class.");
            return;
        }
        // Validate student name
        const trimmedName = newStudentName.trim();
        if (trimmedName) {
            const newId = crypto.randomUUID(); // Generate unique ID for the new student

            // Create the new student object
            const newStudent: Student = {
                id: newId,
                name: trimmedName,
                imageUrl: undefined,
                overallRemarks: undefined,
            };

            // Update the classes state by adding the new student to the selected class
            setClasses(prevClasses =>
                prevClasses.map(cls => {
                    if (cls.id === selectedClassId) {
                        // Add the new student to this class's student list
                        return { ...cls, students: [...cls.students, newStudent] };
                    }
                    return cls;
                })
            );

            // If a subject is also selected, add the new student to the current rows state for the grid
            if (selectedSubjectId) {
                 // Create a new StudentRow for the current subject with default scores
                 const newStudentRow: StudentRow = {
                     ...newStudent, // Include student details
                     cat1: undefined,
                     cat2: undefined,
                     projectWork: undefined,
                     exams: undefined,
                     total: undefined,
                     position: undefined,
                     remarks: undefined,
                     isNew: true, // Mark as new for potential initial editing
                 };
                setRows((prev) => {
                     const updatedRows = [...prev, newStudentRow];
                     calculateAndSetAverage(updatedRows); // Recalculate average
                     return updatedRows;
                });
                // Set the edit mode for the newly added row in the grid
                setRowModesModel((prev) => ({
                    ...prev,
                    [newId]: { mode: GridRowModes.Edit, fieldToFocus: "name" }, // Focus name field
                }));
            } else {
                 // If no subject is selected, just show a success message about adding to the class
                 toast.success(`Student "${trimmedName}" added to class "${className}". Select a subject to enter scores.`);
            }


            handleCloseAddStudentDialog(); // Close the dialog
            toast.success(`Student "${trimmedName}" added.`);
        } else {
            toast.error("Student name cannot be empty");
        }
    };


    /** Opens the "Paste Student Names" dialog. Requires class selection.
     * Pasting names now adds them to the class list.
     */
    const handleOpenPasteNamesDialog = () => {
        if (!selectedClassId) {
            toast.error("Please select a class before pasting students.");
            return;
        }
        setPastedNames(""); // Clear previous pasted text
        setOpenPasteNamesDialog(true);
    };

    /** Closes the "Paste Student Names" dialog. */
    const handleClosePasteNamesDialog = () => {
        setOpenPasteNamesDialog(false);
        // setPastedNames(""); // Optionally clear text on cancel too
    };


    /** Adds multiple student names from the pasted text area to the class's student list
     * and updates the current subject's grid if a subject is selected.
     */
    const handleAddPastedNames = () => {
        // Ensure class selected and component mounted
        if (!selectedClassId || !isMountedRef.current) {
            toast.error("Cannot add students without selecting a class.");
            return;
        }
        // Get the text from the textarea and split into lines
        const namesString = pastedNames.trim();
        if (namesString === "") {
            toast.info("Please paste student names into the text area.");
            return;
        }

        // Split by new line and filter out empty or whitespace-only lines
        const namesArray = namesString.split(/\r?\n/).map(name => name.trim()).filter(name => name !== '');
        if (namesArray.length === 0) {
            toast.info("No valid names found in the pasted text.");
            return;
        }

        // Create new student objects for each name
        const newStudents: Student[] = namesArray.map(name => ({
            id: crypto.randomUUID(), // Generate unique ID for each new student
            name: name,
            imageUrl: undefined,
            overallRemarks: undefined,
        }));

        // Update the classes state by adding the new students to the selected class
        setClasses(prevClasses =>
            prevClasses.map(cls => {
                if (cls.id === selectedClassId) {
                    // Add the new students to this class's student list
                    return { ...cls, students: [...cls.students, ...newStudents] };
                }
                return cls;
            })
        );

        // If a subject is also selected, add the new students to the current rows state for the grid
        if (selectedSubjectId) {
             // Create new StudentRow objects for the current subject with default scores
             const newStudentRows: StudentRow[] = newStudents.map(student => ({
                 ...student, // Include student details
                 cat1: undefined,
                 cat2: undefined,
                 projectWork: undefined,
                 exams: undefined,
                 total: undefined,
                 position: undefined,
                 remarks: undefined,
                 isNew: true, // Mark as new for potential initial editing
             }));

            setRows((prev) => {
                 const updatedRows = [...prev, ...newStudentRows];
                 calculateAndSetAverage(updatedRows); // Recalculate average
                 return updatedRows;
            });

             // Set edit mode for the first newly added row (optional, can be overwhelming for many names)
             if (newStudentRows.length > 0) {
                 setRowModesModel((prev) => ({
                     ...prev,
                     [newStudentRows[0].id]: { mode: GridRowModes.Edit, fieldToFocus: "name" },
                 }));
             }

        } else {
             // If no subject is selected, just show a success message about adding to the class
             toast.success(`${newStudents.length} student(s) added to class "${className}". Select a subject to enter scores.`);
        }

        handleClosePasteNamesDialog(); // Close the dialog
        toast.success(`${newStudents.length} student(s) added.`);
    };

    /** Deletes all currently selected student rows.
     * Deletes students from the class list and all subject data for that class.
     */
    const handleDeleteSelected = () => {
        if (selectionModel.length === 0) {
            toast.info("No students selected to delete.");
            return;
        }
        if (!selectedClassId || !isMountedRef.current) return;


        // Confirmation dialog
        if (window.confirm(`Delete ${selectionModel.length} selected student record(s) from this class and all subjects?`) && isMountedRef.current) {

            const idsToDelete = selectionModel as string[]; // Ensure type is string array

            // 1. Remove selected students from the class's student list in the classes state
            setClasses(prevClasses =>
                prevClasses.map(cls => {
                    if (cls.id === selectedClassId) {
                        return {
                            ...cls,
                            students: cls.students.filter(student => !idsToDelete.includes(student.id)),
                        };
                    }
                    return cls;
                })
            );

            // 2. Remove selected students from the current subject's rows state
            setRows((prev) => {
                const newRows = prev.filter((r) => !idsToDelete.includes(r.id));
                calculateAndSetAverage(newRows); // Recalculate average after deletion
                return newRows;
            });

            // 3. Remove selected students' data from ALL subject localStorage entries for this class
            const subjectsForClass = subjects.filter(s => s.classId === selectedClassId);
            subjectsForClass.forEach(subject => {
                const subjectStudentDataKey = getSubjectStudentDataKey(selectedClassId, subject.id);
                 if (subjectStudentDataKey && typeof window !== 'undefined') {
                    const savedRows = localStorage.getItem(subjectStudentDataKey);
                    if (savedRows) {
                        try {
                            let subjectRows: StudentRow[] = JSON.parse(savedRows);
                            const updatedSubjectRows = subjectRows.filter(row => !idsToDelete.includes(row.id));
                            localStorage.setItem(subjectStudentDataKey, JSON.stringify(updatedSubjectRows));
                        } catch (error) {
                            console.error(`Failed to update student data for subject ${subject.name} on multi-delete:`, error);
                        }
                    }
                 }
            });

            setSelectionModel([]); // Clear the selection model after deletion
            toast.success("Selected student records deleted from class and all subjects.");
        }
    };


    /**
     * Processes row updates after editing in the DataGrid.
     * Calculates the total score for the updated row.
     * Updates the `rows` state (current subject view).
     * Updates the student's overall remarks and image in the classes state.
     * Recalculates the overall class average for the current subject view.
     * @param newRow The row data after editing.
     * @param oldRow The row data before editing.
     * @returns The processed row data to be committed to the grid state.
     */
    const processRowUpdate = (newRow: GridRowModel<StudentRow>, oldRow: GridRowModel<StudentRow>): Promise<StudentRow> | StudentRow => {
        // Ensure component is mounted before processing update
        if (!isMountedRef.current) return oldRow; // Return old row if not mounted
        if (!selectedClassId) return oldRow; // Ensure class is selected


        // Calculate the total score based on the updated row data
        const cat1 = Number(newRow.cat1 || 0);
        const cat2 = Number(newRow.cat2 || 0);
        const projectWork = Number(newRow.projectWork || 0);
        const exams = Number(newRow.exams || 0);
        const total = cat1 + cat2 + projectWork + (exams / 2);


        // Create the final updated row object for the current subject's view
        // Preserve the imageUrl and overallRemarks from the newRow as they might have been edited in the grid (though ideally edited in report card dialog)
        const updatedRow: StudentRow = {
            ...newRow,
            total: parseFloat(total.toFixed(2)),
            isNew: false, // Mark as not new after first edit
            // imageUrl and overallRemarks are now part of the Student type, included from newRow
        };

        // Update the main `rows` state for the current subject view
        setRows(currentRows => {
            const newRows = currentRows.map((row) => (row.id === updatedRow.id ? updatedRow : row));
            calculateAndSetAverage(newRows); // Recalculate the overall average with the updated data
            return newRows; // Return the new array of rows to update the state
        });

        // --- Update the student's overall details (image, remarks) in the classes state ---
        setClasses(prevClasses =>
            prevClasses.map(cls => {
                if (cls.id === selectedClassId) {
                    return {
                        ...cls,
                        students: cls.students.map(student =>
                            student.id === updatedRow.id
                                ? { ...student, imageUrl: updatedRow.imageUrl, overallRemarks: updatedRow.overallRemarks }
                                : student
                        ),
                    };
                }
                return cls;
            })
        );


        // Return the updated row so the DataGrid can finalize the edit process
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
     * Saves all current results for the selected subject:
     * - Recalculates totals, positions, and remarks for all rows in the current subject view.
     * - Updates the `rows` state with the calculated values.
     * - Recalculates the overall class average for the current subject.
     * - Saves the subject-specific student data to localStorage.
     * - Updates student overall remarks and image in the classes state (if edited in grid).
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
                position: `${position}${getOrdinalSuffix(position)}`, // Add ordinal suffix
                remarks: remarks,
            };
        });

        // Step 4: Update the state with the fully processed rows for the current subject view
        setRows(positionedRows);

        // Step 5: Recalculate and set the overall average based on the final rows
        calculateAndSetAverage(positionedRows);

        // Step 6: Update the student's overall details (image, remarks) in the classes state
        // This handles cases where these might have been edited directly in the grid (less likely now)
         setClasses(prevClasses =>
             prevClasses.map(cls => {
                 if (cls.id === selectedClassId) {
                     return {
                         ...cls,
                         students: cls.students.map(student => {
                             const updatedRow = positionedRows.find(row => row.id === student.id);
                             if (updatedRow) {
                                 // Update student details from the corresponding row in the current subject view
                                 return { ...student, imageUrl: updatedRow.imageUrl, overallRemarks: updatedRow.overallRemarks };
                             }
                             return student; // Keep existing student if not in current subject view (shouldn't happen with current logic)
                         }),
                     };
                 }
                 return cls;
             })
         );


        // Step 7: Save the subject-specific data (scores, position, remarks) to localStorage
        const subjectStudentDataKey = getSubjectStudentDataKey(selectedClassId, selectedSubjectId);
        if (subjectStudentDataKey && typeof window !== "undefined") {
             // Filter out only the subject-specific fields before saving
             const subjectSpecificRows = positionedRows.map(row => ({
                 id: row.id,
                 cat1: row.cat1,
                 cat2: row.cat2,
                 projectWork: row.projectWork,
                 exams: row.exams,
                 total: row.total,
                 position: row.position,
                 remarks: row.remarks,
                 isNew: row.isNew,
                 // Do NOT save name, imageUrl, overallRemarks here as they are in the classes state
             }));
            localStorage.setItem(subjectStudentDataKey, JSON.stringify(subjectSpecificRows));
        }

        toast.success("Results saved, positions and remarks updated.");
    };


    // --- Excel Export Handler ---

    /** Exports the current student data grid to an Excel (.xlsx) file.
     */
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
                // Header row matching the grid columns (excluding image and overall remarks for Excel)
                ['Name of Students', 'CAT 1 (10)', 'CAT 2 (20)', 'Project Work (20)',
                    'Exams (100)', 'Total (100%)', 'Position', 'Remarks'],
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

    // --- Print Handler for Overall Results ---
    const handlePrintOverallResults = () => {
        if (overallRankingRef.current) {
            const printContent = overallRankingRef.current.innerHTML;
            const originalContent = document.body.innerHTML;
            const originalTitle = document.title; // Save original title

            // Temporarily replace the body's content with the overall ranking content for printing
            document.body.innerHTML = printContent;
            // Set a print-friendly title
            document.title = `Overall Class Ranking - ${className}`;


            // Add a style block to hide elements not needed for printing and style the content
            const printStyles = `
                <style>
                    @media print {

                        /* Hide everything except the overall ranking content */
                        body > *:not(#overall-ranking-content) {
                            display: none !important;
                        }

                        #overall-ranking-content {
                            display: block !important;
                            width: 100%;
                            margin: 0 auto; /* Center the content if less than 100% width */
                            padding: 10mm; /* Add some padding for print margins */
                            box-sizing: border-box; /* Include padding in width */
                            font-family: sans-serif; /* Specify a common font */
                            color: #000; /* Ensure text is black */
                        }

                        /* Ensure card elements don't add extra space/borders in print */
                        .MuiCard-root, .MuiCardContent-root {
                            border: none !important;
                            box-shadow: none !important;
                            padding: 0 !important;
                            margin: 0 !important;
                        }

                        /* Basic typography reset/styling */
                        h1, h6, p, strong {
                           color: #000 !important; /* Force black text */
                           margin-bottom: 0.5em; /* Add some space below headings/paragraphs */
                        }
                         h6 { font-size: 1.2em; margin-top: 1em; }
                         p { font-size: 0.9em; }

                        /* DataGrid print styles */
                        .MuiDataGrid-root {
                            border: 1px solid #ccc !important; /* Add a border to the grid */
                        }
                        .MuiDataGrid-columnHeaders, .MuiDataGrid-row {
                             border-bottom: 1px solid #eee !important; /* Add row separators */
                        }
                        .MuiDataGrid-cell, .MuiDataGrid-columnHeaderTitleContainer {
                            padding: 8px !important; /* Adjust cell padding */
                        }
                         .MuiDataGrid-footerContainer {
                             display: none !important; /* Hide footer */
                         }
                         /* Hide elements with print-hide class */
                        .print-hide {
                            display: none !important;
                        }

                         /* Elements only visible in print */
                        .print-only {
                            display: block !important;
                        }

                    }
                </style>
            `;
            // Append print styles to the head
            const styleElement = document.createElement('style');
            styleElement.innerHTML = printStyles;
            document.head.appendChild(styleElement);


            window.print();

            // Restore the original content and title after printing
            document.body.innerHTML = originalContent;
            document.title = originalTitle;

            // Remove the added print styles
            if (document.head.contains(styleElement)) {
                 document.head.removeChild(styleElement);
            }

            // A small delay might be needed to ensure the DOM is fully restored
             setTimeout(() => {
                 // Re-initialization might be needed depending on your app structure
             }, 50);

        } else {
            toast.error("Overall ranking content not available for printing.");
        }
    };


    // --- Derived Data for Rendering ---

    /** Memoized list of subjects available for the currently selected class.
     */
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
                                {/* --- New Button to Toggle Overall Results View --- */}
                                <Button
                                    variant="outlined"
                                    onClick={() => setShowOverallResults(!showOverallResults)}
                                    disabled={!selectedClassId} // Disable if no class is selected
                                >
                                    {showOverallResults ? 'View Subject Results' : 'View Overall Class Ranking'}
                                </Button>
                            </>
                        )}
                    </div>

                    {/* --- Conditional Rendering for Subject-Specific View vs. Overall Ranking View --- */}

                    {/* Subject-Specific Data Grid and Header (Shown if class & subject selected AND NOT showing overall results) */}
                    {selectedClassId && selectedSubjectId && !showOverallResults && (
                        <>
                            {/* Header Display Section (Subject Specific) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-white rounded shadow relative">
                                {/* Edit Subject Details Button (Positioned top-right) */}
                                <Button
                                    onClick={handleEditSubjectDetails}
                                    className="absolute top-2 right-2 z-10 print-hide" // Use className for Tailwind positioning, hide in print
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
                                <div className="text-sm">Class Average:
                                    <strong className="font-semibold">{overallClassAverage}%</strong></div>
                            </div>

                            {/* Action Buttons for Student Data (Subject Specific) */}
                            <div className="flex flex-wrap items-center justify-between mb-4 gap-2 print-hide"> {/* Hide action buttons in print */}
                                {/* Add Student Button (Now adds to class list) */}
                                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddStudent}>
                                    Add Student
                                </Button>
                                {/* Paste Names Button (Now adds to class list) */}
                                <Button variant="outlined" onClick={handleOpenPasteNamesDialog}>
                                    Paste Names
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
                                    {/* Save Results Button (Saves subject-specific data) */}
                                    <Button
                                        variant="contained" color="success" startIcon={<SaveIcon />}
                                        onClick={handleSaveAll} disabled={rows.length === 0} // Disable if no rows
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

                            {/* Data Grid Section (Subject Specific) */}
                            {isComponentMounted && ( // Render grid only after component mount to avoid SSR issues
                                <div style={{ height: 600, width: '100%' }}>
                                    <DataGrid
                                        rows={rows}
                                        columns={columns}
                                        checkboxSelection // Enable row selection if needed
                                        selectionModel={selectionModel}
                                        onRowSelectionModelChange={(newSelectionModel) => {
                                            setSelectionModel(newSelectionModel as string[]); // Ensure string[] type
                                        }}
                                        getRowId={(row) => row.id} // Ensure you have a unique 'id' field in your data
                                        processRowUpdate={processRowUpdate} // Handle row updates
                                        onRowEditStop={handleRowEditStop} // Handle edit stop events
                                        disableRowSelectionOnClick // Prevent row selection when clicking anywhere on the row
                                    // Add any other necessary DataGrid props here
                                    />
                                </div>
                            )}
                        </>
                    )}

                    {/* --- Section for Overall Class Ranking --- */}
                    {selectedClassId && showOverallResults && (
                        <Card className="p-4 mt-4" ref={overallRankingRef} id="overall-ranking-content"> {/* Added ref and ID for printing */}
                            <CardContent>
                                <div className="flex justify-between items-center mb-4 print-hide"> {/* Hide print button in print view */}
                                    <Typography variant="h6">
                                        Overall Class Ranking for {className}
                                    </Typography>
                                    {/* Add a print button for the overall results */}
                                    <Button
                                        variant="outlined"
                                        startIcon={<PrintIcon />}
                                        onClick={handlePrintOverallResults}
                                        disabled={overallResults.length === 0}
                                    >
                                        Print Overall Ranking
                                    </Button>
                                </div>
                                {/* Print-only title for the overall ranking */}
                                <Typography variant="h6" className="print-only text-center mb-4">
                                     Overall Class Ranking for {className}
                                </Typography>


                                {overallResults.length > 0 ? (
                                    <div style={{ height: 600, width: '100%' }}>
                                        <DataGrid
                                            rows={overallResults}
                                            columns={overallColumns} // Use the combined columns
                                            getRowId={(row) => row.id}
                                            // Add other DataGrid props as needed (no editing usually for overall view)
                                            disableRowSelectionOnClick
                                            hideFooter // Hide footer for a ranking view
                                            // Disable selection for overall ranking view
                                            checkboxSelection={false}
                                            disableRowSelectionOnClick={true}
                                        />
                                    </div>
                                ) : (
                                    <Typography variant="body1" color="text.secondary">
                                        No overall results available for this class. Ensure subjects have been added and results saved.
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    )}


                    {/* Message shown if class is selected but no subject is selected AND NOT showing overall results */}
                    {selectedClassId && !selectedSubjectId && !showOverallResults && (
                        <div className="text-center p-6 bg-white rounded shadow text-gray-600">
                            Please select or add a subject for the class "{className}" to view or manage student results.
                            You can also view the <Button variant="text" onClick={() => setShowOverallResults(true)}>Overall Class Ranking</Button> if subjects and results are available.
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

                {/* Add Student Dialog (Single Student) */}
                <Dialog open={openAddStudentDialog} onClose={handleCloseAddStudentDialog} maxWidth="xs" fullWidth>
                    <DialogTitle>Add New Student to {className}</DialogTitle> {/* Indicate class name */}
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
                            onChange={(e) =>
                                setNewStudentName(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseAddStudentDialog}>Cancel</Button>
                        <Button onClick={handleSaveNewStudent} variant="contained">Add Student</Button> {/* Updated button text */}
                    </DialogActions>
                </Dialog>

                {/* Paste Names Dialog */}
                <Dialog open={openPasteNamesDialog} onClose={handleClosePasteNamesDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>Paste Student Names for {className}</DialogTitle> {/* Indicate class name */}
                    <DialogContent>
                        <TextareaAutosize
                            autoFocus // Focus this field when dialog opens
                            minRows={10} // Minimum rows visible
                            placeholder="Paste student names here, one name per line..."
                            style={{
                                width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize:
                                    '1rem'
                            }}
                            value={pastedNames}
                            onChange={(e) => setPastedNames(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClosePasteNamesDialog}>Cancel</Button>
                        <Button onClick={handleAddPastedNames} variant="contained">Add Names to Class</Button> {/* Updated button text */}
                    </DialogActions>
                </Dialog>


                {/* Edit Subject Details Dialog */}
                <Dialog open={openEditSubjectDialog} onClose={handleCloseEditSubjectDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>Edit Subject Details for {subjectName}</DialogTitle>
                    <DialogContent>
                        {/* Subject Name Field */}
                        <TextField autoFocus margin="dense" id="edit-subjectName" label="Subject Name" type="text" fullWidth variant="outlined"
                            value={subjectEditData.name} onChange={(e) => setSubjectEditData({ ...subjectEditData, name: e.target.value })} />
                        {/* Subject Teacher Field */}
                        <TextField margin="dense" id="edit-subjectTeacher" label="Subject Teacher" type="text" fullWidth variant="outlined"
                            value={subjectEditData.subjectTeacher} onChange={(e) => setSubjectEditData({ ...subjectEditData, subjectTeacher: e.target.value })} />
                        {/* Term Field */}
                        <TextField margin="dense" id="edit-term" label="Term" type="text" fullWidth variant="outlined"
                            value={subjectEditData.term} onChange={(e) => setSubjectEditData({ ...subjectEditData, term: e.target.value })} />
                        {/* Year Field */}
                        <TextField margin="dense" id="edit-year" label="Year" type="text" fullWidth variant="outlined"
                            value={subjectEditData.year} onChange={(e) => setSubjectEditData({ ...subjectEditData, year: e.target.value })} />
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
                            value={newClassData.name} onChange={(e) => setNewClassData({ name: e.target.value })} />
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
                            value={newSubjectData.name} onChange={(e) => setNewSubjectData({ ...newSubjectData, name: e.target.value })} />
                        {/* Subject Teacher Field */}
                        <TextField margin="dense" id="add-newSubjectTeacher" label="Subject Teacher" type="text" fullWidth variant="outlined"
                            value={newSubjectData.subjectTeacher} onChange={(e) => setNewSubjectData({ ...newSubjectData, subjectTeacher: e.target.value })} />
                        {/* Term Field */}
                        <TextField margin="dense" id="add-newTerm" label="Term" type="text" fullWidth variant="outlined"
                            value={newSubjectData.term} onChange={(e) => setNewSubjectData({ ...newSubjectData, term: e.target.value })} />
                        {/* Year Field */}
                        <TextField margin="dense" id="add-newYear" label="Year" type="text" fullWidth variant="outlined"
                            value={newSubjectData.year} onChange={(e) => setNewSubjectData({ ...newSubjectData, year: e.target.value })} />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseAddSubjectDialog}>Cancel</Button>
                        <Button onClick={handleSaveNewSubject} variant="contained">Add Subject</Button>
                    </DialogActions>
                </Dialog>


                {/* Report Card Dialog */}
                <Dialog open={openReportCardDialog} onClose={handleCloseReportCardDialog} maxWidth="md" fullWidth>
                    <DialogTitle>Report Card for {currentStudentReport?.studentName}</DialogTitle>
                    <DialogContent dividers sx={{ p: 0 }}> {/* Remove padding from DialogContent */}
                        {/* Printable Report Card Content */}
                        <div id="report-card-content" ref={reportCardRef} className="p-6"> {/* Add padding to the printable area */}
                            {currentStudentReport && (
                                <Card variant="outlined" className="p-4"> {/* Add padding to the card */}
                                    <CardContent>
                                        <div className="flex flex-col md:flex-row items-center gap-6 mb-6"> {/* Increased gap and margin */}
                                            {/* Student Image Section */}
                                            <div className="flex-shrink-0">
                                                {reportCardImage ? (
                                                    <CardMedia
                                                        component="img"
                                                        sx={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '2px solid #3b82f6' }} // Combined sx styles
                                                        image={reportCardImage}
                                                        alt={`${currentStudentReport.studentName}'s photo`}
                                                    />
                                                ) : (
                                                    <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 border-2 border-gray-300"> {/* Added border */}
                                                        No Image
                                                    </div>
                                                )}
                                                {/* Image Upload Input (Hidden in print) */}
                                                <Button
                                                    variant="outlined"
                                                    component="label"
                                                    size="small"
                                                    className="mt-2 print-hide w-full" // Added print-hide class and full width
                                                >
                                                    Upload Image
                                                    <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                                                </Button>
                                            </div>

                                            {/* Student and Class/Term/Year Details */}
                                            <div className="flex-grow space-y-1"> {/* Added space-y */}
                                                <Typography variant="h6" gutterBottom={false}> {/* Removed bottom margin from h6 */}
                                                    {currentStudentReport.studentName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Class: <strong className="text-gray-800">{currentStudentReport.className}</strong> {/* Darker text for values */}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Term: <strong className="text-gray-800">{currentStudentReport.term}</strong> {/* Darker text for values */}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Year: <strong className="text-gray-800">{currentStudentReport.year}</strong> {/* Darker text for values */}
                                                </Typography>
                                            </div>
                                        </div>

                                        <Separator className="my-4" /> {/* Maintain separator spacing */}

                                        {/* Subject Results Section */}
                                        <Typography variant="h6" gutterBottom>
                                            Subject Results
                                        </Typography>
                                        {currentStudentReport.subjectResults.length > 0 ? (
                                                <div className="space-y-4"> {/* Spacing between subject cards */}
                                                    {currentStudentReport.subjectResults.map(subjectResult => (
                                                        <Card key={subjectResult.subjectId} variant="outlined" className="p-3"> {/* Padding for subject card */}
                                                            <CardContent className="p-0"> {/* Reduced padding further */}
                                                                <Typography variant="subtitle1" gutterBottom>
                                                                    {subjectResult.subjectName} - <span className="text-sm text-gray-600">Teacher: {subjectResult.subjectTeacher}</span>
                                                                </Typography>
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm"> {/* Increased gap */}
                                                                    <Typography variant="body2">CAT 1 (10): <strong>{subjectResult.cat1 ?? 0}</strong></Typography>
                                                                    <Typography variant="body2">CAT 2 (20): <strong>{subjectResult.cat2 ?? 0}</strong></Typography>
                                                                    <Typography variant="body2">Project (20): <strong>{subjectResult.projectWork ?? 0}</strong></Typography>
                                                                    <Typography variant="body2">Exams (100): <strong>{subjectResult.exams ?? 0}</strong></Typography>
                                                                    <Typography variant="body2">Total (100%): <strong>{subjectResult.total ?? 0}</strong></Typography>
                                                                    <Typography variant="body2">Position: <strong>{subjectResult.position ?? 'N/A'}</strong></Typography>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            ) : (
                                                <Typography variant="body1" color="text.secondary">
                                                    No subject results found for this student in this class.
                                                </Typography>
                                            )}


                                        <Separator className="my-4" /> {/* Maintain separator spacing */}

                                        {/* Overall Remarks Section (Editable in View, Display-only in Print) */}
                                        <Typography variant="h6" gutterBottom>
                                            Overall Remarks
                                        </Typography>
                                        {/* TextField for editing (Hidden in print) */}
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={4}
                                            variant="outlined"
                                            label="Overall Remarks"
                                            value={reportCardOverallRemarks ?? ''}
                                            onChange={handleReportCardOverallRemarksChange}
                                            className="print-hide" // Hide in print
                                        />
                                        {/* Display overall remarks in print (Hidden in View) */}
                                        <Typography variant="body1" className="print-only p-2 border rounded bg-gray-50"> {/* Added basic styling for the remarks block */}
                                            <strong>Overall Remarks:</strong> {reportCardOverallRemarks ?? 'N/A'} {/* Display N/A if no remarks */}
                                        </Typography>


                                    </CardContent>
                                </Card>
                            )}
                        </div> {/* End printable content div */}
                    </DialogContent>
                    {/* Dialog Actions (Hidden in print) */}
                    <DialogActions className="print-hide">
                        <Button onClick={handleCloseReportCardDialog}>Close</Button>
                        <Button onClick={handlePrintReportCard} variant="outlined" startIcon={<PrintIcon />}>Print</Button> {/* Print Button */}
                        <Button onClick={handleSaveReportCard} variant="contained" color="primary">Save
                            Report Card</Button>
                    </DialogActions>
                </Dialog>

            </SidebarInset> {/* End Main content area */}
        </SidebarProvider> // End Sidebar context
    ); // End ClassPage component
}
