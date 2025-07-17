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
import CloudUploadIcon from '@mui/icons-material/CloudUpload'


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
            .MuiCard-root, .MuiCardContent-root {
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            h1, h2, h6, p, strong {
              color: #000 !important;
              margin-bottom: 0.5em;
            }
            h6 { font-size: 1.1em; margin-top: 1em; }
            p { font-size: 0.9em; }
            .flex { display: flex !important; }
            .grid { display: grid !important; }
            .mb-6 { margin-bottom: 1.5rem !important; }
            .p-4 { padding: 1rem !important; }
            .p-3 { padding: 0.75rem !important; }
            .p-2 { padding: 0.5rem !important; }
            .space-y-4 > :not([hidden]) ~ :not([hidden]) { 
              margin-top: 1rem !important; 
              margin-bottom: 0 !important; 
            }
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
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
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
    } else {
      toast.error("Report card content not available for printing.");
    }
  };
// ReportCard.tsx


interface ReportCardProps {
  initialSchoolInfo: {
    name: string;
    address: string;
    cityPostal: string;
    phone: string;
    email: string;
    website: string;
    logoUrl: string;
  };
  studentInfo: {
    name: string;
    id: string;
    gradeLevel: string;
    attendance: string;
    nextTermBegins: string;
    house: string;
    positionInClass: string;
    imageUrl: string;
    dateOfBirth: string;
    homeroom: string;
  };
  academicPerformance: Array<{
    subject: string;
    classScore: string;
    examScore: string;
    totalScore: string;
    grade: string;
    classAverage: string;
    subjectPosition: string;
    overallSubjectPosition: string;
    remarks: string[];
    teacher: string;
  }>;
  overallSummary: {
    academicYear: string;
    termSemester: string;
    dateIssued: string;
    overallPercentage: string;
    overallGrade: string;
    overallPosition: string;
    attendance: string;
    conduct: string;
  };
  commentsRecommendations: {
    formMistressMasterReport: string;
    formTeacherName: string;
    conduct: string;
    interest: string;
    housemistressMasterReport: string;
    houseTeacherName: string;
    headmasterReport: string;
    headmasterName: string;
    parentGuardianNotes: string;
    teacherComments: string;
    principalComments: string;
  };
  gradingScale: {
    grades: string[];
    percentageRanges: string;
    effortScale: string;
    otherSymbols: string;
  };
  isPrintView?: boolean;
}

