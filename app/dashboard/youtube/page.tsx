"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Utility function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
import * as z from "zod";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Upload,
  X,
  MoreVertical,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DataTablePagination } from "@/components/ui/DataTablePagination";
import {
  getAllYoutube,
  createYoutube,
  deleteYoutube,
  updateYoutube,
} from "@/components/api/youtube";
import Image from "next/image";

// Zod schema: strict validations
const ytUrlRegex =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[A-Za-z0-9_-]{11}([&?].*)?$/;

const formSchema = z.object({
  description: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(120, "Title must be at most 120 characters")
    .regex(/^[^\n\r]+$/, "Title cannot contain new lines"),
  videoUrl: z
    .string()
    .url("Must be a valid URL")
    .refine((val) => ytUrlRegex.test(val), {
      message: "Please enter a valid YouTube URL (watch?v=... or youtu.be/...)",
    }),
  thumbnail: z
    .any()
    .refine((file) => file !== null && file !== undefined, {
      message: "Thumbnail is required",
    })
    .refine(
      (file) =>
        typeof file === "string" ||
        (file instanceof File && file.type.startsWith("image/")),
      {
        message: "Please upload a valid image file",
      }
    )
    .refine(
      (file) => {
        if (typeof file === "string") return true; // existing URL allowed when editing
        if (file instanceof File) return file.size <= 1 * 1024 * 1024; // <=5MB
        return true;
      },
      {
        message: "Image size must be less than 1MB",
      }
    ),
});

type FormValues = z.infer<typeof formSchema>;

interface YoutubeItem {
  _id: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  isActive?: boolean;
  createdAt?: string;
}

