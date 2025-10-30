"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  Play,
  MapPin,
  Edit,
  Trash2,
  MoreVertical,
  Video,
  Link as LinkIcon,
  Image,
  CalendarPlus,
  BookPlus,
  AlertTriangle,
  CalendarClock,
  BookAIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle as DialogTitleUI,
  DialogFooter,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, set } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import {
  createCourse,
  getCourses,
  updateCourse,
  deleteCourse,
  createNewBatch,
  updateBatch,
  deleteBatch,
  getAllBatch,
  uploadImage,
} from "@/components/api/course";
import { getAllCenters } from "@/components/api/banner";
import { getAllCourseCategory } from "@/components/api/category";
import { getAllInstructors } from "@/components/api/instructor";
import React from "react";

import Link from "next/link";
import { DataTablePagination } from "@/components/ui/DataTablePagination";
import { Course } from "@/components/api/course";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BatchDatePickerRow } from "@/components/course/BatchDatePickerRow";

type Batch = {
  _id?: string;
  id: string;
  batchName: string;
  centerId?: string;
  description: string;
  startDate: Date | null;
  endDate: Date | null;
  courseId: string;
};

export default function Courses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("recorded");
  const [formActiveTab, setFormActiveTab] = useState("recorded");
  const [isTabSwitching, setIsTabSwitching] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Date states...
  const [recordedStartDate, setRecordedStartDate] = useState<
    Date | undefined
  >();
  const [recordedEndDate, setRecordedEndDate] = useState<Date | undefined>();
  const [liveStartDate, setLiveStartDate] = useState<Date | undefined>();
  const [liveEndDate, setLiveEndDate] = useState<Date | undefined>();
  const [physicalStartDate, setPhysicalStartDate] = useState<
    Date | undefined
  >();
  const [physicalEndDate, setPhysicalEndDate] = useState<Date | undefined>();

  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [instructors, setInstructors] = useState<
    { _id: string; name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instructorError, setInstructorError] = useState<string>("");
  const [editCourse, setEditCourse] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isLiveBatchVisible, setIsLiveBatchVisible] = useState(false);
  const [isPhysicalBatchVisible, setIsPhysicalBatchVisible] = useState(false);
  const [latestCourse, setLatestCourse] = useState<Course | null>(null);
  const [liveBatches, setLiveBatches] = useState<Batch[]>([
    {
      id: "",
      batchName: "",
      description: "",
      startDate: null,
      endDate: null,
      courseId: "",
    },
  ]);
  const [batchErrors, setBatchErrors] = useState<Record<number, any>>({});
  const [physicalBatches, setPhysicalBatches] = useState<Batch[]>([
    {
      id: "",
      batchName: "",
      description: "",
      centerId: "",
      startDate: null,
      endDate: null,
      courseId: "",
    },
  ]);

  // Add error state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Add loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [centers, setCenters] = useState<any[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<any>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

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

  useEffect(() => {
    if (latestCourse) fetchCenters();
  }, [latestCourse]);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getAllCourseCategory();
        if (response.success) {
          setCategories(response.payload?.data || []);
        } else {
          console.error("Failed to fetch categories:", response.message);
          toast.error("Failed to load categories");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("An error occurred while loading categories");
      }
    };

    fetchCategories();
  }, []);

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
          courseId: latestCourse?._id || "",
          ...(activeTab === "physical" &&
            selectedCenter?._id && {
              centerId: selectedCenter._id,
            }),
        })),
      };

      const res = await createNewBatch(payload);
      if (res.success) {
        toast.success("Batch created successfully");
        setBatches(res.payload || []);
        setOpen(false);
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

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
  };

  const handleIntroVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 50 * 1024 * 1024;

      if (!file.type.startsWith("video/")) {
        setFormErrors((prev) => ({
          ...prev,
          introVideo: "Please upload a valid video file",
        }));
        e.target.value = "";
        return;
      }

      if (file.size > maxSize) {
        setFormErrors((prev) => ({
          ...prev,
          introVideo: "Video file size must be less than 50MB",
        }));
        e.target.value = "";
        return;
      }

      setVideoFile(file);
      setFormErrors((prev) => ({ ...prev, introVideo: "" }));
    }
  };

  const handleTrimInput = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const trimmedValue = e.target.value.trim();
    if (trimmedValue !== e.target.value) {
      e.target.value = trimmedValue;
      const event = new Event("input", { bubbles: true });
      e.target.dispatchEvent(event);
    }
  };

  const validateForm = (formData: FormData, courseType: string) => {
    const errors: Record<string, string> = {};

    const name = formData.get("name")?.toString().trim() || "";
    const description = formData.get("description")?.toString().trim() || "";
    const instructor = formData.get("instructor")?.toString().trim() || "";
    const courseLevel = formData.get("courseLevel")?.toString().trim() || "";

    if (!courseLevel) {
      errors.courseLevel = "Course level is required";
    }

    if (!name) {
      errors.name = "Course name is required";
    } else if (name.length < 5) {
      errors.name = "Course name must be at least 5 characters";
    }

    if (!description) {
      errors.description = "Description is required";
    } else if (description.length < 20) {
      errors.description = "Description must be at least 20 characters";
    }

    if (!instructor) {
      errors.instructor = "Instructor is required";
    }

    // Validate price (required and > 0)
    const priceValue = formData.get("price")?.toString();
    const price = parseFloat(priceValue || "");
    if (!priceValue || isNaN(price) || price <= 0) {
      errors.price = "Please enter a valid price greater than 0";
    }

    // Validate hours (required and > 0)
    const hoursValue = formData.get("hours")?.toString();
    const hours = parseFloat(hoursValue || "");
    if (!hoursValue || isNaN(hours) || hours <= 0) {
      errors.hours = "Please enter valid hours greater than 0";
    }

    // Validate dates (use courseStart/courseEnd set before validation)
    const startDate = formData.get("courseStart")?.toString();
    const endDate = formData.get("courseEnd")?.toString();

    if (!startDate) {
      errors.startDate = "Start date is required";
    }
    if (!endDate) {
      errors.endDate = "End date is required";
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errors.dateRange = "End date must be after start date";
    }

    // Image required on create (skip when editing)
    if (!editCourse && !imageFile) {
      errors.image = "Please upload an image";
    }

    // Course type specific validations
    if (courseType === "live") {
      if (
        !formData.get("zoomLink")?.toString().trim() &&
        !editCourse?.meetingLink
      ) {
        errors.zoomLink = "Zoom meeting link is required";
      } else if (
        formData.get("zoomLink") &&
        !isValidUrl(formData.get("zoomLink")?.toString() || "")
      ) {
        errors.zoomLink = "Please enter a valid Zoom URL";
      }
    }

    if (courseType === "physical") {
      if (!formData.get("email")?.toString().trim()) {
        errors.email = "Email is required";
      } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          formData.get("email")?.toString().trim() || ""
        )
      ) {
        errors.email = "Please enter a valid email address";
      }

      // For required phone
      if (!formData.get("phone")?.toString().trim()) {
        errors.phone = "Phone number is required";
      } else if (
        !/^[+\d\s-]{10,}$/.test(formData.get("phone")?.toString().trim() || "")
      ) {
        errors.phone = "Please enter a valid phone number (min 10 digits)";
      }
      if (!formData.get("city")?.toString().trim()) {
        errors.city = "City is required";
      }
      if (!formData.get("state")?.toString().trim()) {
        errors.state = "State is required";
      }
      if (!formData.get("country")?.toString().trim()) {
        errors.country = "Country is required";
      }
    }

    return errors;
  };

  // Add this URL validation helper function
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Fetch instructors
  const fetchInstructors = async () => {
    setLoadingInstructors(true);
    setInstructorError("");
    try {
      const response = await getAllInstructors({});
      if (response.success && response.payload?.data) {
        setInstructors(
          response.payload.data.map((instructor: any) => ({
            _id: instructor._id,
            name: instructor.name,
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching instructors:", err);
      setInstructorError("Failed to load instructors. Please try again later.");
    } finally {
      setLoadingInstructors(false);
    }
  };

  // Fetch courses with pagination and filtering
  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCourses({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        courseType: activeTab,
      });

      if (response && response.success) {
        const { data, count } = response.payload;

        setCourses(data || []);
        setTotalItems(count || 0);
        setTotalPages(Math.ceil((count || 0) / itemsPerPage));
      } else {
        setError(response?.message || "Failed to load courses");
      }
    } catch (err: any) {
      console.error("Error in fetchCourses:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError("Failed to load courses. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  // Add this useEffect near your other effects
  useEffect(() => {
    if (editCourse) {
      // Reset video file state when editing a course
      setVideoFile(null);
    }
  }, [editCourse]);
  useEffect(() => {
    console.log("Pagination state changed:", {
      currentPage,
      itemsPerPage,
      totalItems,
      totalPages,
      coursesCount: courses.length,
    });
  }, [currentPage, itemsPerPage, totalItems, totalPages, courses]);

  // Fetch instructors and courses when component mounts
  useEffect(() => {
    fetchInstructors();
    fetchCourses();
  }, []);

  // Fetch courses when pagination or filters change
  useEffect(() => {
    fetchCourses();
  }, [currentPage, itemsPerPage, searchTerm, activeTab]);

  // Function to reset form and date states
  const resetForm = () => {
    setEditCourse(null);
    setRecordedStartDate(undefined);
    setRecordedEndDate(undefined);
    setLiveStartDate(undefined);
    setLiveEndDate(undefined);
    setPhysicalStartDate(undefined);
    setPhysicalEndDate(undefined);
    setFormErrors({});
    setImageFile(null);
    // setActiveTab('recorded');
    // Reset form fields if using a form ref
    const form = document.querySelector("form");
    if (form) {
      form.reset();
    }
  };

  // Add this effect to initialize form fields when editing
  useEffect(() => {
    if (editCourse) {
      // Set the active tab based on course type
      setActiveTab(editCourse.courseType || "recorded");
      setFormActiveTab(editCourse.courseType || "recorded");

      // Set date states if they exist
      if (editCourse.courseStart) {
        setRecordedStartDate(new Date(editCourse.courseStart));
        setLiveStartDate(new Date(editCourse.courseStart));
        setPhysicalStartDate(new Date(editCourse.courseStart));
      }
      if (editCourse.courseEnd) {
        setRecordedEndDate(new Date(editCourse.courseEnd));
        setLiveEndDate(new Date(editCourse.courseEnd));
        setPhysicalEndDate(new Date(editCourse.courseEnd));
      }
    } else {
      resetForm();
    }
  }, [editCourse]);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const getYoutubeThumbnail = (url: string) => {
    const match = url.match(
      /(?:youtu.be\/|youtube.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
    );
    return match
      ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`
      : null;
  };

  const handleDeleteCourse = async (id: string) => {
    setDeleteDialogOpen(false);
    try {
      const data = await deleteCourse(id);
      if (data.success) {
        toast.success("Course deleted successfully", {
          description: data?.message || "The course has been deleted.",
        });
        // Refresh course list
        const refreshed = await getCourses();
        setCourses(refreshed.payload.data);
      } else {
        toast.error("Failed to delete course", {
          description: data?.message || "An error occurred.",
        });
      }
    } catch (err) {
      toast.error("Failed to delete course", {
        description: err instanceof Error ? err.message : "An error occurred.",
      });
    }
  };

  const CourseCard = ({ course }: { course: any }) => {
    const [popoverOpen, setPopoverOpen] = useState(false);

    return (
      <Card className="hover:shadow-md transition-shadow overflow-hidden">
        <div className="relative aspect-video bg-background">
          {course.courseVideo ? (
            <img
              src={course.courseVideo}
              alt={course.CourseName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <Image className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-lg line-clamp-2">
                <Link
                  href={
                    activeTab === "live"
                      ? `/dashboard/courses/${course._id}/sessions`
                      : `/dashboard/courses/${course._id}`
                  }
                  className="hover:underline cursor-pointer"
                >
                  {course.CourseName}
                </Link>
              </h3>
              <div className="text-base text-muted-foreground line-clamp-2 h-12 overflow-hidden text-ellipsis font-lexend">
                {course.description}
              </div>
            </div>
            <DropdownMenu open={popoverOpen} onOpenChange={setPopoverOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -mt-1 -mr-2"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {activeTab === "live" ? (
                  <>
                    <Link
                      href={`/dashboard/courses/${course._id}/batches?type=live`}
                      className="w-full"
                    >
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setPopoverOpen(false);
                        }}
                        className="cursor-pointer"
                      >
                        <CalendarClock className="mr-2 h-5 w-5" />
                        <span className="text-base font-semibold text-gray-500 font-lexend">
                          Edit Batch
                        </span>
                      </DropdownMenuItem>
                    </Link>
                    <Link
                      href={`/dashboard/courses/${course._id}/syllabus?type=live`}
                      className="w-full"
                    >
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setPopoverOpen(false);
                        }}
                        className="cursor-pointer"
                      >
                        <BookAIcon className="mr-2 h-5 w-5" />
                        <span className="text-base font-semibold text-gray-500 font-lexend">
                          Add Syllabus
                        </span>
                      </DropdownMenuItem>
                    </Link>
                  </>
                ) : activeTab === "physical" ? (
                  <>
                    <Link
                      href={`/dashboard/courses/${course._id}/batches?type=physical`}
                      className="w-full"
                    >
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setPopoverOpen(false);
                        }}
                        className="cursor-pointer"
                      >
                        <BookPlus className="mr-2 h-5 w-5" />
                        <span className="text-base font-semibold text-gray-500 font-lexend">
                          Edit Batch
                        </span>
                      </DropdownMenuItem>
                    </Link>
                    <Link
                      href={`/dashboard/courses/${course._id}/syllabus?type=physical`}
                      className="w-full"
                    >
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setPopoverOpen(false);
                        }}
                        className="cursor-pointer"
                      >
                        <BookAIcon className="mr-2 h-5 w-5" />
                        <span className="text-base font-semibold text-gray-500 font-lexend">
                          Add Syllabus
                        </span>
                      </DropdownMenuItem>
                    </Link>
                  </>
                ) : (
                  <Link
                    href={`/dashboard/courses/${course._id}/syllabus?type=live`}
                    className="w-full"
                  >
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setPopoverOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <BookAIcon className="mr-2 h-5 w-5" />
                      <span className="text-base font-semibold text-gray-500 font-lexend">
                        Add Syllabus
                      </span>
                    </DropdownMenuItem>
                  </Link>
                )}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditCourse(course);
                    setOpen(true);
                    setPopoverOpen(false);
                  }}
                >
                  <Edit className="mr-2 h-5 w-5" />
                  <span className="text-base font-semibold text-gray-500 font-lexend">
                    Edit Course
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => {
                    setCourseToDelete(course);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="mr-2 h-5 w-5" />
                  <span className="text-base font-semibold text-red-600">
                    Delete
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">
              ${course.price || "0"}
            </span>
            <Badge variant="outline" className="capitalize">
              <span className="text-blacktheme">{course.courseType}</span>
            </Badge>
          </div>

          <div className="text-sm text-muted-foreground font-bold">
            {course.courseStart
              ? format(new Date(course.courseStart), "MMM d, yyyy")
              : "No start date"}
            {course.courseEnd
              ? ` - ${format(new Date(course.courseEnd), "MMM d, yyyy")}`
              : ""}
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            <span className="font-bold">Instructor:</span>
            <span className="ml-1">
              {course.instructor?.name || "John Doe"}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-muted-foreground">
              <span className="ml-1 capitalize">
                {course.language || "English"} | Rating 4.6 | 100 Students
              </span>
            </div>
          </div>

          {course.country && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{course.country}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  async function handleCourseSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Prevent multiple submissions
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const formData = new FormData(e.currentTarget);
      const courseType = formData.get("courseType");

      // Get the correct dates based on the active tab
      let startDate = "";
      let endDate = "";

      if (formActiveTab === "recorded") {
        startDate = recordedStartDate
          ? format(recordedStartDate, "yyyy-MM-dd")
          : "";
        endDate = recordedEndDate ? format(recordedEndDate, "yyyy-MM-dd") : "";
      } else if (formActiveTab === "live") {
        startDate = liveStartDate ? format(liveStartDate, "yyyy-MM-dd") : "";
        endDate = liveEndDate ? format(liveEndDate, "yyyy-MM-dd") : "";
      } else if (formActiveTab === "physical") {
        startDate = physicalStartDate
          ? format(physicalStartDate, "yyyy-MM-dd")
          : "";
        endDate = physicalEndDate ? format(physicalEndDate, "yyyy-MM-dd") : "";
      }

      // Add the dates to form data
      formData.set("courseStart", startDate);
      formData.set("courseEnd", endDate);

      // Validate form
      const errors = validateForm(formData, courseType?.toString() || "");
      setFormErrors(errors);

      // If there are errors, stop submission
      if (Object.keys(errors).length > 0) {
        setIsSubmitting(false);
        return;
      }

      // Create a new FormData for the API request
      const apiFormData = new FormData();

      // Add all form fields to the FormData
      apiFormData.append("courseType", formData.get("courseType") || "");
      apiFormData.append("CourseName", formData.get("name") || "");
      apiFormData.append("description", formData.get("description") || "");
      apiFormData.append("price", formData.get("price") || "0");
      apiFormData.append("hours", formData.get("hours") || "0");
      apiFormData.append("courseStart", startDate);
      apiFormData.append("courseEnd", endDate);
      apiFormData.append("instructor", formData.get("instructor") || "");
      apiFormData.append("language", formData.get("language") || "english");
      apiFormData.append("courseLevel", formData.get("courseLevel") || "");

      if (videoFile) {
        try {
          const videoResponse = await uploadImage(videoFile);

          if (videoResponse?.success && videoResponse?.payload) {
            apiFormData.append("courseIntroVideo", videoResponse.payload);
          } else {
            throw new Error("Failed to upload video: Invalid response");
          }   
        } catch (error) {
          console.error("Error uploading video:", error);
          toast.error("Failed to upload video");
          return;
        }
      } else if (editCourse?.courseIntroVideo) {
        // Only include if there's an existing video URL
        if (editCourse.courseIntroVideo !== "undefined") {
          apiFormData.append("courseIntroVideo", editCourse.courseIntroVideo);
        }
      }

      const defineCourse = formData.get("defineCourse");
      if (defineCourse) {
        apiFormData.append("isDefineCourse", defineCourse.toString());
      }

      // Add course type specific fields
      if (courseType === "live") {
        apiFormData.append("meetingLink", formData.get("zoomLink") || "");
      } else if (courseType === "physical") {
        apiFormData.append("email", formData.get("email") || "");
        apiFormData.append("phone", formData.get("phone") || "");
        // apiFormData.append('address', formData.get('address') || '');
      }

      if (imageFile) {
        apiFormData.append("image", imageFile);
      }

      if (formData.get("city")) {
        apiFormData.append("city", formData.get("city") || "");
      }

      if (formData.get("state")) {
        apiFormData.append("state", formData.get("state") || "");
      }

      if (formData.get("country")) {
        apiFormData.append("country", formData.get("country") || "");
      }
      const categoryId = formData.get("courseCategory");
      if (categoryId) {
        apiFormData.append("courseCategory", categoryId.toString());
      }

      try {
        let data;
        if (editCourse && editCourse._id) {
          // Update existing course
          data = await updateCourse(editCourse._id, apiFormData);
        } else {
          // Create new course
          data = await createCourse(apiFormData);
        }

        if (data.success) {
          setLatestCourse(data.payload);
          if (formActiveTab === "recorded") setOpen(false);
          else if (formActiveTab === "live") setIsLiveBatchVisible(true);
          else if (formActiveTab === "physical")
            setIsPhysicalBatchVisible(true);
          setEditCourse(null);
          toast.success(
            editCourse
              ? "Course updated successfully"
              : "Course created successfully",
            {
              description:
                data?.message ||
                (editCourse
                  ? "The course has been updated."
                  : "The course has been created."),
            }
          );
          // Refresh course list
          const refreshed = await getCourses();
          setCourses(refreshed.payload.data);
        } else {
          toast.error(
            editCourse ? "Failed to update course" : "Failed to create course",
            {
              description: data?.message || "An error occurred.",
            }
          );
        }
      } catch (err: any) {
        if (err.response?.status === 413) {
          toast.error("File too large", {
            description:
              "The file you are trying to upload exceeds the maximum allowed size. Please try with a smaller file.",
          });
        } else {
          toast.error("Failed to update course", {
            description:
              err instanceof Error ? err.message : "An error occurred.",
          });
        }
      } finally {
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error("Error submitting course:", error);
      if (error.response?.status === 413) {
        toast.error("File too large", {
          description:
            "The file you are trying to upload exceeds the maximum allowed size. Please try with a smaller file.",
        });
      } else {
        toast.error(
          error instanceof Error ? error.message : "Failed to save course"
        );
      }
      setIsSubmitting(false);
    }
  }

  const handleTabChange = (value: string) => {
    setIsTabSwitching(true);
    setActiveTab(value);
    setTimeout(() => {
      setIsTabSwitching(false);
    }, 500);
  };

  const isTabDisabled = (tabType: string) => {
    if (!editCourse) return false;
    return editCourse.courseType !== tabType;
  };

  const handleFormTabChange = (value: string) => {
    setIsLiveBatchVisible(false);
    setIsPhysicalBatchVisible(false);
    if (editCourse && editCourse.courseType !== value) {
      // Don't allow changing tabs when editing a course
      return;
    }
    setFormActiveTab(value);
  };

  const renderCourseList = (courses: any[], emptyMessage: string) => {
    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-[70vh]">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    } else if (error) {
      return <div className="text-red-500">{error}</div>;
    } else {
      return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {courses.map((course) => (
            <CourseCard key={course._id || course.CourseName} course={course} />
          ))}
          {courses.length === 0 && (
            <div className="col-span-full text-center text-gray-400">
              {emptyMessage}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div>
      <Dialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (!val) {
            setFormErrors({});
            setIsSubmitting(false);
            setEditCourse(null);
            setRecordedStartDate(undefined);
            setRecordedEndDate(undefined);
            setLiveStartDate(undefined);
            setLiveEndDate(undefined);
            setPhysicalStartDate(undefined);
            setPhysicalEndDate(undefined);
            setIsPhysicalBatchVisible(false);
            setIsLiveBatchVisible(false);
            const form = document.querySelector("form");
            if (form) {
              form.reset();
            }
          } else {
            setFormActiveTab(editCourse?.courseType || "recorded");
            setFormErrors({});
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitleUI>
              {editCourse
                ? `Edit ${
                    editCourse.courseType?.charAt(0).toUpperCase() +
                    editCourse.courseType?.slice(1)
                  } Course`
                : "Create Course"}
            </DialogTitleUI>
          </DialogHeader>
          <Tabs
            value={formActiveTab}
            onValueChange={handleFormTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger
                value="recorded"
                disabled={isTabDisabled("recorded")}
                className={
                  isTabDisabled("recorded")
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }
              >
                Recorded
              </TabsTrigger>
              <TabsTrigger
                value="live"
                disabled={isTabDisabled("live")}
                className={
                  isTabDisabled("live") ? "opacity-50 cursor-not-allowed" : ""
                }
              >
                Live
              </TabsTrigger>
              <TabsTrigger
                value="physical"
                disabled={isTabDisabled("physical")}
                className={
                  isTabDisabled("physical")
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }
              >
                In-Person
              </TabsTrigger>
            </TabsList>
            {/* Recorded Course Form */}
            <TabsContent value="recorded">
              <form
                className="space-y-4 h-[54vh] overflow-y-auto px-1 scroll-thin"
                onSubmit={handleCourseSubmit}
              >
                <input type="hidden" name="courseType" value="recorded" />
                <div>
                  <label className="block font-medium mb-1">
                    Course Thumbnail Image
                  </label>
                  <ImageUpload
                    name="image"
                    id="course-thumbnail"
                    error={formErrors.image}
                    onChange={handleImageChange}
                    initialImage={editCourse?.courseVideo || null}
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Course Name</label>
                  <Input
                    placeholder="Course Name"
                    name="name"
                    defaultValue={editCourse?.CourseName || ""}
                    onBlur={handleTrimInput}
                    onKeyDown={(e) => {
                      if (
                        e.key === " " &&
                        !(e.target as HTMLInputElement).value.trim()
                      ) {
                        e.preventDefault();
                      }
                    }}
                  />
                  {formErrors.name && (
                    <div className="text-red-500">{formErrors.name}</div>
                  )}
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    Course Description
                  </label>
                  <Input
                    placeholder="Course Description"
                    name="description"
                    defaultValue={editCourse?.description || ""}
                    onBlur={handleTrimInput}
                    onKeyDown={(e) => {
                      if (
                        e.key === " " &&
                        !(e.target as HTMLInputElement).value.trim()
                      ) {
                        e.preventDefault();
                      }
                    }}
                  />
                  {formErrors.description && (
                    <div className="text-red-500">{formErrors.description}</div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-1">
                      Instructor Name
                    </label>
                    {/* <Input
                      placeholder="Instructor Name"
                      name="instructor"
                      defaultValue={editCourse?.instructor || ""}
                      onBlur={handleTrimInput}
                      onKeyDown={(e) => {
                        if (e.key === ' ' && !(e.target as HTMLInputElement).value.trim()) {
                          e.preventDefault();
                        }
                      }}
                    /> */}
                    <Select
                      name="instructor"
                      defaultValue={
                        editCourse?.instructor?._id || editCourse?.instructor
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an instructor" />
                      </SelectTrigger>
                      <SelectContent>
                        {instructors.map((instructor) => (
                          <SelectItem
                            key={instructor._id}
                            value={instructor._id}
                          >
                            {instructor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.instructor && (
                      <div className="text-red-500">
                        {formErrors.instructor}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Language</label>
                    <select
                      name="language"
                      className="flex h-[55px] w-full rounded-md border border-input bg-background px-4 text-base font-semibold ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      defaultValue={editCourse?.language || "english"}
                    >
                      <option value="english">English</option>
                      <option value="spanish">Spanish</option>
                      <option value="french">French</option>
                      <option value="german">German</option>
                      <option value="hindi">Hindi</option>
                    </select>
                  </div>
                </div>
                {/* Start and End Date in one row */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <label className="block font-medium mb-1">Start Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-[55px] justify-start text-left font-normal px-4 group"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 group-hover:text-gray-900" />
                          {recordedStartDate ? (
                            <span className="text-base font-semibold text-gray-900">
                              {format(recordedStartDate, "PPP")}
                            </span>
                          ) : (
                            <>
                              <input
                                placeholder="Pick a date"
                                className="!outline-none !border-none !bg-transparent !caret-transparent cursor-pointer !text-base !font-semibold"
                              />
                              {/* <span className="text-base font-semibold">Pick a date</span> */}
                            </>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 calendar-gray">
                        <Calendar
                          mode="single"
                          selected={recordedStartDate}
                          onSelect={(date) => {
                            setRecordedStartDate(date);
                            // Close the popover after selection
                            const popoverTrigger = document.querySelector(
                              '[aria-haspopup="dialog"][data-state="open"]'
                            ) as HTMLElement;
                            if (popoverTrigger) popoverTrigger.click();
                          }}
                          initialFocus
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    {formErrors.startDate && (
                      <div className="text-red-500">{formErrors.startDate}</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block font-medium mb-1">End Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-[55px] justify-start text-left font-normal px-4 group"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 group-hover:text-gray-900" />
                          {recordedEndDate ? (
                            <span className="text-base font-semibold text-gray-900">
                              {format(recordedEndDate, "PPP")}
                            </span>
                          ) : (
                            <>
                              <input
                                placeholder="Pick a date"
                                className="!outline-none !border-none !bg-transparent !caret-transparent cursor-pointer !text-base !font-semibold"
                              />
                              {/* <span className="text-base font-semibold">Pick a date</span> */}
                            </>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 calendar-gray">
                        <Calendar
                          mode="single"
                          selected={recordedEndDate}
                          onSelect={(date) => {
                            setRecordedEndDate(date);
                            // Close the popover after selection
                            const popoverTrigger = document.querySelector(
                              '[aria-haspopup="dialog"][data-state="open"]:not([data-radix-popper-content-wrapper])'
                            ) as HTMLElement;
                            if (popoverTrigger) popoverTrigger.click();
                          }}
                          initialFocus
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    {formErrors.endDate && (
                      <div className="text-red-500">{formErrors.endDate}</div>
                    )}
                  </div>
                </div>
                {formErrors.dateRange && (
                  <div className="text-red-500">{formErrors.dateRange}</div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-1">
                      Course Price
                    </label>
                    <Input
                      placeholder="Course Price"
                      type="number"
                      name="price"
                      defaultValue={editCourse?.price || ""}
                    />
                    {formErrors.price && (
                      <div className="text-red-500">{formErrors.price}</div>
                    )}
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Hours</label>
                    <Input
                      placeholder="Hours"
                      type="text"
                      name="hours"
                      defaultValue={editCourse?.hours || ""}
                      onBlur={handleTrimInput}
                      onKeyDown={(e) => {
                        if (
                          e.key === " " &&
                          !(e.target as HTMLInputElement).value.trim()
                        ) {
                          e.preventDefault();
                        }
                      }}
                    />
                    {formErrors.hours && (
                      <div className="text-red-500">{formErrors.hours}</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="block font-medium mb-1">Course Level</label>
                  <Input
                    type="text"
                    name="courseLevel"
                    placeholder="Enter course level"
                    defaultValue={editCourse?.courseLevel || ""}
                    className="h-[55px] w-full"
                    required
                    onBlur={handleTrimInput}
                  />
                  {formErrors.courseLevel && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.courseLevel}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="block font-medium mb-1">Intro Video</label>

                  <div className="relative w-full">
                    <Input
                      type="file"
                      name="courseIntroVideo"
                      accept="video/*"
                      className="file:cursor-pointer file:text-base file:py-4 file:rounded-md file:border-0 file:text-white text-gray-600 text-center"
                      onChange={handleIntroVideoChange}
                      id="courseIntroVideo"
                    />
                    {/* Add this to show current video when editing */}
                    {editCourse?.courseIntroVideo && !videoFile && (
                      <div className="mt-2">
                        <video
                          src={editCourse?.courseIntroVideo}
                          controls
                          className="max-w-full h-auto max-h-20 rounded-md"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Current video
                        </p>
                      </div>
                    )}
                    {/* Show selected file name when a new video is selected */}
                    {videoFile && (
                      <p className="text-sm text-gray-500 mt-1">
                        Selected: {videoFile.name}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-1">
                    Course Category
                  </label>
                  <select
                    name="courseCategory"
                    className="flex h-[55px] w-full rounded-md border border-input bg-background px-4 text-base font-semibold ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue={editCourse?.courseCategory || ""}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* <div>
                  <label className="block font-medium mb-1">Define Course</label>
                  <select name="defineCourse" className="flex h-[55px] w-full rounded-md border border-input bg-background px-4 text-base font-semibold ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" defaultValue={editCourse?.isDefineCourse || ""}>
                    <option value="">Choose Option</option>
                    <option value="popular">Popular</option>
                    <option value="trending">Trending</option>
                  </select>
                </div> */}
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? "Saving..."
                      : editCourse
                      ? "Update Course"
                      : "Create Recorded Course"}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>
            {/* Live Course Form */}
            <TabsContent value="live">
              {!isLiveBatchVisible && (
                <form
                  className="space-y-4 h-[54vh] overflow-y-auto px-1 scroll-thin"
                  onSubmit={handleCourseSubmit}
                >
                  <input type="hidden" name="courseType" value="live" />
                  <div>
                    <label className="block font-medium mb-1">
                      Course Thumbnail Image
                    </label>
                    <ImageUpload
                      name="image"
                      id="course-thumbnail"
                      error={formErrors.image}
                      onChange={handleImageChange}
                      initialImage={editCourse?.courseVideo || null}
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">
                      Course Name
                    </label>
                    <Input
                      placeholder="Course Name"
                      name="name"
                      defaultValue={editCourse?.CourseName || ""}
                      onBlur={handleTrimInput}
                      onKeyDown={(e) => {
                        if (
                          e.key === " " &&
                          !(e.target as HTMLInputElement).value.trim()
                        ) {
                          e.preventDefault();
                        }
                      }}
                    />
                    {formErrors.name && (
                      <div className="text-red-500">{formErrors.name}</div>
                    )}
                  </div>
                  <div>
                    <label className="block font-medium mb-1">
                      Course Description
                    </label>
                    <Input
                      placeholder="Course Description"
                      name="description"
                      defaultValue={editCourse?.description || ""}
                      onBlur={handleTrimInput}
                      onKeyDown={(e) => {
                        if (
                          e.key === " " &&
                          !(e.target as HTMLInputElement).value.trim()
                        ) {
                          e.preventDefault();
                        }
                      }}
                    />
                    {formErrors.description && (
                      <div className="text-red-500">
                        {formErrors.description}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium mb-1">
                        Instructor Name
                      </label>
                      <Select
                        name="instructor"
                        defaultValue={
                          editCourse?.instructor?._id || editCourse?.instructor
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an instructor" />
                        </SelectTrigger>
                        <SelectContent>
                          {instructors.map((instructor) => (
                            <SelectItem
                              key={instructor._id}
                              value={instructor._id}
                            >
                              {instructor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.instructor && (
                        <div className="text-red-500">
                          {formErrors.instructor}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Language</label>
                      <select
                        name="language"
                        className="flex h-[55px] w-full rounded-md border border-input bg-background px-4 text-base font-semibold ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue={editCourse?.language || "english"}
                      >
                        <option value="english">English</option>
                        <option value="spanish">Spanish</option>
                        <option value="french">French</option>
                        <option value="german">German</option>
                        <option value="hindi">Hindi</option>
                      </select>
                    </div>
                  </div>
                  {/* Add Price Field */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium mb-1">
                        Course Price
                      </label>
                      <Input
                        placeholder="Course Price"
                        type="number"
                        name="price"
                        defaultValue={editCourse?.price || ""}
                      />
                      {formErrors.price && (
                        <div className="text-red-500">{formErrors.price}</div>
                      )}
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Hours</label>
                      <Input
                        placeholder="Hours"
                        type="number"
                        name="hours"
                        defaultValue={editCourse?.hours || ""}
                        onBlur={handleTrimInput}
                        onKeyDown={(e) => {
                          if (
                            e.key === " " &&
                            !(e.target as HTMLInputElement).value.trim()
                          ) {
                            e.preventDefault();
                          }
                        }}
                      />
                      {formErrors.hours && (
                        <div className="text-red-500">{formErrors.hours}</div>
                      )}
                    </div>
                  </div>
                  {/* Start and End Date in one row */}
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <label className="block font-medium mb-1">
                        Start Date
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full h-[55px] justify-start text-left font-normal px-4"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {liveStartDate ? (
                              format(liveStartDate, "PPP")
                            ) : (
                              <>
                                <input
                                  placeholder="Pick a date"
                                  className="!outline-none !border-none !bg-transparent !caret-transparent cursor-pointer !text-base !font-semibold"
                                />
                                {/* <span className="text-base font-semibold">Pick a date</span> */}
                              </>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={liveStartDate}
                            onSelect={setLiveStartDate}
                            initialFocus
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      {formErrors.startDate && (
                        <div className="text-red-500">
                          {formErrors.startDate}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block font-medium mb-1">End Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full h-[55px] justify-start text-left font-normal px-4"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {liveEndDate ? (
                              format(liveEndDate, "PPP")
                            ) : (
                              <>
                                <input
                                  placeholder="Pick a date"
                                  className="!outline-none !border-none !bg-transparent !caret-transparent cursor-pointer !text-base !font-semibold"
                                />
                                {/* <span className="text-base font-semibold">Pick a date</span> */}
                              </>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={liveEndDate}
                            onSelect={setLiveEndDate}
                            initialFocus
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      {formErrors.endDate && (
                        <div className="text-red-500">{formErrors.endDate}</div>
                      )}
                    </div>
                  </div>
                  {formErrors.dateRange && (
                    <div className="text-red-500">{formErrors.dateRange}</div>
                  )}
                  <div>
                    <label className="block font-medium mb-1">
                      Zoom Meeting Link
                    </label>
                    <Input
                      placeholder="Zoom Meeting Link"
                      name="zoomLink"
                      defaultValue={editCourse?.meetingLink || ""}
                      onBlur={handleTrimInput}
                      onKeyDown={(e) => {
                        if (
                          e.key === " " &&
                          !(e.target as HTMLInputElement).value.trim()
                        ) {
                          e.preventDefault();
                        }
                      }}
                    />
                    {formErrors.zoomLink && (
                      <div className="text-red-500">{formErrors.zoomLink}</div>
                    )}
                  </div>
                  <div>
                    <label className="block font-medium mb-1">
                      Intro Video
                    </label>
                    <div className="relative w-full">
                      <Input
                        type="file"
                        name="courseIntroVideo"
                        accept="video/*"
                        className="file:cursor-pointer file:text-base file:py-4 file:rounded-md file:border-0 file:text-white text-gray-600 text-center"
                        onChange={handleIntroVideoChange}
                        id="courseIntroVideo"
                      />
                      {/* Add this to show current video when editing */}
                      {editCourse?.courseIntroVideo && !videoFile && (
                        <div className="mt-2">
                          <video
                            src={editCourse?.courseIntroVideo}
                            controls
                            className="max-w-full h-auto max-h-20 rounded-md"
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            Current video
                          </p>
                        </div>
                      )}
                      {/* Show selected file name when a new video is selected */}
                      {videoFile && (
                        <p className="text-sm text-gray-500 mt-1">
                          Selected: {videoFile.name}
                        </p>
                      )}
                    </div>
                    {formErrors.introVideo && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.introVideo}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block font-medium mb-1">
                      Course Category
                    </label>
                    <select
                      name="courseCategory"
                      className="flex h-[55px] w-full rounded-md border border-input bg-background px-4 text-base font-semibold ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      defaultValue={editCourse?.courseCategory || ""}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* <div>
                  <label className="block font-medium mb-1">Define Course</label>
                  <select name="defineCourse" className="flex h-[55px] w-full rounded-md border border-input bg-background px-3 py-2 text-base font-semibold ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" defaultValue={editCourse?.language || "english"}>
                    <option value="">Choose Option</option>
                    <option value="popular">Popular</option>
                    <option value="trending">Trending</option>
                  </select>
                </div> */}
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting
                        ? "Saving..."
                        : editCourse
                        ? "Update Course"
                        : "Next"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
              {isLiveBatchVisible && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateBatch(liveBatches, setLiveBatches);
                  }}
                >
                  <div className="space-y-4">
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => {
                        setLiveBatches([
                          ...liveBatches,
                          {
                            id: "",
                            batchName: "",
                            description: "",
                            startDate: null,
                            endDate: null,
                            courseId: "",
                          },
                        ]);
                      }}
                    >
                      Add Live Batch
                    </Button>

                    {liveBatches.map((batch, index) => (
                      <BatchDatePickerRow
                        key={index}
                        index={index}
                        batch={batch}
                        updateBatch={async (
                          index: number,
                          key: string,
                          value: any
                        ) => {
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
                    ))}
                    <DialogFooter>
                      <Button type="submit" variant="default">
                        Save Batches
                      </Button>
                    </DialogFooter>
                  </div>
                </form>
              )}
            </TabsContent>
            {/* Physical Course Form */}
            <TabsContent value="physical">
              {!isPhysicalBatchVisible && (
                <form
                  className="space-y-4 h-[54vh] overflow-y-auto px-1 scroll-thin"
                  onSubmit={handleCourseSubmit}
                >
                  <input type="hidden" name="courseType" value="physical" />
                  <div>
                    <label className="block font-medium mb-1">
                      Course Thumbnail Image
                    </label>
                    <ImageUpload
                      name="image"
                      id="course-thumbnail"
                      error={formErrors.image}
                      onChange={handleImageChange}
                      initialImage={editCourse?.courseVideo || null}
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">
                      Course Name
                    </label>
                    <Input
                      placeholder="Course Name"
                      name="name"
                      defaultValue={editCourse?.CourseName || ""}
                      onBlur={handleTrimInput}
                      onKeyDown={(e) => {
                        if (
                          e.key === " " &&
                          !(e.target as HTMLInputElement).value.trim()
                        ) {
                          e.preventDefault();
                        }
                      }}
                    />
                    {formErrors.name && (
                      <div className="text-red-500">{formErrors.name}</div>
                    )}
                  </div>
                  <div>
                    <label className="block font-medium mb-1">
                      Course Description
                    </label>
                    <Input
                      placeholder="Course Description"
                      name="description"
                      defaultValue={editCourse?.description || ""}
                      onBlur={handleTrimInput}
                      onKeyDown={(e) => {
                        if (
                          e.key === " " &&
                          !(e.target as HTMLInputElement).value.trim()
                        ) {
                          e.preventDefault();
                        }
                      }}
                    />
                    {formErrors.description && (
                      <div className="text-red-500">
                        {formErrors.description}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium mb-1">
                        Instructor Name
                      </label>
                      <Select
                        name="instructor"
                        defaultValue={
                          editCourse?.instructor?._id || editCourse?.instructor
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an instructor" />
                        </SelectTrigger>
                        <SelectContent>
                          {instructors.map((instructor) => (
                            <SelectItem
                              key={instructor._id}
                              value={instructor._id}
                            >
                              {instructor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.instructor && (
                        <div className="text-red-500">
                          {formErrors.instructor}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Language</label>
                      <select
                        name="language"
                        className="flex h-[55px] w-full rounded-md border border-input bg-background px-4 text-base font-semibold ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue={editCourse?.language || "english"}
                      >
                        <option value="english">English</option>
                        <option value="spanish">Spanish</option>
                        <option value="french">French</option>
                        <option value="german">German</option>
                        <option value="hindi">Hindi</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium mb-1">
                        Course Price
                      </label>
                      <Input
                        placeholder="Course Price"
                        type="number"
                        name="price"
                        defaultValue={editCourse?.price || ""}
                      />
                      {formErrors.price && (
                        <div className="text-red-500">{formErrors.price}</div>
                      )}
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Hours</label>
                      <Input
                        placeholder="Hours"
                        type="text"
                        name="hours"
                        defaultValue={editCourse?.hours || ""}
                        onBlur={handleTrimInput}
                        onKeyDown={(e) => {
                          if (
                            e.key === " " &&
                            !(e.target as HTMLInputElement).value.trim()
                          ) {
                            e.preventDefault();
                          }
                        }}
                      />
                      {formErrors.hours && (
                        <div className="text-red-500">{formErrors.hours}</div>
                      )}
                    </div>
                  </div>
                  {/* Start and End Date in one row */}
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <label className="block font-medium mb-1">
                        Start Date
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full h-[55px] justify-start text-left font-normal px-4"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {physicalStartDate ? (
                              format(physicalStartDate, "PPP")
                            ) : (
                              <>
                                <input
                                  placeholder="Pick a date"
                                  className="!outline-none !border-none !bg-transparent !caret-transparent cursor-pointer !text-base !font-semibold"
                                />
                                {/* <span className="text-base font-semibold">Pick a date</span> */}
                              </>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={physicalStartDate}
                            onSelect={setPhysicalStartDate}
                            initialFocus
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      {formErrors.startDate && (
                        <div className="text-red-500">
                          {formErrors.startDate}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block font-medium mb-1">End Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full h-[55px] justify-start text-left font-normal px-4"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {physicalEndDate ? (
                              format(physicalEndDate, "PPP")
                            ) : (
                              <>
                                <input
                                  placeholder="Pick a date"
                                  className="!outline-none !border-none !bg-transparent !caret-transparent cursor-pointer !text-base !font-semibold"
                                />
                                {/* <span className="text-base font-semibold">Pick a date</span> */}
                              </>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={physicalEndDate}
                            onSelect={setPhysicalEndDate}
                            initialFocus
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      {formErrors.endDate && (
                        <div className="text-red-500">{formErrors.endDate}</div>
                      )}
                    </div>
                  </div>
                  {formErrors.dateRange && (
                    <div className="text-red-500">{formErrors.dateRange}</div>
                  )}
                  {/* <div>
                  <label className="block font-medium mb-1">Date and Time</label>
                  <Input placeholder="e.g. 2024-02-15 9:00 AM" name="dateTime" />
                </div> */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block font-medium">Email</label>
                      <Input
                        type="email"
                        placeholder="Email"
                        name="email"
                        defaultValue={editCourse?.email || ""}
                        className="w-full"
                        onBlur={handleTrimInput}
                        onKeyDown={(e) => {
                          if (
                            e.key === " " &&
                            !(e.target as HTMLInputElement).value.trim()
                          ) {
                            e.preventDefault();
                          }
                        }}
                      />
                      {formErrors.email && (
                        <p className="text-red-500">{formErrors.email}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="block font-medium">Phone No.</label>
                      <Input
                        type="tel"
                        placeholder="Phone Number"
                        name="phone"
                        defaultValue={editCourse?.phone || ""}
                        className="w-full"
                        onBlur={handleTrimInput}
                        onKeyDown={(e) => {
                          if (
                            e.key === " " &&
                            !(e.target as HTMLInputElement).value.trim()
                          ) {
                            e.preventDefault();
                          }
                        }}
                      />
                      {formErrors.phone && (
                        <p className="text-red-500">{formErrors.phone}</p>
                      )}
                    </div>
                    {/* <div className="space-y-1">
                                        <label className="block font-medium text-sm">Address</label>
                                        <Input 
                                            placeholder="Full address" 
                                            name="address" 
                                            defaultValue={editCourse?.address || ''} 
                                            className="w-full"
                                        />
                                        {formErrors.address && (
                                            <p className="text-xs text-red-500">{formErrors.address}</p>
                                        )}
                                    </div> */}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium mb-1">City</label>
                      <Input
                        placeholder="City"
                        name="city"
                        defaultValue={editCourse?.city || ""}
                        onBlur={handleTrimInput}
                        onKeyDown={(e) => {
                          if (
                            e.key === " " &&
                            !(e.target as HTMLInputElement).value.trim()
                          ) {
                            e.preventDefault();
                          }
                        }}
                      />
                      {formErrors.city && (
                        <div className="text-red-500">{formErrors.city}</div>
                      )}
                    </div>
                    <div>
                      <label className="block font-medium mb-1">State</label>
                      <Input
                        placeholder="State"
                        name="state"
                        defaultValue={editCourse?.state || ""}
                        onBlur={handleTrimInput}
                        onKeyDown={(e) => {
                          if (
                            e.key === " " &&
                            !(e.target as HTMLInputElement).value.trim()
                          ) {
                            e.preventDefault();
                          }
                        }}
                      />
                      {formErrors.state && (
                        <div className="text-red-500">{formErrors.state}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Country</label>
                    <Input
                      placeholder="Country"
                      name="country"
                      defaultValue={editCourse?.country || ""}
                      onBlur={handleTrimInput}
                      onKeyDown={(e) => {
                        if (
                          e.key === " " &&
                          !(e.target as HTMLInputElement).value.trim()
                        ) {
                          e.preventDefault();
                        }
                      }}
                    />
                    {formErrors.country && (
                      <div className="text-red-500">{formErrors.country}</div>
                    )}
                  </div>

                  <div>
                    <label className="block font-medium mb-1">
                      Intro Video
                    </label>
                    <div className="relative w-full">
                      <Input
                        type="file"
                        name="courseIntroVideo"
                        accept="video/*"
                        className="file:cursor-pointer file:text-base file:py-4 file:rounded-md file:border-0 file:text-white text-gray-600 text-center"
                        onChange={handleIntroVideoChange}
                        id="courseIntroVideo"
                      />
                      {/* Add this to show current video when editing */}
                      {editCourse?.courseIntroVideo && !videoFile && (
                        <div className="mt-2">
                          <video
                            src={editCourse?.courseIntroVideo}
                            controls
                            className="max-w-full h-auto max-h-20 rounded-md"
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            Current video
                          </p>
                        </div>
                      )}
                      {/* Show selected file name when a new video is selected */}
                      {videoFile && (
                        <p className="text-sm text-gray-500 mt-1">
                          Selected: {videoFile.name}
                        </p>
                      )}
                    </div>
                    {formErrors.introVideo && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.introVideo}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block font-medium mb-1">
                      Course Category
                    </label>
                    <select
                      name="courseCategory"
                      className="flex h-[55px] w-full rounded-md border border-input bg-background px-4 text-base font-semibold ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      defaultValue={editCourse?.courseCategory || ""}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* <div>
                  <label className="block font-medium mb-1">Define Course</label>
                  <select name="defineCourse" className="flex h-[55px] w-full rounded-md border border-input bg-background px-3 py-2 text-base font-semibold ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" defaultValue={editCourse?.language || "english"}>
                    <option value="">Choose Option</option>
                    <option value="popular">Popular</option>
                    <option value="trending">Trending</option>
                  </select>
                </div> */}
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting
                        ? "Saving..."
                        : editCourse
                        ? "Update Course"
                        : "Next"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
              {isPhysicalBatchVisible && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateBatch(physicalBatches, setPhysicalBatches);
                  }}
                >
                  <div className="space-y-4">
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => {
                        setPhysicalBatches([
                          ...physicalBatches,
                          {
                            id: "",
                            batchName: "",
                            description: "",
                            centerId: "",
                            startDate: null,
                            endDate: null,
                            courseId: "",
                          },
                        ]);
                      }}
                    >
                      Add Batch
                    </Button>

                    {physicalBatches.map((batch, index) => (
                      <BatchDatePickerRow
                        key={index}
                        index={index}
                        batch={batch}
                        location={activeTab === "physical" ? true : false}
                        updateBatch={async (
                          index: number,
                          key: string,
                          value: any
                        ) => {
                          const updatedBatches = [...physicalBatches];
                          updatedBatches[index] = {
                            ...updatedBatches[index],
                            [key]: value,
                          };
                          setPhysicalBatches(updatedBatches);

                          if (batch._id) {
                            await handleUpdateBatch(
                              batch._id,
                              { ...updatedBatches[index], [key]: value },
                              setPhysicalBatches
                            );
                          }
                        }}
                        removeBatch={(index) =>
                          handleDeleteBatch(
                            physicalBatches?.[index]?._id as string,
                            setPhysicalBatches
                          )
                        }
                        errors={batchErrors[index]}
                        centers={centers}
                        setSelectedCenter={setSelectedCenter}
                      />
                    ))}
                    <DialogFooter>
                      <Button type="submit" variant="default">
                        Save Batches
                      </Button>
                    </DialogFooter>
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Are you sure you want to delete this course? This action cannot
                be undone.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  courseToDelete && handleDeleteCourse(courseToDelete._id)
                }
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between space-x-2 p-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 font-normal"
          />
        </div>
        <Button
          onClick={() => {
            resetForm();
            setOpen(true);
            setFormActiveTab(activeTab);
          }}
          className="text-base font-semibold"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Course
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full space-y-4 px-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger
            value="recorded"
            className="text-base font-semibold w-full"
          >
            Recorded
          </TabsTrigger>
          <TabsTrigger value="live" className="text-base font-semibold w-full">
            Live
          </TabsTrigger>
          <TabsTrigger
            value="physical"
            className="text-base font-semibold w-full"
          >
            In-Person
          </TabsTrigger>
        </TabsList>

        {isTabSwitching ? (
          <div className="flex justify-center items-center min-h-[70vh]">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <TabsContent value="recorded" className="space-y-4 pt-4">
              {renderCourseList(
                courses.filter(
                  (c) => c.courseType?.toLowerCase() === "recorded"
                ),
                "No recorded courses found."
              )}
            </TabsContent>
            <TabsContent value="live" className="space-y-4 pt-4">
              {renderCourseList(
                courses.filter((c) => c.courseType?.toLowerCase() === "live"),
                "No live courses found."
              )}
            </TabsContent>
            <TabsContent value="physical" className="space-y-4 pt-4">
              {renderCourseList(
                courses.filter(
                  (c) => c.courseType?.toLowerCase() === "physical"
                ),
                "No physical courses found."
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
      {searchTerm === "" && (
        <DataTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(value) => {
            setItemsPerPage(value);
            setCurrentPage(1);
          }}
          itemsPerPageOptions={[8, 10, 20, 30, 50]}
          className="border-t pt-4"
        />
      )}
    </div>
  );
}
