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
  VideoIcon,
  Eye,
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
import { Country } from "country-state-city";
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
import SyllabusFormList from "@/components/course/SyllabusFormList";
import SyllabusSection from "@/components/course/SyllabusFormList";
import {
  createSyllabus,
  deleteSyllabus,
  updateSyllabus,
} from "@/components/api/syllabus";
import { Label } from "@radix-ui/react-label";
import ChapterFormList from "@/components/course/ChapterFormList";
import ViewCourseModal from "@/components/course/ViewCourseModal";

type Batch = {
  _id?: string;
  id: string;
  batchName: string;
  centerId?: string;
  description: string;
  startDate: Date | null;
  endDate: Date | null;
  courseId: string;
  time?: string | null;
  meetingLink?: string | null;
  [key: string]: any;
};

export default function Courses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("coursesActiveTab") || "recorded";
    }
    return "recorded";
  });
  const [formActiveTab, setFormActiveTab] = useState("recorded");
  const [isTabSwitching, setIsTabSwitching] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({
    code: "IN",
    phonecode: "91",
  });

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
  const [isSyllabusVisible, setIsSyllabusVisible] = useState(false);
  const [isChaptersVisible, setIsChaptersVisible] = useState(false);
  const [latestCourse, setLatestCourse] = useState<Course | null>(null);
  const [viewCourseModalOpen, setViewCourseModalOpen] = useState(false);
  const [liveBatches, setLiveBatches] = useState<Batch[]>([
    {
      id: "",
      batchName: "",
      description: "",
      startDate: null,
      endDate: null,
      time: null,
      meetingLink: null,
      courseId: "",
    },
  ]);
  const [batchErrors, setBatchErrors] = useState<Record<number, any>>({});
  const [syllabusList, setSyllabusList] = useState<any[]>([]);
  const [physicalBatches, setPhysicalBatches] = useState<Batch[]>([
    {
      id: "",
      batchName: "",
      description: "",
      centerId: "",
      startDate: null,
      endDate: null,
      time: null,
      courseId: "",
    },
  ]);

  // Clear batches when the form is closed
  useEffect(() => {
    if (!isLiveBatchVisible) {
      setLiveBatches([
        {
          id: "",
          batchName: "",
          description: "",
          startDate: null,
          endDate: null,
          time: null,
          meetingLink: null,
          courseId: "",
        },
      ]);
    }
    if (!isPhysicalBatchVisible) {
      setPhysicalBatches([
        {
          id: "",
          batchName: "",
          description: "",
          centerId: "",
          startDate: null,
          endDate: null,
          time: null,
          courseId: "",
        },
      ]);
    }
  }, [isPhysicalBatchVisible, isLiveBatchVisible]);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [chaptersList, setChaptersList] = useState<any[]>([]);
  // Add error state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Add loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [centers, setCenters] = useState<any[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<any>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

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

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timerId);
  }, [searchTerm]);

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
      if (!b.time) {
        err.time = "Time is required";
      } else if (b.time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(b.time)) {
        err.time = "Please enter a valid time in 24-hour format (HH:MM)";
      }

      if (
        b.startDate &&
        b.endDate &&
        new Date(b.startDate) > new Date(b.endDate)
      ) {
        err.endDate = "End date must be after start date";
      }
      if (activeTab === "physical") {
        if (!b.centerId) err.centerId = "Center is required";
      } else if (activeTab === "live") {
        if (!b.meetingLink) {
          err.meetingLink = "Meeting link is required";
        } else if (!isValidUrl(b.meetingLink)) {
          err.meetingLink = "Please enter a valid URL";
        }
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
          ...(activeTab === "live" && {
            meetingLink: b.meetingLink || null,
          }),
          time: b.time || null,
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
      // Ensure we're sending the correct fields to the API
      const batchData = {
        ...updatedData,
        ...(updatedData.meetingLink && {
          meetingLink: updatedData.meetingLink,
        }),
      };
      const res = await updateBatch(id, batchData);
      if (res.success) {
        toast.success("Batch updated successfully");
        const updated = await getAllBatch(latestCourse?._id || "");
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
    id: string | undefined,
    setBatches: React.Dispatch<React.SetStateAction<Batch[]>>,
    index?: number
  ) => {
    try {
      setIsSubmitting(true);

      if (!id && index !== undefined) {
        setBatches((prev) => prev.filter((_, i) => i !== index));
        return;
      }

      if (id) {
        const res = await deleteBatch(id);
        if (res.success) {
          toast.success("Batch deleted successfully");
          setBatches((prev) => prev.filter((b) => b._id !== id));
        } else {
          toast.error(res.message || "Failed to delete batch");
        }
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
    // Clear any previous errors first
    setFormErrors((prev) => ({ ...prev, introVideo: "" }));

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 10 * 1024 * 1024;
      if (!file) {
        setFormErrors((prev) => ({
          ...prev,
          introVideo: "Please select a video file",
        }));
        e.target.value = "";
        setVideoFile(null);
        return;
      }

      if (!file.type.startsWith("video/")) {
        toast.error("Please upload a valid video file (MP4, WebM, etc.)");
        setFormErrors((prev) => ({
          ...prev,
          introVideo: "Please upload a valid video file (MP4, WebM, etc.)",
        }));
        e.target.value = "";
        setVideoFile(null);
        return;
      }

      if (file.size > maxSize) {
        toast.error("Video file size must be less than 10MB");
        setFormErrors((prev) => ({
          ...prev,
          introVideo: "Video file size must be less than 10MB",
        }));
        e.target.value = "";
        setVideoFile(null);
        return;
      }

      setVideoFile(file);
    } else {
      // If no file is selected, clear the video file
      setVideoFile(null);
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
    const introVideo = formData.get("introVideo")?.toString().trim() || "";

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
    const price = priceValue ? parseFloat(priceValue) : 0;
    if (!priceValue || isNaN(price) || price <= 0) {
      errors.price = "Please enter a valid price greater than 0";
    }

    // Validate hours (required and > 0)
    const hoursValue = formData.get("hours")?.toString();
    const hours = parseFloat(hoursValue || "");
    if (!hoursValue || isNaN(hours) || hours <= 0) {
      errors.hours = "Please enter valid hours greater than 0";
    }

    // Image required on create (skip when editing)
    if (!editCourse && !imageFile) {
      errors.image = "Please upload an image";
    }

    if (!editCourse && !videoFile) {
      errors.videoFile = "Please upload an video";
    }

    if (courseType === "physical") {
      if (!formData.get("email")?.toString().trim()) {
        errors.email = "Email is required";
      } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          formData.get("email")?.toString().trim().toLowerCase() || ""
        )
      ) {
        errors.email = "Please enter a valid email address";
      }

      // For required phone
      if (!formData.get("phone")?.toString().trim()) {
        errors.phone = "Phone number is required";
      }
      // else if (
      //   !/^[+\d\s-]{10,}$/.test(formData.get("phone")?.toString().trim() || "")
      // ) {
      //   errors.phone = "Please enter a valid phone number (min 10 digits)";
      // }
    }
    console.log(errors);
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
        search: debouncedSearchTerm,
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
    setLoading(true);
    fetchCourses();
  }, [currentPage, itemsPerPage, debouncedSearchTerm, activeTab]);

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
                      ? `/dashboard/courses/${course._id}`
                      : `/dashboard/courses/${course._id}`
                  }
                  className="hover:underline cursor-pointer truncate block max-w-[250px]"
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
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setSelectedCourse(course);
                    setViewCourseModalOpen(true);
                    setPopoverOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Eye className="mr-2 h-5 w-5" />
                  <span className="text-base font-semibold text-gray-500 font-lexend">
                    View Course
                  </span>
                </DropdownMenuItem>

                {activeTab === "live" ? (
                  <>
                    <Link
                      href={`/dashboard/courses/${course._id}/batches?type=${activeTab}`}
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
                      href={`/dashboard/courses/${course._id}/syllabus?type=${activeTab}`}
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
                          Edit Syllabus
                        </span>
                      </DropdownMenuItem>
                    </Link>
                  </>
                ) : activeTab === "physical" ? (
                  <>
                    <Link
                      href={`/dashboard/courses/${course._id}/batches?type=${activeTab}`}
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
                      href={`/dashboard/courses/${course._id}/syllabus?type=${activeTab}`}
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
                          Edit Syllabus
                        </span>
                      </DropdownMenuItem>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href={`/dashboard/courses/${course._id}`}
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
                          Edit Chapters
                        </span>
                      </DropdownMenuItem>
                    </Link>
                    <Link
                      href={`/dashboard/courses/${course._id}/syllabus?type=${activeTab}`}
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
                          Edit Syllabus
                        </span>
                      </DropdownMenuItem>
                    </Link>
                  </>
                )}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditCourse(course);
                    setOpen(true);
                    setPopoverOpen(false);
                    setIsSyllabusVisible(false);
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
              <span className="text-white">{course.courseType}</span>
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
              <span className=" capitalize">
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
      if (courseType === "recorded") {
        apiFormData.append("courseStart", startDate);
        apiFormData.append("courseEnd", endDate);
      } else if (courseType === "physical") {
        apiFormData.append("email", formData.get("email") || "");
        apiFormData.append("phone", formData.get("phone") || "");
        // apiFormData.append('address', formData.get('address') || '');
      }

      if (imageFile) {
        apiFormData.append("image", imageFile);
      }

      // if (formData.get("city")) {
      //   apiFormData.append("city", formData.get("city") || "");
      // }

      // if (formData.get("state")) {
      //   apiFormData.append("state", formData.get("state") || "");
      // }

      // if (formData.get("country")) {
      //   apiFormData.append("country", formData.get("country") || "");
      // }
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
          if (!editCourse) {
            setIsSyllabusVisible(true);
          } else {
            setOpen(false);
            setEditCourse(null);
          }
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
    setLoading(true);
    setIsTabSwitching(true);
    setActiveTab(value);
    localStorage.setItem("coursesActiveTab", value);
    setCourses([]);

    setTimeout(() => {
      setIsTabSwitching(false);
    }, 500);
  };

  const isTabDisabled = (tabType: string) => {
    if (!editCourse) return false;
    return editCourse.courseType !== tabType;
  };

  const handleFormTabChange = (value: string) => {
    if (isPhysicalBatchVisible || isLiveBatchVisible || isSyllabusVisible) {
      toast.error("Please Fill all nessary fields");
      return;
    }
    setIsLiveBatchVisible(false);
    setIsPhysicalBatchVisible(false);
    setIsSyllabusVisible(false);
    if (editCourse && editCourse.courseType !== value) {
      // Don't allow changing tabs when editing a course
      return;
    }
    setFormActiveTab(value);
  };

  const renderCourseList = (courses: any[], emptyMessage: string) => {
    if (isTabSwitching) {
      return (
        <div className="flex justify-center items-center min-h-[70vh]">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }
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
          // If trying to close the dialog
          if (!val) {
            if (latestCourse?._id !== undefined) {
              if (
                isSyllabusVisible &&
                (!syllabusList || syllabusList.length === 0)
              ) {
                toast.error("Cannot close: Please add at least one syllabus");
                return;
              }

              if (activeTab === "recorded") {
                // Check if there are any chapters for recorded courses
                if (!isSyllabusVisible && chaptersList.length > 0) {
                  toast.error("Cannot close: Please add at least one chapter");
                  return;
                }
              }

              if (
                activeTab === "live" &&
                (!liveBatches || liveBatches.length === 0)
              ) {
                toast.error("Cannot close: Please add at least one live batch");
                return;
              }

              if (
                activeTab === "physical" &&
                (!physicalBatches || physicalBatches.length === 0)
              ) {
                toast.error(
                  "Cannot close: Please add at least one physical batch"
                );
                return;
              }
            }

            // Proceed with close
            setOpen(val);
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

            if (!editCourse) {
              setLiveBatches([
                {
                  id: "",
                  batchName: "",
                  description: "",
                  startDate: null,
                  endDate: null,
                  courseId: "",
                },
              ]);
              setPhysicalBatches([
                {
                  id: "",
                  batchName: "",
                  description: "",
                  startDate: null,
                  endDate: null,
                  courseId: "",
                },
              ]);
            }

            const form = document.querySelector("form");
            if (form) {
              form.reset();
            }
          } else {
            // Opening the dialog
            setOpen(val);
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
            {!isSyllabusVisible && !isChaptersVisible && (
              <TabsContent value="recorded">
                <form
                  className="space-y-4 h-[54vh] overflow-y-auto px-1 scroll-thin"
                  onSubmit={handleCourseSubmit}
                >
                  <input type="hidden" name="courseType" value="recorded" />
                  <div>
                    <label className="block font-medium mb-1">
                      Course Thumbnail Image *
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
                      Course Name *
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
                      Course Description *
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium mb-1">
                        Instructor Name *
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium mb-1">
                        Course Price *
                      </label>
                      <Input
                        placeholder="Course Price"
                        type="number"
                        step="0.01"
                        min="0"
                        name="price"
                        defaultValue={editCourse?.price || ""}
                        onInput={(e) => {
                          const value = e.currentTarget.value;
                          if (value.includes(".")) {
                            const [whole, decimal] = value.split(".");
                            if (decimal && decimal.length > 2) {
                              e.currentTarget.value = `${whole}.${decimal.slice(
                                0,
                                2
                              )}`;
                            }
                          }
                        }}
                      />
                      {formErrors.price && (
                        <div className="text-red-500">{formErrors.price}</div>
                      )}
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Hours *</label>
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

                  <div className="flex flex-col">
                    <label className="block font-medium mb-1">
                      Course Level *
                    </label>
                    <Input
                      type="text"
                      name="courseLevel"
                      placeholder="Enter course level"
                      defaultValue={editCourse?.courseLevel || ""}
                      className="h-[55px] w-full"
                      onBlur={handleTrimInput}
                    />
                    {formErrors.courseLevel && (
                      <p className="text-red-500">{formErrors.courseLevel}</p>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <label className="block font-medium mb-1">
                      Intro Video *
                    </label>

                    <div className="w-full">
                      <div className="border border-dashed border-gray-300 rounded-md p-4 text-center">
                        {editCourse?.courseIntroVideo ? (
                          <div className="flex justify-center mb-2 items-center">
                            <video
                              src={editCourse?.courseIntroVideo}
                              controls
                              className=" h-auto max-h-20 rounded-md"
                            />
                          </div>
                        ) : (
                          <VideoIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        )}
                        <p className="text-sm text-gray-600 mb-2">
                          {videoFile
                            ? videoFile.name
                            : editCourse?.courseIntroVideo
                            ? "Video file selected"
                            : "No video file selected"}
                        </p>

                        <Input
                          type="file"
                          name="courseIntroVideo"
                          accept="video/mp4,video/webm,video/quicktime"
                          className="hidden"
                          id="courseIntroVideo"
                          onChange={handleIntroVideoChange}
                        />

                        <Label
                          htmlFor="courseIntroVideo"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white gradient-bg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
                        >
                          {videoFile || editCourse?.courseIntroVideo
                            ? "Change Video"
                            : "Upload Video"}
                        </Label>
                      </div>
                      {formErrors.videoFile && (
                        <p className="text-sm font-semibold text-red-500 mt-1">
                          {formErrors.videoFile}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium mb-1">
                      Course Category *
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
                        : "Next"}
                    </Button>
                  </DialogFooter>
                </form>
              </TabsContent>
            )}
            {isSyllabusVisible && (
              <SyllabusSection
                courseId={latestCourse?._id}
                onAdd={(data: any) => createSyllabus(data)}
                onUpdate={(data: any) => updateSyllabus(data.id, data)}
                onDelete={(id: string) => deleteSyllabus(id)}
                setIsSyllabusVisible={() => setIsSyllabusVisible(false)}
                setIsLiveBatchVisible={() =>
                  activeTab === "live"
                    ? setIsLiveBatchVisible(true)
                    : setIsLiveBatchVisible(false)
                }
                setIsChaptersVisible={() =>
                  activeTab === "recorded"
                    ? setIsChaptersVisible(true)
                    : setIsChaptersVisible(false)
                }
                setIsPhysicalBatchVisible={() =>
                  activeTab === "physical"
                    ? setIsPhysicalBatchVisible(true)
                    : setIsPhysicalBatchVisible(false)
                }
                saveTitle="Next"
              />
            )}
            {!isSyllabusVisible && isChaptersVisible && (
              <ChapterFormList
                courseId={latestCourse?._id}
                onSuccess={() => {
                  setIsChaptersVisible(false);
                  setOpen(false);
                }}
                setChaptersList={(chapters: any[]) => {
                  setChaptersList(chapters);
                }}
              />
            )}
            {/* Live Course Form */}
            <TabsContent value="live">
              {!isLiveBatchVisible && !isSyllabusVisible && (
                <form
                  className="space-y-4 h-[54vh] overflow-y-auto px-1 scroll-thin"
                  onSubmit={handleCourseSubmit}
                >
                  <input type="hidden" name="courseType" value="live" />
                  <div>
                    <label className="block font-medium mb-1">
                      Course Thumbnail Image *
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
                      Course Name *
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
                      Course Description *
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
                        Instructor Name *
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
                        Course Price *
                      </label>
                      <Input
                        placeholder="Course Price"
                        type="number"
                        step="0.01"
                        min="0"
                        name="price"
                        defaultValue={editCourse?.price || ""}
                        onInput={(e) => {
                          const value = e.currentTarget.value;
                          if (value.includes(".")) {
                            const [whole, decimal] = value.split(".");
                            if (decimal && decimal.length > 2) {
                              e.currentTarget.value = `${whole}.${decimal.slice(
                                0,
                                2
                              )}`;
                            }
                          }
                        }}
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

                  <div className="flex flex-col">
                    <label className="block font-medium mb-1">
                      Course Level *
                    </label>
                    <Input
                      type="text"
                      name="courseLevel"
                      placeholder="Enter course level"
                      defaultValue={editCourse?.courseLevel || ""}
                      className="h-[55px] w-full"
                      onBlur={handleTrimInput}
                    />
                    {formErrors.courseLevel && (
                      <p className="text-red-500">{formErrors.courseLevel}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-medium mb-1">
                      Intro Video *
                    </label>

                    <div className="w-full">
                      <div className="border border-dashed border-gray-300 rounded-md p-4 text-center">
                        {editCourse?.courseIntroVideo ? (
                          <div className="flex justify-center mb-2 items-center">
                            <video
                              src={editCourse?.courseIntroVideo}
                              controls
                              className=" h-auto max-h-20 rounded-md"
                            />
                          </div>
                        ) : (
                          <VideoIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        )}{" "}
                        <p className="text-sm text-gray-600 mb-2">
                          {videoFile
                            ? videoFile.name
                            : editCourse?.courseIntroVideo
                            ? "Video file selected"
                            : "No video file selected"}
                        </p>
                        <Input
                          type="file"
                          name="courseIntroVideo"
                          accept="video/mp4,video/webm,video/quicktime"
                          className="hidden"
                          onChange={handleIntroVideoChange}
                          id="courseIntroVideo"
                        />
                        <Label
                          htmlFor="courseIntroVideo"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white gradient-bg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
                        >
                          {videoFile || editCourse?.courseIntroVideo
                            ? "Change Video"
                            : "Upload Video"}
                        </Label>
                      </div>
                      {formErrors.videoFile && (
                        <p className="text-sm font-semibold text-red-500 mt-1">
                          {formErrors.videoFile}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">
                      Course Category *
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
                            time: null,
                            meetingLink: null,
                          },
                        ]);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Live Batch
                    </Button>

                    {liveBatches.map((batch, index) => (
                      <BatchDatePickerRow
                        key={index}
                        index={index}
                        batch={batch}
                        link={true}
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
                        removeBatch={
                          liveBatches.length > 1
                            ? async (index) => {
                                const currentBatch = liveBatches[index];
                                if (currentBatch._id) {
                                  await handleDeleteBatch(
                                    currentBatch._id,
                                    setLiveBatches
                                  );
                                } else {
                                  // For unsaved batches, just remove from the local state
                                  setLiveBatches((prevBatches) =>
                                    prevBatches.filter((_, i) => i !== index)
                                  );
                                }
                              }
                            : undefined
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
              {!isPhysicalBatchVisible && !isSyllabusVisible && (
                <form
                  className="space-y-4 h-[54vh] overflow-y-auto px-1 scroll-thin"
                  onSubmit={handleCourseSubmit}
                >
                  <input type="hidden" name="courseType" value="physical" />
                  <div>
                    <label className="block font-medium mb-1">
                      Course Thumbnail Image *
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
                      Course Name *
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
                      Course Description *
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
                        Instructor Name *
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
                        Course Price *
                      </label>
                      <Input
                        placeholder="Course Price"
                        type="number"
                        step="0.01"
                        min="0"
                        name="price"
                        defaultValue={editCourse?.price || ""}
                        onInput={(e) => {
                          const value = e.currentTarget.value;
                          if (value.includes(".")) {
                            const [whole, decimal] = value.split(".");
                            if (decimal && decimal.length > 2) {
                              e.currentTarget.value = `${whole}.${decimal.slice(
                                0,
                                2
                              )}`;
                            }
                          }
                        }}
                      />
                      {formErrors.price && (
                        <div className="text-red-500">{formErrors.price}</div>
                      )}
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Hours *</label>
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

                  {/* <div>
                  <label className="block font-medium mb-1">Date and Time</label>
                  <Input placeholder="e.g. 2024-02-15 9:00 AM" name="dateTime" />
                </div> */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block font-medium">Email *</label>
                      <Input
                        type="email"
                        placeholder="Email"
                        name="email"
                        defaultValue={editCourse?.email || ""}
                        className="w-full lowercase"
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
                      <label className="block font-medium">Phone No. *</label>
                      <div className="flex gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="h-[55px] justify-start"
                            >
                              {selectedCountry.phonecode.startsWith("+")
                                ? selectedCountry.phonecode
                                : `+${selectedCountry.phonecode}`}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            className="w-80 max-h-96 overflow-y-auto mt-2"
                            sideOffset={0}
                            align="start"
                            style={{
                              position: "relative",
                            }}
                          >
                            <div className="p-2">
                              <Input
                                type="search"
                                placeholder="Search country..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="mb-2 h-[30px] text-sm"
                                autoFocus
                              />
                            </div>
                            {Country.getAllCountries()
                              .filter((country) => {
                                const searchLower = searchInput.toLowerCase();
                                return (
                                  country.name
                                    .toLowerCase()
                                    .includes(searchLower) ||
                                  country.isoCode
                                    .toLowerCase()
                                    .includes(searchLower) ||
                                  country.phonecode.includes(searchInput)
                                );
                              })
                              .map((country) => (
                                <DropdownMenuItem
                                  key={country.isoCode}
                                  onClick={() =>
                                    setSelectedCountry({
                                      code: country.isoCode,
                                      phonecode: country.phonecode,
                                    })
                                  }
                                  className="flex  items-center gap-2"
                                >
                                  <span className="w-8 text-sm">
                                    {country.flag}
                                  </span>
                                  <span className="w-16 text-sm">
                                    {country.phonecode.startsWith("+")
                                      ? country.phonecode
                                      : `+${country.phonecode}`}
                                  </span>
                                  <span className="text-muted-foreground ml-2">
                                    {country.name}
                                  </span>
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={10}
                          placeholder="Phone Number"
                          name="phone"
                          defaultValue={editCourse?.phone || ""}
                          className="flex-1"
                          onBlur={handleTrimInput}
                          onKeyDown={(e) => {
                            if (
                              e.key === " " &&
                              !(e.target as HTMLInputElement).value.trim()
                            ) {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            const value = e.target.value;
                            e.target.value = value.replace(/[^0-9]/g, "");

                            if (e.target.form) {
                              const formData = new FormData(e.target.form);
                              formData.set(
                                "phone",
                                `+${selectedCountry.phonecode}${e.target.value}`
                              );
                            }
                          }}
                        />
                      </div>
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
                  <div className="flex flex-col">
                    <label className="block font-medium mb-1">
                      Course Level
                    </label>
                    <Input
                      type="text"
                      name="courseLevel"
                      placeholder="Enter course level"
                      defaultValue={editCourse?.courseLevel || ""}
                      className="h-[55px] w-full"
                      onBlur={handleTrimInput}
                    />
                    {formErrors.courseLevel && (
                      <p className="text-red-500">{formErrors.courseLevel}</p>
                    )}
                  </div>
                  <div>
                    <label className="block font-medium mb-1">
                      Intro Video *
                    </label>

                    <div className="w-full">
                      <div className="border border-dashed border-gray-300 rounded-md p-4 text-center">
                        {editCourse?.courseIntroVideo ? (
                          <div className="flex justify-center mb-2 items-center">
                            <video
                              src={editCourse?.courseIntroVideo}
                              controls
                              className=" h-auto max-h-20 rounded-md"
                            />
                          </div>
                        ) : (
                          <VideoIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        )}{" "}
                        <p className="text-sm text-gray-600 mb-2">
                          {videoFile
                            ? videoFile.name
                            : editCourse?.courseIntroVideo
                            ? "Video file selected"
                            : "No video file selected"}
                        </p>
                        <Input
                          type="file"
                          name="courseIntroVideo"
                          accept="video/mp4,video/webm,video/quicktime"
                          className="hidden"
                          onChange={handleIntroVideoChange}
                          id="courseIntroVideo"
                        />
                        <Label
                          htmlFor="courseIntroVideo"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white gradient-bg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
                        >
                          {videoFile || editCourse?.courseIntroVideo
                            ? "Change Video"
                            : "Upload Video"}
                        </Label>
                      </div>
                      {formErrors.videoFile && (
                        <p className="text-sm font-semibold text-red-500 mt-1">
                          {formErrors.videoFile}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">
                      Course Category *
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
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Batches</h3>
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
                        <Plus className="mr-2 h-4 w-4" /> Add Batch
                      </Button>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {physicalBatches.map((batch, index) => (
                        <div key={index} className="relative group">
                          <BatchDatePickerRow
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
                            removeBatch={(batchIndex) =>
                              handleDeleteBatch(
                                physicalBatches?.[batchIndex]?._id,
                                setPhysicalBatches,
                                batchIndex
                              )
                            }
                            errors={batchErrors[index]}
                            centers={centers}
                            setSelectedCenter={setSelectedCenter}
                          />
                        </div>
                      ))}
                    </div>
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
            type="search"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.trimStart())}
            className="pl-10 font-normal"
          />
        </div>
        <Button
          onClick={() => {
            resetForm();
            setOpen(true);
            setFormActiveTab(activeTab);
            setIsSyllabusVisible(false);
            setIsLiveBatchVisible(false);
            setIsPhysicalBatchVisible(false);
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
      <ViewCourseModal
        open={viewCourseModalOpen}
        onClose={() => setViewCourseModalOpen(false)}
        course={selectedCourse}
      />
    </div>
  );
}
