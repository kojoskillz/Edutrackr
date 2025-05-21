"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { AppSidebar } from "@/components/app-sidebar";

export default function BulkMessageForm() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [viaEmail, setViaEmail] = useState(true);
  const [viaSMS, setViaSMS] = useState(false);
  const [rawInput, setRawInput] = useState("");
  const [students, setStudents] = useState<
    // Updated type definition to swap email and phone order
    { name: string; class: string; phone: string; email: string }[]
  >([]);

  const handleParse = () => {
    const lines = rawInput
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const parsed = lines.map((line) => {
      // Swapping the order of email and phone during parsing
      const [name, className, phone, email] = line.split(",");
      return {
        name: name?.trim() || "",
        class: className?.trim() || "",
        phone: phone?.trim() || "", // Phone is now the third element
        email: email?.trim() || "", // Email is now the fourth element
      };
    });

    setStudents(parsed);
  };

  const handleSend = () => {
    if (students.length === 0) {
      // Using a custom message box instead of alert()
      // In a real application, you'd render a modal or toast notification here.
      console.warn("No student data to send to.");
      return;
    }

    students.forEach((student) => {
      if (viaEmail && student.email) {
        console.log(
          `Email sent to ${student.email} (Parent of ${student.name}): Subject: ${subject} | Message: ${body}`
        );
      }
      if (viaSMS && student.phone) {
        console.log(
          `SMS sent to ${student.phone} (Parent of ${student.name}): Message: ${body}`
        );
      }
    });

    // Using a custom message box instead of alert()
    console.log("Messages sent! Check console logs.");
  };

  // New function to clear all form data
  const handleClear = () => {
    setSubject("");
    setBody("");
    setRawInput("");
    setStudents([]);
    console.log("All form data cleared.");
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Announcement</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="p-4 bg-white rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">Send Bulk Message to Parents</h2>
          <Input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mb-3"
          />
          <Textarea
            placeholder="Enter your message..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mb-3"
          />
          <div className="flex items-center space-x-4 mb-4">
            <label className="flex items-center space-x-2">
              <Checkbox
                checked={viaEmail}
                onCheckedChange={(checked) => setViaEmail(checked === true)}
              />
              <span>Email</span>
            </label>
            <label className="flex items-center space-x-2">
              <Checkbox
                checked={viaSMS}
                onCheckedChange={(checked) => setViaSMS(checked === true)}
              />
              <span>SMS/WhatsApp</span>
            </label>
          </div>

          <Textarea
            // Updated placeholder to reflect new input order
            placeholder="Paste: Name, Class, Phone, Email"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            className="mb-3 h-32"
          />
          <Button variant="outline" className="mb-4" onClick={handleParse}>
            Parse Contact List
          </Button>

          {/* New Clear Data Button */}
          <Button variant="destructive" className="mb-4 ml-2" onClick={handleClear}>
            Clear All Data
          </Button>

          <Button className="bg-blue-600 hover:bg-blue-500 ml-2" onClick={handleSend}>
            Send Message
          </Button>
        </div>

        {students.length > 0 && (
          <div className="mt-6 p-4 bg-white rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-3">Parsed Student Contact List</h3>
            <div className="overflow-auto max-h-60 border rounded-lg p-3 bg-gray-50">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="p-2">Name</th>
                    <th className="p-2">Class</th>
                    {/* Swapped table headers */}
                    <th className="p-2">Phone</th>
                    <th className="p-2">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">{s.name}</td>
                      <td className="p-2">{s.class}</td>
                      {/* Swapped table data cells */}
                      <td className="p-2">{s.phone}</td>
                      <td className="p-2">{s.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
// This code is a React component that allows users to send bulk messages to parents of students.
// It includes a form for entering the subject and body of the message, as well as options for sending via email or SMS.