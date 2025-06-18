/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
'use client';

import * as React from "react";
import {
    DataGrid,
    GridColDef,
    GridRowsProp,
    GridRowModes,
    GridActionsCellItem,
    GridRowEditStopReasons,
    GridEventListener,
    GridRowModel,
} from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import ClearIcon from '@mui/icons-material/Clear';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

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

// Dynamically import excel libraries
// These will be loaded only when needed (e.g., when export functions are called)
// You might need to install them: npm install file-saver xlsx
// eslint-disable-next-line @typescript-eslint/no-require-imports
const FileSaver = typeof window !== 'undefined' ? require('file-saver') : null;
const XLSX = typeof window !== 'undefined' ? require('xlsx') : null;


// Import the ReportCard component from reportcard.txt (assuming it's in the correct path)
import ReportCard from '../Report_card/page'; // Adjust path if necessary

// Supabase imports
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Type Definitions for Supabase Tables (Adjusted Names) ---

// Represents a row in the 'user_classes' table
type MyClass = {
    id: string; // UUID from Supabase
    name: string;
    userId: string; // Link to auth.users.id
};

// Represents a row in the 'user_students' table
type MyStudent = {
    id: string; // UUID from Supabase
    name: string;
    classId: string; // FK to user_classes.id
    imageUrl?: string | null;
    overallRemarks?: string | null;
    attendance?: string | null;
    house?: string | null;
    positionInClass?: string | null;
    userId: string; // Link to auth.users.id
};

// Represents a row in the 'user_subjects' table
type MySubject = {
    id: string; // UUID from Supabase
    name: string;
    classId: string; // FK to user_classes.id
    subjectTeacher: string;
    term: string;
    year: string;
    userId: string; // Link to auth.users.id
};

// Represents a row in the 'user_student_scores' table
type MyStudentScore = {
    id: string; // UUID from Supabase
    studentId: string; // FK to user_students.id
    subjectId: string; // FK to user_subjects.id
    classId: string; // FK to user_classes.id (redundant but useful for querying)
    cat1?: number | null;
    cat2?: number | null;
    projectWork?: number | null;
    exams?: number | null;
    total?: number | null;
    position?: string | null;
    remarks?: string | null;
    grade?: string | null;
    classWorkTotal?: number | null;
    userId: string; // Link to auth.users.id
};


// --- UI-Specific Type Definitions ---

// Defines the structure for a student row in the DataGrid (per subject)
// This will merge MyStudent details with MyStudentScore details for display
type StudentRow = MyStudent & {
    // Subject-specific scores and calculated fields
    cat1?: number; // Score for Continuous Assessment Test 1
    cat2?: number; // Score for Continuous Assessment Test 2
    projectWork?: number; // Score for Project Work
    exams?: number; // Score for Exams
    total?: number; // Calculated total score for this subject
    position?: string; // Calculated position in this subject
    remarks?: string; // Calculated remarks for this subject
    grade?: string; // Added grade property for subject-specific grade
    isNew?: boolean; // Flag for local UI state, not stored in DB
    classWorkTotal?: number; // Calculated field for Class Work Total
    // Additional fields from MyStudentScore for convenience in DataGrid
    scoreId?: string; // The ID of the user_student_scores entry
};

// Type for the aggregated student report card data
type StudentReportCardData = {
    studentId: string;
    studentName: string;
    className: string;
    term: string;
    year: string;
    imageUrl?: string | null;
    overallRemarks?: string | null;
    attendance?: string | null;
    overallPosition?: string;
    positionInClass?: string | null;
    house?: string | null;
    formMistressReport?: string;
    conduct?: string;
    interest?: string;
    housemistressReport?: string;
    headmasterReport?: string;
    subjectResults: {
        subjectId: string;
        subjectName: string;
        subjectTeacher: string;
        cat1?: number | null;
        cat2?: number | null;
        projectWork?: number | null;
        exams?: number | null;
        total?: number | null;
        position?: string | null;
        grade?: string | null;
        remarks?: string | null;
        classWorkTotal?: number | null;
    }[];
    studentOverallPercentage?: number;
    studentOverallGrade?: string;
};

