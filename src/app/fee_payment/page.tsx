/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import * as React from "react";
// Assuming AppSidebar, Breadcrumb components, etc., are correctly imported
// from your components library.
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
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Supabase imports
import { createClient } from '@supabase/supabase-js'; // Import Supabase client creator

// Import PrintIcon for the print button
import PrintIcon from '@mui/icons-material/Print';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Type Definitions ---

// Define the structure for a student row in Supabase
interface Student {
    id: string; // Supabase row ID
    name: string;
    studentClass: string;
    user_id: string; // Changed from userId to user_id
}

// Define the structure for a payment record within a fee document
interface PaymentRecord {
    amount: number;
    date: string; // Date of payment in ISO-MM-DD format
}

// Define the structure for a fee row in Supabase
interface Fee {
    id: string; // Supabase row ID
    studentId: string; // Link to the student's Supabase row ID
    name: string; // e.g., Tuition Fee, Library Fee
    amount: number; // Total amount due
    amountPaid: number; // Amount already paid
    payments: PaymentRecord[]; // Array to store individual payment records (JSONB in Supabase)
    user_id: string; // Changed from userId to user_id
}

// Component to manage and display the fee payment system
const FeePaymentSystem: React.FC = () => {
    // --- Supabase State ---
    const [user_id, setUser_id] = React.useState<string | null>(null); // Changed from userId to user_id
    const [isAuthReady, setIsAuthReady] = React.useState(false); // To track if auth state is determined

    // --- Application Data State ---
    const [students, setStudents] = React.useState<Student[]>([]);
    const [fees, setFees] = React.useState<Fee[]>([]);

    // --- UI State ---
    const [searchTerm, setSearchTerm] = React.useState<string>('');
    const [paymentInputs, setPaymentInputs] = React.useState<{ [key: string]: number }>({}); // Key is fee.id (string)
    const [selectedStudentId, setSelectedStudentId] = React.useState<string | null>(null); // Student ID is now string

    // State for adding a new student
    const [newStudentName, setNewStudentName] = React.useState<string>('');
    const [newStudentClass, setNewStudentClass] = React.useState<string>('');

    // State for adding a new fee type
    const [newFeeName, setNewFeeName] = React.useState<string>('');
    const [newFeeDefaultAmount, setNewFeeDefaultAmount] = React.useState<number>(0);

    // State to track which fee is currently being edited (feeId or null)
    const [editingFeeId, setEditingFeeId] = React.useState<string | null>(null); // feeId is string
    // State to hold the value of the fee amount input while editing
    const [editingFeeAmount, setEditingFeeAmount] = React.useState<number>(0);
    // State for editing fee amount for all students
    const [selectedFeeTypeToEdit, setSelectedFeeTypeToEdit] = React.useState<string>('');
    const [newAmountForAll, setNewAmountForAll] = React.useState<number>(0);

    // State for receipt generation
    const [receiptDetails, setReceiptDetails] = React.useState<{
        studentName: string;
        feeName: string;
        amountPaid: number;
        paymentDate: string;
        balance: number;
        totalAmount: number;
    } | null>(null);
    // Loading states
    const [isLoadingStudents, setIsLoadingStudents] = React.useState(true);
    const [isLoadingFees, setIsLoadingFees] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);


    // --- Supabase Authentication ---
    React.useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                console.log("Auth State Changed: User is logged in", session.user.id);
                setUser_id(session.user.id); // Changed from setUserId to setUser_id
            } else {
                console.log("Auth State Changed: No user session. Attempting anonymous sign-in.");
                try {
                    const { data, error } = await supabase.auth.signInAnonymously();
                    if (error) {
                        console.error("Supabase anonymous sign-in failed:", error.message);
                        toast.error("Failed to sign in to Supabase. Please try again.");
                        setUser_id(null); // Changed from setUserId to setUser_id
                    } else if (data.user) {
                        console.log("Anonymous user signed in:", data.user.id);
                        setUser_id(data.user.id); // Changed from setUserId to setUser_id
                    } else {
                        console.warn("Anonymous sign-in returned no user data.");
                        setUser_id(null); // Changed from setUserId to setUser_id
                    }
                } catch (error: any) { // Catch any unexpected errors during anonymous sign-in
                    console.error("Supabase anonymous sign-in failed (catch block):", error.message);
                    toast.error("Failed to sign in to Supabase. Please try again.");
                    setUser_id(null); // Changed from setUserId to setUser_id
                }
            }
            setIsAuthReady(true); // Auth state determined
        });

        // Initial check for session on component mount
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                console.log("Initial session check: User is logged in", session.user.id);
                setUser_id(session.user.id); // Changed from setUserId to setUser_id
            } else {
                console.log("Initial session check: No active session.");
            }
            setIsAuthReady(true);
        });

        return () => {
            authListener.subscription.unsubscribe(); // Cleanup auth listener
        };
    }, []); // Run once on component mount

    // --- Supabase Data Listeners (Students & Fees) ---
    React.useEffect(() => {
        if (!user_id || !isAuthReady) {
            console.log("Data listener skipped: user_id or auth not ready.", { user_id, isAuthReady });
            return; // Wait for Supabase and auth to be ready
        }

        console.log(`Setting up real-time listeners for user_id: ${user_id}`);

        const fetchStudents = async () => {
            setIsLoadingStudents(true);
            console.log(`Fetching students for user_id: ${user_id}`);
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('user_id', user_id); // Changed from userId to user_id

            if (error) {
                console.error("Error fetching students:", error.message);
                toast.error("Failed to load students.");
            } else {
                console.log("Students fetched:", data);
                setStudents(data as Student[]);
            }
            setIsLoadingStudents(false);
        };

        const fetchFees = async () => {
            setIsLoadingFees(true);
            console.log(`Fetching fees for user_id: ${user_id}`);
            const { data, error } = await supabase
                .from('fees')
                .select('*')
                .eq('user_id', user_id); // Changed from userId to user_id

            if (error) {
                console.error("Error fetching fees:", error.message);
                toast.error("Failed to load fees.");
            } else {
                console.log("Fees fetched:", data);
                setFees(data as Fee[]);
            }
            setIsLoadingFees(false);
        };

        // Initial fetch when user_id becomes available
        fetchStudents();
        fetchFees();

        // Set up real-time subscriptions
        const studentsChannel = supabase
            .channel('public:students_changes') // Use a unique channel name
            .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, (payload) => {
                console.log("Realtime student change detected:", payload);
                if (payload.new && (payload.new as Student).user_id === user_id) { // Changed from userId to user_id
                    if (payload.eventType === 'INSERT') {
                        setStudents(prev => [...prev, payload.new as Student]);
                        toast.info(`New student added: ${(payload.new as Student).name}`);
                    } else if (payload.eventType === 'UPDATE') {
                        setStudents(prev => prev.map(s => s.id === (payload.new as Student).id ? (payload.new as Student) : s));
                        toast.info(`Student updated: ${(payload.new as Student).name}`);
                    } else if (payload.eventType === 'DELETE') {
                        setStudents(prev => prev.filter(s => s.id !== (payload.old as Student).id));
                        toast.info(`Student deleted: ${(payload.old as Student).name}`);
                    }
                }
            })
            .subscribe();

        const feesChannel = supabase
            .channel('public:fees_changes') // Use a unique channel name
            .on('postgres_changes', { event: '*', schema: 'public', table: 'fees' }, (payload) => {
                console.log("Realtime fee change detected:", payload);
                if (payload.new && (payload.new as Fee).user_id === user_id) { // Changed from userId to user_id
                    if (payload.eventType === 'INSERT') {
                        setFees(prev => [...prev, payload.new as Fee]);
                        toast.info(`New fee added: ${(payload.new as Fee).name}`);
                    } else if (payload.eventType === 'UPDATE') {
                        setFees(prev => prev.map(f => f.id === (payload.new as Fee).id ? (payload.new as Fee) : f));
                        toast.info(`Fee updated: ${(payload.new as Fee).name}`);
                    } else if (payload.eventType === 'DELETE') {
                        setFees(prev => prev.filter(f => f.id !== (payload.old as Fee).id));
                        toast.info(`Fee deleted: ${(payload.old as Fee).name}`);
                    }
                }
            })
            .subscribe();

        // Cleanup listeners on unmount or when dependencies change
        return () => {
            console.log("Cleaning up Supabase channels.");
            supabase.removeChannel(studentsChannel);
            supabase.removeChannel(feesChannel);
        };
    }, [user_id, isAuthReady]); // Re-run if user_id, or authReady changes


    // --- Functions to handle input changes for payment amounts ---
    const handlePaymentInputChange = (feeId: string, value: string) => {
        const amount = parseFloat(value);
        setPaymentInputs({
            ...paymentInputs,
            [feeId]: isNaN(amount) ? 0 : amount, // Store 0 if input is not a valid number
        });
    };

    // --- Function to record a payment for a specific fee (Supabase) ---
    const recordPayment = async (feeId: string) => {
        if (!user_id || isSaving) {
            console.warn("Record payment skipped: user_id or isSaving not ready.", { user_id, isSaving });
            toast.error("User not authenticated or a save operation is already in progress.");
            return;
        }
        const paymentAmount = paymentInputs[feeId] || 0;
        const currentFee = fees.find(fee => fee.id === feeId);
        if (paymentAmount <= 0 || !currentFee) {
            toast.error("Please enter a valid payment amount.");
            return;
        }

        setIsSaving(true);
        try {
            const newAmountPaid = Math.min(currentFee.amountPaid + paymentAmount, currentFee.amount);
            const paymentDate = new Date().toISOString().slice(0, 10);
            const newPaymentRecord: PaymentRecord = {
                amount: paymentAmount,
                date: paymentDate,
            };

            // Update the row in Supabase
            const { error } = await supabase
                .from('fees')
                .update({
                    amountPaid: newAmountPaid,
                    payments: [...currentFee.payments, newPaymentRecord], // Append new payment to JSONB array
                })
                .eq('id', feeId)
                .eq('user_id', user_id); // Changed from userId to user_id

            if (error) throw error;

            // Set receipt details
            const student = students.find(s => s.id === currentFee.studentId);
            if (student) {
                setReceiptDetails({
                    studentName: student.name,
                    feeName: currentFee.name,
                    amountPaid: paymentAmount,
                    paymentDate: paymentDate,
                    balance: currentFee.amount - newAmountPaid,
                    totalAmount: currentFee.amount,
                });
            }

            // Clear the input field after recording the payment
            setPaymentInputs({
                ...paymentInputs,
                [feeId]: 0,
            });
            toast.success("Payment recorded successfully!");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Error recording payment:", error.message);
            toast.error(`Failed to record payment: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    // --- Function to add a new student (Supabase) ---
    const addStudent = async () => {
        if (!user_id || isSaving) {
            console.warn("Add student skipped: user_id or isSaving not ready.", { user_id, isSaving });
            toast.error("User not authenticated or a save operation is already in progress.");
            return;
        }
        const trimmedName = newStudentName.trim();
        const trimmedClass = newStudentClass.trim();

        if (!trimmedName || !trimmedClass) {
            toast.error("Please enter both student name and class.");
            return;
        }

        setIsSaving(true);
        try {
            console.log(`Attempting to add student for user_id: ${user_id}`);
            const { error } = await supabase
                .from('students')
                .insert({
                    name: trimmedName,
                    studentClass: trimmedClass,
                    user_id: user_id, // Changed from userId to user_id
                });

            if (error) throw error;

            setNewStudentName('');
            setNewStudentClass('');
            toast.success(`Added new student: ${trimmedName}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Error adding student:", error.message);
            toast.error(`Failed to add student: ${error.message}. Check RLS policies for 'students' table.`);
        } finally {
            setIsSaving(false);
        }
    };

    // --- Function to add a new fee type to all students (Supabase) ---
    const addFeeTypeToAllStudents = async () => {
        if (!user_id || isSaving) {
            console.warn("Add fee type skipped: user_id or isSaving not ready.", { user_id, isSaving });
            toast.error("User not authenticated or a save operation is already in progress.");
            return;
        }
        const trimmedFeeName = newFeeName.trim();
        if (!trimmedFeeName || newFeeDefaultAmount <= 0) {
            toast.error("Please enter a valid fee name and amount.");
            return;
        }
        if (students.length === 0) {
            toast.info("No students available to assign this fee type to. Please add students first.");
            return;
        }

        setIsSaving(true);
        try {
            console.log(`Attempting to add fee type '${trimmedFeeName}' for all students for user_id: ${user_id}`);
            const feeRecords = students.map(student => ({
                studentId: student.id,
                name: trimmedFeeName,
                amount: newFeeDefaultAmount,
                amountPaid: 0,
                payments: [],
                user_id: user_id, // Changed from userId to user_id
            }));

            const { error } = await supabase
                .from('fees')
                .insert(feeRecords);

            if (error) throw error;

            setNewFeeName('');
            setNewFeeDefaultAmount(0);
            toast.success(`Added '${trimmedFeeName}' fee for all students.`);
        } catch (error: any) {
            console.error("Error adding fee type to all students:", error.message);
            toast.error(`Failed to add fee type for all students: ${error.message}. Check RLS policies for 'fees' table.`);
        } finally {
            setIsSaving(false);
        }
    };

    // --- Function to delete a student and their associated fees (Supabase) ---
    const deleteStudent = async (studentId: string) => {
        if (!user_id || isSaving) return;
        if (!window.confirm("Are you sure you want to delete this student and all their associated fees? This action cannot be undone.")) {
            return;
        }

        setIsSaving(true);
        try {
            console.log(`Attempting to delete student ${studentId} and associated fees for user_id: ${user_id}`);
            // Delete all fees associated with the deleted student first (due to foreign key constraints if you set them up)
            const { error: deleteFeesError } = await supabase
                .from('fees')
                .delete()
                .eq('studentId', studentId)
                .eq('user_id', user_id); // Changed from userId to user_id

            if (deleteFeesError) throw deleteFeesError;

            // Delete the student row
            const { error: deleteStudentError } = await supabase
                .from('students')
                .delete()
                .eq('id', studentId)
                .eq('user_id', user_id); // Changed from userId to user_id

            if (deleteStudentError) throw deleteStudentError;

            // If the deleted student was the one currently selected, return to the list view
            if (selectedStudentId === studentId) {
                setSelectedStudentId(null);
            }
            toast.success("Student and all associated fees deleted.");
        } catch (error: any) {
            console.error("Error deleting student and fees:", error.message);
            toast.error(`Failed to delete student and fees: ${error.message}. Check RLS policies.`);
        } finally {
            setIsSaving(false);
        }
    };

    // --- Function to start editing a fee (UI state only) ---
    const startEditingFee = (fee: Fee) => {
        setEditingFeeId(fee.id);
        setEditingFeeAmount(fee.amount);
    };

    // --- Function to handle changes in the editing fee amount input ---
    const handleEditingFeeAmountChange = (value: string) => {
        const amount = parseFloat(value);
        setEditingFeeAmount(isNaN(amount) ? 0 : amount);
    };

    // --- Function to save the edited fee amount for a single student (Supabase) ---
    const saveEditedFee = async (feeId: string) => {
        if (!user_id || isSaving) return;
        if (editingFeeAmount <= 0) {
            toast.error("Please enter a valid amount for the fee.");
            return;
        }

        setIsSaving(true);
        try {
            console.log(`Attempting to save edited fee ${feeId} for user_id: ${user_id}`);
            const currentFee = fees.find(f => f.id === feeId);

            // Ensure amountPaid doesn't exceed the new total amount
            const newAmountPaid = currentFee ?
                Math.min(currentFee.amountPaid, editingFeeAmount) : 0;

            const { error } = await supabase
                .from('fees')
                .update({
                    amount: editingFeeAmount,
                    amountPaid: newAmountPaid,
                })
                .eq('id', feeId)
                .eq('user_id', user_id); // Changed from userId to user_id

            if (error) throw error;

            setEditingFeeId(null); // Exit editing mode
            setEditingFeeAmount(0); // Reset editing amount
            toast.success("Fee amount updated successfully!");
        } catch (error: any) {
            console.error("Error saving edited fee:", error.message);
            toast.error(`Failed to save edited fee: ${error.message}. Check RLS policies.`);
        } finally {
            setIsSaving(false);
        }
    };

    // --- Function to cancel editing a fee (UI state only) ---
    const cancelEditingFee = () => {
        setEditingFeeId(null); // Exit editing mode
        setEditingFeeAmount(0); // Reset editing amount
    };

    // --- Function to update the amount for a specific fee type for all students (Supabase) ---
    const updateFeeForAllStudents = async () => {
        if (!user_id || isSaving) return;
        const trimmedFeeType = selectedFeeTypeToEdit.trim();
        if (!trimmedFeeType || newAmountForAll <= 0) {
            toast.error("Please select a fee type and enter a valid amount.");
            return;
        }

        setIsSaving(true);
        try {
            console.log(`Attempting to update fee type '${trimmedFeeType}' for all students for user_id: ${user_id}`);
            // Fetch all fees matching the fee type for the current user
            const { data: feesToUpdate, error: fetchError } = await supabase
                .from('fees')
                .select('*')
                .eq('name', trimmedFeeType)
                .eq('user_id', user_id); // Changed from userId to user_id

            if (fetchError) throw fetchError;

            // Prepare batch updates
            const batchPromises = feesToUpdate.map(async (feeData: Fee) => {
                const newAmountPaid = Math.min(feeData.amountPaid, newAmountForAll);
                return supabase
                    .from('fees')
                    .update({
                        amount: newAmountForAll,
                        amountPaid: newAmountPaid,
                    })
                    .eq('id', feeData.id)
                    .eq('user_id', user_id); // Changed from userId to user_id
            });

            // Execute all updates concurrently
            const results = await Promise.all(batchPromises);

            // Check for errors in batch updates
            const hasErrors = results.some(result => result.error);
            if (hasErrors) {
                console.error("Errors occurred during batch update:", results);
                toast.error("Failed to update some fees for all students.");
            } else {
                toast.success(`Updated amount for fee type '${trimmedFeeType}' to ₵${newAmountForAll.toFixed(2)} for all students.`);
            }

            // Optionally reset the selection and input after updating
            setSelectedFeeTypeToEdit('');
            setNewAmountForAll(0);
        } catch (error: any) {
            console.error("Error updating fee for all students:", error.message);
            toast.error(`Failed to update fee for all students: ${error.message}. Check RLS policies.`);
        } finally {
            setIsSaving(false);
        }
    };

    // --- Function to clear all data (Supabase) ---
    const clearAllData = async () => {
        if (!user_id || isSaving) return;
        if (!window.confirm("Are you sure you want to clear all student and fee data? This action cannot be undone.")) {
            return;
        }

        setIsSaving(true);
        try {
            console.log(`Attempting to clear all data for user_id: ${user_id}`);
            // Delete all fees first (due to potential foreign key constraints)
            const { error: deleteFeesError } = await supabase
                .from('fees')
                .delete()
                .eq('user_id', user_id); // Changed from userId to user_id

            if (deleteFeesError) throw deleteFeesError;

            // Delete all students
            const { error: deleteStudentsError } = await supabase
                .from('students')
                .delete()
                .eq('user_id', user_id); // Changed from userId to user_id

            if (deleteStudentsError) throw deleteStudentsError;

            // Reset UI states
            setSelectedStudentId(null);
            setSearchTerm('');
            setNewStudentName('');
            setNewStudentClass('');
            setNewFeeName('');
            setNewFeeDefaultAmount(0);
            setEditingFeeId(null);
            setEditingFeeAmount(0);
            setSelectedFeeTypeToEdit('');
            setNewAmountForAll(0);
            setReceiptDetails(null);
            setPaymentInputs({});

            toast.success("All data cleared successfully!");
        } catch (error: any) {
            console.error("Error clearing all data:", error.message);
            toast.error(`Failed to clear all data: ${error.message}. Check RLS policies.`);
        } finally {
            setIsSaving(false);
        }
    };

    // --- Function to handle printing the receipt ---
    const handlePrintReceipt = () => {
        console.log("Attempting to print receipt. Current receiptDetails:", receiptDetails);
        if (!receiptDetails) {
            toast.error("No receipt details available to print. Please record a payment first.");
            return;
        }

        // Create a new window for printing
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            toast.error("Could not open print window. Please allow pop-ups.");
            return;
        }

        // Construct the HTML for the receipt
        const receiptHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payment Receipt</title>
                <style>
                    body {
                        font-family: 'Inter', sans-serif;
                        margin: 20px;
                        color: #000;
                        background-color: #fff;
                    }
                    h3 {
                        font-size: 1.5rem;
                        font-weight: bold;
                        margin-bottom: 1rem;
                        text-align: center;
                    }
                    p {
                        font-size: 1rem;
                        margin-bottom: 0.5rem;
                    }
                    strong {
                        font-weight: 600;
                    }
                    /* Basic styling for the receipt content */
                    .receipt-content {
                        border: 1px solid #ccc;
                        padding: 20px;
                        border-radius: 8px;
                        max-width: 500px;
                        margin: 0 auto; /* Center the receipt on the page */
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    }
                </style>
            </head>
            <body>
                <div class="receipt-content">
                    <h3>Payment Receipt</h3>
                    <p><strong>Student:</strong> ${receiptDetails.studentName}</p>
                    <p><strong>Fee Type:</strong> ${receiptDetails.feeName}</p>
                    <p><strong>Amount Paid:</strong> ₵${receiptDetails.amountPaid.toFixed(2)}</p>
                    <p><strong>Date:</strong> ${receiptDetails.paymentDate}</p>
                    <p><strong>Total Fee:</strong> ₵${receiptDetails.totalAmount.toFixed(2)}</p>
                    <p><strong>Balance Remaining:</strong> ₵${receiptDetails.balance.toFixed(2)}</p>
                </div>
            </body>
            </html>
        `;

        // Write the HTML to the new window
        printWindow.document.write(receiptHtml);
        printWindow.document.close(); // Close the document to ensure content is loaded

        // Wait for content to load, then print
        printWindow.onload = () => {
            printWindow.focus(); // Focus the new window
            printWindow.print(); // Trigger print
            printWindow.close(); // Close the window after printing
        };
    };


    // Get unique fee names for the dropdown
    const uniqueFeeNames = Array.from(new Set(fees.map(fee => fee.name)));
    // Filter students based on the search term
    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentClass.toLowerCase().includes(searchTerm.toLowerCase())
    );
    // Get the selected student's details
    const selectedStudent = students.find(student => student.id === selectedStudentId);
    // Get fees for the selected student
    const selectedStudentFees = fees.filter(fee => fee.studentId === selectedStudentId);
    // Show loading indicator if data is being fetched or saved
    if (!isAuthReady || isLoadingStudents || isLoadingFees) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-lg text-gray-700">Loading data...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            {/* The global print styles are now handled by the new window approach,
                so we don't need the complex media print rules here.
                We only need the print-hide classes on elements that should not be visible
                when the receipt is displayed on the main page.
            */}

            <h2 className="text-2xl font-semibold mb-4">Fee Payment System</h2>

            {/* Clear All Data Button */}
            <div className="mb-4 text-right">
                <button
                    onClick={clearAllData}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50"
                    disabled={isSaving}
                >
                    {isSaving ? 'Clearing...' : 'Clear All Data'}
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search student by name or class..."
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={isSaving}
                />
            </div>

            {/* Receipt Display */}
            {receiptDetails && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-md" role="alert">
                    {/* This div is for displaying the receipt on the main page */}
                    <h3 className="font-bold text-xl mb-2">Payment Receipt</h3>
                    <p><strong>Student:</strong> {receiptDetails.studentName}</p>
                    <p><strong>Fee Type:</strong> {receiptDetails.feeName}</p>
                    <p><strong>Amount Paid:</strong> ₵{receiptDetails.amountPaid.toFixed(2)}</p>
                    <p><strong>Date:</strong> {receiptDetails.paymentDate}</p>
                    <p><strong>Total Fee:</strong> ₵{receiptDetails.totalAmount.toFixed(2)}</p>
                    <p><strong>Balance Remaining:</strong> ₵{receiptDetails.balance.toFixed(2)}</p>

                    <div> {/* Buttons for closing and printing */}
                        <button
                            onClick={() => setReceiptDetails(null)}
                            className="mt-2 px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                        >
                            Close Receipt
                        </button>
                        <button
                            onClick={handlePrintReceipt}
                            className="mt-2 ml-2 px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        >
                            <PrintIcon style={{ fontSize: 16, marginRight: 4 }} /> Print Receipt
                        </button>
                    </div>
                </div>
            )}


            {/* Conditional Rendering: Show student list or selected student details */}
            {selectedStudentId === null ? (
                // Student List View
                <>
                    {/* Add New Student Form */}
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-3">Add New Student</h3>
                        <div className="bg-white shadow rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                placeholder="Student Name"
                                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={newStudentName}
                                onChange={(e) => setNewStudentName(e.target.value)}
                                disabled={isSaving}
                            />
                            <input
                                type="text"
                                placeholder="Student Class"
                                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={newStudentClass}
                                onChange={(e) => setNewStudentClass(e.target.value)}
                                disabled={isSaving}
                            />
                            <button
                                onClick={addStudent}
                                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50"
                                disabled={isSaving || !newStudentName.trim() || !newStudentClass.trim()}
                            >
                                {isSaving ? 'Adding...' : 'Add Student'}
                            </button>
                        </div>
                    </div>

                    {/* Add New Fee Type Form */}
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-3">Add New Fee Type for All Students</h3>
                        <div className="bg-white shadow rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                placeholder="Fee Name (e.g., Exam Fee)"
                                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={newFeeName}
                                onChange={(e) => setNewFeeName(e.target.value)}
                                disabled={isSaving}
                            />
                            <input
                                type="number"
                                placeholder="Default Amount (₵)"
                                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={newFeeDefaultAmount > 0 ? newFeeDefaultAmount : ''}
                                onChange={(e) => setNewFeeDefaultAmount(parseFloat(e.target.value) || 0)}
                                min="0"
                                disabled={isSaving}
                            />
                            <button
                                onClick={addFeeTypeToAllStudents}
                                className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50"
                                disabled={isSaving || !newFeeName.trim() || newFeeDefaultAmount <= 0 || students.length === 0}
                            >
                                {isSaving ? 'Adding...' : 'Add Fee Type'}
                            </button>
                        </div>
                    </div>

                    {/* Edit Existing Fee Type for All Students */}
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-3">Edit Fee Amount for All Students by Type</h3>
                        <div className="bg-white shadow rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <select
                                aria-label="Select Fee Type"
                                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={selectedFeeTypeToEdit}
                                onChange={(e) => setSelectedFeeTypeToEdit(e.target.value)}
                                disabled={isSaving}
                            >
                                <option value="">-- Select Fee Type --</option>
                                {uniqueFeeNames.map(feeName => (
                                    <option key={feeName} value={feeName}>{feeName}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                placeholder="New Amount (₵)"
                                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={newAmountForAll > 0 ? newAmountForAll : ''}
                                onChange={(e) => setNewAmountForAll(parseFloat(e.target.value) || 0)}
                                min="0"
                                disabled={isSaving || !selectedFeeTypeToEdit}
                            />
                            <button
                                onClick={updateFeeForAllStudents}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
                                disabled={isSaving || !selectedFeeTypeToEdit || newAmountForAll <= 0}
                            >
                                {isSaving ? 'Updating...' : 'Update Fee for All'}
                            </button>
                        </div>
                    </div>


                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-3">Students</h3>
                        <div className="bg-white shadow rounded-lg p-4">
                            {filteredStudents.length === 0 ? (
                                <p className="text-gray-600">No students found. Add a new student above.</p>
                            ) : (
                                <ul>
                                    {filteredStudents.map(student => {
                                        // Calculate total outstanding amount for the student
                                        const studentTotalDue = fees
                                            .filter(fee => fee.studentId === student.id)
                                            .reduce((sum, fee) => sum + fee.amount, 0);
                                        const studentTotalPaid = fees
                                            .filter(fee => fee.studentId === student.id)
                                            .reduce((sum, fee) => sum + fee.amountPaid, 0);
                                        const studentOutstanding = studentTotalDue - studentTotalPaid;

                                        return (
                                            <li
                                                key={student.id}
                                                className="flex items-center justify-between py-3 border-b last:border-b-0 flex-wrap gap-2"
                                            >
                                                <div className="flex-1 min-w-[200px] cursor-pointer hover:bg-gray-50 p-2 rounded-md" onClick={() => setSelectedStudentId(student.id)}>
                                                    <p className="text-lg font-medium">{student.name}</p>
                                                    <p className="text-sm text-gray-500">{student.studentClass}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`font-semibold ${studentOutstanding <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {studentOutstanding <= 0 ? 'All Fees Paid' : `₵${studentOutstanding.toFixed(2)} Outstanding`}
                                                    </span>
                                                    <span
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteStudent(student.id);
                                                        }}
                                                        className="text-red-500 cursor-pointer hover:text-red-700 text-xl font-bold"
                                                        title="Delete Student"
                                                    >
                                                        &times;
                                                    </span>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                // Selected Student Detail View
                selectedStudent && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold">{selectedStudent.name}&apos;s Fees ({selectedStudent.studentClass})</h3>
                            <button
                                onClick={() => setSelectedStudentId(null)}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50"
                            >
                                Back to Student List
                            </button>
                        </div>

                        <div className="bg-white shadow rounded-lg p-4">
                            {selectedStudentFees.length === 0 ? (
                                <p className="text-gray-600">No fees found for this student. Add new fee types from the main student list view.</p>
                            ) : (
                                <ul>
                                    {selectedStudentFees.map(fee => {
                                        const isFullyPaid = fee.amountPaid >= fee.amount;
                                        const outstandingAmount = fee.amount - fee.amountPaid;

                                        return (
                                            <li key={fee.id} className="flex items-center justify-between py-3 border-b last:border-b-0 flex-wrap gap-2">
                                                <div className="flex-1 min-w-[200px]">
                                                    <p className="text-lg font-medium">{fee.name}</p>
                                                    {editingFeeId === fee.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-700">Amount Due: ₵</span>
                                                            <input
                                                                type="number"
                                                                className="w-24 px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                value={editingFeeAmount}
                                                                onChange={(e) => handleEditingFeeAmountChange(e.target.value)}
                                                                min="0"
                                                                disabled={isSaving}
                                                            />
                                                            <button
                                                                onClick={() => saveEditedFee(fee.id)}
                                                                className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 text-sm disabled:opacity-50"
                                                                disabled={isSaving || editingFeeAmount <= 0}
                                                            >
                                                                {isSaving ? 'Saving...' : 'Save'}
                                                            </button>
                                                            <button
                                                                onClick={cancelEditingFee}
                                                                className="px-3 py-1 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50 text-sm disabled:opacity-50"
                                                                disabled={isSaving}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500">
                                                            Amount Due: ₵{fee.amount.toFixed(2)} | Paid: ₵{fee.amountPaid.toFixed(2)}
                                                            <button
                                                                onClick={() => startEditingFee(fee)}
                                                                className="ml-2 text-blue-500 hover:text-blue-700 text-sm focus:outline-none disabled:opacity-50"
                                                                disabled={isSaving}
                                                            >
                                                                Edit
                                                            </button>
                                                        </p>
                                                    )}
                                                    {fee.payments.length > 0 && (
                                                        <div className="mt-2 text-xs text-gray-600">
                                                            <p className="font-semibold">Payment History:</p>
                                                            {fee.payments.map((payment, index) => (
                                                                <p key={index}> {/* Using index as key for simplicity, unique IDs preferred for real apps */}
                                                                    ₵{payment.amount.toFixed(2)} on {payment.date}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`font-semibold ${isFullyPaid ? 'text-green-600' : 'text-red-600'}`}>
                                                        {isFullyPaid ? 'Fully Paid' : 'Outstanding'}
                                                    </span>
                                                    {!isFullyPaid && editingFeeId !== fee.id && (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                placeholder="Amount (₵)"
                                                                className="w-24 px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                value={paymentInputs[fee.id] || ''}
                                                                onChange={(e) => handlePaymentInputChange(fee.id, e.target.value)}
                                                                min="0"
                                                                max={outstandingAmount.toFixed(2)}
                                                                disabled={isSaving}
                                                            />
                                                            <button
                                                                onClick={() => recordPayment(fee.id)}
                                                                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm disabled:opacity-50"
                                                                disabled={isSaving || (paymentInputs[fee.id] || 0) <= 0 || (paymentInputs[fee.id] || 0) > outstandingAmount}
                                                            >
                                                                {isSaving ? 'Recording...' : 'Record Payment'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                )
            )}
        </div>
    );
};


export default function Page() {
    return (
        <SidebarProvider>
            {/* AppSidebar component */}
            <AppSidebar />
            <SidebarInset>
                {/* Header with Breadcrumb */}
                <header className="flex h-16 items-center gap-2 border-b px-4">
                    {/* Sidebar trigger button */}
                    <SidebarTrigger className="-ml-1" />
                    {/* Separator */}
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    {/* Breadcrumb navigation */}
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Fee Payment</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                {/* Main content area */}
                <div className="flex flex-1 flex-col bg-gray-100 p-4">
                    {/* Integrate the FeePaymentSystem component here */}
                    <FeePaymentSystem />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
