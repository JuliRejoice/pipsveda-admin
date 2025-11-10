"use client";

import { getContact } from "@/components/api/contact";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Mail,
  Phone,
  MessageSquare,
  MapPin,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataTablePagination } from "@/components/ui/DataTablePagination";

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
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    const getContactData = async () => {
      try {
        setIsLoading(true);
        const data = await getContact();
        const allContacts = data.payload.data || [];
        setTotalItems(allContacts.length);

        // Calculate total pages
        setTotalPages(Math.ceil(allContacts.length / itemsPerPage));

        // Slice current page data
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        setContactData(allContacts.slice(start, end));
      } catch (error) {
        console.error("Error fetching contacts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getContactData();
  }, [currentPage, itemsPerPage]);

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
    <>
      <TooltipProvider>
        <div className="space-y-6 mb-5">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Contact Submission
              </h1>
              <p className="text-gray-900">
                View and manage submitted contact queries.
              </p>
            </div>
          </div>

          <div className="rounded-md border">
            {contactData.length === 0 ? (
              <div className="text-center py-12 bg-card">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-900" />
                <h3 className="mt-4 text-lg font-medium text-foreground">
                  No contact submissions
                </h3>
                <p className="mt-1 text-sm text-gray-900">
                  No one has submitted the contact form yet.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-base">Sr. No</TableHead>
                    <TableHead className="text-base">Name</TableHead>
                    <TableHead className="text-base">Email</TableHead>
                    <TableHead className="text-base">Phone</TableHead>
                    <TableHead className="text-base">Subject</TableHead>
                    <TableHead className="text-base">Description</TableHead>
                    <TableHead className="text-base">Submitted On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contactData.map((submission, index) => {
                    const serialNumber =
                      (currentPage - 1) * itemsPerPage + (index + 1);
                    return (
                      <TableRow key={submission.id}>
                        <TableCell>{serialNumber}</TableCell>
                        <TableCell>
                          {submission.firstName} {submission.lastName}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-5 w-5 text-gray-900" />
                            <span>{submission.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {submission.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-5 w-5 text-gray-900" />
                              <span>
                                {submission.phone.startsWith("+")
                                  ? submission.phone
                                  : `+${submission.phone}`}
                              </span>
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
                                  ? `${submission.description.substring(
                                      0,
                                      40
                                    )}...`
                                  : submission.description}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md">
                              <p className="whitespace-pre-wrap break-words">
                                {submission.description}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-5 w-5 text-gray-900" />
                            <span>{formatDate(submission.createdAt)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </TooltipProvider>

      <DataTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={(value) => {
          setItemsPerPage(value);
          setCurrentPage(1);
        }}
        itemsPerPageOptions={[8, 10, 20, 30, 40, 50]}
      />
    </>
  );
}
