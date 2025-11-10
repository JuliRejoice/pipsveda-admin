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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  MapPin,
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  CitySelect,
  CountrySelect,
  StateSelect,
} from "react-country-state-city";
import { toast } from "sonner";
import { DataTablePagination } from "@/components/ui/DataTablePagination";
import {
  createCenter,
  deleteCenter,
  getAllCenter,
  updateCenter,
} from "@/components/api/center";
import "react-country-state-city/dist/react-country-state-city.css";
import { City, Country, State } from "react-country-state-city/dist/esm/types";

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

const centerFormSchema = z
  .object({
    centerName: z
      .string()
      .min(3, "Center name must be at least 3 characters")
      .max(100, "Center name must be at most 100 characters"),

    location: z
      .string()
      .min(3, "Location must be at least 3 characters")
      .max(200, "Location must be at most 200 characters"),

    country: z.string().min(1, "Please select a country"),
    state: z.string().min(1, "Please select a state"),
    city: z.string().min(1, "Please select a city"),
  })
  .refine(
    (data) => {
      if (data.state && !data.country) return false;
      return true;
    },
    {
      message: "Please select a country first",
      path: ["state"],
    }
  )
  .refine(
    (data) => {
      if (data.city && !data.state) return false;
      return true;
    },
    {
      message: "Please select a state first",
      path: ["city"],
    }
  );

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
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(
    null
  );
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

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
      const response = (await getAllCenter({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm,
      })) as unknown as CenterApiResponse;

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
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on new search
    }, 500); // 500ms delay

    return () => clearTimeout(timerId);
  }, [searchTerm]);

  useEffect(() => {
    fetchCentersData();
  }, [currentPage, itemsPerPage, debouncedSearchTerm]);

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
  console.log();

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
            onChange={(e) => setSearchTerm(e.target.value.trimStart())}
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
                      <Badge
                        variant={center.isActive ? "default" : "secondary"}
                        className="border-none"
                      >
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
                    <FormLabel>Center Name *</FormLabel>
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
                    <FormLabel>Location *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="Enter location" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Country *</FormLabel>
                    <FormControl>
                      <CountrySelect
                        defaultValue={
                          field.value
                            ? ({ name: field.value } as Partial<Country> as Country)
                            : undefined
                        }
                        containerClassName="w-full"
                        inputClassName={`w-full h-[45px] px-4 py-2 rounded-md border ${
                          fieldState.error
                            ? "border-destructive"
                            : "border-input"
                        } bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
                        onChange={(val: any) => {
                          field.onChange(val.name);
                          setSelectedCountryId(val.id);
                          setSelectedStateId(null);
                          form.setValue("state", "");
                          form.setValue("city", "");
                          form.clearErrors(["state", "city"]);
                        }}
                        placeHolder="Select Country"
                      />
                    </FormControl>
                    {fieldState.error && (
                      <p className="text-sm font-medium text-destructive mt-1">
                        {fieldState.error.message}
                      </p>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field, fieldState }) => {
                  // Show error if state is clicked without country
                  const handleStateFocus = () => {
                    if (!selectedCountryId) {
                      form.setError(
                        "state",
                        {
                          type: "manual",
                          message: "Please select a country first",
                        },
                        { shouldFocus: true }
                      );
                    } else {
                      form.clearErrors("state");
                    }
                  };

                  return (
                    <FormItem>
                      <FormLabel>State *</FormLabel>
                      <FormControl>
                        <div onClick={handleStateFocus} className="w-full">
                          <StateSelect
                            defaultValue={
                              field.value
                                ? ({ name: field.value } as Partial<State> as State)
                                : undefined
                            }
                            containerClassName="w-full"
                            inputClassName={`w-full h-[45px] px-4 py-2 rounded-md border ${
                              fieldState.error
                                ? "border-destructive"
                                : "border-input"
                            } bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
                            countryid={
                              selectedCountryId ? Number(selectedCountryId) : 0
                            }
                            onChange={(val: any) => {
                              field.onChange(val?.name || "");
                              setSelectedStateId(val?.id || null);
                              form.setValue("city", "");
                              form.clearErrors(["state", "city"]);
                            }}
                            onFocus={handleStateFocus}
                            placeHolder="Select State"
                            disabled={!selectedCountryId}
                            value={field.value}
                          />
                        </div>
                      </FormControl>
                      {fieldState.error && (
                        <p className="text-sm font-medium text-destructive mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field, fieldState }) => {
                  // Show error if city is clicked without state
                  const handleCityFocus = () => {
                    if (!selectedStateId) {
                      form.setError(
                        "city",
                        {
                          type: "manual",
                          message: selectedCountryId
                            ? "Please select a state first"
                            : "Please select a country and state first",
                        },
                        { shouldFocus: true }
                      );
                    } else {
                      form.clearErrors("city");
                    }
                  };

                  return (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <div onClick={handleCityFocus} className="w-full">
                          <CitySelect
                            defaultValue={
                              field.value
                                ? ({ name: field.value, id: Number(field.value) } as Partial<City> as City)
                                : undefined
                            }
                            containerClassName="w-full"
                            inputClassName={`w-full h-[45px] px-4 py-2 rounded-md border ${
                              fieldState.error
                                ? "border-destructive"
                                : "border-input"
                            } bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
                            countryid={
                              selectedCountryId ? Number(selectedCountryId) : 0
                            }
                            stateid={
                              selectedStateId ? Number(selectedStateId) : 0
                            }
                            onChange={(val: any) => {
                              if (val) {
                                field.onChange(val.name);
                                form.clearErrors("city");
                              }
                            }}
                            onFocus={handleCityFocus}
                            placeHolder="Select City"
                            disabled={!selectedStateId}
                          />
                        </div>
                      </FormControl>
                      {fieldState.error && (
                        <p className="text-sm font-medium text-destructive mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                    </FormItem>
                  );
                }}
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
                    ? isEditMode
                      ? "Updating..."
                      : "Creating..."
                    : isEditMode
                    ? "Update Center"
                    : "Add Center"}
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
              This action cannot be undone. This will permanently delete the
              center "{centerToDelete?.centerName}" and remove all associated
              data.
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
