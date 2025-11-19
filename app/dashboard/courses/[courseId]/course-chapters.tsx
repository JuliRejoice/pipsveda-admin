"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Video as VideoIcon,
  AlertTriangle,
  Loader2,
  X,
  ImageIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  createChapter,
  updateChapter,
  deleteChapter,
  getChapters,
  uploadImage,
} from "@/components/api/course";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { MoreVertical } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import Image from "next/image";

export interface Chapter {
  chapterImage: string;
  _id: string;
  chapterName: string; // new
  title?: string; // keep for backward compatibility
  description: string;
  duration: string; // changed from number to string
  videoUrl: string;
  chapterVideo?: string; // add this for YouTube links
  chapterNo: string; // changed from number to string
  order?: number; // keep for backward compatibility
  courseId:
    | string
    | {
        _id: string;
        CourseName: string;
        hours: number;
      };
  createdAt: string;
  updatedAt: string;
}

interface CourseChaptersProps {
  initialChapters: Chapter[];
  courseId: string;
  courseName?: string; // Add courseName prop
  loading?: boolean;
  setChapters?: (chapters: Chapter[]) => void;
  setLoading?: (loading: boolean) => void;
}

export function CourseChapters({
  initialChapters,
  courseId,
  courseName,
  loading,
  setLoading,
  setChapters,
}: CourseChaptersProps) {
  const router = useRouter();
  const [isTabSwitching, setIsTabSwitching] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [chapterThumbnailFile, setChapterThumbnailFile] = useState<File | null>(
    null
  );
  const [isImageUploadSuccessful, setIsImageUploadSuccessful] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const [formData, setFormData] = useState<{
    chapterImage: string;
    chapterName: string;
    description: string;
    duration: string;
    videoUrl: string;
    videoFile: File | null;
    chapterNo: string;
    image: File | null;
  }>({
    chapterImage: "",
    chapterName: "",
    description: "",
    duration: "",
    videoUrl: "",
    videoFile: null,
    chapterNo: "",
    image: null,
  });

  const [errors, setErrors] = useState<{
    chapterImage?: string;
    chapterName?: string;
    description?: string;
    duration?: string;
    videoUrl?: string;
    videoFile?: string;
    chapterNo?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    let isValid = true;

    if (!formData.chapterName.trim()) {
      newErrors.chapterName = "Chapter name is required";
      isValid = false;
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
      isValid = false;
    }

    // Duration validation
    if (!formData.duration) {
      newErrors.duration = "Duration is required";
      isValid = false;
    } else if (isNaN(Number(formData.duration))) {
      newErrors.duration = "Duration must be a valid number";
      isValid = false;
    } else if (Number(formData.duration) <= 0) {
      newErrors.duration = "Duration must be greater than 0";
      isValid = false;
    } else if (Number(formData.duration) === 0) {
      newErrors.duration = "Duration cannot be 0";
      isValid = false;
    }

    // Video file validation
    if (!selectedChapter && !formData.videoFile) {
      newErrors.videoFile = "Video file is required";
      isValid = false;
    } else if (formData.videoFile) {
      const validTypes = ["video/mp4", "video/webm", "video/quicktime"];
      if (!validTypes.includes(formData.videoFile.type)) {
        newErrors.videoFile =
          "Please upload a valid video file (MP4, WebM, or QuickTime)";
        isValid = false;
      } else if (formData.videoFile.size > 50 * 1024 * 1024) {
        // 50MB limit
        newErrors.videoFile = "Video file size should be less than 50MB";
        isValid = false;
      }
    }

    // Chapter number validation
    if (!formData.chapterNo) {
      newErrors.chapterNo = "Chapter number is required";
      isValid = false;
    } else if (
      isNaN(Number(formData.chapterNo)) ||
      !Number.isInteger(Number(formData.chapterNo))
    ) {
      newErrors.chapterNo = "Chapter number must be a whole number";
      isValid = false;
    } else if (Number(formData.chapterNo) <= 0) {
      newErrors.chapterNo = "Chapter number must be greater than 0";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle route changes and tab switching
  useEffect(() => {
    if (!router) return;

    // Trigger tab switching loader
    const handleRouteChange = () => {
      setIsTabSwitching(true);

      // Stop loader after short delay
      const timeout = setTimeout(() => {
        setIsTabSwitching(false);
      }, 500);

      return () => clearTimeout(timeout);
    };
  }, [router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }

    if (type === "file") {
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      if (name === "videoFile") {
        if (file) {
          // Set immediate local preview
          setVideoPreview(URL.createObjectURL(file));
        }
        setFormData((prev) => ({
          ...prev,
          videoFile: file,
          videoUrl: file ? file.name : "",
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: file,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const data = new FormData();

      if (selectedChapter) {
        // Update mode - only send changed fields
        if (
          formData.chapterName !==
          (selectedChapter.chapterName || selectedChapter.title || "")
        ) {
          data.append("chapterName", formData.chapterName);
        }
        if (formData.description !== selectedChapter.description) {
          data.append("description", formData.description);
        }

        const originalDuration =
          typeof selectedChapter.courseId === "string"
            ? ""
            : selectedChapter.courseId.hours.toString();
        const currentDuration = formData.duration
          ? String(Number(formData.duration))
          : "";
        if (currentDuration !== originalDuration) {
          data.append("duration", currentDuration);
        }

        const originalVideoUrl =
          selectedChapter.videoUrl || selectedChapter.chapterVideo || "";
        if (formData.videoFile) {
          // New video file uploaded
          data.append("image", formData.videoFile);
        } else if (formData.videoUrl !== originalVideoUrl) {
          // Video URL changed
          data.append("image", formData.videoUrl);
          data.append("chapterVideo", formData.videoUrl);
        }

        const originalChapterNo = String(
          selectedChapter.chapterNo || selectedChapter.order || ""
        );
        if (formData.chapterNo !== originalChapterNo) {
          data.append("chapterNo", formData.chapterNo);
        }

        // Update chapter thumbnail
        if (chapterThumbnailFile) {
          data.append("chapterImage", chapterThumbnailFile);
        } else {
          // Ensure we always send a string, not a File object
          const imageUrl =
            typeof formData.chapterImage === "string"
              ? formData.chapterImage
              : "";
          console.log("Updating chapterImage:", imageUrl, typeof imageUrl);
          data.append("chapterImage", imageUrl); // Always a string
        }

        // Always include courseId for updates
        data.append("courseId", courseId);
      } else {
        // Create mode - send all fields
        data.append("chapterName", formData.chapterName);
        data.append("description", formData.description);
        const durationValue = formData.duration
          ? String(Number(formData.duration))
          : "";
        data.append("duration", durationValue);
        if (formData.videoFile) {
          // New video file uploaded
          data.append("image", formData.videoFile);
        } else if (formData.videoUrl) {
          // Video URL changed
          data.append("image", formData.videoUrl);
          data.append("chapterVideo", formData.videoUrl);
        }
        data.append("chapterNo", formData.chapterNo);
        data.append("courseId", courseId);

        if (formData.image) {
          data.append("image", formData.image);
        }
        // Only send chapterImage if it's a string URL
        if (typeof formData.chapterImage === "string") {
          console.log(
            "Creating chapterImage:",
            formData.chapterImage,
            typeof formData.chapterImage
          );
          data.append("chapterImage", formData.chapterImage);
        }
      }

      if (selectedChapter) {
        setIsUpdating(true);
        await updateChapter(selectedChapter._id, data);
        toast.success("Chapter updated successfully");
        const res = await getChapters(courseId);
        setChapters?.(res.payload?.data || []);
        router.refresh(); // Only refresh after success!
        setIsUpdating(false);
      } else {
        setIsCreating(true);
        await createChapter(data);
        toast.success("Chapter created successfully");
        const res = await getChapters(courseId);
        setChapters?.(res.payload?.data || []);
        router.refresh();
        setIsCreating(false);
      }
      setIsAddDialogOpen(false);
      setSelectedChapter(null);
      setFormData({
        chapterImage: "",
        chapterName: "",
        description: "",
        duration: "",
        videoUrl: "",
        videoFile: null,
        chapterNo: "",
        image: null,
      });
      setImagePreview(null);
      setVideoPreview(null);
    } catch (error) {
      console.error("Error saving chapter:", error);
      toast.error("Failed to save chapter");
      setIsCreating(false);
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedChapter) return;
    setIsDeleting(true);
    try {
      await deleteChapter(selectedChapter._id);
      toast.success("Chapter deleted successfully");
      const res = await getChapters(courseId);
      setChapters?.(res.payload?.data || []);

      router.refresh();
      setIsDeleteDialogOpen(false);
      setSelectedChapter(null);
      setIsDeleting(false);
    } catch (error) {
      console.error("Error deleting chapter:", error);
      toast.error("Failed to delete chapter");
      setIsDeleting(false);
    }
  };

  const openEditDialog = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setFormData({
      chapterName: chapter.chapterName || chapter.title || "",
      description: chapter.description,
      duration:
        typeof chapter.courseId === "string"
          ? ""
          : chapter.courseId.hours.toString(),
      videoUrl: chapter.videoUrl || chapter.chapterVideo || "",
      videoFile: null,
      chapterNo: String(chapter.chapterNo || chapter.order || ""),
      image: null,
      chapterImage: chapter.chapterImage,
    });
    // Set video preview for existing video URL
    const existingVideoUrl = chapter.videoUrl || chapter.chapterVideo || "";
    if (existingVideoUrl) {
      setVideoPreview(existingVideoUrl);
    } else {
      setVideoPreview(null);
    }
    setErrors({});
    setIsAddDialogOpen(true);
  };
  const handleImageUpload = async (file: File) => {
    // Validate the file before upload
    const validImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (!validImageTypes.includes(file.type)) {
      toast.error(
        "Invalid file format. Thumbnail must be an image (JPEG, JPG, PNG, or WebP)"
      );
      return;
    } else if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    try {
      setIsImageUploading(true);
      setIsImageUploadSuccessful(false);
      setImagePreview(URL.createObjectURL(file));
      const response = await uploadImage(file);

      if (!response.success) {
        throw new Error("Image upload failed");
      }
      const imageUrl = response.payload || "";
      setFormData({
        ...formData,
        chapterImage: imageUrl,
      });
      setIsImageUploadSuccessful(true);
      toast.success("Image uploaded successfully");
    } catch (error) {
      setIsImageUploadSuccessful(false);
      toast.error("Failed to upload image");
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleImageUpload(file);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center items-center min-h-[70vh]">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
        </div>
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
            <span className="test-sm ">Back to Courses</span>
          </Button>
        </div>
        <Button
          onClick={() => {
            setSelectedChapter(null);
            setFormData({
              chapterName: "",
              description: "",
              duration: "",
              videoUrl: "",
              chapterNo: "",
              videoFile: null,
              image: null,
              chapterImage: "",
            });
            setVideoPreview(null);
            setImagePreview(null);
            setErrors({});
            setIsAddDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Chapter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {courseName ||
              (initialChapters[0]?.courseId &&
              typeof initialChapters[0].courseId === "object"
                ? initialChapters[0].courseId.CourseName
                : "Course Chapters")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isTabSwitching ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : initialChapters.length === 0 && !loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No chapters found for this course.</p>
              <p className="mt-2">
                Click the "Add Chapter" button to get started.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {initialChapters
                .sort((a, b) => {
                  const aNo =
                    typeof a.chapterNo === "number"
                      ? a.chapterNo
                      : typeof a.order === "number"
                      ? a.order
                      : 0;
                  const bNo =
                    typeof b.chapterNo === "number"
                      ? b.chapterNo
                      : typeof b.order === "number"
                      ? b.order
                      : 0;
                  return aNo - bNo;
                })
                .map((chapter, index) => {
                  // Helper for YouTube thumbnail
                  const url =
                    typeof chapter.chapterVideo === "string" &&
                    chapter.chapterVideo.length > 0
                      ? chapter.chapterVideo
                      : typeof chapter.videoUrl === "string"
                      ? chapter.videoUrl
                      : "";
                  let videoId: string | null = null;
                  if (
                    typeof url === "string" &&
                    (url.includes("youtube.com") || url.includes("youtu.be"))
                  ) {
                    const match = url.match(
                      /(?:youtu.be\/|youtube.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
                    );
                    videoId = match ? match[1] : null;
                  }
                  return (
                    <Card
                      key={chapter._id}
                      className="flex flex-col h-full relative"
                    >
                      <CardContent className="p-4 flex flex-col flex-1">
                        {/* Popover for Edit/Delete */}
                        <div className="absolute top-2 right-2 z-10">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="p-1 rounded-full hover:bg-gray-200 focus:outline-none">
                                <MoreVertical className="h-5 w-5 text-gray-500" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              align="end"
                              className="h-auto w-32 p-1"
                            >
                              <button
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
                                onClick={() => openEditDialog(chapter)}
                              >
                                <span className="test-sm ">Edit</span>
                              </button>
                              <button
                                className="w-full text-left px-3 py-2 hover:bg-red-50 rounded"
                                onClick={() => {
                                  setSelectedChapter(chapter);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <span className="test-sm  text-red-600">
                                  Delete
                                </span>
                              </button>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="flex items-start space-x-4">
                          <div className="p-2 bg-light rounded-lg w-[120px] min-w-[120px] h-[120px] flex items-center justify-center relative group overflow-hidden">
                            {videoId ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full h-full block"
                              >
                                <div className="relative w-full h-full">
                                  <img
                                    src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                                    alt="YouTube Video"
                                    className="w-full h-full object-cover rounded-md border border-gray-200"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-white/80 p-2 rounded-full transform transition-transform group-hover:scale-110">
                                      <VideoIcon className="h-5 w-5 text-primary" />
                                    </div>
                                  </div>
                                </div>
                              </a>
                            ) : url ? (
                              <div className="w-full h-full relative group/video">
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full h-full block"
                                  onClick={(e) => {
                                    // If clicking the play button, let the default link behavior happen
                                    const target = e.target as HTMLElement;
                                    if (target.closest(".play-button")) {
                                      return; // Allow default link behavior
                                    }

                                    // If clicking the video, prevent default and toggle play/pause
                                    e.preventDefault();
                                    const video =
                                      e.currentTarget.querySelector("video");
                                    if (video) {
                                      if (video.paused) {
                                        video.play();
                                        video.controls = true;
                                      } else {
                                        video.pause();
                                        video.controls = false;
                                      }
                                    }
                                  }}
                                >
                                  <video
                                    src={url}
                                    className="w-full h-full object-cover rounded-md border border-gray-200"
                                    poster=""
                                    onEnded={(e) => {
                                      const video = e.currentTarget;
                                      video.controls = false;
                                      setIsPlaying(false);
                                    }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/video:opacity-100 transition-opacity">
                                    <div className="bg-white/80 p-2 rounded-full transform transition-transform group-hover/video:scale-110 play-button">
                                      <VideoIcon className="h-5 w-5 text-primary" />
                                    </div>
                                  </div>
                                </a>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center text-center p-2">
                                <VideoIcon className="h-6 w-6 text-primary mb-1" />
                                <span className="test-sm text-muted-foreground">
                                  No video
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Chapter Thumbnail */}
                          {/* <div className="p-2 bg-light rounded-lg w-[120px] min-w-[120px] h-[120px] flex items-center justify-center relative group overflow-hidden">
                            {chapter.chapterImage ? (
                              typeof chapter.chapterImage === "string" ? (
                                <img
                                  src={chapter.chapterImage}
                                  alt="Chapter thumbnail"
                                  className="w-full h-full object-cover rounded-md border border-gray-200"
                                />
                              ) : (
                                <img
                                  src={URL.createObjectURL(
                                    chapter.chapterImage
                                  )}
                                  alt="Chapter thumbnail"
                                  className="w-full h-full object-cover rounded-md border border-gray-200"
                                />
                              )
                            ) : (
                              <div className="flex flex-col items-center justify-center text-center p-2">
                                <ImageIcon className="h-6 w-6 text-primary mb-1" />
                                <span className="test-sm text-muted-foreground">
                                  No image
                                </span>
                              </div>
                            )}
                          </div> */}

                          <div>
                            <h3 className="font-semibold text-lg mb-1 line-clamp-1 max-w-[95%]">
                              {chapter.chapterName}
                            </h3>
                            <div className="flex flex-wrap gap-2 items-center test-sm text-muted-foreground mb-1">
                              <span className="bg-gray-100 px-2 py-0.5 rounded text-sm">
                                Chapter {chapter.chapterNo}
                              </span>
                              <span className="bg-gray-100 px-2 py-0.5 rounded text-sm">
                                {new Date(chapter.createdAt).toLocaleDateString(
                                  "en-GB",
                                  {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                  }
                                )}
                              </span>
                            </div>
                            <p className="test-sm  text-gray-700 mb-2 line-clamp-1 my-2.5 overflow-hidden text-ellipsis">
                              {chapter.description}
                            </p>
                            {url && (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-1 px-3 py-1 text-background gradient-bg rounded-sm test-sm font-medium transition"
                              >
                                ▶ Watch Video
                              </a>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Chapter Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedChapter ? "Edit Chapter" : "Add New Chapter"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 ">
            <div>
              <Label className="block text-sm font-medium mb-1">Title *</Label>
              <div className="w-full">
                <Input
                  name="chapterName"
                  value={formData.chapterName}
                  onChange={handleInputChange}
                  onBlur={handleTrimInput}
                  onKeyDown={(e) => {
                    if (
                      e.key === " " &&
                      !(e.target as HTMLInputElement).value.trim()
                    ) {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Chapter title"
                  className="w-full"
                />
                {errors.chapterName && (
                  <p className="text-sm  text-red-500 mt-1">
                    {errors.chapterName}
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label className="block text-sm font-medium mb-1">
                Description *
              </Label>
              <div className="w-full">
                <textarea
                  name="description"
                  onBlur={handleTrimInput}
                  onKeyDown={(e) => {
                    if (
                      e.key === " " &&
                      !(e.target as HTMLTextAreaElement).value.trim()
                    ) {
                      e.preventDefault();
                    }
                  }}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Chapter description"
                  className="w-full p-2 border rounded-md min-h-[100px] resize-none"
                />
                {errors.description && (
                  <p className="text-sm  text-red-500 mt-1">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center gap-4">
              <div className="w-full">
                <Label>Chapter Thumbnail</Label>
                <div className="w-full mt-1">
                  <div className="border border-dashed border-gray-300 rounded-md p-4">
                    <div className="flex items-center space-x-4">
                      {formData.chapterImage && formData.chapterImage !== "" ? (
                        <div className="relative">
                          <Image
                            src={
                              imagePreview
                                ? imagePreview
                                : typeof formData.chapterImage === "string"
                                ? formData.chapterImage
                                : URL.createObjectURL(formData.chapterImage)
                            }
                            width={1000}
                            height={1000}
                            alt="Chapter thumbnail"
                            className="h-20 w-20 object-cover rounded-md"
                            defaultValue={formData.chapterImage}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white hover:bg-red-600"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                chapterImage: "",
                              });
                              setImagePreview(null);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="h-20 w-20 border-2 border-dashed rounded-md flex items-center justify-center text-gray-400">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          {formData.chapterImage
                            ? "Thumbnail uploaded"
                            : "No thumbnail selected"}
                        </p>
                        <div className="flex items-center">
                          <Input
                            id="image-upload"
                            name="image"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) => handleImageChange(e)}
                            className="hidden"
                          />
                          <Label
                            htmlFor="image-upload"
                            className="inline-flex items-center px-4 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#6b4fd8] cursor-pointer"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            {formData.chapterImage ? "Change" : "Upload"}{" "}
                            Thumbnail
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {errors.chapterImage && (
                  <p className="text-sm  text-red-500 mt-1">
                    {errors.chapterImage}
                  </p>
                )}
              </div>
              <div className="w-full">
                <div>
                  <Label className="block text-sm font-medium mb-1">
                    Video File *
                  </Label>
                  <div className="w-full">
                    <div className="border border-dashed border-gray-300 rounded-md p-4">
                      <div className="flex space-x-4 ">
                        {formData.videoFile || videoPreview ? (
                          <div className="relative">
                            <video
                              src={
                                videoPreview ? videoPreview : formData.videoUrl
                              }
                              className="h-20 w-20 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                              muted
                              onMouseEnter={(e) => {
                                const video = e.currentTarget;
                                video.currentTime = 1;
                              }}
                              onClick={() => {
                                window.open(formData.videoUrl, "_blank");
                              }}
                            />

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white hover:bg-red-600"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  videoFile: null,
                                }));
                                setVideoPreview(null);
                                // Reset file input
                                const input = document.getElementById(
                                  "video-upload"
                                ) as HTMLInputElement;
                                if (input) input.value = "";
                              }}
                            >
                              <Trash2 className=" text-white h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="h-20 w-20 border-2 border-dashed rounded-md flex items-center justify-center text-gray-400">
                            <VideoIcon className="h-6 w-6" />
                          </div>
                        )}
                        <div className=" flex flex-col items-start justify-center">
                          <p className="text-sm text-gray-600 line-clamp-1 w-40">
                            {formData.videoFile
                              ? formData.videoFile.name
                              : formData.videoUrl
                              ? "Using video URL"
                              : "No video file selected"}
                          </p>

                          {/* File Input */}
                          <Input
                            type="file"
                            name="videoFile"
                            id="video-upload"
                            accept="video/mp4,video/webm,video/quicktime"
                            onChange={handleInputChange}
                            className="hidden"
                          />
                          {/* Upload Button */}
                          <div className="mt-2">
                            <Label
                              htmlFor="video-upload" // This connects the label to the input
                              className="inline-flex items-center px-4 py-1.5 border border-transparent test-sm font-normal rounded-md shadow-sm text-white gradient-bg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              {formData.videoFile
                                ? "Change Video"
                                : "Upload Video"}
                            </Label>
                          </div>
                        </div>
                        {/* Remove button if file is selected */}
                      </div>
                    </div>
                    {errors.videoFile && (
                      <p className="text-sm  text-red-500 mt-1">
                        {errors.videoFile}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium mb-1">
                  Chapter No *
                </Label>
                <div className="w-full">
                  <Input
                    name="chapterNo"
                    value={formData.chapterNo}
                    onChange={handleInputChange}
                    placeholder="Chapter Number"
                    className="w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    type="number"
                    onKeyDown={(e) => {
                      if (
                        e.key === "e" ||
                        e.key === "E" ||
                        e.key === "-" ||
                        e.key === "+" ||
                        e.key === "."
                      ) {
                        e.preventDefault();
                      }
                    }}
                  />
                  {errors.chapterNo && (
                    <p className="text-sm  text-red-500 mt-1">
                      {errors.chapterNo}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label className="block text-sm font-medium mb-1">
                  Duration (hours) *
                </Label>
                <div className="w-full">
                  <Input
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="Duration (in hours)"
                    className="w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    type="number"
                    onKeyDown={(e) => {
                      if (
                        e.key === "e" ||
                        e.key === "E" ||
                        e.key === "-" ||
                        e.key === "+"
                      ) {
                        e.preventDefault();
                      }
                    }}
                  />
                  {errors.duration && (
                    <p className="text-sm  text-red-500 mt-1">
                      {errors.duration}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isCreating ||
                  isUpdating
                }
              >
                {isCreating || isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isCreating ? "Creating..." : "Updating..."}
                  </>
                ) : selectedChapter ? (
                  "Update Chapter"
                ) : (
                  "Create Chapter"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Chapter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Are you sure you want to delete this chapter? This action cannot
                be undone.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
