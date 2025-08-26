"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Search, Plus, Tag, Edit, Trash2, AlertTriangle, MoreHorizontal } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTablePagination } from "@/components/ui/DataTablePagination";
import { createCategory, getAllCategory, updateCategory, deleteCategory } from "@/components/api/algobot";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Form validation schema - only category name field
const formSchema = z.object({
  title: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name must be at most 50 characters")
    .regex(/^[a-zA-Z0-9\s-]+$/, "Category name can only contain letters, numbers, spaces, and hyphens"),
});

type FormValues = z.infer<typeof formSchema>;

interface CategoryItem {
  _id: string;
  title: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function Category() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
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
      title: "",
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = form;

  const [allCategories, setAllCategories] = useState<CategoryItem[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryItem[]>([]);

  const fetchCategories = async () => {
    try {
      setIsFetching(true);
      const response = await getAllCategory({
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
    const filtered = categories.filter(category => 
      category.title.toLowerCase().includes(searchLower)
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
  // Handle form submission for both create and update
  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);

      if (isEditMode && currentCategoryId) {
        const response = await updateCategory(currentCategoryId, data);
        if(response.success){
          toast.success("Category updated successfully!");
        }else{
          toast.error(response.message);
        }
      } else {
        const response = await createCategory(data);
        if(response.success){
          toast.success("Category created successfully!");
        }else{
          toast.error(response.message);
        }
      }

      setIsOpen(false);
      reset();
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Failed to save category");
    } finally {
      setIsLoading(false);
    }
  };

  // Set up form for editing
  const handleEdit = (category: CategoryItem) => {
    setCurrentCategoryId(category._id);
    setIsEditMode(true);
    setValue("title", category.title);
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
      await deleteCategory(categoryToDelete);
      toast.success("Category deleted successfully");
      setCategories(categories.filter((category) => category._id !== categoryToDelete));
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
      title: "",
    });
    setIsOpen(true);
  };

  // Search functionality
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Category</h1>
          <p className="text-muted-foreground">Manage trading categories and classifications.</p>
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
              <DialogTitle>{isEditMode ? "Edit Category" : "Create New Category"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Category Name</Label>
                <Input id="title" placeholder="Enter category name" {...register("title")} />
                {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : isEditMode ? "Update Category" : "Create Category"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search category..." value={searchTerm} onChange={handleSearch} className="pl-8" />
        </div>
      </div>

      {/* Content */}
      {isFetching ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading categories...</p>
          </div>
        </div>
      ) : (
        <>
          {filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-4 h-64 text-center">
              <Tag className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">No categories found</h3>
                <p className="text-sm text-muted-foreground">{searchTerm ? "Try a different search term" : "Get started by creating a new algobot"}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                  <TableHead>Sr. No</TableHead>
                    <TableHead>Category Name</TableHead>
                    <TableHead>Edit</TableHead>
                    <TableHead>Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((category,index) => (
                    <TableRow key={category._id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">{category.title}</TableCell>
                      <TableCell className="font-medium"><button onClick={() => handleEdit(category)}><Edit className="mr-2 h-4 w-4" /></button></TableCell>
                      <TableCell className="font-medium"><button onClick={() => handleDeleteClick(category._id)}><Trash2 className="mr-2 h-4 w-4" /></button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalItems > itemsPerPage && (
            <div className="mt-6">
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
                itemsPerPageOptions={[10, 20, 30, 50]}
                className="border-t pt-4"
              />
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Are you sure you want to delete this category? This action cannot be undone.</AlertDescription>
            </Alert>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
