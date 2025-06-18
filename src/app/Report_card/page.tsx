/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-object-type */
// This file contains two components:
// 1. ReportCard: The presentational component displaying the report card structure, now templated from the provided image.
// 2. ReportCardManagerPage: The container component handling data loading, manual saving (to localStorage),
//    and printing, and PDF export, which renders the ReportCard, now with toast notifications.

'use client'; // Needed if this component is used within the app directory in Next.js

import React, { useState, useEffect, useCallback, useRef } from 'react'; // Import useRef
import Image from 'next/image'; // Use Next.js optimized Image component
import { usePDF } from 'react-to-pdf'; // Import usePDF hook
import { ToastContainer, toast } from 'react-toastify'; // Import ToastContainer and toast
import 'react-toastify/dist/ReactToastify.css'; // Import toastify CSS

// Import UI components for sidebar and breadcrumbs
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/app-sidebar"; // Assuming this component exists

// ============================================================================
// Default Data Structures
// Defines the initial structure and placeholder values for the report card sections,
// updated to reflect the fields seen in the image.
// ============================================================================

// Default data structure for school info (used if no initial data is provided or loaded)
const defaultSchoolInfo = {
    name: "", // Left blank
    address: "", // Left blank
    cityPostal: "", // Left blank
    phone: "", // Left blank
    email: "", // Left blank
    website: "", // Left blank
    logoUrl: "https://placehold.co/100x100/EFEFEF/AEAEAE?text=School+Logo", // Initial Placeholder URL
};

// Default data for other display-only sections (Student, Academic, Summary, etc.)
// Updated to reflect fields seen in the image.
const defaultStudentInfo = {
    name: "", // Left blank
    id: "", // Left blank
    gradeLevel: "", // Left blank
    dateOfBirth: "", // Left blank
    homeroom: "", // Left blank
    attendance: "", // Left blank
    nextTermBegins: "", // Left blank
    house: "", // Left blank
    positionInClass: "", // Left blank
    imageUrl: "https://placehold.co/100x100/EFEFEF/AEAEAE?text=Student+Image", // Placeholder URL
};

interface AcademicPerformance {
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
}

const defaultAcademicPerformance: AcademicPerformance[] = [
    // Left as an empty array to start blank
];

const defaultOverallSummary = {
    academicYear: "", // Left blank
    termSemester: "", // Left blank
    dateIssued: "", // Left blank
    overallPercentage: "", // Left blank
    overallGrade: "", // Left blank
    overallPosition: "", // Left blank
    attendance: "", // Left blank
    conduct: "", // Left blank
};

const defaultCommentsRecommendations = {
    formMistressMasterReport: "", // Left blank
    formTeacherName: "", // New editable field for form teacher name
    conduct: "", // Left blank
    interest: "", // Left blank
    housemistressMasterReport: "", // Left blank
    houseTeacherName: "", // New editable field for house teacher name
    headmasterReport: "", // Left blank
    headmasterName: "", // New editable field for headmaster name
    parentGuardianNotes: "", // New editable field for parent/guardian notes
    teacherComments: "", // Left blank
    principalComments: "", // Left blank
};

interface GradingScaleEntry {
    range: string;
    grade: string;
    remarks: string;
}

interface GradingScale {
    grades: GradingScaleEntry[];
    percentageRanges: string;
    effortScale: string;
    otherSymbols: string;
}

const defaultGradingScale: GradingScale = {
    grades: [],
    percentageRanges: "",
    effortScale: "",
    otherSymbols: "",
};

// Predefined remarks for the dropdown
const PREDEFINED_REMARKS = [
    "Excellent effort",
    "Good progress",
    "Needs more practice",
    "Active participation",
    "Struggling with concepts",
    "Improved significantly",
    "Consistent performance",
    "Shows great potential",
    "Requires parental support",
    "Completes assignments diligently",
    "Distracted in class",
    "Strong understanding",
    "Developing well",
    "Requires attention to detail",
    "Works well with peers"
];

