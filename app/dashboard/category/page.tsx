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
  Tag,
  Edit,
  Trash2,
  AlertTriangle,
  Upload,
  X,
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
  createCategory,
  getAllCategory,
  updateCategory,
  deleteCategory,
} from "@/components/api/algobot";
import {
  createCourseCategory,
  deleteCourseCategory,
  getAllCourseCategory,
  updateCourseCategory,
} from "@/components/api/category";

const formSchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name must be at most 50 characters")
    .regex(
      /^[a-zA-Z0-9\s-]+$/,
      "Category name can only contain letters, numbers, spaces, and hyphens"
    ),
  image: z
    .any()
    .refine((file) => file !== null && file !== undefined, {
      message: "Image is required",
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
        if (typeof file === "string") return true;
        if (file instanceof File) return file.size <= 1 * 1024 * 1024;
        return true;
      },
      {
        message: "Image size must be less than 1MB",
      }
    ),
});

type FormValues = z.infer<typeof formSchema>;

interface CategoryItem {
  _id: string;
  name: string;
  image?: string; // Add image field to the interface
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function Category() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
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
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File must be an image");
      return;
    }

    const MAX_FILE_SIZE = 1 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image size must be less than 1MB");
      return;
    }

    setValue("image", file, { shouldValidate: true });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file && !file.type.startsWith("image/"))
      toast.error("File must be Image");
    const MAX_FILE_SIZE = 1 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image size must be less than 1MB");
      return;
    }

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

  const [allCategories, setAllCategories] = useState<CategoryItem[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryItem[]>(
    []
  );

  const fetchCategories = async () => {
    try {
      setIsFetching(true);
      const response = await getAllCourseCategory({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
      });

      const categoriesData = response.payload.data || [];
      setAllCategories(categoriesData);
      filterCategories(categoriesData, searchTerm);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const filterCategories = (categories: CategoryItem[], search: string) => {
    if (!search.trim()) {
      setFilteredCategories(categories);
      setTotalItems(categories.length);
      setTotalPages(Math.ceil(categories.length / itemsPerPage));
      return;
    }

    const searchLower = search.toLowerCase();
    const filtered = categories.filter((category) =>
      category.name.toLowerCase().includes(searchLower)
    );

    setFilteredCategories(filtered);
    setTotalItems(filtered.length);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
  };

  useEffect(() => {
    filterCategories(allCategories, searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    fetchCategories();
  }, []);

const onSubmit = async (data: FormValues) => {
  setIsLoading(true);

  try {
    if (isEditMode && currentCategoryId) {
      // For updates, check if the image has changed
      if (data.image instanceof File) {
        // If image is a File (new upload), use FormData
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("image", data.image);
        await updateCourseCategory(currentCategoryId, formData);
      } else {
        // If image hasn't changed, send only the name in a JSON payload
        await updateCourseCategory(currentCategoryId, { name: data.name });
      }
      toast.success("Category updated successfully");
    } else {
      // For new categories, always use FormData
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.image) {
        formData.append("image", data.image);
      }
      await createCourseCategory(formData);
      toast.success("Category created successfully");
    }

    await fetchCategories();
    setIsOpen(false);
    reset();
  } catch (error) {
    console.error("Error saving category:", error);
  } finally {
    setIsLoading(false);
  }
};

  // Set up form for editing
  const handleEdit = (category: CategoryItem) => {
    setCurrentCategoryId(category._id);
    setIsEditMode(true);

    // Reset the form first to clear any previous state
    reset({
      name: category.name,
      image: category.image || null,
    });

    setIsOpen(true);
  };

  // Handle delete with confirmation dialog
  const handleDeleteClick = (id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setIsDeleting(true);
      await deleteCourseCategory(categoryToDelete);
      toast.success("Category deleted successfully");
      setCategories(
        categories.filter((category) => category._id !== categoryToDelete)
      );
      setDeleteDialogOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    } finally {
      setIsDeleting(false);
      setCategoryToDelete(null);
    }
  };

  // Reset form for creating new category
  const handleCreateNew = () => {
    setIsEditMode(false);
    setCurrentCategoryId(null);
    reset({
      name: "",
    });
    setIsOpen(true);
  };

  // Search functionality
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.trimStart());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2/4 -translate-y-2/4 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search category..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-8 font-normal"
            />
          </div>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Edit Category" : "Create New Category"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter category name"
                  {...register("name")}
                  onBlur={(e) => {
                    const value = e.target.value.trim();
                    setValue("name", value, { shouldValidate: true });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === " " && !e.currentTarget.value.trim()) {
                      e.preventDefault();
                    }
                  }}
                />
                {errors.name && (
                  <p className="text-sm font-semibold text-red-500">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Category Image *</Label>
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
                  {imageFile ? (
                    <div className="relative">
                      <img
                        src={
                          typeof imageFile === "string"
                            ? imageFile
                            : URL.createObjectURL(imageFile)
                        }
                        alt="Preview"
                        className="mx-auto max-h-48 rounded-md object-cover"
                      />
                      <button
                        type="button"
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage();
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
                {errors.image && (
                  <p className="text-sm font-semibold text-red-500">
                    {errors.image.message as string}
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
                    ? "Update Category"
                    : "Create Category"}
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
            <p className="text-muted-foreground">Loading categories...</p>
          </div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <Tag className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">No categories found</h3>
          <p className="text-sm text-muted-foreground font-lexend">
            {searchTerm
              ? "Try a different search term"
              : "Get started by creating a new category"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredCategories
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((category) => (
              <div
                key={category._id}
                className="relative group border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative pt-[56.25%] bg-gray-100">
                  {category.image ? (
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="min-w-full min-h-full object-cover"
                        style={{ objectFit: "contain" }}
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                      <Tag className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="p-3 flex items-center justify-between">
                  <h3 className="font-medium">{category.name}</h3>
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
                          handleEdit(category);
                        }}
                        className="cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(category._id);
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
      )}
      {/* </>
      )} */}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Are you sure you want to delete this category? This action
                cannot be undone.
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
