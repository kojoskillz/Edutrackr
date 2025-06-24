/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

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
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createClient } from '@supabase/supabase-js';
import PrintIcon from '@mui/icons-material/Print';
import * as XLSX from 'xlsx';
import 'jspdf-autotable';
import FilterListIcon from '@mui/icons-material/FilterList';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Student {
    id: string;
    name: string;
    studentClass: string;
    user_id: string;
}

interface PaymentRecord {
    amount: number;
    date: string;
}

interface Fee {
    id: string;
    studentId: string;
    name: string;
    amount: number;
    amountPaid: number;
    payments: PaymentRecord[];
    user_id: string;
}

const FeePaymentSystem: React.FC = () => {
    const [user_id, setUser_id] = React.useState<string | null>(null);
    const [isAuthReady, setIsAuthReady] = React.useState(false);
    const [students, setStudents] = React.useState<Student[]>([]);
    const [fees, setFees] = React.useState<Fee[]>([]);
    const [searchTerm, setSearchTerm] = React.useState<string>('');
    const [paymentInputs, setPaymentInputs] = React.useState<{ [key: string]: number }>({});
    const [selectedStudentId, setSelectedStudentId] = React.useState<string | null>(null);
    const [newStudentName, setNewStudentName] = React.useState<string>('');
    const [newStudentClass, setNewStudentClass] = React.useState<string>('');
    const [newFeeName, setNewFeeName] = React.useState<string>('');
    const [newFeeDefaultAmount, setNewFeeDefaultAmount] = React.useState<number>(0);
    const [editingFeeId, setEditingFeeId] = React.useState<string | null>(null);
    const [editingFeeAmount, setEditingFeeAmount] = React.useState<number>(0);
    const [selectedFeeTypeToEdit, setSelectedFeeTypeToEdit] = React.useState<string>('');
    const [newAmountForAll, setNewAmountForAll] = React.useState<number>(0);
    const [receiptDetails, setReceiptDetails] = React.useState<{
        studentName: string;
        feeName: string;
        amountPaid: number;
        paymentDate: string;
        balance: number;
        totalAmount: number;
    } | null>(null);
    const [isLoadingStudents, setIsLoadingStudents] = React.useState(true);
    const [isLoadingFees, setIsLoadingFees] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [totalFeesPaid, setTotalFeesPaid] = React.useState<number>(0);
    const [paymentFilter, setPaymentFilter] = React.useState<'all' | 'paid' | 'unpaid'>('all');

    React.useEffect(() => {
        const total = fees.reduce((sum, fee) => sum + fee.amountPaid, 0);
        setTotalFeesPaid(total);
    }, [fees]);

    React.useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                setUser_id(session.user.id);
            } else {
                try {
                    const { data, error } = await supabase.auth.signInAnonymously();
                    if (error) {
                        console.error("Supabase anonymous sign-in failed:", error.message);
                        toast.error("Failed to sign in to Supabase. Please try again.");
                        setUser_id(null);
                    } else if (data.user) {
                        setUser_id(data.user.id);
                    } else {
                        setUser_id(null);
                    }
                } catch (error: any) {
                    console.error("Supabase anonymous sign-in failed (catch block):", error.message);
                    toast.error("Failed to sign in to Supabase. Please try again.");
                    setUser_id(null);
                }
            }
            setIsAuthReady(true);
        });

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setUser_id(session.user.id);
            }
            setIsAuthReady(true);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    React.useEffect(() => {
        if (!user_id || !isAuthReady) return;

        const fetchStudents = async () => {
            setIsLoadingStudents(true);
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('user_id', user_id);

            if (error) {
                console.error("Error fetching students:", error.message);
                toast.error("Failed to load students.");
            } else {
                setStudents(data as Student[]);
            }
            setIsLoadingStudents(false);
        };

        const fetchFees = async () => {
            setIsLoadingFees(true);
            const { data, error } = await supabase
                .from('fees')
                .select('*')
                .eq('user_id', user_id);

            if (error) {
                console.error("Error fetching fees:", error.message);
                toast.error("Failed to load fees.");
            } else {
                setFees(data as Fee[]);
            }
            setIsLoadingFees(false);
        };

        fetchStudents();
        fetchFees();

        const studentsChannel = supabase
            .channel('public:students_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, (payload) => {
                if (payload.new && (payload.new as Student).user_id === user_id) {
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
            .channel('public:fees_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'fees' }, (payload) => {
                if (payload.new && (payload.new as Fee).user_id === user_id) {
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

        return () => {
            supabase.removeChannel(studentsChannel);
            supabase.removeChannel(feesChannel);
        };
    }, [user_id, isAuthReady]);

    const handlePaymentInputChange = (feeId: string, value: string) => {
        const amount = parseFloat(value);
        setPaymentInputs({
            ...paymentInputs,
            [feeId]: isNaN(amount) ? 0 : amount,
        });
    };

    const recordPayment = async (feeId: string) => {
        if (!user_id || isSaving) return;
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

            const { error } = await supabase
                .from('fees')
                .update({
                    amountPaid: newAmountPaid,
                    payments: [...currentFee.payments, newPaymentRecord],
                })
                .eq('id', feeId)
                .eq('user_id', user_id);

            if (error) throw error;

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

            setPaymentInputs({
                ...paymentInputs,
                [feeId]: 0,
            });
            toast.success("Payment recorded successfully!");
        } catch (error: any) {
            console.error("Error recording payment:", error.message);
            toast.error(`Failed to record payment: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const addStudent = async () => {
        if (!user_id || isSaving) return;
        const trimmedName = newStudentName.trim();
        const trimmedClass = newStudentClass.trim();

        if (!trimmedName || !trimmedClass) {
            toast.error("Please enter both student name and class.");
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('students')
                .insert({
                    name: trimmedName,
                    studentClass: trimmedClass,
                    user_id: user_id,
                });

            if (error) throw error;

            setNewStudentName('');
            setNewStudentClass('');
            toast.success(`Added new student: ${trimmedName}`);
        } catch (error: any) {
            console.error("Error adding student:", error.message);
            toast.error(`Failed to add student: ${error.message}. Check RLS policies for 'students' table.`);
        } finally {
            setIsSaving(false);
        }
    };

    const deleteStudent = async (studentId: string) => {
        if (!user_id || isSaving) return;
        if (!window.confirm("Are you sure you want to delete this student and all their associated fees? This action cannot be undone.")) {
            return;
        }

        setIsSaving(true);
        try {
            const { error: deleteFeesError } = await supabase
                .from('fees')
                .delete()
                .eq('studentId', studentId)
                .eq('user_id', user_id);

            if (deleteFeesError) throw deleteFeesError;

            const { error: deleteStudentError } = await supabase
                .from('students')
                .delete()
                .eq('id', studentId)
                .eq('user_id', user_id);

            if (deleteStudentError) throw deleteStudentError;

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

    const startEditingFee = (fee: Fee) => {
        setEditingFeeId(fee.id);
        setEditingFeeAmount(fee.amount);
    };

    const handleEditingFeeAmountChange = (value: string) => {
        const amount = parseFloat(value);
        setEditingFeeAmount(isNaN(amount) ? 0 : amount);
    };

    const saveEditedFee = async (feeId: string) => {
        if (!user_id || isSaving) return;
        if (editingFeeAmount <= 0) {
            toast.error("Please enter a valid amount for the fee.");
            return;
        }

        setIsSaving(true);
        try {
            const currentFee = fees.find(f => f.id === feeId);
            const newAmountPaid = currentFee ?
                Math.min(currentFee.amountPaid, editingFeeAmount) : 0;

            const { error } = await supabase
                .from('fees')
                .update({
                    amount: editingFeeAmount,
                    amountPaid: newAmountPaid,
                })
                .eq('id', feeId)
                .eq('user_id', user_id);

            if (error) throw error;

            setEditingFeeId(null);
            setEditingFeeAmount(0);
            toast.success("Fee amount updated successfully!");
        } catch (error: any) {
            console.error("Error saving edited fee:", error.message);
            toast.error(`Failed to save edited fee: ${error.message}. Check RLS policies.`);
        } finally {
            setIsSaving(false);
        }
    };

    const cancelEditingFee = () => {
        setEditingFeeId(null);
        setEditingFeeAmount(0);
    };

    const updateFeeForAllStudents = async () => {
        if (!user_id || isSaving) return;
        const trimmedFeeType = selectedFeeTypeToEdit.trim();
        if (!trimmedFeeType || newAmountForAll <= 0) {
            toast.error("Please select a fee type and enter a valid amount.");
            return;
        }

        setIsSaving(true);
        try {
            const { data: feesToUpdate, error: fetchError } = await supabase
                .from('fees')
                .select('*')
                .eq('name', trimmedFeeType)
                .eq('user_id', user_id);

            if (fetchError) throw fetchError;

            const batchPromises = feesToUpdate.map(async (feeData: Fee) => {
                const newAmountPaid = Math.min(feeData.amountPaid, newAmountForAll);
                return supabase
                    .from('fees')
                    .update({
                        amount: newAmountForAll,
                        amountPaid: newAmountPaid,
                    })
                    .eq('id', feeData.id)
                    .eq('user_id', user_id);
            });

            const results = await Promise.all(batchPromises);
            const hasErrors = results.some(result => result.error);
            if (hasErrors) {
                console.error("Errors occurred during batch update:", results);
                toast.error("Failed to update some fees for all students.");
            } else {
                toast.success(`Updated amount for fee type '${trimmedFeeType}' to ₵${newAmountForAll.toFixed(2)} for all students.`);
            }

            setSelectedFeeTypeToEdit('');
            setNewAmountForAll(0);
        } catch (error: any) {
            console.error("Error updating fee for all students:", error.message);
            toast.error(`Failed to update fee for all students: ${error.message}. Check RLS policies.`);
        } finally {
            setIsSaving(false);
        }
    };

    const clearAllData = async () => {
        if (!user_id || isSaving) return;
        if (!window.confirm("Are you sure you want to clear all student and fee data? This action cannot be undone.")) {
            return;
        }

        setIsSaving(true);
        try {
            const { error: deleteFeesError } = await supabase
                .from('fees')
                .delete()
                .eq('user_id', user_id);

            if (deleteFeesError) throw deleteFeesError;

            const { error: deleteStudentsError } = await supabase
                .from('students')
                .delete()
                .eq('user_id', user_id);

            if (deleteStudentsError) throw deleteStudentsError;

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

    const handlePrintReceipt = () => {
        if (!receiptDetails) {
            toast.error("No receipt details available to print. Please record a payment first.");
            return;
        }

        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            toast.error("Could not open print window. Please allow pop-ups.");
            return;
        }

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
                    .receipt-content {
                        border: 1px solid #ccc;
                        padding: 20px;
                        border-radius: 8px;
                        max-width: 500px;
                        margin: 0 auto;
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

        printWindow.document.write(receiptHtml);
        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        };
    };

    const addFeeTypeToAllStudents = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        if (!user_id || isSaving) {
            toast.error("User not authenticated or a save operation is already in progress.");
            return;
        }
        const trimmedFeeName = newFeeName.trim();
        if (!trimmedFeeName || newFeeDefaultAmount <= 0) {
            toast.error("Please enter a valid fee name and amount.");
            return;
        }
        if (students.length === 0) {
            toast.error("No students available to assign the fee.");
            return;
        }

        setIsSaving(true);
        try {
            const newFees = students.map(student => ({
                studentId: student.id,
                name: trimmedFeeName,
                amount: newFeeDefaultAmount,
                amountPaid: 0,
                payments: [],
                user_id: user_id,
            }));

            const { error } = await supabase
                .from('fees')
                .insert(newFees);

            if (error) throw error;

            setNewFeeName('');
            setNewFeeDefaultAmount(0);
            toast.success(`Added fee type "${trimmedFeeName}" for all students.`);
        } catch (error: any) {
            console.error("Error adding fee type to all students:", error.message);
            toast.error(`Failed to add fee type: ${error.message}. Check RLS policies for 'fees' table.`);
        } finally {
            setIsSaving(false);
        }
    };

    const exportToExcel = () => {
        const data = students.map(student => {
            const studentFees = fees.filter(fee => fee.studentId === student.id);
            const totalDue = studentFees.reduce((sum, fee) => sum + fee.amount, 0);
            const totalPaid = studentFees.reduce((sum, fee) => sum + fee.amountPaid, 0);
            const balance = totalDue - totalPaid;
            const paymentStatus = balance <= 0 ? 'Paid' : 'Unpaid';

            return {
                'Student Name': student.name,
                'Class': student.studentClass,
                'Total Fees Due (₵)': totalDue,
                'Total Paid (₵)': totalPaid,
                'Balance (₵)': balance,
                'Payment Status': paymentStatus,
                'Last Payment Date': studentFees.flatMap(f => f.payments)
                    .reduce((latest, payment) => {
                        return payment.date > latest ? payment.date : latest;
                    }, '') || 'No payments'
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Fee Payments');
        XLSX.writeFile(workbook, 'fee_payments.xlsx');
    };


    const uniqueFeeNames = Array.from(new Set(fees.map(fee => fee.name)));
    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentClass.toLowerCase().includes(searchTerm.toLowerCase())
    ).filter(student => {
        if (paymentFilter === 'all') return true;
        
        const studentFees = fees.filter(fee => fee.studentId === student.id);
        const totalDue = studentFees.reduce((sum, fee) => sum + fee.amount, 0);
        const totalPaid = studentFees.reduce((sum, fee) => sum + fee.amountPaid, 0);
        const balance = totalDue - totalPaid;
        
        return paymentFilter === 'paid' ? balance <= 0 : balance > 0;
    });
    const selectedStudent = students.find(student => student.id === selectedStudentId);
    const selectedStudentFees = fees.filter(fee => fee.studentId === selectedStudentId);

    if (!isAuthReady || isLoadingStudents || isLoadingFees) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-lg text-gray-700">Loading data...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-semibold mb-4">Fee Payment System</h2>

            {/* Summary Card */}
            <div className="mb-6 bg-white shadow rounded-lg p-4">
                <h3 className="text-xl font-semibold mb-3">Fee Collection Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-md">
                        <p className="text-sm text-blue-600">Total Students</p>
                        <p className="text-2xl font-bold">{students.length}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-md">
                        <p className="text-sm text-green-600">Total Fees Paid</p>
                        <p className="text-2xl font-bold">₵{totalFeesPaid.toFixed(2)}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-md">
                        <p className="text-sm text-purple-600">Total Outstanding</p>
                        <p className="text-2xl font-bold">
                            ₵{(fees.reduce((sum, fee) => sum + fee.amount, 0) - totalFeesPaid).toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Export and Clear Data Buttons */}
            <div className="mb-4 flex justify-between">
                <div className="flex gap-2">
                    <button
                        onClick={exportToExcel}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50"
                        disabled={isSaving || students.length === 0}
                    >
                        Export to Excel
                    </button>
                    {/* <button
                        onClick={exportToPDF}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50"
                        disabled={isSaving || students.length === 0}
                    >
                        Export to PDF
                    </button> */}
                </div>
                
                <button
                    onClick={clearAllData}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50"
                    disabled={isSaving}
                >
                    {isSaving ? 'Clearing...' : 'Clear All Data'}
                </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="mb-4 flex gap-2">
                <input
                    type="text"
                    placeholder="Search student by name or class..."
                    className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={isSaving}
                />
                <div className="relative">
                    <button
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50 flex items-center gap-2"
                        onClick={() => setPaymentFilter(prev => {
                            if (prev === 'all') return 'paid';
                            if (prev === 'paid') return 'unpaid';
                            return 'all';
                        })}
                    >
                        <FilterListIcon style={{ fontSize: 18 }} />
                        {paymentFilter === 'all' ? 'All Students' : paymentFilter === 'paid' ? 'Paid Only' : 'Unpaid Only'}
                    </button>
                </div>
            </div>

            {/* Receipt Display */}
            {receiptDetails && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-md" role="alert">
                    <h3 className="font-bold text-xl mb-2">Payment Receipt</h3>
                    <p><strong>Student:</strong> {receiptDetails.studentName}</p>
                    <p><strong>Fee Type:</strong> {receiptDetails.feeName}</p>
                    <p><strong>Amount Paid:</strong> ₵{receiptDetails.amountPaid.toFixed(2)}</p>
                    <p><strong>Date:</strong> {receiptDetails.paymentDate}</p>
                    <p><strong>Total Fee:</strong> ₵{receiptDetails.totalAmount.toFixed(2)}</p>
                    <p><strong>Balance Remaining:</strong> ₵{receiptDetails.balance.toFixed(2)}</p>

                    <div>
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

                    {/* Bulk Update Fees */}
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-3">Bulk Update Fees</h3>
                        <div className="bg-white shadow rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
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
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAmountForAll(parseFloat(e.target.value) || 0)}
                                min="0"
                                disabled={isSaving || !selectedFeeTypeToEdit}
                            />
                            <button
                                onClick={updateFeeForAllStudents}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
                                disabled={isSaving || !selectedFeeTypeToEdit || newAmountForAll <= 0}
                            >
                                {isSaving ? 'Updating...' : 'Update Amount'}
                            </button>
                            <button
                                onClick={async () => {
                                    if (!selectedFeeTypeToEdit) return;
                                    if (!window.confirm(`Are you sure you want to delete "${selectedFeeTypeToEdit}" for all students?`)) return;
                                    
                                    setIsSaving(true);
                                    try {
                                        const { error } = await supabase
                                            .from('fees')
                                            .delete()
                                            .eq('name', selectedFeeTypeToEdit)
                                            .eq('user_id', user_id);
                                        
                                        if (error) throw error;
                                        
                                        toast.success(`Deleted fee type "${selectedFeeTypeToEdit}" for all students`);
                                        setSelectedFeeTypeToEdit('');
                                    } catch (error: any) {
                                        toast.error(`Failed to delete fee: ${error.message}`);
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }}
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50"
                                disabled={isSaving || !selectedFeeTypeToEdit}
                            >
                                {isSaving ? 'Deleting...' : 'Delete Fee Type'}
                            </button>
                        </div>
                    </div>

                    {/* All Payments History */}
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-3">All Payments History</h3>
                        <div className="bg-white shadow rounded-lg p-4">
                            {fees.filter(f => f.payments.length > 0).length === 0 ? (
                                <p className="text-gray-600">No payment history found.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Type</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {fees.flatMap(fee => {
                                                const student = students.find(s => s.id === fee.studentId);
                                                return fee.payments.map((payment, index) => (
                                                    <tr key={`${fee.id}-${index}`}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {student?.name || 'Unknown Student'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {fee.name}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            ₵{payment.amount.toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {payment.date}
                                                        </td>
                                                    </tr>
                                                ));
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Students List */}
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-3">Students</h3>
                        <div className="bg-white shadow rounded-lg p-4">
                            {filteredStudents.length === 0 ? (
                                <p className="text-gray-600">No students found. Add a new student above.</p>
                            ) : (
                                <ul>
                                    {filteredStudents.map(student => {
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
                                className="px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
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
                                                                <p key={index}>
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
                                <BreadcrumbPage>Fee Payment</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <div className="flex flex-1 flex-col bg-gray-100 p-4">
                    <FeePaymentSystem />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
