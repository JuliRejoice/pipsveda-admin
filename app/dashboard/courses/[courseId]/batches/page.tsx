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

interface Batch {
  centerId?: any;
  _id?: string;
  startDate: string;
  endDate: string;
  courseId: string;
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

    if (batchType === "physical") {
      if (!batch.centerId) err.centerId = "Center is required";
    }
    if (!batch.startDate) err.startDate = "Start date is required";
    if (!batch.endDate) err.endDate = "End date is required";

    if (batch.startDate && batch.endDate) {
      const start = new Date(batch.startDate);
      const end = new Date(batch.endDate);
      if (start > end) err.endDate = "End date must be after start date";
    }

    if (batch.startDate && batches.length > 0) {
      const currentStart = new Date(batch.startDate);

      const latestStart = batches
        .filter((b) => b._id !== batch._id)
        .reduce((latest, b) => {
          const bStart = new Date(b.startDate);
          return bStart > latest ? bStart : latest;
        }, new Date(0));

      if (currentStart <= latestStart) {
        err.startDate =
          "Start date must be after all previous batch start dates";
      }
    }

    setBatchErrors({ 0: err });
    return err;
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
        ...(batchType === "physical" &&
          selectedCenter?._id && {
            centerId: selectedCenter._id,
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
                  <CardHeader className="pb-0">
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
                    {batchType === "physical" && (
                      <p className="text-sm">
                        <span className="font-medium">Center:</span>{" "}
                        {batch.centerId
                          ? centers?.find(
                              (c) =>
                                c._id ===
                                (typeof batch.centerId === "string"
                                  ? batch.centerId
                                  : batch.centerId?._id)
                            )?.centerName || "N/A"
                          : "N/A"}
                      </p>
                    )}
                    <p className="text-sm">
                      <span className="font-medium">Start Date:</span>{" "}
                      {formatDate(batch.startDate)}
                    </p>

                    <p className="text-sm">
                      <span className="font-medium">End Date:</span>{" "}
                      {formatDate(batch.endDate)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ADD / EDIT DIALOG */}
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
            batch={
              selectedBatch || {
                startDate: "",
                endDate: "",
                courseId,
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
              onClick={() =>
                handleSaveBatch(
                  selectedBatch || { startDate: "", endDate: "", courseId }
                )
              }
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
