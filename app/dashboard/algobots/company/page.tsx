"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Search, Plus, Edit, Trash2, AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createCompany, deleteCompany, getAllCompany, updateCompany } from "@/components/api/algobot";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
});

type FormValues = z.infer<typeof formSchema>;

interface Company {
  _id: string;
  companyName: string;
}

export default function CompanyPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { companyName: "" },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = form;

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setIsFetching(true);
      const response = await getAllCompany();
      setCompanies(response.payload.data || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast.error("Failed to fetch companies");
    } finally {
      setIsFetching(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      if (isEditMode && currentCompanyId) {
        await updateCompany(currentCompanyId, data);
        toast.success("Company updated successfully!");
      } else {
        await createCompany(data);
        toast.success("Company created successfully!");
      }
      setIsOpen(false);
      reset();
      fetchCompanies();
    } catch (error) {
      console.error("Error saving company:", error);
      toast.error("Failed to save company");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (company: Company) => {
    setCurrentCompanyId(company._id);
    setIsEditMode(true);
    setValue("companyName", company.companyName);
    setIsOpen(true);
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;
    try {
      setIsLoading(true);
      await deleteCompany(companyToDelete);
      toast.success("Company deleted successfully");
      setCompanies(companies.filter((c) => c._id !== companyToDelete));
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting company:", error);
      toast.error("Failed to delete company");
    } finally {
      setIsLoading(false);
      setIsDeleting(false);
      setCompanyToDelete(null);
    }
  };

  const filteredCompanies = companies.filter((company) => company.companyName.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Company</h1>
          <p className="text-muted-foreground">Manage bot provider company</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setIsEditMode(false);
                reset();
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Company
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditMode ? "Edit Company" : "Add New Company"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input {...register("companyName")} className={errors.companyName ? "border-red-500" : ""} />
                {errors.companyName && <p className="text-sm text-red-500">{errors.companyName.message}</p>}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : isEditMode ? "Update" : "Add Company"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search company..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sr. No</TableHead>
              <TableHead>Company Name</TableHead>
              <TableHead>Edit</TableHead>
              <TableHead>Delete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No companies found
                </TableCell>
              </TableRow>
            ) : (
              filteredCompanies.map((company, index) => (
                <TableRow key={company._id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{company.companyName}</TableCell>
                  <TableCell className="font-medium">
                    <button onClick={() => handleEdit(company)}>
                      <Edit className="mr-2 h-4 w-4" />
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">
                    <button
                      onClick={() => {
                        setCompanyToDelete(company._id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Are you sure you want to delete this company? This action cannot be undone.</AlertDescription>
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
