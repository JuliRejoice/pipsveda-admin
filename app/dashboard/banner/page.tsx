"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
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
  Edit,
  Trash2,
  Upload,
  X,
  MoreVertical,
  Tag,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from "@/components/api/banner";

const formSchema = z.object({
  image: z
    .any()
    .refine((file) => file !== undefined && file !== null, {
      message: "Please upload a valid image file",
    })
    .refine(
      (file) => {
        if (file === null || file === undefined) return false;
        if (typeof file === "string") return true;
        return file.size <= 5 * 1024 * 1024;
      },
      { message: "Image size must be under 5MB" }
    ),
});

type FormValues = z.infer<typeof formSchema>;

interface BannerItem {
  _id: string;
  image: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function BannerPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentBannerId, setCurrentBannerId] = useState<string | null>(null);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { image: null },
  });

  const {
    setValue,
    watch,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;
  const imageFile = watch("image");

  const fetchBanners = async () => {
    try {
      setIsFetching(true);
      const response = await getAllBanners();
      // Filter out banners where isOnboarding is true or not present
      const filteredBanners = (response?.payload?.data || []).filter(
        (banner: any) => banner.isOnboarding === false
      );
      setBanners(filteredBanners);
    } catch (error) {
      toast.error("Failed to fetch banners");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);

      if (!data.image) throw new Error("Image file is required");

      let response;

      if (isEditMode && currentBannerId) {
        // update banner
        response = await updateBanner(currentBannerId, data.image);
      } else {
        // create banner
        response = await createBanner(data.image);
      }

      if (response?.success) {
        toast.success(
          isEditMode
            ? "Banner updated successfully!"
            : "Banner created successfully!"
        );
        fetchBanners();
        setIsOpen(false);
        reset();
      } else {
        toast.error(response?.message || "Operation failed");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (banner: BannerItem) => {
    setIsEditMode(true);
    setCurrentBannerId(banner._id);
    setValue("image", banner.image, { shouldValidate: true });
    setIsOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setBannerToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!bannerToDelete) return;

    try {
      setIsDeleting(true);
      const response = await deleteBanner(bannerToDelete);
      if (response?.success) {
        toast.success("Banner deleted successfully");
        fetchBanners();
      } else {
        toast.error("Failed to delete banner");
      }
    } catch {
      toast.error("Error deleting banner");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setBannerToDelete(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/"))
      setValue("image", file, { shouldValidate: true });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/"))
      setValue("image", file, { shouldValidate: true });
  };
  const removeImage = () => setValue("image", null, { shouldValidate: true });
  const openFileDialog = () => fileInputRef.current?.click();

  const handleCreateNew = () => {
    reset({ image: null });
    setIsEditMode(false);
    setIsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Banners</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Banner
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Edit Banner" : "Create New Banner"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label>Banner Image</Label>
                <input
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
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
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
                      <p className="text-sm text-gray-600">
                        Click to upload or drag and drop
                      </p>
                    </>
                  )}
                </div>

                {errors.image && (
                  <p className="text-sm text-red-500">
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
                    ? "Update Banner"
                    : "Create Banner"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isFetching ? (
        <div className="text-center py-10 text-gray-500">
          Loading banners...
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-10">
          <Tag className="mx-auto h-10 w-10 text-gray-400" />
          <p className="text-sm text-gray-600 mt-2">No banners found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {banners.map((banner) => (
            <div
              key={banner._id}
              className="relative border rounded-lg overflow-hidden"
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10 bg-white/70"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(banner)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteClick(banner._id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <img
                src={banner.image}
                alt="Banner"
                className="w-full h-40 object-cover bg-gray-50"
              />
            </div>
          ))}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Banner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Are you sure you want to delete this banner? This action cannot
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
