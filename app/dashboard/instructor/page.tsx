"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Search,
  Plus,
  User,
  Edit,
  Trash2,
  AlertTriangle,
  Upload,
  X,
  Star,
  GraduationCap,
  MoreVertical,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTablePagination } from "@/components/ui/DataTablePagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAllInstructors,
  createInstructor,
  updateInstructor,
  deleteInstructor,
} from "@/components/api/instructor";

// Form validation schema
const formSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  bio: z
    .string()
    .min(10, "Bio must be at least 10 characters")
    .max(500, "Bio must be at most 500 characters"),
  image: z
    .any()
    .refine(
      (file) =>
        file instanceof File || file === null || typeof file === "string",
      {
        message: "Please upload a image",
      }
    )
    .refine(
      (file) => {
        if (!file) return true; // Optional field
        if (typeof file === "string") return true; // Allow existing image URLs
        return file.size <= 5 * 1024 * 1024; // 5MB max size
      },
      {
        message: "Image must be less than 5MB",
      }
    ),
});

type FormValues = z.infer<typeof formSchema>;

interface InstructorItem {
  _id: string;
  name: string;
  email: string;
  bio: string;
  image?: string;
  courses?: string[];
  rating?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function InstructorPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentInstructorId, setCurrentInstructorId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [instructors, setInstructors] = useState<InstructorItem[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [instructorToDelete, setInstructorToDelete] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      bio: "",
      image: null,
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

  const imageFile = watch("image");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setValue("image", file, { shouldValidate: true });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setValue("image", file, { shouldValidate: true });
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setValue("image", null, { shouldValidate: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const fetchInstructors = async () => {
    try {
      setIsFetching(true);
      const response = await getAllInstructors({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm,
      });

      const instructorsData = response.payload.data || [];
      setInstructors(instructorsData);
      setTotalItems(response.payload.count);
      setTotalPages(Math.ceil(response.payload.count / itemsPerPage));
    } catch (error) {
      console.error("Error fetching instructors:", error);
      toast.error("Failed to load instructors");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, [currentPage, itemsPerPage, debouncedSearchTerm]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("bio", data.bio);

      if (data.image && data.image instanceof File) {
        formData.append("image", data.image);
      } else if (isEditMode && typeof data.image === "string") {
        formData.append("imageUrl", data.image);
      }

      if (isEditMode && currentInstructorId) {
        const response = await updateInstructor(currentInstructorId, formData);
        if (response.success) {
          toast.success("Instructor updated successfully!");
          setIsOpen(false);
          fetchInstructors();
        } else {
          toast.error(response.message || "Failed to update instructor");
        }
      } else {
        const response = await createInstructor(formData);
        if (response.success) {
          toast.success("Instructor created successfully!");
          setIsOpen(false);
          reset();
          fetchInstructors();
        } else {
          toast.error(response.message || "Failed to create instructor");
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An error occurred while processing your request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (instructor: InstructorItem) => {
    setIsEditMode(true);
    setCurrentInstructorId(instructor._id);
    setValue("name", instructor.name);
    setValue("email", instructor.email);
    setValue("bio", instructor.bio);
    if (instructor.image) {
      setValue("image", instructor.image);
    }
    setIsOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setInstructorToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!instructorToDelete) return;

    try {
      setIsDeleting(true);
      const response = await deleteInstructor(instructorToDelete);
      if (response.success) {
        toast.success("Instructor deleted successfully!");
        fetchInstructors();
      } else {
        toast.error(response.message || "Failed to delete instructor");
      }
    } catch (error) {
      console.error("Error deleting instructor:", error);
      toast.error("An error occurred while deleting the instructor");
    } finally {
      setDeleteDialogOpen(false);
      setInstructorToDelete(null);
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on new search
    }, 500); // 500ms delay

    return () => clearTimeout(timerId);
  }, [searchTerm]);

  const resetForm = () => {
    reset({
      name: "",
      email: "",
      bio: "",
      image: null,
    });
    setCurrentInstructorId(null);
    setIsEditMode(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search instructors..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.trimStart())}
          />
        </div>

        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) {
              resetForm();
            }
            setIsOpen(open);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Instructor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Edit Instructor" : "Add New Instructor"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      {...register("name")}
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="instructor@example.com"
                      {...register("email")}
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Profile image</Label>
                  <div
                    className={`mt-1 flex justify-center p-2 border-2 border-dashed rounded-lg ${
                      isDragging
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={openFileDialog}
                  >
                    <div className="space-y-1 text-center">
                      {imageFile ? (
                        <div className="relative">
                          <img
                            src={
                              typeof imageFile === "string"
                                ? imageFile
                                : URL.createObjectURL(imageFile)
                            }
                            alt="Preview"
                            className="mx-auto h-25 w-25 rounded-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage();
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-center">
                            <User className="h-12 w-12 text-gray-400" />
                          </div>
                          <div className="flex text-sm text-gray-600">
                            <span className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                              Upload a file
                            </span>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF up to 5MB
                          </p>
                        </>
                      )}
                      <input
                        id="image"
                        type="file"
                        className="sr-only"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                      />
                    </div>
                  </div>
                  {errors.image && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.image.message as string}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio *</Label>
                <textarea
                  id="bio"
                  rows={4}
                  placeholder="A brief introduction about the instructor..."
                  {...register("bio")}
                  className={`w-full px-3 py-2 border ${
                    errors.bio ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.bio && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.bio.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setIsOpen(false);
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isEditMode ? "Updating..." : "Creating..."}
                    </div>
                  ) : isEditMode ? (
                    "Update Instructor"
                  ) : (
                    "Create Instructor"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg shadow overflow-hidden">
        {isFetching ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : instructors.length === 0 ? (
          <div className="text-center p-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No instructors
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding a new instructor.
            </p>
            {/* <div className="mt-6">
                                <Button
                                    onClick={() => setIsOpen(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                    New Instructor
                                </Button>
                            </div> */}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Instructor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Courses</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instructors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No results.
                      </TableCell>
                    </TableRow>
                  ) : (
                    instructors.map((instructor) => (
                      <TableRow key={instructor._id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-4">
                            {instructor.image ? (
                              <img
                                className="h-10 w-10 rounded-full"
                                src={instructor.image}
                                alt={instructor.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <span>{instructor.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{instructor.email}</TableCell>
                        <TableCell>
                          {instructor.courses?.length || 0} courses
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  (instructor.rating || 0) >= star
                                    ? "text-yellow-400 fill-current"
                                    : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                            <span className="ml-2 text-muted-foreground">
                              ({instructor.rating?.toFixed(1) || "N/A"})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEdit(instructor)}
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDeleteClick(instructor._id)
                                }
                                className="cursor-pointer text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <DataTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={totalItems}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="flex flex-col items-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Delete Instructor
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to delete this instructor? This action
              cannot be undone.
            </p>
            <div className="flex justify-end space-x-3 w-full">
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
                {isDeleting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </div>
                ) : (
                  "Delete Instructor"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
