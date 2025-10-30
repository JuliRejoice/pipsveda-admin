"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Search, Plus, MoreHorizontal, Edit, Trash2, MapPin } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { toast } from "sonner";
import { DataTablePagination } from "@/components/ui/DataTablePagination";
import { createCenter, deleteCenter, getAllCenter, updateCenter } from "@/components/api/center";

interface Center {
  _id: string;
  centerName: string;
  location: string;
  city: string;
  state: string;
  country: string;
  isActive: boolean;
  createdAt: string;
}

interface CenterApiResponse {
  success: boolean;
  payload: {
    data: Center[];
    count: number;
    totalPages: number;
  };
}

const centerFormSchema = z.object({
  centerName: z
    .string()
    .min(3, "Center name must be at least 3 characters")
    .max(100, "Center name must be at most 100 characters"),
  
  location: z
    .string()
    .min(3, "Location must be at least 3 characters")
    .max(200, "Location must be at most 200 characters"),
    
  city: z
    .string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must be at most 100 characters"),
    
  state: z
    .string()
    .min(2, "State must be at least 2 characters")
    .max(100, "State must be at most 100 characters"),
    
  country: z
    .string()
    .min(2, "Country must be at least 2 characters")
    .max(100, "Country must be at most 100 characters"),
});

type CenterFormValues = z.infer<typeof centerFormSchema>;

export default function CenterPage() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isAddCenterOpen, setIsAddCenterOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [centerToDelete, setCenterToDelete] = useState<Center | null>(null);
  const [currentCenterId, setCurrentCenterId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<CenterFormValues>({
    resolver: zodResolver(centerFormSchema),
    defaultValues: {
      centerName: "",
      location: "",
      city: "",
      state: "",
      country: "",
    },
  });

  const fetchCentersData = async () => {
    try {
      setIsLoading(true);
      const response = await getAllCenter({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
      }) as unknown as CenterApiResponse;

      setCenters(response.payload.data);
      setTotalItems(response.payload.count);
      setTotalPages(response.payload.totalPages);
    } catch (error) {
      console.error("Error fetching centers:", error);
      toast.error("Failed to fetch centers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCentersData();
  }, [currentPage, itemsPerPage, searchTerm]);

  const handleEdit = (center: Center) => {
    setIsEditMode(true);
    setCurrentCenterId(center._id);
    setEditingCenter(center);
    form.reset({
      centerName: center.centerName,
      location: center.location,
      city: center.city,
      state: center.state,
      country: center.country,
    });
    setIsAddCenterOpen(true);
  };

  const handleDeleteClick = (center: Center) => {
    setCenterToDelete(center);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!centerToDelete) return;

    try {
      setIsDeleting(true);
      await deleteCenter(centerToDelete._id);
      setCenters(centers.filter((c) => c._id !== centerToDelete._id));
      toast.success("Center deleted successfully");
      setIsDeleteDialogOpen(false);
      setCenterToDelete(null);
      await fetchCentersData();
    } catch (error) {
      console.error("Error deleting center:", error);
      toast.error("Failed to delete center");
    } finally {
      setIsDeleting(false);
    }
  };

  const onSubmit = async (data: CenterFormValues) => {
    try {
      setIsLoading(true);

      if (isEditMode && currentCenterId) {
        await updateCenter(currentCenterId, data);
        toast.success("Center updated successfully!");
      } else {
        await createCenter(data);
        toast.success("Center created successfully!");
      }

      setIsAddCenterOpen(false);
      form.reset();
      setIsEditMode(false);
      setEditingCenter(null);
      await fetchCentersData();
    } catch (error: any) {
      console.error("Error saving center:", error);
      toast.error(error.response?.data?.message || "Failed to save center");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCentersData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
       <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-[35px] w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search centers..."
                className="pl-8 w-[200px] lg:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
        <Button onClick={() => setIsAddCenterOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Center
        </Button>
      </div>

      <Card>
        {/* <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">All Centers</CardTitle>
          <form onSubmit={handleSearch} className="flex items-center space-x-2">
            
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
        </CardHeader> */}
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>City</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading centers...
                  </TableCell>
                </TableRow>
              ) : centers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No centers found
                  </TableCell>
                </TableRow>
              ) : (
                centers.map((center) => (
                  <TableRow key={center._id}>
                    <TableCell className="font-medium">
                      {center.centerName}
                    </TableCell>
                    <TableCell>{center.location}</TableCell>
                    <TableCell>{center.city}</TableCell>
                    <TableCell>{center.state}</TableCell>
                    <TableCell>{center.country}</TableCell>
                    <TableCell>
                      <Badge variant={center.isActive ? "default" : "secondary"} className="border-none">
                        {center.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(center.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEdit(center)}
                            className="cursor-pointer"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(center)}
                            className="text-red-600 cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {!isLoading && centers.length > 0 && (
            <div className="mt-4">
              <DataTablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Center Dialog */}
      <Dialog 
        open={isAddCenterOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // Reset form and state when dialog is closed
            form.reset({
              centerName: "",
              location: "",
              city: "",
              state: "",
              country: "",
            });
            setIsEditMode(false);
            setEditingCenter(null);
            setCurrentCenterId(null);
          }
          setIsAddCenterOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Center" : "Add New Center"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? "Update the center details below." 
                : "Fill in the details to add a new center."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="centerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Center Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter center name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="Enter location"  
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter city" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter state" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddCenterOpen(false);
                    form.reset();
                    setIsEditMode(false);
                    setEditingCenter(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading 
                    ? (isEditMode ? "Updating..." : "Creating...")
                    : (isEditMode ? "Update Center" : "Add Center")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the center
              "{centerToDelete?.centerName}" and remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Center"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}