export default function YoutubeManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [items, setItems] = useState<YoutubeItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState<YoutubeItem[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      videoUrl: "",
      thumbnail: null,
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = form;

  // const thumbnailFile = watch("thumbnail");
  const thumbnailFile = watch("thumbnail");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch list
  const fetchList = async () => {
    try {
      setIsFetching(true);
      const res = await getAllYoutube({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
      });
      // expecting response.payload.data like in previous examples
      const data = res?.payload?.data ?? res?.data ?? [];
      setItems(data);
      setFilteredItems(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch YouTube items");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredItems(items);
      return;
    }
    const q = searchTerm.toLowerCase();
    setFilteredItems(
      items.filter((it) => it?.description?.toLowerCase().includes(q))
    );
  }, [searchTerm, items]);

  // Drag & drop handlers for thumbnail
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File must be an image");
      return;
    }
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image size must be less than 5MB");
      return;
    }
    // Convert to a new File object to ensure it's properly handled by react-hook-form
    const newFile = new File([file], file.name, { type: file.type });
    setValue("thumbnail", newFile, { shouldValidate: true });
    if (fileInputRef.current) {
      // Create a new DataTransfer to set the file
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(newFile);
      fileInputRef.current.files = dataTransfer.files;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file && !file.type.startsWith("image/"))
      toast.error("File must be Image");
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    if (file && file.type.startsWith("image/")) {
      setValue("thumbnail", file, { shouldValidate: true });
    }
  };

  const openFileDialog = () => fileInputRef.current?.click();

  const removeThumbnail = () => {
    setValue("thumbnail", null, { shouldValidate: true });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Submit
  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);

    try {
      const requestData: any = {
        description: data.description,
        videoUrl: data.videoUrl,
      };

      // Handle thumbnail
      if (data.thumbnail) {
        if (data.thumbnail instanceof File) {
          // Convert file to base64
          requestData.thumbnail = await fileToBase64(data.thumbnail);
        } else if (typeof data.thumbnail === "string") {
          // If it's already a string (URL or base64), use it as is
          requestData.thumbnail = data.thumbnail;
        }
      }

      if (isEditMode && currentId) {
        await updateYoutube(currentId, requestData);
        toast.success("YouTube item updated successfully");
      } else {
        const response = await createYoutube(requestData);
        toast.success("YouTube item created successfully");
      }

      setIsOpen(false);
      reset({ description: "", videoUrl: "", thumbnail: null });
      await fetchList();
    } catch (error: any) {
      console.error("Error saving YouTube item:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to save item";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Edit
  const handleEdit = (item: YoutubeItem) => {
    setIsEditMode(true);
    setCurrentId(item._id);

    reset({
      description: item.description,
      videoUrl: item.videoUrl,
      thumbnail: item.thumbnail ?? null,
    });
    setIsOpen(true);
  };

  // Delete
  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      await deleteYoutube(itemToDelete);
      toast.success("Deleted successfully");
      setItems((prev) => prev.filter((p) => p._id !== itemToDelete));
      setDeleteDialogOpen(false);
      fetchList();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete");
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  // Create new
  const handleCreateNew = () => {
    setIsEditMode(false);
    setCurrentId(null);
    reset({ description: "", videoUrl: "", thumbnail: null });
    setIsOpen(true);
  };

  // Simple pagination helpers
  const paginated = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  console.log(paginated, "jhv");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2/4 -translate-y-2/4 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.trimStart())}
              className="pl-8 font-normal"
            />
          </div>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add YouTube
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[640px]">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Edit YouTube" : "Create New YouTube"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="description">Title *</Label>
                <Input
                  id="description"
                  placeholder="Enter description"
                  {...register("description")}
                  onBlur={(e) =>
                    setValue("description", e.target.value.trim(), {
                      shouldValidate: true,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "" && !e.currentTarget.value.trim())
                      e.preventDefault();
                  }}
                />
                {errors.description && (
                  <p className="text-sm font-semibold text-red-500">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoUrl">YouTube URL *</Label>
                <Input
                  id="videoUrl"
                  placeholder="https://www.youtube.com/watch?v=..."
                  {...register("videoUrl")}
                />
                {errors.videoUrl && (
                  <p className="text-sm font-semibold text-red-500">
                    {errors.videoUrl.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Thumbnail *</Label>
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={openFileDialog}
                >
                  {thumbnailFile ? (
                    <div className="relative">
                      <Image
                        src={
                          typeof thumbnailFile === "string"
                            ? thumbnailFile
                            : URL.createObjectURL(thumbnailFile)
                        }
                        alt="Preview"
                        className="mx-auto max-h-48 rounded-md object-cover"
                        width={400}
                        height={300}
                      />
                      <button
                        type="button"
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeThumbnail();
                        }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Upload className="h-5 w-5 text-gray-500" />
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="text-blue-600 font-medium">
                          Click to upload
                        </span>{" "}
                        or drag and drop
                      </p>
                    </>
                  )}
                </div>
                {errors.thumbnail && (
                  <p className="text-sm font-semibold text-red-500">
                    {errors.thumbnail.message as string}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading
                    ? "Saving..."
                    : isEditMode
                    ? "Update YouTube"
                    : "Create YouTube"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content */}
      {isFetching ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading videos...</p>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No videos found</h3>
          <p className="text-sm text-muted-foreground">
            {searchTerm
              ? "Try a different search"
              : "Start by adding a new YouTube video"}
          </p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginated.map((item) => (
              <div
                key={item._id}
                className="relative group border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative pt-[56.25%] bg-gray-100">
                  {item.thumbnail ? (
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                      <Image
                        width={1000}
                        height={1000}
                        src={item?.thumbnail}
                        alt={item?.description}
                        className="min-w-full min-h-full object-cover"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                      <div className="text-muted-foreground">No Image</div>
                    </div>
                  )}
                </div>
                <div className="p-3 flex items-center justify-between">
                  <h3 className="font-medium text-sm truncate max-w-[70%]">
                    {item?.description}
                  </h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(item);
                        }}
                        className="cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(item._id);
                        }}
                        className="cursor-pointer text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination control - simple */}
          {filteredItems.length > itemsPerPage && (
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Showing {paginated.length} of {filteredItems.length} videos
                </p>
              </div>
              {filteredItems.length > itemsPerPage && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="px-3 py-1 border rounded">{currentPage}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={
                      paginated.length < itemsPerPage ||
                      currentPage * itemsPerPage >= filteredItems.length
                    }
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete YouTube Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Are you sure you want to delete this video? This action cannot
                be undone.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
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