// Define a type for the overall student result row (for overall ranking view)
type OverallStudentRow = {
    id: string; // Student ID
    name: string; // Student Name
    overallTotalScore: number; // Sum of total scores across all subjects
    overallAverage: number; // Average score across all subjects
    overallRank: string; // Overall rank in the class
    subjectTotals: { [subjectId: string]: number }; // Object to hold total scores for each subject
    [key: string]: any;
};


// ============================================================================
// AllReportCardsPrintView Component
// A new component to render multiple report cards for printing.
// ============================================================================
interface AllReportCardsPrintViewProps {
    reports: StudentReportCardData[];
    onClose: () => void;
}

const AllReportCardsPrintView: React.FC<AllReportCardsPrintViewProps> = ({ reports, onClose }) => {
    const printRef = React.useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        if (printRef.current) {
            const printContent = printRef.current.innerHTML;
            const originalContent = document.body.innerHTML;
            const originalTitle = document.title;

            document.body.innerHTML = printContent;
            document.title = `All Report Cards - Class: ${reports[0]?.className || 'Unknown'}`;

            const printStyles = `
                <style>
                    @media print {
                        body > *:not(#all-report-cards-content) {
                            display: none !important;
                        }
                        #all-report-cards-content {
                            display: block !important;
                            width: 100%;
                            margin: 0 auto;
                            padding: 10mm;
                            box-sizing: border-box;
                            font-family: sans-serif;
                            color: #000;
                        }
                        .report-card-page-break {
                            page-break-after: always;
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
                        .flex { display: flex !important; }
                        .grid { display: grid !important; }
                                <ReportCardModule.default
                                    initialSchoolInfo={{ name: "", address: "", cityPostal: "", phone: "", email: "", website: "", logoUrl: report.imageUrl || "https://placehold.co/100x100/EFEFEF/AEAEAE?text=School+Logo" }}
                                    studentInfo={{
                                        name: report.studentName,
                                        id: report.studentId,
                         .mb-6 { margin-bottom: 1.5rem !important; }
                         .p-4 { padding: 1rem !important; }
                         .p-3 { padding: 0.75rem !important; }
                         .p-2 { padding: 0.5rem !important; }
                         .space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem !important; margin-bottom: 0 !important; }
                         .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                         .md\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
                         .flex-shrink-0 { flex-shrink: 0 !important; }
                         .flex-grow { flex-grow: 1 !important; }
                         .justify-center { justify-content: center !important; }
                        img {
                             display: block !important;
                             max-width: 100% !important;
                             height: auto !important;
                             object-fit: cover !important;
                         }
                         .rounded-full { border-radius: 9999px !important; }
                         .h-32 { height: 8rem !important; }
                         .w-32 { width: 8rem !important; }
                         .border-2 { border-width: 2px !important; }
                         .border-blue-500 { border-color: #3b82f6 !important; }
                        .MuiDivider-root, .separator {
                            border-top: 1px solid #ccc !important;
                            margin: 1em 0 !important;
                        }
                        .print-hide {
                            display: none !important;
                        }
                        .print-only {
                            display: block !important;
                        }
                        .MuiDialog-container, .MuiDialog-paper, .MuiModal-backdrop {
                             display: none !important;
                        }
                    }
                </style>
            `;
            const styleElement = document.createElement('style');
            styleElement.innerHTML = printStyles;
            document.head.appendChild(styleElement);

            window.print();

            document.body.innerHTML = originalContent;
            document.title = originalTitle;
            if (document.head.contains(styleElement)) {
                 document.head.removeChild(styleElement);
            }
            setTimeout(() => {}, 50);
        } else {
            toast.error("Report card content not available for printing.");
        }
    };

    return (
        <Dialog open={true} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>All Report Cards for Printing</DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <div id="all-report-cards-content" ref={printRef} className="p-6">
                    {reports.length > 0 ? (
                        reports.map((report, index) => (
                            <React.Fragment key={report.studentId}>
                                {(ReportCard as any)({
                                    initialSchoolInfo: { name: "", address: "", cityPostal: "", phone: "", email: "", website: "", logoUrl: report.imageUrl || "https://placehold.co/100x100/EFEFEF/AEAEAE?text=School+Logo" },
                                    studentInfo: {
                                        name: report.studentName,
                                        id: report.studentId,
                                        gradeLevel: report.className,
                                        attendance: report.attendance || "",
                                        nextTermBegins: "",
                                        house: report.house || "",
                                        positionInClass: report.positionInClass || "",
                                        imageUrl: report.imageUrl || "https://placehold.co/100x100/EFEFEF/AEAEAE?text=Student+Image",
                                        dateOfBirth: "",
                                        homeroom: "",
                                    },
                                    academicPerformance: report.subjectResults.map(sr => ({
                                        subject: sr.subjectName,
                                        classScore: sr.classWorkTotal?.toString() || "",
                                        examScore: sr.exams?.toString() || "",
                                        totalScore: sr.total?.toString() || "",
                                        grade: sr.grade || "",
                                        classAverage: "",
                                        subjectPosition: sr.position || "",
                                        overallSubjectPosition: "",
                                        remarks: sr.remarks ? [sr.remarks] : [],
                                        teacher: sr.subjectTeacher,
                                    })),
                                    overallSummary: {
                                        academicYear: report.year,
                                        termSemester: report.term,
                                        dateIssued: "",
                                        overallPercentage: report.studentOverallPercentage?.toString() || "",
                                        overallGrade: report.studentOverallGrade || "",
                                        overallPosition: report.overallPosition || "",
                                        attendance: report.attendance || "",
                                        conduct: report.conduct || "",
                                    },
                                    commentsRecommendations: {
                                        formMistressMasterReport: report.formMistressReport || "",
                                        formTeacherName: "",
                                        conduct: report.conduct || "",
                                        interest: "",
                                        housemistressMasterReport: "",
                                        houseTeacherName: "",
                                        headmasterReport: "",
                                        headmasterName: "",
                                        parentGuardianNotes: "",
                                        teacherComments: "",
                                        principalComments: "",
                                    },
                                    gradingScale: { grades: [], percentageRanges: "", effortScale: "", otherSymbols: "" },
                                    isPrintView: true
                                })}
                                {index < reports.length - 1 && (
                                    <div className="report-card-page-break my-8"></div>
                                )}
                            </React.Fragment>
                        ))
                    ) : (
                        <Typography variant="body1" color="text.secondary" className="text-center p-4">
                            No report cards available for printing.
                        </Typography>
                    )}
                </div>
            </DialogContent>
            <DialogActions className="print-hide">
                <Button onClick={onClose}>Close</Button>
                <Button onClick={handlePrint} variant="contained" startIcon={<PrintIcon />}>Print All</Button>
            </DialogActions>
        </Dialog>
    );
};