// ============================================================================
// MultiSelectDropdown Component
// A custom multi-select dropdown component that looks like a button.
// ============================================================================
interface MultiSelectDropdownProps {
    options: string[];
    selectedValues: string[];
    onChange: (selectedValues: string[]) => void;
    placeholder: string;
    isPrintView?: boolean;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ options, selectedValues, onChange, placeholder, isPrintView }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        interface ClickOutsideEvent extends MouseEvent {}

        const handleClickOutside = (event: ClickOutsideEvent): void => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleToggle = () => {
        if (!isPrintView) { // Only allow toggle if not in print view
            setIsOpen(prev => !prev);
        }
    };

    const handleCheckboxChange = (value: string) => {
        if (!isPrintView) { // Only allow change if not in print view
            const newSelectedValues = selectedValues.includes(value)
                ? selectedValues.filter(item => item !== value)
                : [...selectedValues, value];
            onChange(newSelectedValues);
        }
    };

    const displayValue = selectedValues.length > 0
        ? selectedValues.join(', ')
        : placeholder;

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {/* Button for view mode, span for print mode */}
            {!isPrintView ? (
                <button
                    type="button"
                    onClick={handleToggle}
                    className="w-full text-left p-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 print:hidden"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                >
                    {displayValue}
                    {/* Add a dropdown arrow icon */}
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </span>
                </button>
            ) : (
                // Content for print only
                <span className="block w-full border-b border-gray-200 p-0.5 text-[7pt]">
                    {displayValue}
                </span>
            )}

            {isOpen && !isPrintView && ( // Only show dropdown if not in print view
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                    <ul role="listbox" className="py-1">
                        {options.map((option) => (
                            <li
                                key={option}
                                className="px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center"
                                onClick={() => handleCheckboxChange(option)}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedValues.includes(option)}
                                    onChange={() => handleCheckboxChange(option)} // handle change on checkbox directly
                                    className="mr-2"
                                />
                                {option}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


// ============================================================================
// 1. ReportCard Component (Presentational)
//    Displays the report card structure based on the template image.
//    It receives data as props and uses internal state for editable fields
//    to manage input values temporarily. It calls parent-provided callbacks
//    when editable fields change.
//    It DOES NOT handle saving, loading, or printing/PDF generation directly.
// ============================================================================

interface ReportCardProps {
    initialSchoolInfo?: typeof defaultSchoolInfo;
    studentInfo?: typeof defaultStudentInfo;
    academicPerformance?: AcademicPerformance[];
    overallSummary?: typeof defaultOverallSummary;
    commentsRecommendations?: typeof defaultCommentsRecommendations;
    gradingScale?: typeof defaultGradingScale;
    onSchoolNameChange: (value: string) => void;
    onSchoolAddressChange: (value: string) => void;
    onSchoolCityPostalChange: (value: string) => void;
    onSchoolPhoneChange: (value: string) => void;
    onSchoolEmailChange: (value: string) => void;
    onSchoolWebsiteChange: (value: string) => void;
    onSchoolLogoChange: (file: File | null) => void;
    onAcademicPerformanceChange: (index: number, field: keyof AcademicPerformance, value: string | string[]) => void;
    onRemoveSubject: (index: number) => void;
    onStudentInfoChange: (field: string, value: string) => void;
    onOverallSummaryChange: (field: string, value: string) => void;
    onCommentsRecommendationsChange: (field: keyof typeof defaultCommentsRecommendations, value: string) => void;
    onGradingScaleChange: (index: number, field: keyof GradingScaleEntry, value: string) => void;
    onRemoveGradingScaleEntry: (index: number) => void;
    isPrintView?: boolean;
}

const ReportCard: React.FC<ReportCardProps> = ({
    initialSchoolInfo = defaultSchoolInfo, // Use default if no initial data is passed
    studentInfo = defaultStudentInfo, // Use default if no student data is passed
    academicPerformance = defaultAcademicPerformance, // Use default if no academic data is passed
    overallSummary = defaultOverallSummary, // Use default if no overall summary is passed
    commentsRecommendations = defaultCommentsRecommendations, // Use default if no comments are passed
    gradingScale = defaultGradingScale, // Use default if no grading scale is passed
    // Callbacks to pass updated data back up to parent when editable fields change
    onSchoolNameChange,
    onSchoolAddressChange,
    onSchoolCityPostalChange,
    onSchoolPhoneChange,
    onSchoolEmailChange,
    onSchoolWebsiteChange,
    onSchoolLogoChange,
    // Props for academic performance editing
    onAcademicPerformanceChange, // Function to update a specific field of a subject
    onRemoveSubject, // Function to remove a subject
    // Single prop for student info editing (handles all student fields)
    onStudentInfoChange,
    // Single prop for overall summary editing
    onOverallSummaryChange,
    // Single prop for comments and recommendations editing
    onCommentsRecommendationsChange,
    // Props for grading scale editing
    onGradingScaleChange,
    onRemoveGradingScaleEntry,
    isPrintView = false, // New prop to control view/print mode
}) => {

    // State for editable school information (managed temporarily within this component
    // to update input values as user types/selects). Parent state is the source of truth.
    const [schoolName, setSchoolName] = useState(initialSchoolInfo.name);
    const [schoolAddress, setSchoolAddress] = useState(initialSchoolInfo.address);
    const [schoolCityPostal, setSchoolCityPostal] = useState(initialSchoolInfo.cityPostal);
    const [schoolPhone, setSchoolPhone] = useState(initialSchoolInfo.phone);
    const [schoolEmail, setSchoolEmail] = useState(initialSchoolInfo.email);
    const [schoolWebsite, setSchoolWebsite] = useState(initialSchoolInfo.website);
    const [schoolLogoUrl, setSchoolLogoUrl] = useState(initialSchoolInfo.logoUrl);

    // State for editable student information (internal state for inputs, parent state is source of truth)
    const [studentName, setStudentName] = useState(studentInfo.name);
    const [studentGradeLevel, setStudentGradeLevel] = useState(studentInfo.gradeLevel);
    const [studentAttendance, setStudentAttendance] = useState(studentInfo.attendance);
    const [studentNextTermBegins, setStudentNextTermBegins] = useState(studentInfo.nextTermBegins);
    const [studentHouse, setStudentHouse] = useState(studentInfo.house);
    const [studentPositionInClass, setStudentPositionInClass] = useState(studentInfo.positionInClass);

    // State for editable overall summary (internal state for inputs, parent state is source of truth)
    const [summaryAcademicYear, setSummaryAcademicYear] = useState(overallSummary.academicYear);
    const [summaryTermSemester, setSummaryTermSemester] = useState(overallSummary.termSemester);
    const [summaryOverallPercentage, setSummaryOverallPercentage] = useState(overallSummary.overallPercentage);
    const [summaryOverallGrade, setSummaryOverallGrade] = useState(overallSummary.overallGrade);
    const [summaryOverallPosition, setSummaryOverallPosition] = useState(overallSummary.overallPosition);

    // State for editable comments and recommendations (internal state for inputs, parent state is source of truth)
    const [commentsFormMistressMasterReport, setCommentsFormMistressMasterReport] = useState(commentsRecommendations.formMistressMasterReport);
    const [commentsFormTeacherName, setCommentsFormTeacherName] = useState(commentsRecommendations.formTeacherName);
    const [commentsConduct, setCommentsConduct] = useState(commentsRecommendations.conduct);
    const [commentsInterest, setCommentsInterest] = useState(commentsRecommendations.interest);
    const [commentsHousemistressMasterReport, setCommentsHousemistressMasterReport] = useState(commentsRecommendations.housemistressMasterReport);
    const [commentsHouseTeacherName, setCommentsHouseTeacherName] = useState(commentsRecommendations.houseTeacherName);
    const [commentsHeadmasterReport, setCommentsHeadmasterReport] = useState(commentsRecommendations.headmasterReport);
    const [commentsHeadmasterName, setCommentsHeadmasterName] = useState(commentsRecommendations.headmasterName);
    const [commentsParentGuardianNotes, setCommentsParentGuardianNotes] = useState(commentsRecommendations.parentGuardianNotes);


    // Effects to update internal state if initial props change (e.g., loading different saved data)
    useEffect(() => {
        setSchoolName(initialSchoolInfo.name);
        setSchoolAddress(initialSchoolInfo.address);
        setSchoolCityPostal(initialSchoolInfo.cityPostal);
        setSchoolPhone(initialSchoolInfo.phone);
        setSchoolEmail(initialSchoolInfo.email);
        setSchoolWebsite(initialSchoolInfo.website);
        setSchoolLogoUrl(initialSchoolInfo.logoUrl);
    }, [initialSchoolInfo]);

    useEffect(() => {
        setStudentName(studentInfo.name);
        setStudentGradeLevel(studentInfo.gradeLevel);
        setStudentAttendance(studentInfo.attendance);
        setStudentNextTermBegins(studentInfo.nextTermBegins);
        setStudentHouse(studentInfo.house);
        setStudentPositionInClass(studentInfo.positionInClass);
    }, [studentInfo]);

    useEffect(() => {
        setSummaryAcademicYear(overallSummary.academicYear);
        setSummaryTermSemester(overallSummary.termSemester);
        setSummaryOverallPercentage(overallSummary.overallPercentage);
        setSummaryOverallGrade(overallSummary.overallGrade);
        setSummaryOverallPosition(overallSummary.overallPosition);
    }, [overallSummary]);

    useEffect(() => {
        setCommentsFormMistressMasterReport(commentsRecommendations.formMistressMasterReport);
        setCommentsFormTeacherName(commentsRecommendations.formTeacherName);
        setCommentsConduct(commentsRecommendations.conduct);
        setCommentsInterest(commentsRecommendations.interest);
        setCommentsHousemistressMasterReport(commentsRecommendations.housemistressMasterReport);
        setCommentsHouseTeacherName(commentsRecommendations.houseTeacherName);
        setCommentsHeadmasterReport(commentsRecommendations.headmasterReport);
        setCommentsHeadmasterName(commentsRecommendations.headmasterName);
        setCommentsParentGuardianNotes(commentsRecommendations.parentGuardianNotes);
    }, [commentsRecommendations]);


    // --- Handlers for Input Changes (School Info) ---
    const handleSchoolNameInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setSchoolName(newValue);
        onSchoolNameChange(newValue);
    };

    const handleSchoolAddressInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setSchoolAddress(newValue);
        onSchoolAddressChange(newValue);
    };

    const handleSchoolCityPostalInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setSchoolCityPostal(newValue);
        onSchoolCityPostalChange(newValue);
    };

    const handleSchoolPhoneInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setSchoolPhone(newValue);
        onSchoolPhoneChange(newValue);
    };

    const handleSchoolEmailInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setSchoolEmail(newValue);
        onSchoolEmailChange(newValue);
    };

    const handleSchoolWebsiteInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setSchoolWebsite(newValue);
        onSchoolWebsiteChange(newValue);
    };

    const handleSchoolLogoFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files && event.target.files[0];
        if (file) {
            onSchoolLogoChange(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setSchoolLogoUrl(reader.result);
                } else {
                    setSchoolLogoUrl(initialSchoolInfo.logoUrl);
                }
            };
            reader.readAsDataURL(file);
        } else {
            onSchoolLogoChange(null);
            setSchoolLogoUrl(initialSchoolInfo.logoUrl);
        }
    };

    // --- Handlers for Input Changes (Student Info) ---
    // This handler now directly calls the single onStudentInfoChange prop
    const handleStudentInfoChangeInternal = (field: string, value: string) => {
        // Update internal state first to reflect changes in the input fields
        if (field === 'name') setStudentName(value);
        else if (field === 'gradeLevel') setStudentGradeLevel(value);
        else if (field === 'attendance') setStudentAttendance(value);
        else if (field === 'nextTermBegins') setStudentNextTermBegins(value);
        else if (field === 'house') setStudentHouse(value);
        else if (field === 'positionInClass') setStudentPositionInClass(value);

        // Then call the parent's handler to update the main report card data
        onStudentInfoChange(field, value);
    };

    // --- Handlers for Input Changes (Overall Summary) ---
    // This handler now directly calls the single onOverallSummaryChange prop
    const handleOverallSummaryInputChangeInternal = (field: string, value: React.SetStateAction<string>) => {
        // Update internal state first
        if (field === 'academicYear') setSummaryAcademicYear(value);
        else if (field === 'termSemester') setSummaryTermSemester(value);
        else if (field === 'overallPercentage') setSummaryOverallPercentage(value);
        else if (field === 'overallGrade') setSummaryOverallGrade(value);
        else if (field === 'overallPosition') setSummaryOverallPosition(value);

        // Then call the parent's handler
        onOverallSummaryChange(field, typeof value === 'string' ? value : '');
    };

    // --- Handlers for Input Changes (Comments & Recommendations) ---
    // This handler now directly calls the single onCommentsRecommendationsChange prop
    const handleCommentsRecommendationsInputChangeInternal = (
        field: keyof typeof defaultCommentsRecommendations,
        value: React.SetStateAction<string>
    ) => {
        // Update internal state first
        if (field === 'formMistressMasterReport') setCommentsFormMistressMasterReport(value);
        else if (field === 'formTeacherName') setCommentsFormTeacherName(value);
        else if (field === 'conduct') setCommentsConduct(value);
        else if (field === 'interest') setCommentsInterest(value);
        else if (field === 'housemistressMasterReport') setCommentsHousemistressMasterReport(value);
        else if (field === 'houseTeacherName') setCommentsHouseTeacherName(value);
        else if (field === 'headmasterReport') setCommentsHeadmasterReport(value);
        else if (field === 'headmasterName') setCommentsHeadmasterName(value);
        else if (field === 'parentGuardianNotes') setCommentsParentGuardianNotes(value);
    
        // Then call the parent's handler
        onCommentsRecommendationsChange(field, typeof value === 'string' ? value : '');
    };


    return (
        <>
        <div className="container mx-auto p-6 bg-white shadow-md rounded-lg my-8
                    print:p-0 print:my-0 print:shadow-none print:max-w-none print:mx-0 print:w-full">

            {/* School Information and Logo Section - Templated from image layout */}
            <div className="flex items-start justify-between mb-4 print:mb-1">
                 {/* School Logo and Info Left Side */}
                <div className="flex items-center">
                    {/* School Logo Upload and Preview */}
                        <Image
                            src={schoolLogoUrl}
                            alt={`${schoolName || 'School'} Logo`} // Use schoolName if available
                            className="w-20 h-20 object-contain rounded-md mb-1 print:w-12 print:h-12 print:mb-0" // Smaller image/margin in print
                            width={80}
                            height={80}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = 'https://placehold.co/100x100/EFEFEF/AEAEAE?text=Logo+Error';
                            }} // Fallback on error
                            unoptimized // Allow external URLs without optimization warning
                        />
                        {/* File input for logo upload - Hide in print via CSS utility */}
                        {!isPrintView && (
                            <input
                                type="file"
                                accept="image/*" // Accept only image files
                                onChange={handleSchoolLogoFileInputChange}
                                className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 print:hidden" // Hidden in print
                                aria-label="Upload School Logo"
                            />
                        )}
                    </div>
                     {/* School Name and Address Info */}
                    <div className="flex-grow"> {/* flex-grow allows div to take available space */}
                        <div className="text-lg font-bold mb-0.5 print:text-sm print:font-bold"></div> {/* Added static text from image */}
                        {/* Editable School Name Input */}
                        <div>
                             <label htmlFor="schoolName" className="sr-only">School Name</label>
                             {isPrintView ? (
                                <span className="text-xl font-bold mb-0.5 print:text-base print:font-semibold">{schoolName || '[School Name]'}</span>
                             ) : (
                                <input
                                    id="schoolName"
                                    type="text"
                                    value={schoolName}
                                    onChange={handleSchoolNameInputChange}
                                    className="text-xl font-bold mb-0.5 border-b border-gray-300 focus:border-blue-500 outline-none w-full
                                            print:border-none print:outline-none print:bg-none print:p-0 print:inline print:w-auto print:box-shadow-none print:text-base print:font-semibold print:mb-0"
                                    placeholder="[School Name]"
                                    aria-label="School Name"
                                />
                             )}
                        </div>
                         {/* Editable School Address Input */}
                         <div>
                             <label htmlFor="schoolAddress" className="sr-only">School Address</label>
                             {isPrintView ? (
                                <span className="text-sm text-gray-600 print:text-xs">{schoolAddress || '[School Address]'}</span>
                             ) : (
                                <input
                                    id="schoolAddress"
                                    type="text"
                                    value={schoolAddress}
                                    onChange={handleSchoolAddressInputChange}
                                    className="text-sm text-gray-600 border-b border-gray-300 focus:border-blue-500 outline-none w-full mb-0.5
                                            print:border-none print:outline-none print:bg-none print:p-0 print:inline print:w-auto print:box-shadow-none print:text-xs print:mb-0"
                                    placeholder="[School Address]"
                                    aria-label="School Address"
                                />
                             )}
                         </div>
                         {/* Editable School Phone and Email Inputs */}
                        <div className="flex flex-wrap gap-x-2 mb-0.5 print:gap-x-1 print:mb-0">
                             <label htmlFor="schoolPhone" className="sr-only">School Phone Number</label>
                             {isPrintView ? (
                                <span className="text-sm text-gray-600 print:text-xs">{schoolPhone || '[School Phone Number]'}</span>
                             ) : (
                                <input
                                    id="schoolPhone"
                                    type="text"
                                    value={schoolPhone}
                                    onChange={handleSchoolPhoneInputChange}
                                    className="text-sm text-gray-600 border-b border-gray-300 focus:border-blue-500 outline-none flex-1 min-w-[100px]
                                            print:border-none print:outline-none print:bg-none print:p-0 print:inline print:flex-initial print:min-w-0 print:w-auto print:box-shadow-none print:text-xs"
                                    placeholder="[School Phone Number]"
                                    aria-label="School Phone Number"
                                />
                             )}
                             <span className="text-sm text-gray-600 print:hidden">|</span> {/* Hide separator pipe in print */}
                             <label htmlFor="schoolEmail" className="sr-only">School Email Address</label>
                             {isPrintView ? (
                                <span className="text-sm text-gray-600 print:text-xs">{schoolEmail || '[School Email Address]'}</span>
                             ) : (
                                <input
                                    id="schoolEmail"
                                    type="text"
                                    value={schoolEmail}
                                    onChange={handleSchoolEmailInputChange}
                                    className="text-sm text-gray-600 border-b border-gray-300 focus:border-blue-500 outline-none flex-1 min-w-[100px]
                                            print:border-none print:outline-none print:bg-none print:p-0 print:inline print:flex-initial print:min-w-0 print:w-auto print:box-shadow-none print:text-xs"
                                    placeholder="[School Email Address]"
                                    aria-label="School Email Address"
                                />
                             )}
                        </div>
                         {/* Editable School Website Input (Optional) */}
                        <div>
                             <label htmlFor="schoolWebsite" className="sr-only">School Website</label>
                             {isPrintView ? (
                                <span className="text-sm text-gray-600 print:text-xs">{schoolWebsite || '[School Website (Optional)]'}</span>
                             ) : (
                                <input
                                    id="schoolWebsite"
                                    type="text"
                                    value={schoolWebsite}
                                    onChange={handleSchoolWebsiteInputChange}
                                    className="text-sm text-gray-600 border-b border-gray-300 focus:border-blue-500 outline-none w-full
                                            print:border-none print:outline-none print:bg-none print:p-0 print:inline print:w-auto print:box-shadow-none print:text-xs"
                                    placeholder="[School Website (Optional)]"
                                    aria-label="School Website"
                                />
                             )}
                        </div>
                    </div>
                </div>

                {/* Student Overall Summary Right Side */}
                 <div className="text-sm text-right print:text-xs">
                    <p>
                        <strong>Student Overall Percentage :</strong>
                        {isPrintView ? (
                            <span className="inline-block w-20 text-right">{summaryOverallPercentage || '%'}</span>
                        ) : (
                            <input
                                type="text"
                                value={summaryOverallPercentage}
                                onChange={(e) => handleOverallSummaryInputChangeInternal('overallPercentage', e.target.value)}
                                className="inline-block w-20 text-right border-b border-gray-300 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                                placeholder="%"
                            />
                        )}
                    </p>
                    <p>
                        <strong>Student Overall Grade :</strong>
                        {isPrintView ? (
                            <span className="inline-block w-16 text-right">{summaryOverallGrade || 'Grade'}</span>
                        ) : (
                            <input
                                type="text"
                                value={summaryOverallGrade}
                                onChange={(e) => handleOverallSummaryInputChangeInternal('overallGrade', e.target.value)}
                                className="inline-block w-16 text-right border-b border-gray-300 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                                placeholder="Grade"
                            />
                        )}
                    </p>
                    <p>
                        <strong>Overall Position :</strong>
                        {isPrintView ? (
                            <span className="inline-block w-24 text-right">{summaryOverallPosition || 'Pos/Total'}</span>
                        ) : (
                            <input
                                type="text"
                                value={summaryOverallPosition}
                                onChange={(e) => handleOverallSummaryInputChangeInternal('overallPosition', e.target.value)}
                                className="inline-block w-24 text-right border-b border-gray-300 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                                placeholder="Pos/Total"
                            />
                        )}
                    </p>
                    <p>
                        <strong>Position in Class :</strong>
                        {isPrintView ? (
                            <span className="inline-block w-24 text-right">{studentPositionInClass || 'Pos/Total'}</span>
                        ) : (
                            <input
                                type="text"
                                value={studentPositionInClass}
                                onChange={(e) => handleStudentInfoChangeInternal('positionInClass', e.target.value)}
                                className="inline-block w-24 text-right border-b border-gray-300 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                                placeholder="Pos/Total"
                            />
                        )}
                    </p>
                    <p>
                        <strong>House :</strong>
                        {isPrintView ? (
                            <span className="inline-block w-24 text-right">{studentHouse || 'House Name'}</span>
                        ) : (
                            <input
                                type="text"
                                value={studentHouse}
                                onChange={(e) => handleStudentInfoChangeInternal('house', e.target.value)}
                                className="inline-block w-24 text-right border-b border-gray-300 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                                placeholder="House Name"
                            />
                        )}
                    </p>
                 </div>
            </div>

            <hr className="my-4 print:my-1" />

            {/* Student Information Section */}
            <div className="flex justify-between text-sm mb-4 print:mb-1 print:text-xs">
                 {/* Student Info Left Side */}
                <div>
                    <p>
                        <strong>Student Name :</strong>
                        {isPrintView ? (
                            <span className="inline-block w-48">{studentName || 'Student Name'}</span>
                        ) : (
                            <input
                                type="text"
                                value={studentName}
                                onChange={(e) => handleStudentInfoChangeInternal('name', e.target.value)}
                                className="inline-block w-48 border-b border-gray-300 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                                placeholder="Student Name"
                            />
                        )}
                    </p>
                    <p>
                        <strong>Class/Level :</strong>
                        {isPrintView ? (
                            <span className="inline-block w-32">{studentGradeLevel || 'Class/Level'}</span>
                        ) : (
                            <input
                                type="text"
                                value={studentGradeLevel}
                                onChange={(e) => handleStudentInfoChangeInternal('gradeLevel', e.target.value)}
                                className="inline-block w-32 border-b border-gray-300 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                                placeholder="Class/Level"
                            />
                        )}
                    </p>
                    <p>
                        <strong>Attendance :</strong>
                        {isPrintView ? (
                            <span className="inline-block w-24">{studentAttendance || 'Attended/Total'}</span>
                        ) : (
                            <input
                                type="text"
                                value={studentAttendance}
                                onChange={(e) => handleStudentInfoChangeInternal('attendance', e.target.value)}
                                className="inline-block w-24 border-b border-gray-300 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                                placeholder="Attended/Total"
                            />
                        )}
                    </p>
                    <p>
                        <strong>Next Term Begins:</strong>
                        {isPrintView ? (
                            <span className="inline-block w-40">{studentNextTermBegins || 'Date'}</span>
                        ) : (
                            <input
                                type="text"
                                value={studentNextTermBegins}
                                onChange={(e) => handleStudentInfoChangeInternal('nextTermBegins', e.target.value)}
                                className="inline-block w-40 border-b border-gray-300 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                                placeholder="Date"
                            />
                        )}
                    </p>
                </div>
                <div></div> {/* Empty div to push content left, matching image layout */}
            </div>

            {/* Terminal Report Title */}
            <h2 className="text-xl font-semibold text-center mb-4 print:text-base print:mb-1">TERMINAL REPORT</h2>

            {/* Session and Term */}
             <div className="text-center text-sm mb-6 print:mb-1.5 print:text-xs">
                <p>
                    SESSION:
                    {isPrintView ? (
                        <span className="inline-block w-24 text-center">{summaryAcademicYear || 'YYYY/YY'}</span>
                    ) : (
                        <input
                            type="text"
                            value={summaryAcademicYear}
                            onChange={(e) => handleOverallSummaryInputChangeInternal('academicYear', e.target.value)}
                            className="inline-block w-24 text-center border-b border-gray-300 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                            placeholder="YYYY/YY"
                        />
                    )}
                    {isPrintView ? (
                        <span className="inline-block w-20 text-center">{summaryTermSemester || 'TERM X'}</span>
                    ) : (
                        <input
                            type="text"
                            value={summaryTermSemester}
                            onChange={(e) => handleOverallSummaryInputChangeInternal('termSemester', e.target.value)}
                            className="inline-block w-20 text-center border-b border-gray-300 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                            placeholder="TERM X"
                        />
                    )}
                </p>
             </div>

            {/* Academic Performance Table */}
            <div className="overflow-x-auto mb-6 print:mb-1.5">
                <table className="min-w-full bg-white border border-gray-200 rounded-md">
                    <thead>
                        <tr className="bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider print:text-[7pt]">
                            <th className="py-2 px-3 border-b border-gray-200 print:py-0.5 print:px-1">SUBJECT</th>
                            <th className="py-2 px-3 border-b border-gray-200 print:py-0.5 print:px-1">CLASS SCORE <br/> 30 %</th>
                            <th className="py-2 px-3 border-b border-gray-200 print:py-0.5 print:px-1">EXAM SCORE <br/> 70 %</th>
                            <th className="py-2 px-3 border-b border-gray-200 print:py-0.5 print:px-1">TOTAL SCORE <br/> 100 %</th>
                            <th className="py-2 px-3 border-b border-gray-200 text-center print:py-0.5 print:px-1">GRADE</th>
                            <th className="py-2 px-3 border-b border-gray-200 print:py-0.5 print:px-1">CLASS AVERAGE</th>
                            <th className="py-2 px-3 border-b border-gray-200 print:py-0.5 print:px-1">SUBJECT <br/> POSITION</th>
                            <th className="py-2 px-3 border-b border-gray-200 print:py-0.5 print:px-1">OVERALL SUBJECT <br/> POSITION</th>
                            <th className="py-2 px-3 border-b border-gray-200 print:py-0.5 print:px-1">REMARKS</th>
                            <th className="py-2 px-3 border-b border-gray-200 print:py-0.5 print:px-1">TEACHER NAME</th>
                            {!isPrintView && <th className="py-2 px-3 border-b border-gray-200 print:hidden">ACTIONS</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {academicPerformance.length === 0 ? (
                            <tr>
                                <td colSpan={isPrintView ? 10 : 11} className="py-4 text-center text-gray-500 print:py-1">No subjects added yet. Use the form below to add subjects.</td>
                            </tr>
                        ) : (
                            academicPerformance.map((subjectData, index) => (
                                <tr key={index} className="hover:bg-gray-50 text-sm print:text-[7pt] print:break-inside-avoid">
                                    <td className="py-2 px-3 border-b border-gray-200 print:py-0.5 print:px-1">
                                        {isPrintView ? (
                                            <span>{subjectData.subject}</span>
                                        ) : (
                                            <input
                                                type="text"
                                                value={subjectData.subject}
                                                onChange={(e) => onAcademicPerformanceChange(index, 'subject', e.target.value)}
                                                className="w-full border-b border-gray-200 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                                            />
                                        )}
                                    </td>
                                    <td className="py-2 px-3 border-b border-gray-200 text-center print:py-0.5 print:px-1">
                                        {isPrintView ? (
                                            <span>{subjectData.classScore}</span>
                                        ) : (
                                            <input
                                                type="text"
                                                value={subjectData.classScore}
                                                onChange={(e) => onAcademicPerformanceChange(index, 'classScore', e.target.value)}
                                                className="w-full text-center border-b border-gray-200 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                                            />
                                        )}
                                    </td>
                                    <td className="py-2 px-3 border-b border-gray-200 text-center print:py-0.5 print:px-1">
                                        {isPrintView ? (
                                            <span>{subjectData.examScore}</span>
                                        ) : (
                                            <input
                                                type="text"
                                                value={subjectData.examScore}
                                                onChange={(e) => onAcademicPerformanceChange(index, 'examScore', e.target.value)}
                                                className="w-full text-center border-b border-gray-200 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                                            />
                                        )}
                                    </td>
                                    <td className="py-2 px-3 border-b border-gray-200 text-center print:py-0.5 print:px-1">
                                        {isPrintView ? (
                                            <span>{subjectData.totalScore}</span>
                                        ) : (
                                            <input
                                                type="text"
                                                value={subjectData.totalScore}
                                                onChange={(e) => onAcademicPerformanceChange(index, 'totalScore', e.target.value)}
                                                className="w-full text-center border-b border-gray-200 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                                            />
                                        )}
                                    </td>
                                    <td className="py-2 px-3 border-b border-gray-200 text-center print:py-0.5 print:px-1">
                                        {isPrintView ? (
                                            <span>{subjectData.grade}</span>
                                        ) : (
                                            <input
                                                type="text"
                                                value={subjectData.grade}
                                                onChange={(e) => onAcademicPerformanceChange(index, 'grade', e.target.value)}
                                                className="w-full text-center border-b border-gray-200 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                                            />
                                        )}
                                    </td>
                                    <td className="py-2 px-3 border-b border-gray-200 text-center print:py-0.5 print:px-1">
                                        {isPrintView ? (
                                            <span>{subjectData.classAverage}</span>
                                        ) : (
                                            <input
                                                type="text"
                                                value={subjectData.classAverage}
                                                onChange={(e) => onAcademicPerformanceChange(index, 'classAverage', e.target.value)}
                                                className="w-full text-center border-b border-gray-200 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                                            />
                                        )}
                                    </td>
                                    <td className="py-2 px-3 border-b border-gray-200 text-center print:py-0.5 print:px-1">
                                        {isPrintView ? (
                                            <span>{subjectData.subjectPosition}</span>
                                        ) : (
                                            <input
                                                type="text"
                                                value={subjectData.subjectPosition}
                                                onChange={(e) => onAcademicPerformanceChange(index, 'subjectPosition', e.target.value)}
                                                className="w-full text-center border-b border-gray-200 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                                            />
                                        )}
                                    </td>
                                    <td className="py-2 px-3 border-b border-gray-200 text-center print:py-0.5 print:px-1">
                                        {isPrintView ? (
                                            <span>{subjectData.overallSubjectPosition}</span>
                                        ) : (
                                            <input
                                                type="text"
                                                value={subjectData.overallSubjectPosition}
                                                onChange={(e) => onAcademicPerformanceChange(index, 'overallSubjectPosition', e.target.value)}
                                                className="w-full text-center border-b border-gray-200 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                                            />
                                        )}
                                    </td>
                                    <td className="py-2 px-3 border-b border-gray-200 print:py-0.5 print:px-1">
                                        <MultiSelectDropdown
                                            options={PREDEFINED_REMARKS}
                                            selectedValues={subjectData.remarks}
                                            onChange={(selectedOptions) => onAcademicPerformanceChange(index, 'remarks', selectedOptions)}
                                            placeholder="Select Remarks"
                                            isPrintView={isPrintView} // Pass isPrintView to dropdown
                                        />
                                    </td>
                                    <td className="py-2 px-3 border-b border-gray-200 print:py-0.5 print:px-1">
                                        {isPrintView ? (
                                            <span>{subjectData.teacher}</span>
                                        ) : (
                                            <input
                                                type="text"
                                                value={subjectData.teacher}
                                                onChange={(e) => onAcademicPerformanceChange(index, 'teacher', e.target.value)}
                                                className="w-full border-b border-gray-200 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                                            />
                                        )}
                                    </td>
                                    {!isPrintView && (
                                        <td className="py-2 px-3 border-b border-gray-200 text-center print:hidden">
                                            <button
                                                onClick={() => onRemoveSubject(index)}
                                                className="text-red-500 hover:text-red-700 font-bold"
                                                title="Remove Subject"
                                            >
                                                &times; {/* Times symbol for remove */}
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <hr className="my-6 print:my-1.5" />

            {/* Comments and Recommendations Section */}
            {/* Changed to a single grid to arrange all report/comment sections in columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:gap-1.5 print:text-xs mb-6 print:mb-1.5 print:grid-cols-3">
                {/* Form Teacher's Report */}
                <div className="mb-3 print:mb-0.5 print:break-inside-avoid">
                    <p className="font-semibold mb-1 print:mb-0.5">
                        Form Teacher&#39;s Report :
                        {isPrintView ? (
                            <span className="inline-block w-40">{commentsFormTeacherName || '[Teacher Name]'}</span>
                        ) : (
                            <input
                                type="text"
                                value={commentsFormTeacherName}
                                onChange={(e) => handleCommentsRecommendationsInputChangeInternal('formTeacherName', e.target.value)}
                                className="inline-block w-40 border-b border-gray-300 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                                placeholder="[Teacher Name]"
                            />
                        )}
                    </p>
                    {isPrintView ? (
                        <span className="block w-full print:text-xs">{commentsFormMistressMasterReport || 'Enter report here...'}</span>
                    ) : (
                        <textarea
                            value={commentsFormMistressMasterReport}
                            onChange={(e) => handleCommentsRecommendationsInputChangeInternal('formMistressMasterReport', e.target.value)}
                            className="w-full border-b border-gray-300 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0 resize-none h-auto overflow-hidden"
                            rows={2}
                            placeholder="Enter report here..."
                        />
                    )}
                </div>

                {/* Conduct Section */}
                <div className="mb-3 print:mb-0.5 print:break-inside-avoid">
                    <p className="font-semibold mb-1 print:mb-0.5">Conduct :</p>
                    {isPrintView ? (
                        <span className="block w-full print:text-xs">{commentsConduct || 'Enter conduct here...'}</span>
                    ) : (
                        <input
                            type="text"
                            value={commentsConduct}
                            onChange={(e) => handleCommentsRecommendationsInputChangeInternal('conduct', e.target.value)}
                            className="w-full border-b border-gray-300 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                            placeholder="Enter conduct here..."
                        />
                    )}
                </div>

                {/* Interest Section */}
                <div className="mb-3 print:mb-0.5 print:break-inside-avoid">
                    <p className="font-semibold mb-1 print:mb-0.5">Interest :</p>
                    {isPrintView ? (
                        <span className="block w-full print:text-xs">{commentsInterest || 'Enter interest here...'}</span>
                    ) : (
                        <input
                            type="text"
                            value={commentsInterest}
                            onChange={(e) => handleCommentsRecommendationsInputChangeInternal('interest', e.target.value)}
                            className="w-full border-b border-gray-300 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                            placeholder="Enter interest here..."
                        />
                    )}
                </div>

                {/* House Teacher's Report */}
                <div className="mb-3 print:mb-0.5 print:break-inside-avoid">
                    <p className="font-semibold mb-1 print:mb-0.5">
                        House Teacher&apos;s Report :
                        {isPrintView ? (
                            <span className="inline-block w-40">{commentsHouseTeacherName || '[Teacher Name]'}</span>
                        ) : (
                            <input
                                type="text"
                                value={commentsHouseTeacherName}
                                onChange={(e) => handleCommentsRecommendationsInputChangeInternal('houseTeacherName', e.target.value)}
                                className="inline-block w-40 border-b border-gray-300 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                                placeholder="[Teacher Name]"
                            />
                        )}
                    </p>
                    {isPrintView ? (
                        <span className="block w-full print:text-xs">{commentsHousemistressMasterReport || 'Enter report here...'}</span>
                    ) : (
                        <textarea
                            value={commentsHousemistressMasterReport}
                            onChange={(e) => handleCommentsRecommendationsInputChangeInternal('housemistressMasterReport', e.target.value)}
                            className="w-full border-b border-gray-300 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0 resize-none h-auto overflow-hidden"
                            rows={2}
                            placeholder="Enter report here..."
                        />
                    )}
                </div>

                {/* Headmaster's Report */}
                <div className="mb-3 print:mb-0.5 print:break-inside-avoid">
                    <p className="font-semibold mb-1 print:mb-0.5">
                        Headmaster&lsquo;s Report :
                        {isPrintView ? (
                            <span className="inline-block w-40">{commentsHeadmasterName || '[Headmaster Name]'}</span>
                        ) : (
                            <input
                                type="text"
                                value={commentsHeadmasterName}
                                onChange={(e) => handleCommentsRecommendationsInputChangeInternal('headmasterName', e.target.value)}
                                className="inline-block w-40 border-b border-gray-300 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                                placeholder="[Headmaster Name]"
                            />
                        )}
                    </p>
                    {isPrintView ? (
                        <span className="block w-full print:text-xs">{commentsHeadmasterReport || 'Enter report here...'}</span>
                    ) : (
                        <textarea
                            value={commentsHeadmasterReport}
                            onChange={(e) => handleCommentsRecommendationsInputChangeInternal('headmasterReport', e.target.value)}
                            className="w-full border-b border-gray-300 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0 resize-none h-auto overflow-hidden"
                            rows={2}
                            placeholder="Enter report here..."
                        />
                    )}
                </div>
            </div>


            <hr className="my-6 print:my-1.5" />

            {/* Signatures (Display Only) */}
            <h3 className="text-lg font-semibold mb-4 print:text-base print:mb-1">Signatures</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 md:gap-x-8 text-sm mb-6 print:text-xs print:mb-1.5 print:gap-y-1 print:gap-x-2 print:break-inside-avoid">
                <div className="print:break-inside-avoid">
                    <p><strong>Form Mistress/Master Signature:</strong> _________________________</p>
                    <p className="mt-1 print:mt-0.5"><strong>Date:</strong> ______________</p>
                </div>
                 <div className="print:break-inside-avoid">
                    <p><strong>Housemistress/Master Signature:</strong> _______________________</p>
                    <p className="mt-1 print:mt-0.5"><strong>Date:</strong> ______________</p>
                </div>
                <div className="print:break-inside-avoid">
                    <p><strong>Headmaster Signature:</strong> _______________________</p>
                    <p className="mt-1 print:mt-0.5"><strong>Date:</strong> ______________</p>
                </div>
            </div>

            <hr className="my-6 print:my-1.5" />

            {/* Parent/Guardian Notes */}
            <h3 className="text-lg font-semibold mb-4 print:text-base print:mb-1">Parent/Guardian Notes</h3>
            {isPrintView ? (
                <span className="block w-full text-sm text-gray-700 h-24 border border-gray-300 rounded-md p-3
                           print:text-xs print:p-0.5 print:border print:h-auto print:min-h-[10mm] print:break-inside-avoid print:bg-none print:box-shadow-none">
                    {commentsParentGuardianNotes || 'Area for parents/guardians to write any comments, questions, or feedback'}
                </span>
            ) : (
                <textarea
                    value={commentsParentGuardianNotes}
                    onChange={(e) => handleCommentsRecommendationsInputChangeInternal('parentGuardianNotes', e.target.value)}
                    className="w-full text-sm text-gray-700 h-24 border border-gray-300 rounded-md p-3
                           focus:border-blue-500 outline-none resize-none
                           print:text-xs print:p-0.5 print:border print:h-auto print:min-h-[10mm] print:break-inside-avoid print:bg-none print:box-shadow-none"
                    placeholder="Area for parents/guardians to write any comments, questions, or feedback"
                />
            )}

            <hr className="my-6 print:my-1.5" />

            {/* Grading Code / Legend Right Column - Moved here */}
            <div className="print:break-inside-avoid">
                <h3 className="text-base font-semibold mb-2 print:text-xs print:mb-0.5">Grading Code</h3>
                <table className="min-w-full bg-white border border-gray-200 rounded-md text-xs print:text-[5pt]">
                    <thead>
                        <tr className="bg-gray-100 text-left font-semibold text-gray-600 uppercase tracking-wider print:py-0.25 print:px-0.5">
                            <th className="py-1 px-2 border-b border-gray-200 print:py-0.25 print:px-0.5">Range</th>
                            <th className="py-1 px-2 border-b border-gray-200 print:py-0.25 print:px-0.5">Grade</th>
                            <th className="py-1 px-2 border-b border-gray-200 print:py-0.25 print:px-0.5">Remarks</th>
                            {!isPrintView && <th className="py-1 px-2 border-b border-gray-200 print:hidden">ACTIONS</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {gradingScale.grades.length === 0 ? (
                            <tr>
                                <td colSpan={isPrintView ? 3 : 4} className="py-2 text-center text-gray-500 print:py-0.5">No grading scale defined. Use the form below to add entries.</td>
                            </tr>
                        ) : (
                            gradingScale.grades.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50 print:break-inside-avoid">
                                    <td className="py-1 px-2 border-b border-gray-200 print:py-0.25 print:px-0.5">
                                        {isPrintView ? (
                                            <span>{item.range}</span>
                                        ) : (
                                            <input
                                                type="text"
                                                value={item.range}
                                                onChange={(e) => onGradingScaleChange(index, 'range', e.target.value)}
                                                className="w-full border-b border-gray-200 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                                            />
                                        )}
                                    </td>
                                    <td className="py-1 px-2 border-b border-gray-200 print:py-0.25 print:px-0.5">
                                        {isPrintView ? (
                                            <span>{item.grade}</span>
                                        ) : (
                                            <input
                                                type="text"
                                                value={item.grade}
                                                onChange={(e) => onGradingScaleChange(index, 'grade', e.target.value)}
                                                className="w-full border-b border-gray-200 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                                            />
                                        )}
                                    </td>
                                    <td className="py-1 px-2 border-b border-gray-200 print:py-0.25 print:px-0.5">
                                        {isPrintView ? (
                                            <span>{item.remarks}</span>
                                        ) : (
                                            <input
                                                type="text"
                                                value={item.remarks}
                                                onChange={(e) => onGradingScaleChange(index, 'remarks', e.target.value)}
                                                className="w-full border-b border-gray-200 focus:border-blue-500 outline-none print:border-none print:outline-none print:bg-none print:p-0"
                                            />
                                        )}
                                    </td>
                                    {!isPrintView && (
                                        <td className="py-1 px-2 border-b border-gray-200 text-center print:hidden">
                                            <button
                                                onClick={() => onRemoveGradingScaleEntry(index)}
                                                className="text-red-500 hover:text-red-700 font-bold"
                                                title="Remove Entry"
                                            >
                                                &times;
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

        </>

    );
};


// ============================================================================
// 2. ReportCardManagerPage Component (Container/Manager)
// Key used for saving/loading report card data in localStorage
const LOCAL_STORAGE_KEY = "edutrack_report_card_data";

const ReportCardManagerPage: React.FC = () => {
    const [reportCardData, setReportCardData] = useState<{
        schoolInfo: typeof defaultSchoolInfo;
        studentInfo: typeof defaultStudentInfo;
        academicPerformance: AcademicPerformance[];
        overallSummary: typeof defaultOverallSummary;
        commentsRecommendations: typeof defaultCommentsRecommendations;
        gradingScale: GradingScale;
    }>({
        schoolInfo: defaultSchoolInfo,
        studentInfo: defaultStudentInfo,
        academicPerformance: defaultAcademicPerformance,
        overallSummary: defaultOverallSummary,
        commentsRecommendations: defaultCommentsRecommendations,
        gradingScale: defaultGradingScale,
        // Add other sections here if needed
    });

    // State for a new grading scale entry to be added
    const [newGradingScaleEntry, setNewGradingScaleEntry] = useState<GradingScaleEntry>({
        range: '',
        grade: '',
        remarks: '',
    });

    // State for a new subject to be added
    const [newSubject, setNewSubject] = useState<AcademicPerformance>({
        subject: '',
        classScore: '',
        examScore: '',
        totalScore: '',
        grade: '',
        classAverage: '',
        subjectPosition: '',
        overallSubjectPosition: '',
        remarks: [],
        teacher: '',
    });

    // State to hold the raw text pasted for academic data
    const [pastedAcademicText, setPastedAcademicText] = useState('');

    // State to track if data is loading from localStorage.
    const [isLoading, setIsLoading] = useState(true);

    // --- PDF Export Setup ---
    // usePDF hook provides:
    // - targetRef: A ref to attach to the HTML element you want to convert.
    // - toPDF: A function to call to trigger the PDF generation.
    const { targetRef, toPDF } = usePDF({
        filename: 'student-report-card.pdf', // Default filename for the downloaded PDF
    });

    // --- Effect to Load Data from localStorage on Component Mount ---
    // This effect runs once when the component mounts to load any previously saved data.
    useEffect(() => {
        try {
            const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                // Merge saved data with defaults to ensure all keys are present.
                setReportCardData(() => ({
                    schoolInfo: { ...defaultSchoolInfo, ...parsedData.schoolInfo },
                    studentInfo: { ...defaultStudentInfo, ...parsedData.studentInfo },
                    // Ensure academicPerformance remarks are arrays, even if loaded as strings from old data
                    academicPerformance: (parsedData.academicPerformance || defaultAcademicPerformance).map((subject: AcademicPerformance) => ({
                        ...subject,
                        remarks: Array.isArray(subject.remarks) ? subject.remarks : (subject.remarks ? [subject.remarks] : []),
                    })),
                    overallSummary: { ...defaultOverallSummary, ...parsedData.overallSummary },
                    commentsRecommendations: { ...defaultCommentsRecommendations, ...parsedData.commentsRecommendations },
                    gradingScale: { ...defaultGradingScale, grades: parsedData.gradingScale?.grades || defaultGradingScale.grades },
                }));
            }
        } catch (error) {
            console.error("Failed to load data from localStorage:", error);
        } finally {
             setIsLoading(false);
        }
    }, []);


    // --- Manual Save Function ---
    // This function is called by the "Save All Data" button.
    // It saves the current state of all report card data to localStorage.
    const handleSaveAllData = useCallback(() => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reportCardData));
            console.log("All report card data saved to localStorage!");
            toast.success("All report card data saved successfully!");
        } catch (error) {
            console.error("Failed to save data to localStorage:", error);
            toast.error("Failed to save report card data.");
        }
    }, [reportCardData]);


    // --- Callback handlers for ReportCard component (update parent state) ---
    const handleSchoolNameChange = useCallback((newName: string) => {
        setReportCardData(prevData => ({
            ...prevData,
            schoolInfo: { ...prevData.schoolInfo, name: newName },
        }));
    }, []);

    const handleSchoolAddressChange = useCallback((newAddress: string) => {
        setReportCardData(prevData => ({
            ...prevData,
            schoolInfo: { ...prevData.schoolInfo, address: newAddress },
        }));
    }, []);

    const handleSchoolCityPostalChange = useCallback((newCityPostal: string) => {
        setReportCardData(prevData => ({
            ...prevData,
            schoolInfo: { ...prevData.schoolInfo, cityPostal: newCityPostal },
        }));
    }, []);

    const handleSchoolPhoneChange = useCallback((newPhone: string) => {
        setReportCardData(prevData => ({
            ...prevData,
            schoolInfo: { ...prevData.schoolInfo, phone: newPhone },
        }));
    }, []);

    const handleSchoolEmailChange = useCallback((newEmail: string) => {
        setReportCardData(prevData => ({
            ...prevData,
            schoolInfo: { ...prevData.schoolInfo, email: newEmail },
        }));
    }, []);

    const handleSchoolWebsiteChange = useCallback((newWebsite: string) => {
        setReportCardData(prevData => ({
            ...prevData,
            schoolInfo: { ...prevData.schoolInfo, website: newWebsite },
        }));
    }, []);

    const handleSchoolLogoChange = useCallback((file: File | null) => {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReportCardData(prevData => ({
                    ...prevData,
                    schoolInfo: {
                        ...prevData.schoolInfo,
                        logoUrl: typeof reader.result === 'string' ? reader.result : defaultSchoolInfo.logoUrl,
                    },
                }));
            };
            reader.readAsDataURL(file);
        } else {
            setReportCardData(prevData => ({
                ...prevData,
                schoolInfo: {
                    ...prevData.schoolInfo,
                    logoUrl: defaultSchoolInfo.logoUrl,
                },
            }));
        }
    }, []);

    // Student Info Handlers
    const handleStudentInfoChange = useCallback((field: string, value: string) => {
        setReportCardData(prevData => ({
            ...prevData,
            studentInfo: { ...prevData.studentInfo, [field]: value },
        }));
    }, []);

    // Overall Summary Handlers
    const handleOverallSummaryChange = useCallback((field: string, value: string) => {
        setReportCardData(prevData => ({
            ...prevData,
            overallSummary: { ...prevData.overallSummary, [field]: value },
        }));
    }, []);

    // Comments and Recommendations Handlers
    const handleCommentsRecommendationsChange = useCallback(
        (field: keyof typeof defaultCommentsRecommendations, value: string) => {
            setReportCardData(prevData => ({
                ...prevData,
                commentsRecommendations: { ...prevData.commentsRecommendations, [field]: value },
            }));
        },
        []
    );


    // Academic Performance Handlers
    const handleNewSubjectChange = useCallback((e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: string | string[] } }) => {
        const { name, value } = e.target;
        setNewSubject(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleAddSubject = useCallback(() => {
        if (newSubject.subject.trim() === '') {
            toast.error("Subject name cannot be empty.");
            return;
        }
        setReportCardData(prevData => ({
            ...prevData,
            academicPerformance: [...prevData.academicPerformance, { ...newSubject }],
        }));
        setNewSubject({ // Reset new subject form
            subject: '',
            classScore: '',
            examScore: '',
            totalScore: '',
            grade: '',
            classAverage: '',
            subjectPosition: '',
            overallSubjectPosition: '',
            remarks: [], // Reset as empty array
            teacher: '',
        });
        toast.success("Subject added!");
    }, [newSubject]);

    const handleAcademicPerformanceChange = useCallback(
        (index: string | number, field: keyof AcademicPerformance, value: string | string[]) => {
            const idx = typeof index === 'string' ? parseInt(index, 10) : index;
            setReportCardData(prevData => {
                const updatedPerformance = [...prevData.academicPerformance];
                updatedPerformance[idx] = {
                    ...updatedPerformance[idx],
                    [field]: value,
                };
                return {
                    ...prevData,
                    academicPerformance: updatedPerformance,
                };
            });
        },
        []
    );

    const handleRemoveSubject = useCallback((indexToRemove: number) => {
        setReportCardData(prevData => ({
            ...prevData,
            academicPerformance: prevData.academicPerformance.filter((_, index) => index !== indexToRemove),
        }));
        toast.info("Subject removed.");
    }, []);

    // Grading Scale Handlers
    const handleNewGradingScaleEntryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewGradingScaleEntry(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleAddGradingScaleEntry = useCallback(() => {
        if (newGradingScaleEntry.range.trim() === '' || newGradingScaleEntry.grade.trim() === '') {
            toast.error("Range and Grade cannot be empty for grading scale.");
            return;
        }
        setReportCardData(prevData => ({
            ...prevData,
            gradingScale: {
                ...prevData.gradingScale,
                grades: [...prevData.gradingScale.grades, { ...newGradingScaleEntry }],
            },
        }));
        setNewGradingScaleEntry({ // Reset new entry form
            range: '',
            grade: '',
            remarks: '',
        });
        toast.success("Grading scale entry added!");
    }, [newGradingScaleEntry]);

    const handleGradingScaleChange = useCallback((index: string | number, field: keyof GradingScaleEntry, value: string) => {
        const idx = typeof index === 'string' ? parseInt(index, 10) : index;
        setReportCardData(prevData => {
            const updatedGrades = [...prevData.gradingScale.grades];
            updatedGrades[idx] = {
                ...updatedGrades[idx],
                [field]: value,
            };
            return {
                ...prevData,
                gradingScale: {
                    ...prevData.gradingScale,
                    grades: updatedGrades,
                },
            };
        });
    }, []);

    const handleRemoveGradingScaleEntry = useCallback((indexToRemove: number) => {
        setReportCardData(prevData => ({
            ...prevData,
            gradingScale: {
                ...prevData.gradingScale,
                grades: prevData.gradingScale.grades.filter((_, index) => index !== indexToRemove),
            },
        }));
        toast.info("Grading scale entry removed.");
    }, []);

    // --- Handle Paste Academic Data ---
    const handlePasteAcademicData = useCallback(() => {
        if (!pastedAcademicText.trim()) {
            toast.warn("Paste area is empty. Nothing to apply.");
            return;
        }

        const lines = pastedAcademicText.trim().split('\n');
        const newAcademicPerformance: AcademicPerformance[] = [];
        const expectedColumns = [
            'subject', 'classScore', 'examScore', 'totalScore', 'grade',
            'classAverage', 'subjectPosition', 'overallSubjectPosition', 'remarks', 'teacher'
        ];

        for (const line of lines) {
            const values = line.split(',');
            if (values.length !== expectedColumns.length) {
                toast.error(`Skipped a row due to incorrect number of columns: "${line}". Expected ${expectedColumns.length} columns.`);
                continue;
            }

            const subjectData: AcademicPerformance = {
                subject: "",
                classScore: "",
                examScore: "",
                totalScore: "",
                grade: "",
                classAverage: "",
                subjectPosition: "",
                overallSubjectPosition: "",
                remarks: [],
                teacher: ""
            };
            expectedColumns.forEach((col, index) => {
                const value = values[index].trim();
                if (col === 'remarks') {
                    // Split remarks by semicolon and trim each part
                    (subjectData as AcademicPerformance).remarks = value ? value.split(';').map(r => r.trim()) : [];
                } else {
                    (subjectData as Record<keyof AcademicPerformance, string | string[]>)[col as keyof AcademicPerformance] = value;
                }
            });
            newAcademicPerformance.push(subjectData);
        }

        if (newAcademicPerformance.length > 0) {
            setReportCardData(prevData => ({
                ...prevData,
                academicPerformance: newAcademicPerformance,
            }));
            setPastedAcademicText(''); // Clear textarea after applying
            toast.success(`Successfully applied ${newAcademicPerformance.length} subjects from pasted data.`);
        } else {
            toast.error("No valid academic data could be parsed from the pasted text.");
        }
    }, [pastedAcademicText]);


    // --- Handle Print function (uses browser's native print) ---
    const handlePrint = () => {
        window.print();
    };

    // --- Handle Export to PDF function ---
    const handleExportPdf = async () => {
        console.log("Attempting to export PDF...");
        try {
             await toPDF();
             toast.success("Report card exported to PDF!");
        } catch (error) {
             console.error("Failed to export PDF:", error);
             toast.error("Failed to export report card to PDF.");
        }
    };


    // Show loading state while data is being loaded from localStorage.
    if (isLoading) {
        return <div className="text-center my-8">Loading report card data...</div>;
    }

    return (
        <SidebarProvider>
            {/* Apply print:hidden to the AppSidebar to hide it during print/PDF export */}
            <AppSidebar className="print:hidden" />
            <SidebarInset>
                {/* Apply print:hidden to the header containing the SidebarTrigger and Breadcrumbs */}
                <header className="flex h-16 items-center gap-2 border-b px-4 print:hidden">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Report Card</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <div ref={targetRef} className="print-container p-4 print:p-0 print:w-full print:mx-0">

                    <div className="flex justify-center gap-4 my-4 print:hidden">
                        <button
                            onClick={handleSaveAllData}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                            Save All Data
                        </button>
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Print Report Card (Browser)
                        </button>
                        <button
                            onClick={handleExportPdf}
                            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                        >
                            Export to PDF
                        </button>
                    </div>

                    {/* Section to Add New Subject */}
                    <div className="bg-white p-4 rounded-lg shadow-md mb-6 print:hidden">
                        <h3 className="text-lg font-semibold mb-3">Add New Subject</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                            <input
                                type="text"
                                name="subject"
                                placeholder="Subject Name"
                                value={newSubject.subject}
                                onChange={handleNewSubjectChange}
                                className="p-2 border border-gray-300 rounded-md"
                            />
                            <input
                                type="text"
                                name="classScore"
                                placeholder="Class Score (30%)"
                                value={newSubject.classScore}
                                onChange={handleNewSubjectChange}
                                className="p-2 border border-gray-300 rounded-md"
                            />
                            <input
                                type="text"
                                name="examScore"
                                placeholder="Exam Score (70%)"
                                value={newSubject.examScore}
                                onChange={handleNewSubjectChange}
                                className="p-2 border border-gray-300 rounded-md"
                            />
                            <input
                                type="text"
                                name="totalScore"
                                placeholder="Total Score (100%)"
                                value={newSubject.totalScore}
                                onChange={handleNewSubjectChange}
                                className="p-2 border border-gray-300 rounded-md"
                            />
                            <input
                                type="text"
                                name="grade"
                                placeholder="Grade"
                                value={newSubject.grade}
                                onChange={handleNewSubjectChange}
                                className="p-2 border border-gray-300 rounded-md"
                            />
                            <input
                                type="text"
                                name="classAverage"
                                placeholder="Class Average"
                                value={newSubject.classAverage}
                                onChange={handleNewSubjectChange}
                                className="p-2 border border-gray-300 rounded-md"
                            />
                            <input
                                type="text"
                                name="subjectPosition"
                                placeholder="Subject Position"
                                value={newSubject.subjectPosition}
                                onChange={handleNewSubjectChange}
                                className="p-2 border border-gray-300 rounded-md"
                            />
                            <input
                                type="text"
                                name="overallSubjectPosition"
                                placeholder="Overall Subject Position"
                                value={newSubject.overallSubjectPosition}
                                onChange={handleNewSubjectChange}
                                className="p-2 border border-gray-300 rounded-md"
                            />
                            <MultiSelectDropdown
                                options={PREDEFINED_REMARKS}
                                selectedValues={newSubject.remarks}
                                onChange={(selectedOptions) => handleNewSubjectChange({ target: { name: 'remarks', value: selectedOptions } })}
                                placeholder="Select Remarks"
                                isPrintView={false} // Always editable in this manager view
                            />
                            <input
                                type="text"
                                name="teacher"
                                placeholder="Teacher Name"
                                value={newSubject.teacher}
                                onChange={handleNewSubjectChange}
                                className="p-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <button
                            onClick={handleAddSubject}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Add Subject
                        </button>
                    </div>

                    {/* Section to Add New Grading Scale Entry */}
                    <div className="bg-white p-4 rounded-lg shadow-md mb-6 print:hidden">
                        <h3 className="text-lg font-semibold mb-3">Add New Grading Scale Entry</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                            <input
                                type="text"
                                name="range"
                                placeholder="Range (e.g., 80-100)"
                                value={newGradingScaleEntry.range}
                                onChange={handleNewGradingScaleEntryChange}
                                className="p-2 border border-gray-300 rounded-md"
                            />
                            <input
                                type="text"
                                name="grade"
                                placeholder="Grade (e.g., A1)"
                                value={newGradingScaleEntry.grade}
                                onChange={handleNewGradingScaleEntryChange}
                                className="p-2 border border-gray-300 rounded-md"
                            />
                            <input
                                type="text"
                                name="remarks"
                                placeholder="Remarks (e.g., Excellent)"
                                value={newGradingScaleEntry.remarks}
                                onChange={handleNewGradingScaleEntryChange}
                                className="p-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <button
                            onClick={handleAddGradingScaleEntry}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Add Grading Entry
                        </button>
                    </div>

                    {/* New Section: Paste Academic Data */}
                    <div className="bg-white p-4 rounded-lg shadow-md mb-6 print:hidden">
                        <h3 className="text-lg font-semibold mb-3">Paste Academic Data (CSV)</h3>
                        <p className="text-sm text-gray-600 mb-2">
                            Paste comma-separated values for subjects. Each line is a new subject.
                            Order: `Subject,ClassScore,ExamScore,TotalScore,Grade,ClassAverage,SubjectPosition,OverallSubjectPosition,Remarks,Teacher`
                            (For Remarks, use semicolon `;` to separate multiple remarks, e.g., &quot;Good;Effort Needed&quot;)
                        </p>
                        <textarea
                            className="w-full h-32 p-2 border border-gray-300 rounded-md resize-y"
                            placeholder="Paste your academic data here (e.g., 'Mathematics,25,60,85,A,70,1,1,Excellent;Consistent,Mr. Smith')"
                            value={pastedAcademicText}
                            onChange={(e) => setPastedAcademicText(e.target.value)}
                        ></textarea>
                        <button
                            onClick={handlePasteAcademicData}
                            className="mt-3 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                        >
                            Apply Pasted Data
                        </button>
                    </div>


                    {/* Render the ReportCard component */}
                    <ReportCard
                        initialSchoolInfo={reportCardData.schoolInfo}
                        studentInfo={reportCardData.studentInfo}
                        academicPerformance={reportCardData.academicPerformance}
                        overallSummary={reportCardData.overallSummary}
                        commentsRecommendations={reportCardData.commentsRecommendations}
                        gradingScale={reportCardData.gradingScale}
                        onSchoolNameChange={handleSchoolNameChange}
                        onSchoolAddressChange={handleSchoolAddressChange}
                        onSchoolCityPostalChange={handleSchoolCityPostalChange}
                        onSchoolPhoneChange={handleSchoolPhoneChange}
                        onSchoolEmailChange={handleSchoolEmailChange}
                        onSchoolWebsiteChange={handleSchoolWebsiteChange}
                        onSchoolLogoChange={handleSchoolLogoChange}
                        onAcademicPerformanceChange={handleAcademicPerformanceChange}
                        onRemoveSubject={handleRemoveSubject}
                        onStudentInfoChange={handleStudentInfoChange} // Pass the single handler
                        onOverallSummaryChange={handleOverallSummaryChange} // Pass the single handler
                        onCommentsRecommendationsChange={handleCommentsRecommendationsChange} // Pass the single handler
                        onGradingScaleChange={handleGradingScaleChange}
                        onRemoveGradingScaleEntry={handleRemoveGradingScaleEntry}
                        isPrintView={false} // This manager view is always editable
                    />

                    <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default ReportCardManagerPage;
