"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  CalendarClock,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  createNewBatch,
  updateBatch,
  deleteBatch,
  getAllBatch,
  getCourses,
} from "@/components/api/course";
import { getAllCenters } from "@/components/api/banner";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BatchDatePickerRow } from "@/components/course/BatchDatePickerRow";
import { format } from "path";

interface Batch {
  centerId?: any;
  _id?: string;
  startDate: string;
  endDate: string;
  courseId: string;
  time: string | null;
  meetingLink?: string | null;
  [key: string]: any;
}

export default function CourseBatches() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const courseId = params.courseId as string;
  const batchType = searchParams.get("type");

  const [courseName, setCourseName] = useState("");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [batchErrors, setBatchErrors] = useState<Record<number, any>>({});
  const [centers, setCenters] = useState<any[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<any>(null);

  const validateBatch = (batch: Batch) => {
    const err: Record<string, string> = {};

    // Required field validations
    if (!batch.startDate) err.startDate = "Start date is required";
    if (!batch.endDate) err.endDate = "End date is required";
    if (!batch.time) err.time = "Time is required";

    // Batch type specific validations
    if (batchType === "physical") {
      if (!batch.centerId) err.centerId = "Center is required";
    } else if (batchType === "live") {
      if (!batch.meetingLink) {
        err.meetingLink = "Meeting link is required";
      } else if (!isValidUrl(batch.meetingLink)) {
        err.meetingLink = "Please enter a valid URL";
      }
    }

    // Date validations
    if (batch.startDate && batch.endDate) {
      const start = new Date(batch.startDate);
      const end = new Date(batch.endDate);

      if (start > end) {
        err.endDate = "End date must be after start date";
      }

      // Ensure start date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (start < today) {
        err.startDate = "Start date cannot be in the past";
      }
    }

    // Batch sequence validation
    if (batch.startDate) {
      const currentStart = new Date(batch.startDate).toDateString();
      const hasDuplicate = batches.some(
        (b) =>
          b._id !== batch._id &&
          new Date(b.startDate).toDateString() === currentStart
      );

      if (hasDuplicate) {
        err.startDate = "Another batch already starts on this date";
      }
    }

    // Time format validation
    if (batch.time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(batch.time)) {
      err.time = "Please enter a valid time in 24-hour format (HH:MM)";
    }

    setBatchErrors({ 0: err });
    return err;
  };

  // Helper function to validate URLs
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const fetchCenters = async () => {
    try {
      const response = await getAllCenters();
      if (response.success) {
        setCenters(response.payload?.data || []);
      } else throw new Error(response.message);
    } catch (err) {
      console.error("Error loading centers:", err);
      toast.error("Failed to load centers");
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await getAllBatch(courseId);
      if (response.success) {
        const allBatches = response.payload?.data || [];
        const courseBatches = allBatches.filter((b: any) =>
          typeof b.courseId === "object"
            ? b.courseId?._id === courseId
            : b.courseId === courseId
        );
        setBatches(courseBatches);
      } else throw new Error(response.message);
    } catch (err) {
      console.error("Error loading batches:", err);
      toast.error("Failed to load batches");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseName = async () => {
    try {
      const res = await getCourses();
      const course = res.payload?.data?.find((c: any) => c._id === courseId);
      if (course) setCourseName(course.CourseName);
    } catch (err) {
      console.error("Error fetching course:", err);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchBatches();
      fetchCourseName();
      fetchCenters();
    }
  }, [courseId]);

  const formatDate = (dateStr: any) =>
    new Date(dateStr).toLocaleDateString("en-GB", {
      timeZone: "UTC",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const formatTime = (timeStr: string | null): string => {
    if (!timeStr) return "N/A";
    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const handleSaveBatch = async (batch: Batch) => {
    const validationErrors = validateBatch(batch);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix validation errors before saving");
      return;
    }

    setIsSubmitting(true);
    try {
      const batchPayload = {
        startDate: new Date(batch.startDate).toISOString().split("T")[0],
        endDate: new Date(batch.endDate).toISOString().split("T")[0],
        courseId,
        ...(batch.time ? { time: batch.time } : { time: null }),
        ...(batchType === "physical" &&
          selectedCenter?._id && {
            centerId: selectedCenter._id,
          }),
        ...(batchType === "live" && {
          meetingLink: batch.meetingLink || null,
        }),
      };
      if (selectedBatch?._id) {
        const res = await updateBatch(selectedBatch._id, batchPayload);
        if (res.success) {
          toast.success("Batch updated successfully");
          await fetchBatches();
        } else {
          toast.error(res.message || "Failed to update batch");
        }
      } else {
        const payload = {
          batch: [batchPayload],
        };
        const res = await createNewBatch(payload);
        if (res.success) {
          toast.success("Batch created successfully");
          await fetchBatches();
        } else {
          toast.error(res.message || "Failed to create batch");
        }
      }
      setIsDialogOpen(false);
      setSelectedBatch(null);
      setBatchErrors({});
    } catch (err) {
      toast.error("Error saving batch");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBatch = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await deleteBatch(id);
      if (res.success) {
        toast.success("Batch deleted successfully");
        setBatches((prev) => prev.filter((b) => b._id !== id));
      } else toast.error(res.message || "Failed to delete batch");
    } catch (err) {
      toast.error("Error deleting batch");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  console.log(selectedBatch);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="text-base font-semibold">Back to Courses</span>
        </Button>

        <Button
          onClick={() => {
            setBatchErrors({});
            setSelectedBatch({
              _id: undefined,
              startDate: "",
              endDate: "",
              courseId,
              time: null,
              meetingLink: null,
            });
            setIsDialogOpen(true);
          }}
        >
          <CalendarClock className="mr-2 h-4 w-4" /> Add Batch
        </Button>
      </div>

      {/* BATCH LIST */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {courseName || "Batches"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No batches yet</p>
              <p className="text-sm text-muted-foreground">
                Get started by adding your first batch
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {batches.map((batch, index) => (
                <Card
                  key={batch._id}
                  className="relative group transition-shadow hover:shadow-lg"
                >
                  <CardHeader className="px-0 pl-4 border-b">
                    <CardTitle className="text-lg font-medium">
                      Batch {index + 1}
                    </CardTitle>
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setBatchErrors({});
                          setSelectedBatch(batch);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedBatch(batch);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2  gap-y-2">
                      {batchType === "physical" && (
                        <>
                          <span className="text-sm font-medium text-gray-500">
                            Center:
                          </span>
                          <span className="text-sm">
                            {batch.centerId
                              ? centers?.find(
                                  (c) =>
                                    c._id ===
                                    (typeof batch.centerId === "string"
                                      ? batch.centerId
                                      : batch.centerId?._id)
                                )?.centerName || "N/A"
                              : "N/A"}
                          </span>
                        </>
                      )}

                      <span className="text-sm font-medium text-gray-500">
                        Start Date:
                      </span>
                      <span className="text-sm">
                        {formatDate(batch.startDate)}
                      </span>

                      <span className="text-sm font-medium text-gray-500">
                        End Date:
                      </span>
                      <span className="text-sm">
                        {formatDate(batch.endDate)}
                      </span>

                      <span className="text-sm font-medium text-gray-500">
                        Time:
                      </span>
                      <span className="text-sm">{formatTime(batch.time)}</span>

                      {batchType === "live" && (
                        <>
                          <span className="text-sm font-medium text-gray-500">
                            Meeting Link:
                          </span>

                          <span
                            rel="noopener noreferrer"
                            className="text-blue-600 break-all"
                          >
                            {batch.meetingLink || "N/A"}
                          </span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedBatch?._id ? "Edit Batch" : "Add New Batch"}
            </DialogTitle>
          </DialogHeader>

          <BatchDatePickerRow
            key={selectedBatch?._id || "new"}
            index={0}
            location={batchType === "physical" ? true : false}
            link={batchType === "live" ? true : false}
            batch={
              selectedBatch || {
                startDate: "",
                endDate: "",
                courseId,
                time: "",
                meetingLink: "",
                centerId: "",
              }
            }
            updateBatch={(index, key, value) => {
              setSelectedBatch((prev: any) => ({
                ...prev,
                [key]: value,
              }));
            }}
            setSelectedCenter={setSelectedCenter}
            centers={centers}
            // removeBatch={() => setIsDialogOpen(false)}
            errors={batchErrors[0]}
          />

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const batchToSave = selectedBatch || {
                  startDate: "",
                  endDate: "",
                  courseId,
                  time: "",
                  meetingLink: "",
                  centerId: "",
                };
                // Ensure time is properly passed from the selectedBatch
                if (selectedBatch?.time) {
                  batchToSave.time = selectedBatch.time;
                }
                handleSaveBatch(batchToSave);
              }}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : selectedBatch?._id
                ? "Update Batch"
                : "Create Batch"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Batch</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive" className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <AlertDescription>
              Are you sure you want to delete this batch? This action cannot be
              undone.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={() => handleDeleteBatch(selectedBatch?._id as string)}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
