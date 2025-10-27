"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  ArrowLeft,
  MoreVertical,
  Upload,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  createNewBatch,
  createSession,
  deleteBatch,
  deleteSession,
  getAllBatch,
  getSession,
  updateBatch,
  updateSession,
} from "@/components/api/course";
import { Skeleton } from "@/components/ui/skeleton";

interface Session {
  _id: string;
  sessionName: string;
  description: string;
  date: string;
  time: string;
  meetingLink: string;
  sessionVideo?: string;
  image?: string;
  courseId: string;
  createdAt?: string;
  updatedAt?: string;
}

import { getCourses } from "@/components/api/course";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BatchDatePickerRow } from "@/components/course/BatchDatePickerRow";

interface CourseSessionsProps {
  params: { courseId: string };
}

interface Batch {
  _id?: string;
  startDate: string;
  endDate: string;
  courseId: string;
}

export default function CourseBatches() {
  const [courseName, setCourseName] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLiveBatchVisible, setIsLiveBatchVisible] = useState(false);
  const [liveBatches, setLiveBatches] = useState<Batch[]>([
    {
      _id: "",
      startDate: "",
      endDate: "",
      courseId: "",
    },
  ]);
  const [batchErrors, setBatchErrors] = useState<Record<number, any>>({});
  const params = useParams();
  const courseId = params.courseId as string;

  const router = useRouter();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [formData, setFormData] = useState({
    sessionName: "",
    description: "",
    date: "",
    time: "",
    meetingLink: "",
    image: null as File | null,
    courseId: params.courseId,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const validateBatches = (batches: Batch[]) => {
    const errors: Record<number, any> = {};

    batches.forEach((b, i) => {
      const err: any = {};

      if (!b.startDate) err.startDate = "Start date is required";
      if (!b.endDate) err.endDate = "End date is required";

      if (
        b.startDate &&
        b.endDate &&
        new Date(b.startDate) > new Date(b.endDate)
      ) {
        err.endDate = "End date must be after start date";
      }

      if (i > 0) {
        const prevBatch = batches[i - 1];

        if (prevBatch.startDate && b.startDate) {
          const prevStart = new Date(prevBatch.startDate);
          const currentStart = new Date(b.startDate);

          if (currentStart <= prevStart) {
            err.startDate = `Start date must be after previous batch’s start date (${prevStart.toDateString()})`;
          }
        }
      }

      errors[i] = err;
    });

    setBatchErrors(errors);
    return errors;
  };

  const handleCreateBatch = async (
    batches: Batch[],
    setBatches: React.Dispatch<React.SetStateAction<Batch[]>>
  ) => {
    try {
      const errors = validateBatches(batches);

      const hasErrors = Object.values(errors).some(
        (err) => Object.keys(err).length > 0
      );
      if (hasErrors) {
        toast.error("Please fix the batch errors before submitting.");
        return;
      }
      setIsSubmitting(true);
      const payload = {
        batch: batches.map((b) => ({
          startDate: b.startDate
            ? new Date(b.startDate).toISOString().split("T")[0]
            : null,
          endDate: b.endDate
            ? new Date(b.endDate).toISOString().split("T")[0]
            : null,
          courseId: courseId || "",
        })),
      };

      const res = await createNewBatch(payload);
      if (res.success) {
        toast.success("Batch created successfully");
        setBatches(res.payload || []);
        // setOpen(false);
      } else {
        toast.error(res.message || "Failed to create batch");
      }
    } catch (error) {
      toast.error("Failed to create batch");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBatch = async (
    id: string,
    updatedData: Batch,
    setBatches: React.Dispatch<React.SetStateAction<Batch[]>>
  ) => {
    try {
      setIsSubmitting(true);
      const res = await updateBatch(id, updatedData);
      if (res.success) {
        toast.success("Batch updated successfully");
        const updated = await getAllBatch();
        setBatches(updated.payload || []);
      } else {
        toast.error(res.message || "Failed to update batch");
      }
    } catch (error) {
      toast.error("Failed to update batch");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDeleteBatch = async (
    id: string,
    setBatches: React.Dispatch<React.SetStateAction<Batch[]>>
  ) => {
    try {
      setIsSubmitting(true);
      const res = await deleteBatch(id);
      if (res.success) {
        toast.success("Batch deleted successfully");
        setBatches((prev) => prev.filter((b) => b._id !== id));
      } else {
        toast.error(res.message || "Failed to delete batch");
      }
    } catch (error) {
      toast.error("Failed to delete batch");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleTrimInput = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (value && typeof value === "string") {
      setFormData((prev) => ({
        ...prev,
        [name]: value.trim(),
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.sessionName.trim()) {
      newErrors.sessionName = "Session name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    if (!formData.time) {
      newErrors.time = "Time is required";
    } else {
      const timeRegex =
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]\s*-\s*([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(formData.time)) {
        newErrors.time =
          "Please enter time in format HH:MM - HH:MM (e.g., 09:00 - 10:00)";
      } else {
        // Additional validation to ensure end time is after start time
        const [startTime, endTime] = formData.time.split(" - ");
        const [startHours, startMinutes] = startTime.split(":").map(Number);
        const [endHours, endMinutes] = endTime.split(":").map(Number);

        const startTotal = startHours * 60 + startMinutes;
        const endTotal = endHours * 60 + endMinutes;

        if (endTotal <= startTotal) {
          newErrors.time = "End time must be after start time";
        }
      }
    }

    // URL validation
    if (!formData.meetingLink) {
      newErrors.meetingLink = "Meeting link is required";
    } else {
      try {
        const url = new URL(formData.meetingLink);
        if (!["http:", "https:"].includes(url.protocol)) {
          newErrors.meetingLink = "URL must start with http:// or https://";
        }
        if (!url.hostname.includes(".")) {
          newErrors.meetingLink = "Please enter a valid domain name";
        }
      } catch (e) {
        newErrors.meetingLink =
          "Please enter a valid URL (e.g., https://meet.google.com/abc-xyz)";
      }
    }

    if (!selectedSession && !formData.image && !imagePreview) {
      newErrors.image = "Image is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchBatches = async () => {
    try {
      const response = await getAllBatch();

      if (response.success) {
        const allBatches = response.payload?.data || [];

        const courseBatches = allBatches.filter((batch: any) => {
          if (typeof batch.courseId === "object") {
            return batch.courseId?._id === courseId;
          }
          return batch.courseId === courseId;
        });

        setBatches(courseBatches);
      } else {
        throw new Error(response.message || "Failed to fetch batches");
      }
    } catch (error) {
      console.error("Error in fetchBatches:", error);
      toast.error("Failed to load batches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params?.courseId) {
      fetchBatches();
    }
  }, [params?.courseId]);

  ~useEffect(() => {
    const fetchCourseName = async () => {
      if (!courseName) {
        try {
          const response = await getCourses();
          const course = response.payload?.data?.find(
            (c: any) => c._id === params.courseId
          );
          if (course) {
            setCourseName(course.CourseName);
          }
        } catch (error) {
          console.error("Error fetching course details:", error);
        }
      }
    };

    fetchCourseName();
    fetchBatches();
  }, [params.courseId, courseName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();

      const currentCourseId =
        typeof params.courseId === "string" ? params.courseId : "";

      Object.entries({
        ...formData,
        courseId: currentCourseId,
      }).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, value);
        }
      });

      if (selectedSession) {
        const response = await updateSession(
          selectedSession._id,
          formDataToSend
        );

        if (response.success) {
          toast.success("Session updated successfully");
          await fetchBatches();
          setIsAddDialogOpen(false);
          setSelectedSession(null);
          return;
        } else {
          throw new Error(response.message || "Failed to update session");
        }
      } else {
        const response = await createSession(formDataToSend);

        if (response.success) {
          toast.success("Session created successfully");
          await fetchBatches();
          setIsAddDialogOpen(false);
          return;
        } else {
          throw new Error(response.message || "Failed to create session");
        }
      }

      // Reset form
      setFormData({
        sessionName: "",
        description: "",
        date: "",
        time: "",
        meetingLink: "",
        image: null,
        courseId: params.courseId,
      });
      setImagePreview(null);
      setSelectedSession(null);
      setErrors({});
    } catch (error) {
      console.error("Error saving session:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save session"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSession || isDeleting) return;

    try {
      setIsDeleting(true);
      const response = await deleteSession(selectedSession._id);

      if (response.success) {
        toast.success("Session deleted successfully");
        await fetchBatches(); // Reload sessions after delete
        setIsDeleteDialogOpen(false);
        setSelectedSession(null);
      } else {
        throw new Error(response.message || "Failed to delete session");
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete session"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          image: "Please upload a valid image (JPEG, PNG, or WebP)",
        }));
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setErrors((prev) => ({
          ...prev,
          image: "Image size should be less than 5MB",
        }));
        return;
      }

      setFormData((prev) => ({ ...prev, image: file }));
      setErrors((prev) => ({ ...prev, image: "" }));

      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (session: Session) => {
    setSelectedSession(session);
    setIsCreateMode(false);
    setFormData({
      sessionName: session.sessionName,
      description: session.description,
      date: session.date.split("T")[0],
      time: session.time,
      meetingLink: session.meetingLink,
      image: null,
      courseId: session.courseId,
    });
    if (session.image) {
      setImagePreview(session.image);
    }
    setIsAddDialogOpen(true);
  };

  // Split time string into start and end times
  const parseTimeRange = (timeString: string) => {
    if (!timeString) return { start: "", end: "" };
    const [start, end] = timeString.split(" - ");
    return { start, end };
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-base font-semibold">Back to Courses</span>
          </Button>
        </div>
        <Button
          onClick={() => {
            setLiveBatches([
              ...liveBatches,
              {
                startDate: "",
                endDate: "",
                courseId: "",
              },
            ]);
          }}
        >
          <CalendarClock className="mr-2 h-4 w-4" /> Add Batch
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-2xl font-bold tracking-tight">
              {courseName || "Batches"}
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {batches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No batches yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Get started by adding your first batch
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {batches.map((batch) => (
                    <Card
                      key={batch._id}
                      className="flex flex-col h-full relative"
                    >
                      <CardContent className="p-4 flex flex-col flex-1">
                        <div className="flex flex-col space-y-2">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Start Date:</span>{" "}
                            {new Date(batch.startDate).toLocaleDateString(
                              "en-GB"
                            )}
                          </p>
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">End Date:</span>{" "}
                            {new Date(batch.endDate).toLocaleDateString(
                              "en-GB"
                            )}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {liveBatches.map((batch, index) => (
        <Dialog open={isLiveBatchVisible} onOpenChange={setIsLiveBatchVisible}>
          <BatchDatePickerRow
            key={index}
            index={index}
            batch={batch}
            updateBatch={async (index: number, key: string, value: any) => {
              const updatedBatches = [...liveBatches];
              updatedBatches[index] = {
                ...updatedBatches[index],
                [key]: value,
              };
              setLiveBatches(updatedBatches);

              if (batch._id) {
                await handleUpdateBatch(
                  batch._id,
                  { ...updatedBatches[index], [key]: value },
                  setLiveBatches
                );
              }
            }}
            removeBatch={(index) =>
              handleDeleteBatch(
                liveBatches?.[index]?._id as string,
                setLiveBatches
              )
            }
            errors={batchErrors[index]}
          />
        </Dialog>
      ))}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive" className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <AlertDescription>
                Are you sure you want to delete this session? This action cannot
                be undone.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
