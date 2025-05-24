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

// Define the structure for a student
interface Student {
  id: number;
  name: string;
  studentClass: string;
}

// Define the structure for a payment record
interface PaymentRecord {
  id: number;
  amount: number;
  date: string; // Date of payment in YYYY-MM-DD format
}

// Define the structure for a fee item, linked to a student
interface Fee {
  id: number;
  studentId: number; // Link to the student
  name: string; // e.g., Tuition Fee, Library Fee
  amount: number; // Total amount due
  amountPaid: number; // Amount already paid
  payments: PaymentRecord[]; // Array to store individual payment records
}

// Component to manage and display the fee payment system
const FeePaymentSystem: React.FC = () => {
  // State to manage the list of students
  const [students, setStudents] = React.useState<Student[]>([

  ]);

  // State to manage the list of fees
  const [fees, setFees] = React.useState<Fee[]>([

  ]);

  // State to manage the search term for filtering students
  const [searchTerm, setSearchTerm] = React.useState<string>('');

  // State to manage the input value for payments for each fee item
  const [paymentInputs, setPaymentInputs] = React.useState<{ [key: number]: number }>({});

  // State to track the currently selected student ID (null for list view)
  const [selectedStudentId, setSelectedStudentId] = React.useState<number | null>(null);

  // State for adding a new student
  const [newStudentName, setNewStudentName] = React.useState<string>('');
  const [newStudentClass, setNewStudentClass] = React.useState<string>('');

  // State for adding a new fee type
  const [newFeeName, setNewFeeName] = React.useState<string>('');
  const [newFeeDefaultAmount, setNewFeeDefaultAmount] = React.useState<number>(0);

  // State to track which fee is currently being edited (feeId or null)
  const [editingFeeId, setEditingFeeId] = React.useState<number | null>(null);
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


  // Function to handle input changes for payment amounts
  const handlePaymentInputChange = (feeId: number, value: string) => {
    const amount = parseFloat(value);
    setPaymentInputs({
      ...paymentInputs,
      [feeId]: isNaN(amount) ? 0 : amount, // Store 0 if input is not a valid number
    });
  };

  // Function to record a payment for a specific fee
  const recordPayment = (feeId: number) => {
    const paymentAmount = paymentInputs[feeId] || 0; // Get the amount from state, default to 0
    const currentFee = fees.find(fee => fee.id === feeId);

    if (paymentAmount <= 0 || !currentFee) {
      console.log("Please enter a valid payment amount.");
      return;
    }

    const newAmountPaid = Math.min(currentFee.amountPaid + paymentAmount, currentFee.amount);
    const paymentDate = new Date().toISOString().slice(0, 10); // Get current date in YYYY-MM-DD

    const newPaymentRecord: PaymentRecord = {
      id: currentFee.payments.length > 0 ? Math.max(...currentFee.payments.map(p => p.id)) + 1 : 1,
      amount: paymentAmount,
      date: paymentDate,
    };

    setFees(fees.map(fee => {
      if (fee.id === feeId) {
        return {
          ...fee,
          amountPaid: newAmountPaid,
          payments: [...fee.payments, newPaymentRecord],
        };
      }
      return fee;
    }));

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
  };

  // Function to add a new student
  const addStudent = () => {
    if (!newStudentName || !newStudentClass) {
      console.log("Please enter both student name and class.");
      return;
    }
    const newStudent: Student = {
      id: students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1,
      name: newStudentName,
      studentClass: newStudentClass,
    };
    setStudents([...students, newStudent]);
    setNewStudentName('');
    setNewStudentClass('');
    console.log(`Added new student: ${newStudent.name}`);
  };

  // Function to add a new fee type to all students
  const addFeeTypeToAllStudents = () => {
    if (!newFeeName || newFeeDefaultAmount <= 0) {
      console.log("Please enter a valid fee name and amount.");
      return;
    }

    const newFeesForStudents: Fee[] = students.map(student => ({
      id: fees.length > 0 ? Math.max(...fees.map(f => f.id)) + 1 + students.indexOf(student) : 1 + students.indexOf(student), // Generate unique IDs
      studentId: student.id,
      name: newFeeName,
      amount: newFeeDefaultAmount,
      amountPaid: 0,
      payments: [], // Initialize payments array for new fees
    }));

    setFees([...fees, ...newFeesForStudents]);
    setNewFeeName('');
    setNewFeeDefaultAmount(0);
    console.log(`Added '${newFeeName}' fee for all students.`);
  };

  // Function to delete a student and their associated fees
  const deleteStudent = (studentId: number) => {
    // Remove the student from the students state
    setStudents(students.filter(student => student.id !== studentId));
    // Remove all fees associated with the deleted student
    setFees(fees.filter(fee => fee.studentId !== studentId));
    // If the deleted student was the one currently selected, return to the list view
    if (selectedStudentId === studentId) {
      setSelectedStudentId(null);
    }
    console.log(`Deleted student with ID: ${studentId}`);
  };

  // Function to start editing a fee
  const startEditingFee = (fee: Fee) => {
    setEditingFeeId(fee.id);
    setEditingFeeAmount(fee.amount);
  };

  // Function to handle changes in the editing fee amount input
  const handleEditingFeeAmountChange = (value: string) => {
    const amount = parseFloat(value);
    setEditingFeeAmount(isNaN(amount) ? 0 : amount);
  };

  // Function to save the edited fee amount for a single student
  const saveEditedFee = (feeId: number) => {
    if (editingFeeAmount <= 0) {
      console.log("Please enter a valid amount for the fee.");
      return;
    }

    setFees(fees.map(fee => {
      if (fee.id === feeId) {
        // Ensure amountPaid doesn't exceed the new total amount
        const newAmountPaid = Math.min(fee.amountPaid, editingFeeAmount);
        return { ...fee, amount: editingFeeAmount, amountPaid: newAmountPaid };
      }
      return fee;
    }));
    setEditingFeeId(null); // Exit editing mode
    setEditingFeeAmount(0); // Reset editing amount
    console.log(`Saved edited amount for fee ID: ${feeId}`);
  };

  // Function to cancel editing a fee
  const cancelEditingFee = () => {
    setEditingFeeId(null); // Exit editing mode
    setEditingFeeAmount(0); // Reset editing amount
  };

  // Function to update the amount for a specific fee type for all students
  const updateFeeForAllStudents = () => {
    if (!selectedFeeTypeToEdit || newAmountForAll <= 0) {
      console.log("Please select a fee type and enter a valid amount.");
      return;
    }

    setFees(fees.map(fee => {
      if (fee.name === selectedFeeTypeToEdit) {
        // Update the amount and ensure amountPaid doesn't exceed the new amount
        const newAmountPaid = Math.min(fee.amountPaid, newAmountForAll);
        return { ...fee, amount: newAmountForAll, amountPaid: newAmountPaid };
      }
      return fee;
    }));

    console.log(`Updated amount for fee type '${selectedFeeTypeToEdit}' to ₵${newAmountForAll.toFixed(2)} for all students.`);
    // Optionally reset the selection and input after updating
    setSelectedFeeTypeToEdit('');
    setNewAmountForAll(0);
  };

  // Function to clear all data
  const clearAllData = () => {
    if (window.confirm("Are you sure you want to clear all student and fee data? This action cannot be undone.")) {
      setStudents([]);
      setFees([]);
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
      console.log("All data cleared.");
    }
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

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Fee Payment System</h2>

      {/* Clear All Data Button */}
      <div className="mb-4 text-right">
        <button
          onClick={clearAllData}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
        >
          Clear All Data
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
        />
      </div>

      {/* Receipt Display */}
      {receiptDetails && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
          <p className="font-bold">Payment Receipt</p>
          <p>Student: {receiptDetails.studentName}</p>
          <p>Fee Type: {receiptDetails.feeName}</p>
          <p>Amount Paid: ₵{receiptDetails.amountPaid.toFixed(2)}</p>
          <p>Date: {receiptDetails.paymentDate}</p>
          <p>Total Fee: ₵{receiptDetails.totalAmount.toFixed(2)}</p>
          <p>Balance Remaining: ₵{receiptDetails.balance.toFixed(2)}</p>
          <button
            onClick={() => setReceiptDetails(null)}
            className="mt-2 px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
          >
            Close Receipt
          </button>
        </div>
      )}


      {/* Conditional Rendering: Show student list or selected student details */}
      {selectedStudentId === null ? (
        // Student List View
        <>
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
              />
              <input
                type="number"
                placeholder="Default Amount (₵)" // Updated placeholder
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newFeeDefaultAmount > 0 ? newFeeDefaultAmount : ''} // Use '' for empty display if 0
                onChange={(e) => setNewFeeDefaultAmount(parseFloat(e.target.value) || 0)} // Parse and default to 0
                min="0"
              />
              <button
                onClick={addFeeTypeToAllStudents}
                className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
              >
                Add Fee Type
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
                disabled={!selectedFeeTypeToEdit} // Disable if no fee type is selected
              />
              <button
                onClick={updateFeeForAllStudents}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
                disabled={!selectedFeeTypeToEdit || newAmountForAll <= 0} // Disable if no fee type selected or amount is invalid
              >
                Update Fee for All
              </button>
            </div>
          </div>


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
              />
              <input
                type="text"
                placeholder="Student Class"
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newStudentClass}
                onChange={(e) => setNewStudentClass(e.target.value)}
              />
              <button
                onClick={addStudent}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              >
                Add Student
              </button>
            </div>
          </div>


          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Students</h3>
            <div className="bg-white shadow rounded-lg p-4">
              {filteredStudents.length === 0 ? (
                <p className="text-gray-600">No students found.</p>
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
                        className="flex items-center justify-between py-3 border-b last:border-b-0 flex-wrap gap-2" // Added flex-wrap and gap
                      >
                        <div className="flex-1 min-w-[200px] cursor-pointer hover:bg-gray-50 p-2 rounded-md" onClick={() => setSelectedStudentId(student.id)}> {/* Made this section clickable */}
                          <p className="text-lg font-medium">{student.name}</p>
                          <p className="text-sm text-gray-500">{student.studentClass}</p>
                        </div>
                        <div className="flex items-center gap-3"> {/* Container for status and delete button */}
                          <span className={`font-semibold ${studentOutstanding <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {studentOutstanding <= 0 ? 'All Fees Paid' : `₵${studentOutstanding.toFixed(2)} Outstanding`} {/* Updated currency symbol */}
                          </span>
                          {/* Replaced button with icon */}
                          <span
                            onClick={(e) => { // Use a separate onClick for the icon
                              e.stopPropagation(); // Prevent the list item's onClick from firing
                              deleteStudent(student.id);
                            }}
                            className="text-red-500 cursor-pointer hover:text-red-700 text-xl font-bold" // Styled as a clickable icon
                            title="Delete Student" // Add a tooltip
                          >
                            &times; {/* '×' character for a simple close/delete icon */}
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
                <p className="text-gray-600">No fees found for this student.</p>
              ) : (
                <ul>
                  {selectedStudentFees.map(fee => {
                    const isFullyPaid = fee.amountPaid >= fee.amount;
                    const outstandingAmount = fee.amount - fee.amountPaid;

                    return (
                      <li key={fee.id} className="flex items-center justify-between py-3 border-b last:border-b-0 flex-wrap gap-2">
                        <div className="flex-1 min-w-[200px]">
                          <p className="text-lg font-medium">{fee.name}</p>
                          <p className="text-sm text-gray-500">
                            {/* Conditional rendering for editing mode */}
                            {editingFeeId === fee.id ? (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-700">Amount Due: ₵</span>
                                <input
                                  type="number"
                                  className="w-24 px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  value={editingFeeAmount}
                                  onChange={(e) => handleEditingFeeAmountChange(e.target.value)}
                                  min="0"
                                />
                                <button
                                  onClick={() => saveEditedFee(fee.id)}
                                  className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 text-sm"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditingFee}
                                  className="px-3 py-1 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50 text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              // Display mode
                              <p className="text-sm text-gray-500">
                                Amount Due: ₵{fee.amount.toFixed(2)} | Paid: ₵{fee.amountPaid.toFixed(2)}
                                {/* Edit button */}
                                <button
                                  onClick={() => startEditingFee(fee)}
                                  className="ml-2 text-blue-500 hover:text-blue-700 text-sm focus:outline-none"
                                >
                                  Edit
                                </button>
                              </p>
                            )}
                          </p>
                          {fee.payments.length > 0 && (
                            <div className="mt-2 text-xs text-gray-600">
                              <p className="font-semibold">Payment History:</p>
                              {fee.payments.map(payment => (
                                <p key={payment.id}>
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
                          {/* Show payment input and button only if not fully paid AND not currently editing */}
                          {!isFullyPaid && editingFeeId !== fee.id && (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                placeholder="Amount (₵)" // Updated placeholder
                                className="w-24 px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={paymentInputs[fee.id] || ''}
                                onChange={(e) => handlePaymentInputChange(fee.id, e.target.value)}
                                min="0"
                                max={outstandingAmount.toFixed(2)}
                              />
                              <button
                                onClick={() => recordPayment(fee.id)}
                                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm"
                              >
                                Record Payment
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
      <AppSidebar/>
      <SidebarInset>
        {/* Header with Breadcrumb */}
        <header className="flex h-16 items-center gap-2 border-b px-4">
          {/* Sidebar trigger button */}
          <SidebarTrigger className="-ml-1"/>
          {/* Separator */}
          <Separator orientation="vertical" className="mr-2 h-4" />
          {/* Breadcrumb navigation */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="#">Dashboard</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator/>
              <BreadcrumbItem><BreadcrumbPage>Fee Payment</BreadcrumbPage></BreadcrumbItem>
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