const ReportCard: React.FC<ReportCardProps> = ({
  initialSchoolInfo,
  studentInfo,
  academicPerformance,
  overallSummary,
  commentsRecommendations,
  gradingScale,
  isPrintView = false
}) => {
  return (
    <div className={`p-4 ${isPrintView ? 'print-view' : ''}`}>
      {/* School header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{initialSchoolInfo.name}</h1>
          <p>{initialSchoolInfo.address}</p>
          <p>{initialSchoolInfo.cityPostal}</p>
          <p>Tel: {initialSchoolInfo.phone} | Email: {initialSchoolInfo.email}</p>
          <p>Website: {initialSchoolInfo.website}</p>
        </div>
        <img 
          src={initialSchoolInfo.logoUrl} 
          alt="School Logo" 
          className="w-24 h-24 object-contain"
        />
      </div>

      {/* Student info */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="flex-shrink-0">
          <img 
            src={studentInfo.imageUrl} 
            alt={`${studentInfo.name}'s photo`} 
            className="w-32 h-32 rounded-full border-2 border-blue-500 object-cover"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 flex-grow">
          <div>
            <p><strong>Name:</strong> {studentInfo.name}</p>
            <p><strong>Class:</strong> {studentInfo.gradeLevel}</p>
            <p><strong>Term:</strong> {overallSummary.termSemester}</p>
          </div>
          <div>
            <p><strong>Position:</strong> {studentInfo.positionInClass}</p>
            <p><strong>House:</strong> {studentInfo.house}</p>
            <p><strong>Attendance:</strong> {studentInfo.attendance}</p>
          </div>
        </div>
      </div>

      {/* Academic performance */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Academic Performance</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Subject</th>
              <th className="border p-2">Class Score (50)</th>
              <th className="border p-2">Exam Score (50)</th>
              <th className="border p-2">Total (100)</th>
              <th className="border p-2">Grade</th>
              <th className="border p-2">Position</th>
              <th className="border p-2">Teacher</th>
            </tr>
          </thead>
          <tbody>
            {academicPerformance.map((subject, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border p-2">{subject.subject}</td>
                <td className="border p-2 text-center">{subject.classScore}</td>
                <td className="border p-2 text-center">{subject.examScore}</td>
                <td className="border p-2 text-center">{subject.totalScore}</td>
                <td className="border p-2 text-center">{subject.grade}</td>
                <td className="border p-2 text-center">{subject.subjectPosition}</td>
                <td className="border p-2">{subject.teacher}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Overall summary */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Overall Summary</h3>
          <p><strong>Average:</strong> {overallSummary.overallPercentage}%</p>
          <p><strong>Grade:</strong> {overallSummary.overallGrade}</p>
          <p><strong>Position:</strong> {overallSummary.overallPosition}</p>
        </div>
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Form Teacher&apos;s Remarks</h3>
          <p>{commentsRecommendations.formMistressMasterReport}</p>
        </div>
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Headmaster&apos;s Remarks</h3>
          <p>{commentsRecommendations.headmasterReport}</p>
        </div>
      </div>

      {/* Grading scale */}
      {!isPrintView && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Grading Scale</h3>
          <div dangerouslySetInnerHTML={{ __html: gradingScale.percentageRanges }} />
        </div>
      )}
    </div>
  );
};

  return (
    <Dialog open={true} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>All Report Cards for Printing</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <div id="all-report-cards-content" ref={printRef} className="p-6">
          {reports.length > 0 ? (
            reports.map((report, index) => (
              <React.Fragment key={report.studentId}>
                <ReportCard
                  initialSchoolInfo={{ 
                    name: "Your School Name", 
                    address: "School Address",
                    cityPostal: "City, Postal Code",
                    phone: "Phone Number",
                    email: "school@email.com",
                    website: "www.schoolwebsite.com",
                    logoUrl: report.imageUrl || "https://placehold.co/100x100/EFEFEF/AEAEAE?text=School+Logo" 
                  }}
                  studentInfo={{
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
                  }}
                  academicPerformance={report.subjectResults.map(subject => ({
                    subject: subject.subjectName,
                    classScore: subject.classWorkTotal?.toString() || "0",
                    examScore: subject.exams?.toString() || "0",
                    totalScore: subject.total?.toString() || "0",
                    grade: subject.grade || "N/A",
                    classAverage: "",
                    subjectPosition: subject.position || "N/A",
                    overallSubjectPosition: "",
                    remarks: subject.remarks ? [subject.remarks] : [],
                    teacher: subject.subjectTeacher,
                  }))}
                  overallSummary={{
                    academicYear: report.year,
                    termSemester: report.term,
                    dateIssued: new Date().toLocaleDateString(),
                    overallPercentage: report.studentOverallPercentage?.toString() || "0",
                    overallGrade: report.studentOverallGrade || "N/A",
                    overallPosition: report.overallPosition || "N/A",
                    attendance: report.attendance || "N/A",
                    conduct: report.conduct || "",
                  }}
                  commentsRecommendations={{
                    formMistressMasterReport: report.formMistressReport || "",
                    formTeacherName: "",
                    conduct: report.conduct || "",
                    interest: report.interest || "",
                    housemistressMasterReport: report.housemistressReport || "",
                    houseTeacherName: "",
                    headmasterReport: report.headmasterReport || "",
                    headmasterName: "",
                    parentGuardianNotes: "",
                    teacherComments: "",
                    principalComments: "",
                  }}
                  gradingScale={{
                    grades: ["A", "B", "C", "D", "E", "F"],
                    percentageRanges: "A: 80-100%, B: 70-79%, C: 60-69%, D: 50-59%, E: 40-49%, F: Below 40%",
                    effortScale: "1: Excellent, 2: Good, 3: Satisfactory, 4: Needs Improvement",
                    otherSymbols: "",
                  }}
                  isPrintView={true}
                />
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
        <Button onClick={handlePrint} variant="contained" startIcon={<PrintIcon />}>
          Print All
        </Button>
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
            setSubjectTeacher("N/A");
            setOverallClassAverage(0);
            return;
        }

        setSubjectName(currentSubject.name);
        setTerm(currentSubject.term);
        setYear(currentSubject.year);
        setSubjectTeacher(currentSubject.subjectTeacher);

        // Merge students with their scores for the selected subject
        const studentsInSelectedClass = students.filter(s => s.classId === selectedClassId);
        const mergedRows: StudentRow[] = studentsInSelectedClass.map(student => {
            const scoreData = studentScores.find(score =>
                score.studentId === student.id && score.subjectId === selectedSubjectId && score.classId === selectedClassId
            );

            return {
                ...student, // MyStudent properties
                scoreId: scoreData?.id, // ID of the score entry
                cat1: scoreData?.cat1 ?? undefined,
                cat2: scoreData?.cat2 ?? undefined,
                projectWork: scoreData?.projectWork ?? undefined,
                exams: scoreData?.exams ?? undefined,
                total: scoreData?.total ?? undefined,
                position: scoreData?.position ?? undefined,
                remarks: scoreData?.remarks ?? undefined,
                grade: scoreData?.grade ?? undefined,
                classWorkTotal: scoreData?.classWorkTotal ?? undefined,
            };
        });
        setRows(mergedRows);
        calculateAndSetAverage(mergedRows);

    }, [selectedClassId, selectedSubjectId, classes, students, subjects, studentScores, isAuthReady, userId, isLoadingInitialData]);


    /**
     * Calculates the average 'total' score from the provided rows
     * and updates the `overallClassAverage` state (per subject).
     * Wrapped in useCallback to provide a stable function reference.
     * @param currentRows An array of StudentRow objects.
     */
    const calculateAndSetAverage = React.useCallback((currentRows: StudentRow[]) => {
        if (!currentRows || currentRows.length === 0) {
            setOverallClassAverage(0);
            return;
        }
        let totalOfTotals = 0;
        currentRows.forEach(row => {
            const cat1 = row.cat1 || 0;
            const cat2 = row.cat2 || 0;
            const projectWork = row.projectWork || 0;
            const exams = row.exams || 0;

            const total = row.total ?? (cat1 + cat2 + projectWork + (exams));
            totalOfTotals += total;
        });
        const calculatedAverage = (totalOfTotals / currentRows.length).toFixed(2);
        setOverallClassAverage(calculatedAverage);
    }, []);

    /**
     * Generates the correct ordinal suffix (ST, ND, RD, TH) for a given position number.
     * @param position The position number.
     * @returns The ordinal suffix string.
     */
    const getOrdinalSuffix = React.useCallback((position: number): string => {
        if (position % 100 >= 11 && position % 100 <= 13) {
            return "TH";
        }
        switch (position % 10) {
            case 1: return "ST";
            case 2: return "ND";
            case 3: return "RD";
            default: return "TH";
        }
    }, []);

    /**
     * Aggregates student data from all subjects for a given class
     * and calculates overall total, average, and rank.
     * Also generates dynamic columns for each subject.
     * @param classId The ID of the class to process.
     * @returns An object containing rankedResults (OverallStudentRow[]) and subjectColumns (GridColDef[]).
     */
    const calculateOverallResults = React.useCallback((classId: string): { rankedResults: OverallStudentRow[], subjectColumns: GridColDef<OverallStudentRow>[] } => {
        const studentsOverallData: { [studentId: string]: { name: string; totalScores: number[]; subjectCount: number; subjectTotals: { [subjectId: string]: number } } } = {};

        const studentsInClass = students.filter(s => s.classId === classId);
        if (studentsInClass.length === 0) {
            return { rankedResults: [], subjectColumns: [] };
        }

        studentsInClass.forEach(student => {
            studentsOverallData[student.id] = {
                name: student.name,
                totalScores: [],
                subjectCount: 0,
                subjectTotals: {},
            };
        });

        const subjectsForClass = subjects.filter(subject => subject.classId === classId);

        subjectsForClass.forEach(subject => {
            const scoresForSubject = studentScores.filter(score => score.subjectId === subject.id && score.classId === classId);
            scoresForSubject.forEach(score => {
                if (studentsOverallData[score.studentId]) {
                    const subjectTotal = score.total ?? 0;
                    studentsOverallData[score.studentId].totalScores.push(subjectTotal);
                    studentsOverallData[score.studentId].subjectCount++;
                    studentsOverallData[score.studentId].subjectTotals[subject.id] = subjectTotal;
                }
            });
        });

        const overallResults: OverallStudentRow[] = Object.keys(studentsOverallData).map(studentId => {
            const data = studentsOverallData[studentId];
            const overallTotalScore = data.totalScores.reduce((sum, score) => sum + score, 0);
            const overallAverage = data.subjectCount > 0 ? overallTotalScore / data.subjectCount : 0;

            return {
                id: studentId,
                name: data.name,
                overallTotalScore: parseFloat(overallTotalScore.toFixed(2)),
                overallAverage: parseFloat(overallAverage.toFixed(2)),
                overallRank: "N/A",
                subjectTotals: data.subjectTotals,
            };
        });

        overallResults.sort((a, b) => b.overallTotalScore - a.overallTotalScore);

        const rankedResults = overallResults.map((row, index) => {
            const rank = index + 1;
            return {
                ...row,
                overallRank: `${rank}${getOrdinalSuffix(rank)}`,
            };
        });

        const subjectColumns: GridColDef<OverallStudentRow>[] = subjectsForClass.map(subject => ({
            field: subject.id,
            headerName: `${subject.name} Total`,
            width: 150,
            type: 'number',
            editable: false,
            sortable: true,
            valueGetter: (_value, row) => row.subjectTotals[subject.id] ?? 0,
        }));

        return { rankedResults, subjectColumns };
    }, [getOrdinalSuffix, students, subjects, studentScores]);

    // --- Effect to Calculate Overall Results ---
    React.useEffect(() => {
        if (selectedClassId && isAuthReady && userId) {
            const { rankedResults, subjectColumns } = calculateOverallResults(selectedClassId);
            setOverallResults(rankedResults);
            setDynamicOverallColumns(subjectColumns);
        } else {
            setOverallResults([]);
            setDynamicOverallColumns([]);
        }
    }, [selectedClassId, classes, students, subjects, studentScores, isAuthReady, userId, calculateOverallResults]);


    // --- Report Card Handlers (Single Student) ---
    const handleViewReportCard = React.useCallback((studentId: string) => async () => {
        if (!selectedClassId || !userId) {
            toast.error("Please select a class and ensure authentication is ready.");
            return;
        }

        const studentDetails = students.find(s => s.id === studentId && s.classId === selectedClassId);
        if (!studentDetails) {
            toast.error("Student data not found in the selected class.");
            return;
        }

        const subjectsForClass = subjects.filter(s => s.classId === selectedClassId);
        const aggregatedSubjectResults: StudentReportCardData['subjectResults'] = [];

        for (const subject of subjectsForClass) {
            const scoreData = studentScores.find(score =>
                score.studentId === studentId && score.subjectId === subject.id && score.classId === selectedClassId
            );

            if (scoreData) {
                const classWorkTotal = (scoreData.cat1 ?? 0) + (scoreData.cat2 ?? 0) + (scoreData.projectWork ?? 0);
                aggregatedSubjectResults.push({
                    subjectId: subject.id,
                    subjectName: subject.name,
                    subjectTeacher: subject.subjectTeacher,
                    cat1: scoreData.cat1,
                    cat2: scoreData.cat2,
                    projectWork: scoreData.projectWork,
                    exams: scoreData.exams,
                    total: scoreData.total,
                    position: scoreData.position,
                    grade: scoreData.grade,
                    remarks: scoreData.remarks,
                    classWorkTotal: classWorkTotal,
                });
            } else {
                 // Include subject even if no scores exist for it
                 aggregatedSubjectResults.push({
                    subjectId: subject.id,
                    subjectName: subject.name,
                    subjectTeacher: subject.subjectTeacher,
                    cat1: null, cat2: null, projectWork: null, exams: null, total: null,
                    position: null, grade: null, remarks: null, classWorkTotal: null,
                 });
            }
        }

        const currentClassDetails = classes.find(c => c.id === selectedClassId);
        const anySubjectInClass = subjectsForClass.length > 0 ? subjectsForClass[0] : null;
        const term = anySubjectInClass?.term || "N/A";
        const year = anySubjectInClass?.year || "N/A";

        const studentOverallData = overallResults.find(result => result.id === studentId);

        const reportData: StudentReportCardData = {
            studentId: studentId,
            studentName: studentDetails.name,
            className: currentClassDetails?.name || "N/A",
            term: term,
            year: year,
            imageUrl: studentDetails.imageUrl || null,
            overallRemarks: studentDetails.overallRemarks || null,
            subjectResults: aggregatedSubjectResults,
            studentOverallPercentage: studentOverallData?.overallAverage,
            studentOverallGrade: undefined, // You would need logic to derive overall grade from overall average
            attendance: studentDetails.attendance || null,
            house: studentDetails.house || null,
            positionInClass: studentDetails.positionInClass || null,
            overallPosition: studentOverallData?.overallRank,
            formMistressReport: "", // Placeholder
            conduct: "", // Placeholder
            interest: "", // Placeholder
            housemistressReport: "", // Placeholder
            headmasterReport: "", // Placeholder
        };

        setCurrentStudentReport(reportData);
        setReportCardImage(reportData.imageUrl ?? null);
        setReportCardOverallRemarks(reportData.overallRemarks || "");
        setReportCardAttendance(reportData.attendance || "");
        setReportCardHouse(reportData.house || "");
        setReportCardPositionInClass(reportData.positionInClass || "");
        setOpenReportCardDialog(true);

    }, [selectedClassId, students, subjects, studentScores, overallResults, userId]);


    const handleCloseReportCardDialog = () => {
        setOpenReportCardDialog(false);
        setCurrentStudentReport(null);
        setReportCardImage(null);
        setReportCardOverallRemarks("");
        setReportCardAttendance("");
        setReportCardHouse("");
        setReportCardPositionInClass("");
    };

    const handleReportCardOverallRemarksChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setReportCardOverallRemarks(event.target.value);
    };

    const handleReportCardAttendanceChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setReportCardAttendance(event.target.value);
    };
    const handleReportCardHouseChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setReportCardHouse(event.target.value);
    };
    const handleReportCardPositionInClassChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setReportCardPositionInClass(event.target.value);
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !userId || !currentStudentReport) {
            toast.error("No file selected, or user/student not identified.");
            return;
        }

        const filePath = `${userId}/${currentStudentReport.studentId}/${Date.now()}_${file.name}`;

        try {
            const { error } = await supabase.storage
                .from('student_images') // Assuming you have a bucket named 'student_images'
                .upload(filePath, file, { cacheControl: '3600', upsert: true });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from('student_images')
                .getPublicUrl(filePath);

            if (!publicUrlData || !publicUrlData.publicUrl) {
                throw new Error("Failed to get public URL for the uploaded image.");
            }

            setReportCardImage(publicUrlData.publicUrl);
            toast.success("Image uploaded successfully!");
        } catch (error: Error | unknown) {
            console.error("Error uploading image:", error instanceof Error ? error.message : String(error));
            toast.error(`Failed to upload image: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const handleSaveReportCard = async () => {
        if (!currentStudentReport || !userId || !selectedClassId) {
            toast.error("Cannot save report card details (student data or selection missing).");
            return;
        }

        try {
            const { error } = await supabase
                .from('user_students') // Updated table name
                .update({
                    overallRemarks: reportCardOverallRemarks,
                    imageUrl: reportCardImage,
                    attendance: reportCardAttendance,
                    house: reportCardHouse,
                    positionInClass: reportCardPositionInClass,
                })
                .eq('id', currentStudentReport.studentId)
                .eq('classId', selectedClassId)
                .eq('userId', userId);

            if (error) throw error;

            toast.success("Report card details saved.");
        } catch (error: Error | unknown) {
            console.error("Error saving report card details:", error instanceof Error ? error.message : String(error));
            toast.error(`Failed to save report card details: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

   const handlePrintReportCard = () => {
  if (!currentStudentReport) {
    toast.error("No student report data available for printing.");
    return;
  }

  // Format the data for the ReportCard component
  const reportCardData = {
    initialSchoolInfo: {
      name: "Your School Name",
      address: "School Address",
      cityPostal: "City, Postal Code",
      phone: "Phone Number",
      email: "school@email.com",
      website: "www.schoolwebsite.com",
      logoUrl: reportCardImage || "https://placehold.co/100x100/EFEFEF/AEAEAE?text=School+Logo",
    },
    studentInfo: {
      name: currentStudentReport.studentName,
      id: currentStudentReport.studentId,
      gradeLevel: currentStudentReport.className,
      attendance: reportCardAttendance || "N/A",
      nextTermBegins: "",
      house: reportCardHouse || "N/A",
      positionInClass: reportCardPositionInClass || "N/A",
      imageUrl: reportCardImage || "https://placehold.co/100x100/EFEFEF/AEAEAE?text=Student+Image",
      dateOfBirth: "",
      homeroom: "",
    },
    academicPerformance: currentStudentReport.subjectResults.map(subject => ({
      subject: subject.subjectName,
      classScore: subject.classWorkTotal?.toString() || "0",
      examScore: subject.exams?.toString() || "0",
      totalScore: subject.total?.toString() || "0",
      grade: subject.grade || "N/A",
      classAverage: "",
      subjectPosition: subject.position || "N/A",
      overallSubjectPosition: "",
      remarks: subject.remarks ? [subject.remarks] : [],
      teacher: subject.subjectTeacher,
    })),
    overallSummary: {
      academicYear: currentStudentReport.year,
      termSemester: currentStudentReport.term,
      dateIssued: new Date().toLocaleDateString(),
      overallPercentage: currentStudentReport.studentOverallPercentage?.toString() || "0",
      overallGrade: currentStudentReport.studentOverallGrade || "N/A",
      overallPosition: currentStudentReport.overallPosition || "N/A",
      attendance: reportCardAttendance || "N/A",
      conduct: "",
    },
    commentsRecommendations: {
      formMistressMasterReport: currentStudentReport.formMistressReport || "",
      formTeacherName: "",
      conduct: currentStudentReport.conduct || "",
      interest: currentStudentReport.interest || "",
      housemistressMasterReport: currentStudentReport.housemistressReport || "",
      houseTeacherName: "",
      headmasterReport: currentStudentReport.headmasterReport || "",
      headmasterName: "",
      parentGuardianNotes: "",
      teacherComments: "",
      principalComments: "",
    },
    gradingScale: {
      grades: ["A", "B", "C", "D", "E", "F"],
      percentageRanges: "A: 80-100%, B: 70-79%, C: 60-69%, D: 50-59%, E: 40-49%, F: Below 40%",
      effortScale: "1: Excellent, 2: Good, 3: Satisfactory, 4: Needs Improvement",
      otherSymbols: "",
    },
    isPrintView: true
  };

  // Now you can print this data
  if (reportCardRef.current) {
    const printContent = reportCardRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    const originalTitle = document.title;

    document.body.innerHTML = printContent;
    document.title = `Report Card - ${currentStudentReport.studentName}`;

    const printStyles = `
      <style>
        @media print {
          body > *:not(#report-card-content) { display: none !important; }
          #report-card-content {
            display: block !important;
            width: 100%;
            margin: 0 auto;
            padding: 10mm;
            box-sizing: border-box;
            font-family: sans-serif;
            color: #000;
          }
          .MuiCard-root, .MuiCardContent-root { 
            border: none !important; 
            box-shadow: none !important; 
            padding: 0 !important; 
            margin: 0 !important; 
          }
          h1, h2, h6, p, strong { 
            color: #000 !important; 
            margin-bottom: 0.5em; 
          }
          h6 { font-size: 1.1em; margin-top: 1em; }
          p { font-size: 0.9em; }
          .flex { display: flex !important; }
          .grid { display: grid !important; }
          .flex-col { flex-direction: column !important; }
          .md\\:flex-row { flex-direction: row !important; }
          .items-start { align-items: flex-start !important; }
          .items-center { align-items: center !important; }
          .gap-6 { gap: 1.5rem !important; }
          .mb-6 { margin-bottom: 1.5rem !important; }
          .p-4 { padding: 1rem !important; }
          .p-3 { padding: 0.75rem !important; }
          .p-2 { padding: 0.5rem !important; }
          .space-y-4 > :not([hidden]) ~ :not([hidden]) { 
            margin-top: 1rem !important; 
            margin-bottom: 0 !important; 
          }
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
          .print-hide { display: none !important; }
          .print-only { display: block !important; }
          .MuiDialog-container, .MuiDialog-paper, .MuiModal-backdrop { 
            display: none !important; 
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
        }
      </style>
    `;
    const styleElement = document.createElement('style');
    styleElement.innerHTML = printStyles;
    document.head.appendChild(styleElement);

    window.print();

    // Restore original content
    document.body.innerHTML = originalContent;
    document.title = originalTitle;
    if (document.head.contains(styleElement)) {
      document.head.removeChild(styleElement);
    }
  } else {
    toast.error("Report card content not available for printing.");
  }
};


    const handleDeleteSingle = React.useCallback( (studentId: string) => async () => {
        if (!selectedClassId || !userId) {
            toast.error("Authentication or class not ready.");
            return;
        }

        if (window.confirm("Delete this student's record from this class and all subjects? This action cannot be undone.")) {
            try {
                // 1. Delete student scores for this student across all subjects in this class
                const { error: scoresError } = await supabase
                    .from('user_student_scores') // Updated table name
                    .delete()
                    .eq('studentId', studentId)
                    .eq('classId', selectedClassId)
                    .eq('userId', userId);

                if (scoresError) throw scoresError;

                // 2. Delete the student from the user_students table
                const { error: studentError } = await supabase
                    .from('user_students') // Updated table name
                    .delete()
                    .eq('id', studentId)
                    .eq('classId', selectedClassId)
                    .eq('userId', userId);

                if (studentError) throw studentError;

                toast.success("Student record and all associated scores deleted.");
            } catch (error: Error | unknown) {
                console.error("Error deleting student:", error instanceof Error ? error.message : String(error));
                toast.error(`Failed to delete student: ${error instanceof Error ? error.message : String(error)}. Check RLS policies.`);
            }
        }
    }, [selectedClassId, userId]);


    // --- DataGrid Column Definitions ---
    const columns: GridColDef<StudentRow>[] = React.useMemo(() => [
        { field: "name", headerName: "Name of Students", width: 200, editable: false },
        {
            field: "cat1", headerName: "CAT 1 (10)", width: 100, editable: true, type: "number",
            valueParser: (value) => Number(value) || 0,
        },
        {
            field: "cat2", headerName: "CAT 2 (20)", width: 100, editable: true, type: "number",
            valueParser: (value) => Number(value) || 0,
        },
        {
            field: "projectWork", headerName: "Project Work (20)", width: 120, editable: true, type: "number",
            valueParser: (value) => Number(value) || 0,
        },
        {
            field: "classWorkTotal", headerName: "Class Score (50)", width: 120, editable: false, sortable: true,
            valueGetter: (_value, row) => {
                const cat1 = row.cat1 || 0;
                const cat2 = row.cat2 || 0;
                const projectWork = row.projectWork || 0;
                const classWorkTotal = cat1 + cat2 + projectWork;
                return parseFloat(classWorkTotal.toFixed(2));
            },
        },
        {
            field: "exams", headerName: "Exams (100/2)", width: 100, editable: true, type: "number",
            valueParser: (value) => Number(value) || 0,
        },
        {
            field: "total", headerName: "Total (100%)", width: 120, editable: false, sortable: true,
            valueGetter: (_value, row) => {
                const cat1 = row.cat1 || 0;
                const cat2 = row.cat2 || 0;
                const projectWork = row.projectWork || 0;
                const exams = row.exams || 0;
                const total = cat1 + cat2 + projectWork + (exams);
                return parseFloat(total.toFixed(2));
            },
        },
        { field: "position", headerName: "Position", width: 100, sortable: true, editable: false },
        { field: "remarks", headerName: "Remarks", width: 120, editable: true },
        {
            field: "actions", type: "actions", headerName: "Delete", width: 100,
            getActions: ({ id }) => [
                <GridActionsCellItem
                    key={`delete-${id}`}
                    icon={<DeleteIcon />}
                    label="Delete"
                    onClick={handleDeleteSingle(id as string)}
                    color="inherit"
                />,
            ],
        },
    ], [handleDeleteSingle]);

    // --- DataGrid Column Definitions for Overall Ranking ---
    const overallColumns: GridColDef<OverallStudentRow>[] = React.useMemo(() => {
        const baseColumns: GridColDef<OverallStudentRow>[] = [
            { field: "name", headerName: "Student Name", width: 250 },
            { field: "overallTotalScore", headerName: "Overall Total", width: 150, type: "number" },
            { field: "overallAverage", headerName: "Overall Average (%)", width: 150, type: "number" },
            { field: "overallRank", headerName: "Overall Rank", width: 120 },
            {
                field: "actions", type: "actions", headerName: "Results", width: 100,
                getActions: ({ id }) => [
                    <GridActionsCellItem
                        key={`view-${id}`}
                        icon={<VisibilityIcon />}
                        label="View Report Card"
                        onClick={handleViewReportCard(id as string)}
                        color="primary"
                    />,
                ],
            },
        ];

        const combinedColumns: GridColDef<OverallStudentRow>[] = [
            ...baseColumns.slice(0, 1),
            ...dynamicOverallColumns,
            ...baseColumns.slice(1),
        ];

        return combinedColumns;
    }, [dynamicOverallColumns, handleViewReportCard]);


    // --- Event Handlers & Logic ---

    // --- Class Management Handlers ---
    const handleCreateClass = () => { setOpenCreateClassDialog(true); };
    const handleCloseCreateClassDialog = () => {
        setOpenCreateClassDialog(false);
        setNewClassData({ name: "" });
    };

    const handleSaveNewClass = async () => {
        if (!newClassData.name.trim() || !userId) {
            toast.error("Class name cannot be empty or user not authenticated.");
            return;
        }
        try {
            const { data, error } = await supabase
                .from('user_classes') // Updated table name
                .insert({ name: newClassData.name.trim(), userId: userId })
                .select();
            if (error) throw error;
            const newClass = data[0] as MyClass;
            setSelectedClassId(newClass.id);
            setSelectedSubjectId(null);
            setRows([]);
            setSubjectName("N/A");
            setTerm("N/A");
            setYear("N/A");
            setSubjectTeacher("N/A");
            setClassName(newClass.name);
            setOverallClassAverage(0);
            setShowOverallResults(false);
            setOverallResults([]);
            setDynamicOverallColumns([]);
            handleCloseCreateClassDialog();
            toast.success(`Class "${newClass.name}" created.`);
        } catch (error: Error | unknown) {
            console.error("Error creating class:", error instanceof Error ? error.message : String(error));
            toast.error(`Failed to create class: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const handleClassSelection = (event: SelectChangeEvent<string>) => {
        const selectedId = event.target.value;
        if (!selectedId) {
            setSelectedClassId(null);
            setSelectedSubjectId(null);
            setClassName("N/A");
            setRows([]);
            setSubjectName("N/A");
            setTerm("N/A");
            setYear("N/A");
            setSubjectTeacher("N/A");
            setOverallClassAverage(0);
            setShowOverallResults(false);
            setOverallResults([]);
            setDynamicOverallColumns([]);
            return;
        }
        setSelectedClassId(selectedId);
        setSelectedSubjectId(null); // Reset subject when class changes
        const selectedClass = classes.find((c) => c.id === selectedId);
        setClassName(selectedClass ? selectedClass.name : "N/A");
        setRows([]); // Clear rows as we are changing class
        setSubjectName("N/A");
        setTerm("N/A");
        setYear("N/A");
        setSubjectTeacher("N/A");
        setOverallClassAverage(0);
        setShowOverallResults(false);
    };

    const handleDeleteClass = async () => {
        if (!selectedClassId || !userId) {
            toast.info("No class selected or user not authenticated.");
            return;
        }
        const currentClassName = classes.find(c => c.id === selectedClassId)?.name || "N/A";

        if (window.confirm(`ARE YOU SURE?\n\nDeleting class "${currentClassName}" will permanently remove:\n- The class itself\n- All subjects within this class\n- All student records and scores for all subjects in this class.\n\nThis action cannot be undone.`)) {
            try {
                // Supabase CASCADE DELETE on foreign keys should handle subjects, students, and student_scores
                // if configured correctly in your table schema.
                // If not, you'd need to delete in reverse order: user_student_scores -> user_students -> user_subjects -> user_classes.
                const { error: classError } = await supabase
                    .from('user_classes') // Updated table name
                    .delete()
                    .eq('id', selectedClassId)
                    .eq('userId', userId);

                if (classError) throw classError;

                // State will be updated by real-time listeners.
                setSelectedClassId(null);
                setSelectedSubjectId(null);
                setRows([]);
                setSubjectName("N/A");
                setTerm("N/A");
                setYear("N/A");
                setSubjectTeacher("N/A");
                setClassName("N/A");
                setOverallClassAverage(0);
                setOverallResults([]);
                setDynamicOverallColumns([]);
                setShowOverallResults(false);

                toast.success(`Class "${currentClassName}" and all its data deleted.`);
            } catch (error: Error | unknown) {
                console.error("Error deleting class:", error instanceof Error ? error.message : String(error));
                toast.error(`Failed to delete class: ${error instanceof Error ? error.message : String(error)}. Check RLS policies.`);
            }
        }
    };


    

    // --- Subject Management Handlers ---
    const handleAddSubject = () => {
        if (!selectedClassId) {
            toast.error("Please select a class first before adding a subject.");
            return;
        }
        setNewSubjectData({ name: "", subjectTeacher: "", term: "", year: "" });
        setOpenAddSubjectDialog(true);
    };
    const handleCloseAddSubjectDialog = () => { setOpenAddSubjectDialog(false); };

    const handleSaveNewSubject = async () => {
        if (!newSubjectData.name.trim() || !selectedClassId || !userId) {
            toast.error("Subject name, class selection, or user authentication missing.");
            return;
        }
        try {
            const { data, error } = await supabase
                .from('user_subjects') // Updated table name
                .insert({ ...newSubjectData, classId: selectedClassId, userId: userId })
                .select();
            if (error) throw error;
            const newSubject = data[0] as MySubject;
            setSelectedSubjectId(newSubject.id);
            setRows([]);
            setSubjectName(newSubject.name);
            setTerm(newSubject.term);
            setYear(newSubject.year);
            setSubjectTeacher(newSubject.subjectTeacher);
            setOverallClassAverage(0);
            setShowOverallResults(false);
            handleCloseAddSubjectDialog();
            toast.success(`Subject "${newSubject.name}" added to class "${className}".`);
        } catch (error: unknown) {
            console.error("Error adding subject:", (error as Error).message);
            toast.error(`Failed to add subject: ${(error as Error).message}`);
        }
    };

    const handleSubjectSelection = (event: SelectChangeEvent<string>) => {
        const selectedId = event.target.value;
        if (!selectedId) {
            setSelectedSubjectId(null);
            setRows([]);
            setSubjectName("N/A");
            setTerm("N/A");
            setYear("N/A");
            setSubjectTeacher("N/A");
            setOverallClassAverage(0);
            setShowOverallResults(false);
            return;
        }

        setSelectedSubjectId(selectedId);
        const selectedSubject = subjects.find((s) => s.id === selectedId);
        if (selectedSubject) {
            setSubjectName(selectedSubject.name);
            setTerm(selectedSubject.term);
            setYear(selectedSubject.year);
            setSubjectTeacher(selectedSubject.subjectTeacher);
        }
        setRows([]); // Will be populated by the useEffect sync
        setShowOverallResults(false);
    };

    const handleEditSubjectDetails = () => {
        const currentSubject = subjects.find(s => s.id === selectedSubjectId);
        if (!currentSubject) {
            toast.error("No subject selected to edit.");
            return;
        }
        setSubjectEditData({
            name: currentSubject.name,
            subjectTeacher: currentSubject.subjectTeacher,
            term: currentSubject.term,
            year: currentSubject.year,
        });
        setOpenEditSubjectDialog(true);
    };
    const handleCloseEditSubjectDialog = () => { setOpenEditSubjectDialog(false); };

    const handleSaveSubjectDetails = async () => {
        if (!selectedSubjectId || !userId) {
            toast.error("No subject selected or user not authenticated.");
            return;
        }
        try {
            const { error } = await supabase
                .from('user_subjects') // Updated table name
                .update(subjectEditData)
                .eq('id', selectedSubjectId)
                .eq('userId', userId);
            if (error) throw error;
            toast.success("Subject details updated");
            handleCloseEditSubjectDialog();
        } catch (error: Error | unknown) {
            console.error("Error saving subject details:", error instanceof Error ? error.message : String(error));
            toast.error(`Failed to save subject details: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const handleDeleteSubject = async () => {
        if (!selectedSubjectId || !selectedClassId || !userId) {
            toast.info("No subject selected or user not authenticated.");
            return;
        }
        const subjectToDelete = subjects.find(s => s.id === selectedSubjectId);
        const currentSubjectName = subjectToDelete ? subjectToDelete.name : "N/A";

        if (window.confirm(`ARE YOU SURE?\n\nDeleting subject "${currentSubjectName}" for class "${className}" will permanently remove:\n- The subject itself\n- All student scores associated with this specific subject.\n\nThis action cannot be undone.`)) {
            try {
                // Supabase CASCADE DELETE on foreign keys should handle user_student_scores
                const { error } = await supabase
                    .from('user_subjects') // Updated table name
                    .delete()
                    .eq('id', selectedSubjectId)
                    .eq('classId', selectedClassId)
                    .eq('userId', userId);
                if (error) throw error;

                setSelectedSubjectId(null);
                setRows([]);
                setSubjectName("N/A");
                setTerm("N/A");
                setYear("N/A");
                setSubjectTeacher("N/A");
                setOverallClassAverage(0);
                setShowOverallResults(false);
                toast.success(`Subject "${currentSubjectName}" and its data deleted.`);
            } catch (error: Error | unknown) {
                console.error("Error deleting subject:", error instanceof Error ? error.message : String(error));
                toast.error(`Failed to delete subject: ${error instanceof Error ? error.message : String(error)}. Check RLS policies.`);
            }
        }
    };


    // --- Student Management Handlers ---
    const handleAddStudent = () => {
        if (!selectedClassId) {
            toast.error("Please select a class before adding students.");
            return;
        }
        setNewStudentName("");
        setOpenAddStudentDialog(true);
    };
    const handleCloseAddStudentDialog = () => { setOpenAddStudentDialog(false); };

    const handleSaveNewStudent = async () => {
        if (!selectedClassId || !newStudentName.trim() || !userId) {
            toast.error("Class not selected, student name empty, or user not authenticated.");
            return;
        }
        try {
            const { data: studentData, error: studentError } = await supabase
                .from('user_students') // Updated table name
                .insert({
                    name: newStudentName.trim(),
                    classId: selectedClassId,
                    userId: userId,
                })
                .select();
            if (studentError) throw studentError;

            const newStudent = studentData[0] as MyStudent;

            // Automatically add initial score entries for all existing subjects in this class
            const subjectsInClass = subjects.filter(s => s.classId === selectedClassId);
            if (subjectsInClass.length > 0) {
                const newScoreEntries = subjectsInClass.map(subject => ({
                    id: crypto.randomUUID(),
                    studentId: newStudent.id,
                    subjectId: subject.id,
                    classId: selectedClassId,
                    userId: userId,
                }));
                const { error: scoresError } = await supabase
                    .from('user_student_scores') // Updated table name
                    .insert(newScoreEntries);
                if (scoresError) {
                    console.warn(`Could not create initial score entries for new student: ${scoresError.message}`);
                    toast.warn(`Student added, but failed to create initial score entries for all subjects. (Error: ${scoresError.message})`);
                }
            }

            handleCloseAddStudentDialog();
            toast.success(`Student "${newStudent.name}" added to class "${className}".`);
        } catch (error: Error | unknown) {
            console.error("Error adding student:", error instanceof Error ? error.message : String(error));
            toast.error(`Failed to add student: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const handleOpenPasteNamesDialog = () => {
        if (!selectedClassId) {
            toast.error("Please select a class before pasting students.");
            return;
        }
        setPastedNames("");
        setOpenPasteNamesDialog(true);
    };
    const handleClosePasteNamesDialog = () => { setOpenPasteNamesDialog(false); };

    const handleAddPastedNames = async () => {
        if (!selectedClassId || !pastedNames.trim() || !userId) {
            toast.error("Class not selected, names empty, or user not authenticated.");
            return;
        }

        const namesArray = pastedNames.split(/\r?\n/).map(name => name.trim()).filter(name => name !== '');
        if (namesArray.length === 0) {
            toast.info("No valid names found in the pasted text.");
            return;
        }

        try {
            const newStudentsToInsert = namesArray.map(name => ({
                name: name,
                classId: selectedClassId,
                userId: userId,
            }));

            const { data: insertedStudentsData, error: studentError } = await supabase
                .from('user_students') // Updated table name
                .insert(newStudentsToInsert)
                .select(); // Get the inserted rows with their IDs
            if (studentError) throw studentError;

            const insertedStudents = insertedStudentsData as MyStudent[];

            // For each newly inserted student, add initial score entries for all existing subjects
            const subjectsInClass = subjects.filter(s => s.classId === selectedClassId);
            if (subjectsInClass.length > 0 && insertedStudents.length > 0) {
                const newScoreEntries: MyStudentScore[] = [];
                insertedStudents.forEach(newStudent => {
                    subjectsInClass.forEach(subject => {
                        newScoreEntries.push({
                            id: crypto.randomUUID(),
                            studentId: newStudent.id,
                            subjectId: subject.id,
                            classId: selectedClassId,
                            userId: userId,
                        });
                    });
                });
                const { error: scoresError } = await supabase
                    .from('user_student_scores') // Updated table name
                    .insert(newScoreEntries);
                if (scoresError) {
                    console.warn(`Could not create initial score entries for pasted students: ${scoresError.message}`);
                    toast.warn(`Students added, but failed to create initial score entries for some. (Error: ${scoresError.message})`);
                }
            }

            handleClosePasteNamesDialog();
            toast.success(`${insertedStudents.length} student(s) added.`);
        } catch (error: Error | unknown) {
            console.error("Error adding pasted students:", error instanceof Error ? error.message : String(error));
            toast.error(`Failed to add students: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const handleDeleteSelected = async () => {
        if (!userId || !selectedClassId || rows.length === 0) { // Check if rows exist for current subject view
            toast.info("No students selected or authentication/class not ready.");
            return;
        }

        // The DataGrid component currently doesn't provide a selectionModel directly in this usage.
        // Assuming `selectionModel` is implicitly used or we need a way to track selected rows.
        // For simplicity, let's assume `rows` here refers to the currently displayed filterable/editable rows
        // and we will apply deletion to currently displayed. A proper multi-delete would involve a `selectionModel` state.

        if (rows.length === 0) { // No students to delete in current view
            toast.info("No students to delete in the current view.");
            return;
        }
         // Assuming we want to delete all students currently displayed in the grid if selectedStudentIds is empty.
         // If a proper `selectionModel` is implemented by DataGrid, use that instead.
         // For now, if no specific selection is made, and user clicks "Delete Selected",
         // we should clarify what "selected" means or disable if nothing explicitly selected via checkbox.
         // Given the UI shows checkboxSelection, I'll use a placeholder for `selectionModel` which needs to be managed by DataGrid.
         // For now, let's assume this means deleting students explicitly selected by checkbox if `selectionModel` is updated by DataGrid.
         // If `selectionModel` is empty, maybe prompt user if they mean to delete ALL visible?
         if (rows.length === 0) {
             toast.info("No rows to delete. Select rows using the checkboxes.");
             return;
         }

        if (window.confirm(`Delete ${rows.length} student(s) from this class and all subjects? This action cannot be undone.`)) {
            try {
                // Delete all students in the current view (and their associated scores via CASCADE DELETE)
                const studentIdsInView = rows.map(r => r.id);
                if (studentIdsInView.length === 0) {
                    toast.info("No students to delete in the current view.");
                    return;
                }

                const { error: studentDeleteError } = await supabase
                    .from('user_students') // Updated table name
                    .delete()
                    .in('id', studentIdsInView) // Delete all students currently in the `rows` state
                    .eq('classId', selectedClassId)
                    .eq('userId', userId);

                if (studentDeleteError) throw studentDeleteError;

                toast.success("Selected student records and all associated scores deleted.");
                // Real-time listeners will update the state
            } catch (error: Error | unknown) {
                console.error("Error deleting selected students:", error instanceof Error ? error.message : String(error));
                toast.error(`Failed to delete selected students: ${error instanceof Error ? error.message : String(error)}. Check RLS policies.`);
            }
        }
    };


    const processRowUpdate = async (newRow: GridRowModel<StudentRow>, oldRow: GridRowModel<StudentRow>): Promise<StudentRow> => {
        if (!userId || !selectedClassId || !selectedSubjectId) {
            toast.error("User not authenticated or selection incomplete. Cannot save.");
            return oldRow;
        }

        // Calculate derived fields (total, classWorkTotal) before saving
        const cat1 = Number(newRow.cat1 || 0);
        const cat2 = Number(newRow.cat2 || 0);
        const projectWork = Number(newRow.projectWork || 0);
        const exams = Number(newRow.exams || 0);
        const total = cat1 + cat2 + projectWork + (exams);
        const classWorkTotal = cat1 + cat2 + projectWork;

        const updatedStudentScore: MyStudentScore = {
            id: newRow.scoreId || crypto.randomUUID(), // Use existing ID or generate new
            studentId: newRow.id,
            subjectId: selectedSubjectId,
            classId: selectedClassId,
            userId: userId,
            cat1: cat1,
            cat2: cat2,
            projectWork: projectWork,
            exams: exams,
            total: parseFloat(total.toFixed(2)),
            classWorkTotal: parseFloat(classWorkTotal.toFixed(2)),
            position: newRow.position || null, // Will be updated by handleSaveAll
            remarks: newRow.remarks || null,
            grade: newRow.grade || null,
        };

        try {
            // Check if score entry already exists
            const existingScore = studentScores.find(s => s.id === newRow.scoreId);

            if (existingScore) {
                // Update existing score
                const { error } = await supabase
                    .from('user_student_scores') // Updated table name
                    .update(updatedStudentScore)
                    .eq('id', updatedStudentScore.id)
                    .eq('userId', userId); // Ensure user owns the record
                if (error) throw error;
            } else {
                // Insert new score entry
                const { data, error } = await supabase
                    .from('user_student_scores') // Updated table name
                    .insert(updatedStudentScore)
                    .select(); // Select to get the new ID
                if (error) throw error;
                updatedStudentScore.id = data[0].id; // Update the ID if it was new
            }

            // Update student's profile details if they were edited in the grid (e.g., imageUrl, overallRemarks)
            // This assumes these fields are also editable directly in the DataGrid,
            // which might be an unintended side effect if primary editing is via the report card dialog.
            // For now, I'll add logic to update `user_students` table, but consider if these fields should be editable here.
            const { error: studentUpdateError } = await supabase
                .from('user_students') // Updated table name
                .update({
                    imageUrl: newRow.imageUrl || null,
                    overallRemarks: newRow.overallRemarks || null,
                    attendance: newRow.attendance || null,
                    house: newRow.house || null,
                    positionInClass: newRow.positionInClass || null,
                })
                .eq('id', newRow.id)
                .eq('classId', selectedClassId)
                .eq('userId', userId);
            if (studentUpdateError) {
                console.warn("Could not update student profile fields:", studentUpdateError.message);
                toast.warn(`Failed to update student profile fields: ${studentUpdateError.message}`);
            }

            toast.success("Row updated successfully.");

            const finalUpdatedRow: StudentRow = {
                ...newRow,
                cat1: updatedStudentScore.cat1 ?? undefined,
                cat2: updatedStudentScore.cat2 ?? undefined,
                projectWork: updatedStudentScore.projectWork ?? undefined,
                exams: updatedStudentScore.exams ?? undefined,
                total: updatedStudentScore.total ?? undefined,
                classWorkTotal: updatedStudentScore.classWorkTotal ?? undefined,
                position: updatedStudentScore.position ?? undefined,
                remarks: updatedStudentScore.remarks ?? undefined,
                grade: updatedStudentScore.grade ?? undefined,
                isNew: false,
                scoreId: updatedStudentScore.id,
            };
            setRows(currentRows => {
                const newRows = currentRows.map((row) => (row.id === finalUpdatedRow.id ? finalUpdatedRow : row));
                calculateAndSetAverage(newRows);
                return newRows;
            });

            return finalUpdatedRow;
        } catch (error: Error | unknown) {
            console.error("Error processing row update:", error instanceof Error ? error.message : String(error));
            toast.error(`Failed to update row: ${error instanceof Error ? error.message : String(error)}`);
            return oldRow; // Revert to old row on error
        }
    };


    const handleRowEditStop: GridEventListener<"rowEditStop"> = (params, event) => {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
    };

    const handleSaveAll = async () => {
        if (!userId || !selectedClassId || !selectedSubjectId || rows.length === 0) {
            toast.error("Cannot save results: User not authenticated, class/subject not selected, or no data.");
            return;
        }

        try {
            const updates: MyStudentScore[] = [];
            const newScores: MyStudentScore[] = [];

            // Step 1: Prepare data for saving (calculate derived fields)
            const rowsWithCalculations = rows.map(row => {
                const cat1 = row.cat1 || 0;
                const cat2 = row.cat2 || 0;
                const projectWork = row.projectWork || 0;
                const exams = row.exams || 0;
                const total = cat1 + cat2 + projectWork + (exams);
                const classWorkTotal = cat1 + cat2 + projectWork;

                return {
                    ...row,
                    total: parseFloat(total.toFixed(2)),
                    classWorkTotal: parseFloat(classWorkTotal.toFixed(2)),
                };
            });

            // Step 2: Sort and calculate position and remarks
            const sortedRows = [...rowsWithCalculations].sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
            const positionedRows = sortedRows.map((row, index) => {
                const position = index + 1;
                const total = row.total ?? 0;
                const remarks = total < 40 ? "WEAK" : total < 60 ? "AVERAGE" : "GOOD";
                // Add simple grading logic (example)
                let grade = '';
                if (total >= 80) grade = 'A';
                else if (total >= 70) grade = 'B';
                else if (total >= 60) grade = 'C';
                else if (total >= 50) grade = 'D';
                else if (total >= 40) grade = 'E';
                else grade = 'F';

                const scoreEntry: MyStudentScore = {
                    id: row.scoreId || crypto.randomUUID(),
                    studentId: row.id,
                    subjectId: selectedSubjectId,
                    classId: selectedClassId,
                    userId: userId,
                    cat1: row.cat1 || null,
                    cat2: row.cat2 || null,
                    projectWork: row.projectWork || null,
                    exams: row.exams || null,
                    total: row.total || null,
                    classWorkTotal: row.classWorkTotal || null,
                    position: `${position}${getOrdinalSuffix(position)}`,
                    remarks: remarks,
                    grade: grade, // Save grade
                };

                if (row.scoreId) {
                    updates.push(scoreEntry);
                } else {
                    newScores.push(scoreEntry);
                }

                // Return updated row for local state (UI)
                return {
                    ...row,
                    position: `${position}${getOrdinalSuffix(position)}`,
                    remarks: remarks,
                    grade: grade,
                    scoreId: scoreEntry.id // Ensure local UI has the scoreId for new entries
                };
            });

            // Step 3: Perform batch updates/inserts to Supabase
            if (newScores.length > 0) {
                const { error: insertError, data: insertedData } = await supabase
                    .from('user_student_scores') // Updated table name
                    .insert(newScores)
                    .select(); // Select to get IDs for new entries
                if (insertError) throw insertError;
                // Update the `rows` with the new IDs for newly inserted scores
                insertedData.forEach(insertedScore => {
                    const rowIndex = positionedRows.findIndex(r => r.id === insertedScore.studentId && !r.scoreId);
                    if (rowIndex !== -1) {
                        positionedRows[rowIndex].scoreId = insertedScore.id;
                    }
                });
            }

            // Batch update existing scores
            for (const update of updates) {
                const { error } = await supabase
                    .from('user_student_scores') // Updated table name
                    .update(update)
                    .eq('id', update.id)
                    .eq('userId', userId);
                if (error) {
                    console.warn(`Failed to update score for student ${update.studentId}: ${error.message}`);
                    // Don't throw, allow other updates to proceed
                }
            }

            // Update the local rows state
            setRows(positionedRows);
            calculateAndSetAverage(positionedRows);
            toast.success("Results saved, positions and remarks updated.");
            handleViewAllReportCardsForPrinting(); // Auto open all reports
        } catch (error: any) {
            console.error("Error saving all results:", error.message);
            toast.error(`Failed to save results: ${error.message}`);
        }
    };


    const handleClearResults = async () => {
        if (!userId || !selectedClassId || !selectedSubjectId) {
            toast.error("Cannot clear results: User not authenticated, or class/subject not selected.");
            return;
        }

        if (window.confirm(`ARE YOU SURE?\n\nThis will permanently clear ALL results (scores, positions, remarks) for the subject "${subjectName}" in class "${className}".\n\nThis action cannot be undone.`)) {
            try {
                // Delete all user_student_scores entries for the current class and subject
                const { error } = await supabase
                    .from('user_student_scores') // Updated table name
                    .delete()
                    .eq('classId', selectedClassId)
                    .eq('subjectId', selectedSubjectId)
                    .eq('userId', userId);

                if (error) throw error;

                // Reset local state for current subject to reflect cleared scores
                const studentsInCurrentClass = students.filter(s => s.classId === selectedClassId);
                const clearedRows: StudentRow[] = studentsInCurrentClass.map(student => ({
                    ...student,
                    cat1: undefined, cat2: undefined, projectWork: undefined, exams: undefined,
                    total: undefined, position: undefined, remarks: undefined, grade: undefined,
                    classWorkTotal: undefined, scoreId: undefined
                }));
                setRows(clearedRows);
                calculateAndSetAverage(clearedRows);

                toast.success(`Results for subject "${subjectName}" in class "${className}" cleared.`);
            } catch (error: any) {
                console.error("Error clearing results:", error.message);
                toast.error(`Failed to clear results: ${error.message}. Check RLS policies.`);
            }
        }
    };


    // --- Excel Export Handler (Subject Specific) ---
    const exportToExcel = async () => {
        if (!rows.length || !selectedClassId || !selectedSubjectId || !XLSX || !FileSaver) {
            toast.info("No student data or required libraries to export.");
            return;
        }
        try {
            const worksheetData = [
                ['Name of Students', 'CAT 1 (10)', 'CAT 2 (20)', 'Project Work (20)', 'Class Score (50)',
                    'Exams (100)', 'Total (100%)', 'Position', 'Remarks'],
                ...rows.map(row => [
                    row.name,
                    row.cat1 || 0,
                    row.cat2 || 0,
                    row.projectWork || 0,
                    row.classWorkTotal || 0,
                    row.exams || 0,
                    row.total || 0,
                    row.position || '',
                    row.remarks || ''
                ])
            ];
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Subject Results");
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

            const currentClassName = classes.find(c => c.id === selectedClassId)?.name || "Class";
            const currentSubjectName = subjects.find(s => s.id === selectedSubjectId)?.name || "Subject";
            const filename = `Student_Results_${currentClassName}_${currentSubjectName}.xlsx`;
            FileSaver.saveAs(dataBlob, filename);
            toast.success("Subject results exported to Excel successfully.");
        } catch (error) {
            console.error("Excel export failed:", error);
            toast.error(`Failed to export data to Excel: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    // --- Excel Export Handler (Overall Ranking) ---
    const handleExportOverallToExcel = async () => {
        if (!overallResults.length || !selectedClassId || !XLSX || !FileSaver) {
            toast.info("No overall ranking data or required libraries to export.");
            return;
        }
        try {
            const headers = overallColumns.map(col => col.headerName);
            const worksheetData = [
                headers,
                ...overallResults.map(row => {
                    return overallColumns.map(col => {
                        if (row.subjectTotals.hasOwnProperty(col.field)) {
                            return row.subjectTotals[col.field] ?? 0;
                        }
                        return (row as OverallStudentRow)[col.field] ?? '';
                    });
                })
            ];
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Overall Ranking");
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

            const currentClassName = classes.find(c => c.id === selectedClassId)?.name || "Class";
            const filename = `${currentClassName}_Overall_Ranking.xlsx`;
            FileSaver.saveAs(dataBlob, filename);
            toast.success("Overall ranking exported to Excel successfully.");
        } catch (error) {
            console.error("Overall ranking Excel export failed:", error);
            toast.error(`Failed to export overall ranking data to Excel: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    // --- Print Handler for Overall Results ---
    const handlePrintOverallResults = () => {
        if (overallRankingRef.current) {
            const printContent = overallRankingRef.current.innerHTML;
            const originalContent = document.body.innerHTML;
            const originalTitle = document.title;

            document.body.innerHTML = printContent;
            document.title = `Overall Class Ranking - ${className}`;

            const printStyles = `
                <style>
                    @media print {
                        body > *:not(#overall-ranking-content) { display: none !important; }
                        #overall-ranking-content {
                            display: block !important; width: 100%; margin: 0 auto; padding: 10mm;
                            box-sizing: border-box; font-family: sans-serif; color: #000;
                        }
                        .MuiCard-root, .MuiCardContent-root { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
                        h1, h6, p, strong { color: #000 !important; margin-bottom: 0.5em; }
                        h6 { font-size: 1.2em; margin-top: 1em; }
                        p { font-size: 0.9em; }
                        .MuiDataGrid-root { border: 1px solid #ccc !important; }
                        .MuiDataGrid-columnHeaders, .MuiDataGrid-row { border-bottom: 1px solid #eee !important; }
                        .MuiDataGrid-cell, .MuiDataGrid-columnHeaderTitleContainer { padding: 8px !important; }
                        .MuiDataGrid-footerContainer { display: none !important; }
                        .print-hide { display: none !important; }
                        .print-only { display: block !important; }
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
            toast.error("Overall ranking content not available for printing.");
        }
    };

    const handleViewAllReportCardsForPrinting = React.useCallback(async () => {
        if (!selectedClassId || !userId) {
            toast.error("Please select a class and ensure authentication is ready.");
            return;
        }

        const currentClass = classes.find(c => c.id === selectedClassId);
        const studentsInClass = students.filter(s => s.classId === selectedClassId);

        if (!currentClass || studentsInClass.length === 0) {
            toast.info("No students found in the selected class to generate reports.");
            return;
        }

        const subjectsForClass = subjects.filter(s => s.classId === selectedClassId);
        const allReports: StudentReportCardData[] = [];

        for (const student of studentsInClass) {
            const aggregatedSubjectResults: StudentReportCardData['subjectResults'] = [];

            for (const subject of subjectsForClass) {
                const scoreData = studentScores.find(score =>
                    score.studentId === student.id && score.subjectId === subject.id && score.classId === selectedClassId
                );

                if (scoreData) {
                    const classWorkTotal = (scoreData.cat1 ?? 0) + (scoreData.cat2 ?? 0) + (scoreData.projectWork ?? 0);
                    aggregatedSubjectResults.push({
                        subjectId: subject.id,
                        subjectName: subject.name,
                        subjectTeacher: subject.subjectTeacher,
                        cat1: scoreData.cat1,
                        cat2: scoreData.cat2,
                        projectWork: scoreData.projectWork,
                        exams: scoreData.exams,
                        total: scoreData.total,
                        position: scoreData.position,
                        grade: scoreData.grade,
                        remarks: scoreData.remarks,
                        classWorkTotal: classWorkTotal,
                    });
                } else {
                    // Include subject even if no scores exist for it
                    aggregatedSubjectResults.push({
                        subjectId: subject.id,
                        subjectName: subject.name,
                        subjectTeacher: subject.subjectTeacher,
                        cat1: null, cat2: null, projectWork: null, exams: null, total: null,
                        position: null, grade: null, remarks: null, classWorkTotal: null,
                    });
                }
            }

            const studentOverallData = overallResults.find(result => result.id === student.id);

            const anySubjectInClass = subjectsForClass.length > 0 ? subjectsForClass[0] : null;
            const term = anySubjectInClass?.term || "N/A";
            const year = anySubjectInClass?.year || "N/A";

            allReports.push({
                studentId: student.id,
                studentName: student.name,
                className: currentClass.name,
                term: term,
                year: year,
                imageUrl: student.imageUrl || null,
                overallRemarks: student.overallRemarks || null,
                subjectResults: aggregatedSubjectResults,
                studentOverallPercentage: studentOverallData?.overallAverage,
                overallPosition: studentOverallData?.overallRank,
                attendance: student.attendance || null,
                positionInClass: student.positionInClass || null,
                house: student.house || null,
                formMistressReport: "",
                conduct: "",
                interest: "",
                housemistressReport: "",
                headmasterReport: "",
                studentOverallGrade: "",
            });
        }

        if (allReports.length > 0) {
            setAllStudentsReports(allReports);
            setOpenAllReportsDialog(true);
        } else {
            toast.info("No complete report card data found for any student in this class.");
        }
    }, [selectedClassId, classes, students, subjects, studentScores, overallResults, userId]);

    const handleCopyData = () => {
        if (rows.length === 0) {
            toast.info("No student data to copy.");
            return;
        }
        if (typeof window === 'undefined') {
            toast.error("Copy to clipboard is not supported in this environment.");
            return;
        }

        try {
            const headers = ["Student Name", "Class Score (50)", "Exams (100)"];
            const dataRows = rows.map(row => [
                row.name,
                row.classWorkTotal || 0,
                row.exams || 0,
            ].join('\t'));
            const textToCopy = [headers.join('\t'), ...dataRows].join('\n');

            const tempTextArea = document.createElement('textarea');
            tempTextArea.value = textToCopy;
            document.body.appendChild(tempTextArea);
            tempTextArea.select();
            document.execCommand('copy');
            document.body.removeChild(tempTextArea);

            toast.success("Student data copied to clipboard!");
        } catch (error) {
            console.error("Failed to copy data:", error);
            toast.error("Failed to copy data to clipboard.");
        }
    };


    // --- Derived Data for Rendering ---
    const availableSubjects = React.useMemo(() => {
        return subjects.filter(s => s.classId === selectedClassId);
    }, [subjects, selectedClassId]);

    const [openUploadExcelDialog, setOpenUploadExcelDialog] = React.useState(false);
    const [excelFile, setExcelFile] = React.useState<File | null>(null);

    // --- Place all hooks before any early returns ---
    const [schoolLogo, setSchoolLogo] = React.useState<string | null>(null);

    // Show loading indicator
    if (!isAuthReady || isLoadingInitialData) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-lg text-gray-700">Loading application data...</p>
            </div>
        );
    }

// Add these handler functions
const handleOpenUploadExcelDialog = () => {
    if (!selectedClassId) {
        toast.error("Please select a class first before uploading data.");
        return;
    }
    setExcelFile(null);
    setOpenUploadExcelDialog(true);
};

const handleCloseUploadExcelDialog = () => {
    setOpenUploadExcelDialog(false);
    setExcelFile(null);
};

const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
        setExcelFile(files[0]);
    }
};

const handleUploadExcel = async () => {
    if (!excelFile || !selectedClassId || !selectedSubjectId || !userId || !XLSX) {
        toast.error("Please select a file and ensure class/subject is selected.");
        return;
    }

    try {
        const data = await excelFile.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (jsonData.length === 0) {
            toast.error("No data found in the Excel file.");
            return;
        }

        // Validate required columns
        const requiredColumns = ['Name of Students', 'CAT 1 (10)', 'CAT 2 (20)', 'Project Work (20)', 'Exams (100)'];
        const firstRow = jsonData[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));
        
        if (missingColumns.length > 0) {
            toast.error(`Missing required columns: ${missingColumns.join(', ')}`);
            return;
        }

        // Process each row
        const updates: MyStudentScore[] = [];
        const newStudents: MyStudent[] = [];
        const newScores: MyStudentScore[] = [];

        for (const row of jsonData) {
            const studentName = row['Name of Students'];
            if (!studentName) continue;

            // Find or create student
            let student = students.find(s => 
                s.name.toLowerCase() === studentName.toLowerCase() && 
                s.classId === selectedClassId
            );

            if (!student) {
                // Create new student
                const { data: newStudentData, error: studentError } = await supabase
                    .from('user_students')
                    .insert({
                        name: studentName,
                        classId: selectedClassId,
                        userId: userId,
                    })
                    .select();
                
                if (studentError) throw studentError;
                student = newStudentData[0] as MyStudent;
                newStudents.push(student);
            }

            // Prepare score data
            const cat1 = Number(row['CAT 1 (10)']) || 0;
            const cat2 = Number(row['CAT 2 (20)']) || 0;
            const projectWork = Number(row['Project Work (20)']) || 0;
            const exams = Number(row['Exams (100)']) || 0;
            const total = cat1 + cat2 + projectWork + (exams / 2);
            const classWorkTotal = cat1 + cat2 + projectWork;

            const scoreEntry: MyStudentScore = {
                id: crypto.randomUUID(),
                studentId: student.id,
                subjectId: selectedSubjectId,
                classId: selectedClassId,
                userId: userId,
                cat1: cat1,
                cat2: cat2,
                projectWork: projectWork,
                exams: exams,
                total: parseFloat(total.toFixed(2)),
                classWorkTotal: parseFloat(classWorkTotal.toFixed(2)),
                position: null, // Will be calculated when saved
                remarks: null,
                grade: null,
            };

            // Check if score already exists
            const existingScore = studentScores.find(s => 
                s.studentId === student.id && 
                s.subjectId === selectedSubjectId
            );

            if (existingScore) {
                updates.push({ ...scoreEntry, id: existingScore.id });
            } else {
                newScores.push(scoreEntry);
            }
        }

        // Batch insert new scores
        if (newScores.length > 0) {
            const { error: insertError } = await supabase
                .from('user_student_scores')
                .insert(newScores);
            if (insertError) throw insertError;
        }

        // Batch update existing scores
        for (const update of updates) {
            const { error } = await supabase
                .from('user_student_scores')
                .update(update)
                .eq('id', update.id);
            if (error) console.warn(`Failed to update score: ${error.message}`);
        }

        toast.success(`Successfully imported ${jsonData.length} student records`);
        handleCloseUploadExcelDialog();
    } catch (error) {
        console.error("Error importing Excel data:", error);
        toast.error(`Failed to import data: ${error instanceof Error ? error.message : String(error)}`);
// (moved above, so remove this duplicate declaration if present here)

const handleSchoolLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) {
        toast.error("No file selected or user not authenticated.");
        return;
    }

    const filePath = `${userId}/school_logo/${Date.now()}_${file.name}`;

    try {
        const { error } = await supabase.storage
            .from('school_images')
            .upload(filePath, file, { cacheControl: '3600', upsert: true });

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
            .from('school_images')
            .getPublicUrl(filePath);

        if (!publicUrlData || !publicUrlData.publicUrl) {
            throw new Error("Failed to get public URL for the uploaded logo.");
        }

        setSchoolLogo(publicUrlData.publicUrl);
        toast.success("School logo uploaded successfully!");
    } catch (error: Error | unknown) {
        console.error("Error uploading school logo:", error instanceof Error ? error.message : String(error));
        toast.error(`Failed to upload logo: ${error instanceof Error ? error.message : String(error)}`);
    }
};
        toast.error(`Failed to upload logo: ${error instanceof Error ? error.message : String(error)}`);
    }
};


    const handleSchoolLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !userId) {
            toast.error("No file selected or user not authenticated.");
            return;
        }

        const filePath = `${userId}/school_logo/${Date.now()}_${file.name}`;

        try {
            const { error } = await supabase.storage
                .from('school_images')
                .upload(filePath, file, { cacheControl: '3600', upsert: true });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from('school_images')
                .getPublicUrl(filePath);

            if (!publicUrlData || !publicUrlData.publicUrl) {
                throw new Error("Failed to get public URL for the uploaded logo.");
            }

            setSchoolLogo(publicUrlData.publicUrl);
            toast.success("School logo uploaded successfully!");
        } catch (error: Error | unknown) {
            console.error("Error uploading school logo:", error instanceof Error ? error.message : String(error));
            toast.error(`Failed to upload logo: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    // --- JSX Rendering ---
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 items-center gap-2 border-b bg-white px-4 sticky top-0 z-30">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="#">Dashboard</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem><BreadcrumbPage>Student Results</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <div className="flex flex-col flex-1 bg-gray-100 p-4 space-y-4">
                    <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded shadow">
                        <FormControl sx={{ minWidth: 200 }}>
                            <InputLabel id="class-select-label">Select Class</InputLabel>
                            <Select
                                labelId="class-select-label"
                                id="class-select"
                                value={selectedClassId || ""}
                                onChange={handleClassSelection}
                                label="Select Class"
                            >
                                {classes.map((c) => (
                                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button onClick={handleCreateClass} variant="contained" color="primary">
                            Create Class
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleDeleteClass}
                            disabled={!selectedClassId}
                            startIcon={<DeleteIcon />}
                        >
                            Delete Class
                        </Button>

                        {selectedClassId && (
                            <>
                                <FormControl sx={{ minWidth: 200 }} disabled={!selectedClassId}>
                                    <InputLabel id="subject-select-label">Select Subject</InputLabel>
                                    <Select
                                        labelId="subject-select-label"
                                        id="subject-select"
                                        value={selectedSubjectId || ""}
                                        onChange={handleSubjectSelection}
                                        label="Select Subject"
                                    >
                                        {availableSubjects.map((s) => (
                                            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Button
                                    onClick={handleAddSubject}
                                    variant="contained"
                                    color="secondary"
                                    disabled={!selectedClassId}
                                >
                                    Add Subject
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={handleDeleteSubject}
                                    disabled={!selectedSubjectId}
                                    startIcon={<DeleteIcon />}
                                >
                                    Delete Subject
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => setShowOverallResults(!showOverallResults)}
                                    disabled={!selectedClassId}
                                >
                                    {showOverallResults ? 'View Subject Results' : 'View Overall Class Ranking'}
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleViewAllReportCardsForPrinting}
                                    disabled={!selectedClassId || students.filter(s => s.classId === selectedClassId).length === 0}
                                >
                                    View All Report Cards for Printing
                                </Button>
                            </>
                        )}
                    </div>

                    {selectedClassId && selectedSubjectId && !showOverallResults && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-white rounded shadow relative">
                                <Button
                                    onClick={handleEditSubjectDetails}
                                    className="absolute top-2 right-2 z-40 print-hide"
                                    variant="contained"
                                    size="small"
                                    startIcon={<EditIcon />}
                                    sx={{ backgroundColor: 'rgb(30 58 138)', '&:hover': { backgroundColor: 'rgb(30 64 175)' } }}
                                >
                                    Edit Details
                                </Button>
                                <div className="text-sm">Class: <strong className="font-semibold">{className}</strong></div>
                                <div className="text-sm">Subject: <strong className="font-semibold">{subjectName}</strong></div>
                                <div className="text-sm">Term: <strong className="font-semibold">{term}</strong></div>
                                <div className="text-sm">Year: <strong className="font-semibold">{year}</strong></div>
                                <div className="text-sm">Subject Teacher: <strong className="font-semibold">{subjectTeacher}</strong></div>
                                <div className="text-sm">Class Average: <strong className="font-semibold">{overallClassAverage}%</strong></div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between mb-4 gap-2 print-hide">
                                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddStudent}>
                                    Add Student
                                </Button>
                                <Button variant="outlined" onClick={handleOpenPasteNamesDialog}>
                                    Paste Names
                                </Button>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant="contained" color="error" startIcon={<DeleteIcon />}
                                        onClick={handleDeleteSelected} disabled={rows.length === 0} // Disabled if no rows to delete
                                    >
                                        Delete All Visible
                                    </Button>
                                    <Button
                                        variant="outlined" color="warning" startIcon={<ClearIcon />}
                                        onClick={handleClearResults} disabled={rows.length === 0}
                                    >
                                        Clear Results
                                    </Button>
                                    <Button
                                        variant="contained" color="success" startIcon={<SaveIcon />}
                                        onClick={handleSaveAll} disabled={rows.length === 0}
                                    >
                                        Save Results
                                    </Button>
                                    <Button
                                        variant="contained" color="secondary" onClick={exportToExcel}
                                        disabled={rows.length === 0}
                                        startIcon={<DownloadIcon />}
                                    >
                                        Export to Excel
                                    </Button>
                                               <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={handleOpenUploadExcelDialog}
                                                startIcon={<CloudUploadIcon />}
                                                disabled={!selectedClassId || !selectedSubjectId}
                                            >
                                                Import from Excel
                                        </Button>
                                    <Button
                                        variant="outlined"
                                        color="info"
                                        onClick={handleCopyData}
                                        disabled={rows.length === 0}
                                        startIcon={<ContentCopyIcon />}
                                    >
                                        Copy Data
                                    </Button>
                                </div>
                            </div>

                            {rows.length > 0 ? (
                                <div style={{ height: 600, width: '100%' }}>
                                    <DataGrid
                                        rows={rows}
                                        columns={columns}
                                        getRowId={(row) => row.id}
                                        processRowUpdate={processRowUpdate}
                                        onRowEditStop={handleRowEditStop}
                                        disableRowSelectionOnClick
                                    />
                                </div>
                            ) : (
                                <Typography variant="body1" color="text.secondary" className="text-center p-4 bg-white rounded shadow">
                                    No student data for this subject. Add students to get started.
                                </Typography>
                            )}
                        </>
                    )}

                    {selectedClassId && showOverallResults && (
                        <Card className="p-4 mt-4" ref={overallRankingRef} id="overall-ranking-content">
                            <CardContent>
                                <div className="flex justify-between items-center mb-4 print-hide">
                                    <Typography variant="h6">
                                        Overall Class Ranking for {className}
                                    </Typography>
                                     <div className="flex flex-wrap gap-2">
                                         <Button
                                             variant="outlined"
                                             startIcon={<PrintIcon />}
                                             onClick={handlePrintOverallResults}
                                             disabled={overallResults.length === 0}
                                         >
                                             Print Ranking
                                         </Button>
                                         <Button
                                             variant="contained" color="secondary" onClick={handleExportOverallToExcel}
                                             disabled={overallResults.length === 0}
                                             startIcon={<DownloadIcon />}
                                         >
                                             Export to Excel
                                         </Button>
                                     </div>
                                </div>
                                <Typography variant="h6" className="print-only text-center mb-4">
                                     Overall Class Ranking for {className}
                                </Typography>

                                {overallResults.length > 0 ? (
                                    <div style={{ height: 600, width: '100%' }}>
                                        <DataGrid
                                            rows={overallResults}
                                            columns={overallColumns}
                                            getRowId={(row) => row.id}
                                            disableRowSelectionOnClick
                                            hideFooter
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

                    {selectedClassId && !selectedSubjectId && !showOverallResults && (
                        <div className="text-center p-6 bg-white rounded shadow text-gray-600">
                            Please select or add a subject for the class &quot;{className}&quot; to view or manage student results.
                            You can also view the <Button variant="text" onClick={() => setShowOverallResults(true)}>Overall Class Ranking</Button> if subjects and results are available.
                        </div>
                    )}

                    {!selectedClassId && (
                        <div className="text-center p-6 bg-white rounded shadow text-gray-600">
                            Please select or create a class to begin.
                        </div>
                    )}

                </div>

                {/* Add Student Dialog */}
                <Dialog open={openAddStudentDialog} onClose={handleCloseAddStudentDialog} maxWidth="xs" fullWidth>
                    <DialogTitle>Add New Student to {className}</DialogTitle>
                    <DialogContent>
                        <TextField autoFocus margin="dense" id="new-student-name" label="Student Name" type="text" fullWidth variant="outlined"
                            value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseAddStudentDialog}>Cancel</Button>
                        <Button onClick={handleSaveNewStudent} variant="contained">Add Student</Button>
                    </DialogActions>
                </Dialog>

                {/* Paste Names Dialog */}
                <Dialog open={openPasteNamesDialog} onClose={handleClosePasteNamesDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>Paste Student Names for {className}</DialogTitle>
                    <DialogContent>
                        <TextareaAutosize minRows={10} placeholder="Paste student names here, one name per line..."
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }}
                            value={pastedNames} onChange={(e) => setPastedNames(e.target.value)} />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClosePasteNamesDialog}>Cancel</Button>
                        <Button onClick={handleAddPastedNames} variant="contained">Add Names to Class</Button>
                    </DialogActions>
                </Dialog>

                {/* Edit Subject Details Dialog */}
                <Dialog open={openEditSubjectDialog} onClose={handleCloseEditSubjectDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>Edit Subject Details for {subjectName}</DialogTitle>
                    <DialogContent>
                        <TextField autoFocus margin="dense" id="edit-subjectName" label="Subject Name" type="text" fullWidth variant="outlined"
                            value={subjectEditData.name} onChange={(e) => setSubjectEditData({ ...subjectEditData, name: e.target.value })} />
                        <TextField margin="dense" id="edit-subjectTeacher" label="Subject Teacher" type="text" fullWidth variant="outlined"
                            value={subjectEditData.subjectTeacher} onChange={(e) => setSubjectEditData({ ...subjectEditData, subjectTeacher: e.target.value })} />
                        <TextField margin="dense" id="edit-term" label="Term" type="text" fullWidth variant="outlined"
                            value={subjectEditData.term} onChange={(e) => setSubjectEditData({ ...subjectEditData, term: e.target.value })} />
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
                    <DialogTitle>Add New Subject to &quot;{className}&quot;</DialogTitle>
                    <DialogContent>
                        <TextField autoFocus margin="dense" id="add-newSubjectName" label="Subject Name" type="text" fullWidth variant="outlined"
                            value={newSubjectData.name} onChange={(e) => setNewSubjectData({ ...newSubjectData, name: e.target.value })} />
                        <TextField margin="dense" id="add-newSubjectTeacher" label="Subject Teacher" type="text" fullWidth variant="outlined"
                            value={newSubjectData.subjectTeacher} onChange={(e) => setNewSubjectData({ ...newSubjectData, subjectTeacher: e.target.value })} />
                        <TextField margin="dense" id="add-newTerm" label="Term" type="text" fullWidth variant="outlined"
                            value={newSubjectData.term} onChange={(e) => setNewSubjectData({ ...newSubjectData, term: e.target.value })} />
                        <TextField margin="dense" id="add-newYear" label="Year" type="text" fullWidth variant="outlined"
                            value={newSubjectData.year} onChange={(e) => setNewSubjectData({ ...newSubjectData, year: e.target.value })} />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseAddSubjectDialog}>Cancel</Button>
                        <Button onClick={handleSaveNewSubject} variant="contained">Add Subject</Button>
                    </DialogActions>
                </Dialog>

                {/* Report Card Dialog (Single Student) */}
                <Dialog open={openReportCardDialog} onClose={handleCloseReportCardDialog} maxWidth="md" fullWidth>
                    <DialogTitle>Report Card for {currentStudentReport?.studentName}</DialogTitle>
                    <DialogContent dividers sx={{ p: 0 }}>
                        <div id="report-card-content" ref={reportCardRef} className="p-6">
                            {currentStudentReport && (
                                <Card variant="outlined" className="p-2">
                                    <CardContent>
                                        <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                                            <div className="flex-shrink-0">
                                                {reportCardImage ? (
                                                    <CardMedia
                                                        component="img"
                                                        sx={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '2px solid #3b82f6' }}
                                                        image={reportCardImage}
                                                        alt={`${currentStudentReport.studentName}'s photo`}
                                                    />
                                                ) : (
                                                    <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 border-2 border-gray-300">
                                                        No Image
                                                    </div>
                                                )}
                                           
                                            </div>

                                            <div className="flex-grow space-y-1">
                                                <Typography variant="h6" gutterBottom={false}>
                                                    {currentStudentReport.studentName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Class: <strong className="text-gray-800">{currentStudentReport.className}</strong>
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Term: <strong className="text-gray-800">{currentStudentReport.term}</strong>
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Year: <strong className="text-gray-800">{currentStudentReport.year}</strong>
                                                </Typography>
                                                <TextField
                                                    margin="dense"
                                                    label="Attendance"
                                                    type="text"
                                                    fullWidth
                                                    variant="outlined"
                                                    value={reportCardAttendance}
                                                    onChange={handleReportCardAttendanceChange}
                                                    className="print-hide"
                                                />
                                                <TextField
                                                    margin="dense"
                                                    label="House"
                                                    type="text"
                                                    fullWidth
                                                    variant="outlined"
                                                    value={reportCardHouse}
                                                    onChange={handleReportCardHouseChange}
                                                    className="print-hide"
                                                />
                                                <TextField
                                                    margin="dense"
                                                    label="Position in Class"
                                                    type="text"
                                                    fullWidth
                                                    variant="outlined"
                                                    value={reportCardPositionInClass}
                                                    onChange={handleReportCardPositionInClassChange}
                                                    className="print-hide"
                                                />
                                            </div>
                                        </div>

                                        <Separator className="my-4" />

                                        <Typography variant="h6" gutterBottom>
                                            Subject Results
                                        </Typography>
                                        {currentStudentReport.subjectResults.length > 0 ? (
                                                <div className="space-y-4">
                                                    {currentStudentReport.subjectResults.map(subjectResult => (
                                                        <Card key={subjectResult.subjectId} variant="outlined" className="p-3">
                                                            <CardContent className="p-0">
                                                                <Typography variant="subtitle1" gutterBottom>
                                                                    {subjectResult.subjectName} - <span className="text-sm text-gray-600">Teacher: {subjectResult.subjectTeacher}</span>
                                                                </Typography>
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                                    <Typography variant="body2">CAT 1 (10): <strong>{subjectResult.cat1 ?? 0}</strong></Typography>
                                                                    <Typography variant="body2">CAT 2 (20): <strong>{subjectResult.cat2 ?? 0}</strong></Typography>
                                                                    <Typography variant="body2">Project (20): <strong>{subjectResult.projectWork ?? 0}</strong></Typography>
                                                                    <Typography variant="body2">Class Score (50): <strong>{subjectResult.classWorkTotal ?? 0}</strong></Typography>
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

                                        <Separator className="my-4" />

                                        <Typography variant="h6" gutterBottom>
                                            Overall Remarks
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={4}
                                            variant="outlined"
                                            label="Overall Remarks"
                                            value={reportCardOverallRemarks ?? ''}
                                            onChange={handleReportCardOverallRemarksChange}
                                            className="print-hide"
                                        />
                                        <Typography variant="body1" className="print-only p-2 border rounded bg-gray-50">
                                            <strong>Overall Remarks:</strong> {reportCardOverallRemarks ?? 'N/A'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </DialogContent>
                    <DialogActions className="print-hide">
                        <Button onClick={handleCloseReportCardDialog}>Close</Button>
                        <Button onClick={handlePrintReportCard} variant="outlined" startIcon={<PrintIcon />}>Print</Button>
                        <Button onClick={handleSaveReportCard} variant="contained" color="primary">Save Report Card</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={openUploadExcelDialog} onClose={handleCloseUploadExcelDialog} maxWidth="sm" fullWidth>
                        <DialogTitle>Import Student Results from Excel</DialogTitle>
                        <DialogContent>
                            <Typography variant="body1" paragraph>
                                Upload an Excel file with student results. The file should include these columns:
                            </Typography>
                            <Typography variant="body2" component="div" sx={{ mb: 2 }}>
                                <ul>
                                    <li>Name of Students</li>
                                    <li>CAT 1 (10)</li>
                                    <li>CAT 2 (20)</li>
                                    <li>Project Work (20)</li>
                                    <li>Exams (100)</li>
                                </ul>
                            </Typography>
                            <Button
                                variant="contained"
                                component="label"
                                fullWidth
                                startIcon={<CloudUploadIcon />}
                            >
                                Select Excel File
                                <input 
                                    type="file" 
                                    hidden 
                                    accept=".xlsx,.xls" 
                                    onChange={handleFileChange}
                                />
                            </Button>
                            {excelFile && (
                                <Typography variant="body2" sx={{ mt: 2 }}>
                                    Selected file: {excelFile.name}
                                </Typography>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseUploadExcelDialog}>Cancel</Button>
                            <Button 
                                onClick={handleUploadExcel} 
                                variant="contained"
                                disabled={!excelFile}
                            >
                                Import Data
                            </Button>
                        </DialogActions>
                    </Dialog>

                {openAllReportsDialog && (
                    <AllReportCardsPrintView
                        reports={allStudentsReports}
                        onClose={() => setOpenAllReportsDialog(false)}
                    />
                )}
            </SidebarInset>
        </SidebarProvider>
    );
}
