"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, MoreHorizontal, Edit, Trash2, Gift, Calendar as CalendarIcon } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DataTablePagination } from "@/components/ui/DataTablePagination";
import { createCoupon, deleteCoupon, getAllCoupon, updateCoupon } from "@/components/api/algobot";

interface Coupon {
  _id: string;
  couponCode: string;
  discount: number;
  expiryDate: string;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
}

interface CouponApiResponse {
  success: boolean;
  payload: {
    data: Coupon[];
    count: number;
  };
}

const couponFormSchema = z.object({
  couponCode: z
    .string()
    .min(3, "Coupon code must be at least 3 characters")
    .max(20, "Coupon code must be at most 20 characters")
    .regex(/^[A-Z0-9-_]+$/, "Coupon code can only contain uppercase letters, numbers, hyphens, and underscores"),

  discount: z.string()
    .min(1, "Discount is required")
    .regex(/^[1-9]\d*$/, "Discount must be a positive number")
    .refine(val => parseInt(val) >= 1 && parseInt(val) <= 99, {
      message: "Discount must be between 1% and 99%"
    }),

  expiryDate: z
    .date({
      required_error: "Expiry date is required.",
      invalid_type_error: "Please enter a valid date",
    })
    .min(new Date(), "Expiry date must be in the future"),

  usageLimit: z.string()
    .min(1, "Usage limit is required")
    .regex(/^[1-9]\d*$/, "Usage limit must be a positive number")
    .refine(val => parseInt(val) >= 1 && parseInt(val) <= 10000, {
      message: "Usage limit must be between 1 and 10,000"
    }),
});

type CouponFormValues = z.infer<typeof couponFormSchema>;

export default function CouponPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [currentCouponId, setCurrentCouponId] = useState<string | null>(null);

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      couponCode: "",
      discount: "",
      expiryDate: undefined as unknown as Date, // no default; force user to pick
      usageLimit: "",
    },
  });

  // Mock data - replace with actual API calls
  const fetchCouponsData = async () => {
    try {
      setIsLoading(true);
      const response = await getAllCoupon({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
      });

      console.log("response", response);

      setCoupons(response.payload.data);
      setTotalItems(response.payload.data.length);
      setTotalPages(Math.ceil(response.payload.totalPages / itemsPerPage));
    } catch (error) {
      console.error("Error fetching coupons:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCouponsData();
  }, [currentPage, itemsPerPage]);

  const handleEdit = (coupon: Coupon) => {
    setIsEditMode(true);
    setCurrentCouponId(coupon._id);
    setEditingCoupon(coupon);
    form.reset({
      couponCode: coupon.couponCode,
      discount: String(coupon.discount),
      expiryDate: new Date(coupon.expiryDate),
      usageLimit: String(coupon.usageLimit),
    });
    setIsAddCouponOpen(true);
  };

  const handleDeleteClick = (coupon: Coupon) => {
    setCouponToDelete(coupon);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!couponToDelete) return;

    try {
      await deleteCoupon(couponToDelete._id);
      console.log("Deleting coupon:", couponToDelete._id);
      setCoupons(coupons.filter((c) => c._id !== couponToDelete._id));
      toast.success("Coupon deleted successfully");
      setIsDeleteDialogOpen(false);
      setCouponToDelete(null);
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast.error("Failed to delete coupon");
    }
  };

  const onSubmit = async (data: CouponFormValues) => {
    try {
      setIsLoading(true);

      console.log("data", data);

      // Ensure expiryDate is sent as YYYY-MM-DD
      const payload = {
        couponCode: data.couponCode,
        discount: data.discount,
        usageLimit: data.usageLimit,
        expiryDate: format(data.expiryDate, "yyyy-MM-dd"),
      };

      if (isEditMode && currentCouponId) {
        await updateCoupon(currentCouponId, payload);
        toast.success("Coupon updated successfully!");
      } else {
        await createCoupon(payload);
        toast.success("Coupon created successfully!");
      }

      setIsAddCouponOpen(false);
      form.reset();
      setIsEditMode(false);
      setEditingCoupon(null);
      await fetchCouponsData();
    } catch (error) {
      console.error("Error saving coupon:", error);
      toast.error("Failed to save coupon");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredCoupons = coupons.filter((coupon) => coupon.couponCode.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddNew = () => {
    setIsEditMode(false);
    setEditingCoupon(null);
    form.reset({
      couponCode: "",
      discount: "",
      expiryDate: undefined as unknown as Date,
      usageLimit: "",
    });
    setIsAddCouponOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">Manage discount coupons and promotional codes.</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Coupon
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search coupons..." value={searchTerm} onChange={handleSearchInputChange} className="pl-8" />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading coupons...</p>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sr. No</TableHead>
                  <TableHead>Coupon Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage Limit</TableHead>
                  <TableHead>Usage Count</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8">
                      <div className="flex flex-col items-center justify-center space-y-4 h-64 text-center">
                        <Gift className="h-12 w-12 text-muted-foreground" />
                        <div>
                          <h3 className="text-lg font-medium">No coupons found</h3>
                          <p className="text-sm text-muted-foreground">{searchTerm ? "Try a different search term" : "Get started by creating your first coupon"}</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCoupons.map((coupon, index) => (
                    <TableRow key={coupon._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Gift className="mr-2 h-4 w-4" />
                          {coupon.couponCode}
                        </div>
                      </TableCell>
                      <TableCell>{coupon.discount}</TableCell>
                      <TableCell> {coupon.usageLimit}</TableCell>
                      <TableCell>{coupon.usageCount}</TableCell>
                      <TableCell>{format(new Date(coupon.createdAt), "M/d/yyyy, h:mm:ss a")}</TableCell>
                      <TableCell>{format(new Date(coupon.expiryDate), "M/d/yyyy, h:mm:ss a")}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-blacktheme">
                            <DropdownMenuItem onClick={() => handleEdit(coupon)}>
                              <Edit className="mr-2 h-4 w-4 text-blacktheme" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(coupon)}>
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

            {totalItems > itemsPerPage && (
              <div className="mt-6">
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={(value) => {
                    setItemsPerPage(value);
                    setCurrentPage(1);
                  }}
                  itemsPerPageOptions={[10, 20, 30, 50]}
                  className="border-t pt-4"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Coupon Dialog */}
      <Dialog open={isAddCouponOpen} onOpenChange={setIsAddCouponOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Coupon" : "Add New Coupon"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="couponCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coupon Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Coupon code..." {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount(%)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(e.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Expiry Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP") : <span>Pick an expiry date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar 
                            mode="single" 
                            selected={field.value} 
                            onSelect={(date) => {
                              field.onChange(date);
                              // Close the popover after selection
                              const popoverTrigger = document.querySelector('[aria-haspopup="dialog"][data-state="open"]:not([data-radix-popper-content-wrapper])') as HTMLElement;
                              if (popoverTrigger) popoverTrigger.click();
                            }} 
                            disabled={(date) => date < new Date()} 
                            initialFocus 
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="usageLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usage Limit</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(e.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsAddCouponOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditMode ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  {isEditMode ? "Save Changes" : "Add Coupon"}
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
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>Are you sure you want to delete the coupon "{couponToDelete?.couponCode}"? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