// --- React Component ---

export default function ClassPage() {
    // --- State Variables ---
    const [userId, setUserId] = React.useState<string | null>(null);
    const [isAuthReady, setIsAuthReady] = React.useState(false); // To track if auth state is determined
    const [isLoadingInitialData, setIsLoadingInitialData] = React.useState(true); // For initial data fetch

    const [rows, setRows] = React.useState<GridRowsProp<StudentRow>>([]);
    const [] = React.useState<Record<string, { mode: GridRowModes; fieldToFocus?: string }>>({});

    const [selectedClassId, setSelectedClassId] = React.useState<string | null>(null);
    const [selectedSubjectId, setSelectedSubjectId] = React.useState<string | null>(null);

    // Data state for Supabase tables (Adjusted Names)
    const [classes, setClasses] = React.useState<MyClass[]>([]);
    const [students, setStudents] = React.useState<MyStudent[]>([]); // All students across all classes
    const [subjects, setSubjects] = React.useState<MySubject[]>([]);
    const [studentScores, setStudentScores] = React.useState<MyStudentScore[]>([]); // All student scores

    // Derived state for display purposes
    const [className, setClassName] = React.useState("N/A");
    const [subjectName, setSubjectName] = React.useState("N/A");
    const [term, setTerm] = React.useState("N/A");
    const [year, setYear] = React.useState("N/A");
    const [subjectTeacher, setSubjectTeacher] = React.useState("N/A");
    const [overallClassAverage, setOverallClassAverage] = React.useState<number | string>(0);

    // --- State for Overall Ranking ---
    const [overallResults, setOverallResults] = React.useState<OverallStudentRow[]>([]);
    const [showOverallResults, setShowOverallResults] = React.useState(false);
    const [dynamicOverallColumns, setDynamicOverallColumns] = React.useState<GridColDef<OverallStudentRow>[]>([]);

    // Dialog states
    const [openAddStudentDialog, setOpenAddStudentDialog] = React.useState(false);
    const [newStudentName, setNewStudentName] = React.useState("");
    const [openPasteNamesDialog, setOpenPasteNamesDialog] = React.useState(false);
    const [pastedNames, setPastedNames] = React.useState("");
    const [openEditSubjectDialog, setOpenEditSubjectDialog] = React.useState(false);
    const [subjectEditData, setSubjectEditData] = React.useState<Omit<MySubject, 'id' | 'classId' | 'userId'>>({
        name: "", subjectTeacher: "", term: "", year: "",
    });
    const [openCreateClassDialog, setOpenCreateClassDialog] = React.useState(false);
    const [newClassData, setNewClassData] = React.useState({ name: "" });
    const [openAddSubjectDialog, setOpenAddSubjectDialog] = React.useState(false);
    const [newSubjectData, setNewSubjectData] = React.useState<Omit<MySubject, 'id' | 'classId' | 'userId'>>({
        name: "", subjectTeacher: "", term: "", year: "",
    });

    // Report Card State (for single student view)
    const [openReportCardDialog, setOpenReportCardDialog] = React.useState(false);
    const [currentStudentReport, setCurrentStudentReport] = React.useState<StudentReportCardData | null>(null);
    const [reportCardImage, setReportCardImage] = React.useState<string | null>(null);
    const [reportCardOverallRemarks, setReportCardOverallRemarks] = React.useState<string>("");
    // Additional student info for editing in report card dialog
    const [reportCardAttendance, setReportCardAttendance] = React.useState<string>("");
    const [reportCardHouse, setReportCardHouse] = React.useState<string>("");
    const [reportCardPositionInClass, setReportCardPositionInClass] = React.useState<string>("");


    // Report Card State (for all students view)
    const [openAllReportsDialog, setOpenAllReportsDialog] = React.useState(false);
    const [allStudentsReports, setAllStudentsReports] = React.useState<StudentReportCardData[]>([]);

    // Ref for the printable report card content (single student)
    const reportCardRef = React.useRef<HTMLDivElement>(null);
    // Ref for the printable overall ranking content
    const overallRankingRef = React.useRef<HTMLDivElement>(null);


    // --- Supabase Authentication & Initial Data Fetch ---
    React.useEffect(() => {
        const setupSupabaseAndFetchData = async () => {
            setIsLoadingInitialData(true);
            // 1. Authenticate (or sign in anonymously)
            const { data: authSession } = await supabase.auth.getSession();
            let currentUserId = authSession?.session?.user?.id || null;

            if (!currentUserId) {
                const { data, error } = await supabase.auth.signInAnonymously();
                if (error) {
                    console.error("Supabase anonymous sign-in failed:", error.message);
                    toast.error("Failed to sign in. Please try again.");
                } else if (data.user) {
                    currentUserId = data.user.id;
                    console.log("Anonymous user signed in:", currentUserId);
                }
            } else {
                console.log("User already signed in:", currentUserId);
            }
            setUserId(currentUserId);
            setIsAuthReady(true); // Auth state determined

            if (!currentUserId) {
                setIsLoadingInitialData(false);
                return;
            }

            // 2. Fetch all user-specific data
            try {
                const [
                    { data: classesData, error: classesError },
                    { data: studentsData, error: studentsError },
                    { data: subjectsData, error: subjectsError },
                    { data: studentScoresData, error: studentScoresError }
                ] = await Promise.all([
                    supabase.from('user_classes').select('*').eq('userId', currentUserId),
                    supabase.from('user_students').select('*').eq('userId', currentUserId),
                    supabase.from('user_subjects').select('*').eq('userId', currentUserId),
                    supabase.from('user_student_scores').select('*').eq('userId', currentUserId)
                ]);

                if (classesError) throw classesError;
                if (studentsError) throw studentsError;
                if (subjectsError) throw subjectsError;
                if (studentScoresError) throw studentScoresError;

                setClasses(classesData as MyClass[]);
                setStudents(studentsData as MyStudent[]);
                setSubjects(subjectsData as MySubject[]);
                setStudentScores(studentScoresData as MyStudentScore[]);
                console.log("Initial data fetched from Supabase.");

                // Restore last selected class/subject (if valid for current user)
                const savedSelectedClassId = localStorage.getItem("selectedClassId");
                const savedSelectedSubjectId = localStorage.getItem("selectedSubjectId");

                const validClass = (classesData as MyClass[]).find(c => c.id === savedSelectedClassId && c.userId === currentUserId);
                if (validClass) {
                    setSelectedClassId(validClass.id);
                    setClassName(validClass.name);

                    const validSubject = (subjectsData as MySubject[]).find(s =>
                        s.id === savedSelectedSubjectId && s.classId === validClass.id && s.userId === currentUserId
                    );
                    if (validSubject) {
                        setSelectedSubjectId(validSubject.id);
                        setSubjectName(validSubject.name);
                        setTerm(validSubject.term);
                        setYear(validSubject.year);
                        setSubjectTeacher(validSubject.subjectTeacher);
                    } else {
                        localStorage.removeItem("selectedSubjectId");
                    }
                } else {
                    localStorage.removeItem("selectedClassId");
                    localStorage.removeItem("selectedSubjectId");
                }

            } catch (error: Error | unknown) {
                console.error("Error fetching initial Supabase data:", error instanceof Error ? error.message : String(error));
                toast.error("Failed to load data. Check console for details.");
            } finally {
                setIsLoadingInitialData(false);
            }
        };

        setupSupabaseAndFetchData();
    }, []); // Run once on component mount

    // --- Supabase Real-time Listeners ---
    React.useEffect(() => {
        if (!userId || !isAuthReady) {
            console.log("Realtime listeners skipped: userId or auth not ready.", { userId, isAuthReady });
            return;
        }

        console.log(`Setting up real-time listeners for userId: ${userId}`);

        // Listener for 'user_classes' table
        const classesChannel = supabase
            .channel('public:user_classes_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_classes' }, (payload) => {
                const change = payload.new || payload.old;
                if (change && (change as MyClass).userId === userId) {
                    console.log("Realtime user_classes change detected:", payload);
                    if (payload.eventType === 'INSERT') {
                        setClasses(prev => [...prev, payload.new as MyClass]);
                        toast.info(`Class added: ${(payload.new as MyClass).name}`);
                    } else if (payload.eventType === 'UPDATE') {
                        setClasses(prev => prev.map(c => c.id === (payload.new as MyClass).id ? (payload.new as MyClass) : c));
                        toast.info(`Class updated: ${(payload.new as MyClass).name}`);
                    } else if (payload.eventType === 'DELETE') {
                        setClasses(prev => prev.filter(c => c.id !== (payload.old as MyClass).id));
                        toast.info(`Class deleted: ${(payload.old as MyClass).name}`);
                    }
                }
            }).subscribe();

        // Listener for 'user_students' table
        const studentsChannel = supabase
            .channel('public:user_students_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_students' }, (payload) => {
                const change = payload.new || payload.old;
                if (change && (change as MyStudent).userId === userId) {
                    console.log("Realtime user_students change detected:", payload);
                    if (payload.eventType === 'INSERT') {
                        setStudents(prev => [...prev, payload.new as MyStudent]);
                        toast.info(`Student added: ${(payload.new as MyStudent).name}`);
                    } else if (payload.eventType === 'UPDATE') {
                        setStudents(prev => prev.map(s => s.id === (payload.new as MyStudent).id ? (payload.new as MyStudent) : s));
                        toast.info(`Student updated: ${(payload.new as MyStudent).name}`);
                    } else if (payload.eventType === 'DELETE') {
                        setStudents(prev => prev.filter(s => s.id !== (payload.old as MyStudent).id));
                        toast.info(`Student deleted: ${(payload.old as MyStudent).name}`);
                    }
                }
            }).subscribe();

        // Listener for 'user_subjects' table
        const subjectsChannel = supabase
            .channel('public:user_subjects_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_subjects' }, (payload) => {
                const change = payload.new || payload.old;
                if (change && (change as MySubject).userId === userId) {
                    console.log("Realtime user_subjects change detected:", payload);
                    if (payload.eventType === 'INSERT') {
                        setSubjects(prev => [...prev, payload.new as MySubject]);
                        toast.info(`Subject added: ${(payload.new as MySubject).name}`);
                    } else if (payload.eventType === 'UPDATE') {
                        setSubjects(prev => prev.map(s => s.id === (payload.new as MySubject).id ? (payload.new as MySubject) : s));
                        toast.info(`Subject updated: ${(payload.new as MySubject).name}`);
                    } else if (payload.eventType === 'DELETE') {
                        setSubjects(prev => prev.filter(s => s.id !== (payload.old as MySubject).id));
                        toast.info(`Subject deleted: ${(payload.old as MySubject).name}`);
                    }
                }
            }).subscribe();

        // Listener for 'user_student_scores' table
        const studentScoresChannel = supabase
            .channel('public:user_student_scores_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_student_scores' }, (payload) => {
                const change = payload.new || payload.old;
                if (change && (change as MyStudentScore).userId === userId) {
                    console.log("Realtime user_student_scores change detected:", payload);
                    if (payload.eventType === 'INSERT') {
                        setStudentScores(prev => [...prev, payload.new as MyStudentScore]);
                    } else if (payload.eventType === 'UPDATE') {
                        setStudentScores(prev => prev.map(s => s.id === (payload.new as MyStudentScore).id ? (payload.new as MyStudentScore) : s));
                    } else if (payload.eventType === 'DELETE') {
                        setStudentScores(prev => prev.filter(s => s.id !== (payload.old as MyStudentScore).id));
                    }
                }
            }).subscribe();


        // Cleanup listeners on unmount or when userId changes
        return () => {
            console.log("Cleaning up Supabase channels.");
            supabase.removeChannel(classesChannel);
            supabase.removeChannel(studentsChannel);
            supabase.removeChannel(subjectsChannel);
            supabase.removeChannel(studentScoresChannel);
        };
    }, [userId, isAuthReady]);

    // --- Sync UI state with fetched data based on selections ---
    React.useEffect(() => {
        if (!selectedClassId || !isAuthReady || !userId || isLoadingInitialData) {
            setRows([]);
            setOverallClassAverage(0);
            return;
        }

        const currentClass = classes.find(c => c.id === selectedClassId);
        if (!currentClass) {
            setRows([]);
            setClassName("N/A");
            setOverallClassAverage(0);
            return;
        }
        setClassName(currentClass.name);

        if (!selectedSubjectId) {
            setRows([]);
            setSubjectName("N/A");
            setTerm("N/A");
            setYear("N/A");
            setSubjectTeacher("N/A");
            setOverallClassAverage(0);
            return;
        }

        const currentSubject = subjects.find(s => s.id === selectedSubjectId && s.classId === selectedClassId);
        if (!currentSubject) {
            setRows([]);
            setSubjectName("N/A");
            setTerm("N/A");
            setYear("N/A");
