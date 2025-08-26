"use client";

import { getContact } from "@/components/api/contact";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, Phone, MessageSquare, MapPin, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  description: string;
  createdAt: string;
  isActive: boolean;
  firstName: string;
  lastName: string;
  subject: string;
};

export default function ContactPage() {
  const [contactData, setContactData] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const getContactData = async () => {
      try {
        setIsLoading(true);
        const data = await getContact();
        setContactData(data.payload.data);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    getContactData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contact Submission</h1>
          <p className="text-muted-foreground">Submit your query and stay connected.</p>
        </div>
      </div>

      <div className="rounded-md border">
        {contactData.length === 0 ? (
          <div className="text-center py-12 bg-card">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">No contact submissions</h3>
            <p className="mt-1 text-sm text-muted-foreground">No one has submitted the contact form yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sr. No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Submitted On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contactData.map((submission, index) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    {submission.firstName} {submission.lastName}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{submission.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {submission.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{submission.phone}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-default">
                          {submission.subject?.length > 30 
                            ? `${submission.subject.substring(0, 30)}...` 
                            : submission.subject}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{submission.subject}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="font-medium max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-default">
                          {submission.description?.length > 40 
                            ? `${submission.description.substring(0, 40)}...` 
                            : submission.description}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md">
                        <p className="whitespace-pre-wrap break-words">{submission.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(submission.createdAt)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}
