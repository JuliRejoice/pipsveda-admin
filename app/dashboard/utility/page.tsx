"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SquarePen, Phone, Mail, Search, Plus } from "lucide-react";
import { toast } from "sonner";
import { getUtility, updateUtility } from "@/components/api/utility";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePagination } from "@/components/ui/DataTablePagination";

type UtilitySettings = {
  _id?: string;
  email: string;
  phoneNo: string;
  facebookLink: string;
  instagramLink: string;
  linkedin: string;
  location: string;
  twitter: string;
  chatNumber: string;
  days: string;
};

export default function Utility() {
  const [utilitySettings, setUtilitySettings] = useState<UtilitySettings>({
    email: "",
    phoneNo: "",
    facebookLink: "",
    instagramLink: "",
    linkedin: "",
    location: "",
    twitter: "",
    chatNumber: "",
    days: "",
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentField, setCurrentField] = useState<keyof UtilitySettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUtilitySettings = async () => {
    try {
      // Replace with actual API call
      const res = await getUtility();
      console.log(res, "res");
      setUtilitySettings(res?.payload || {});
    } catch (err) {
      console.error("Failed to fetch utility settings:", err);
    }
  };

  const updateUtilitySetting = async (field: keyof UtilitySettings, value: string) => {
    try {
      setIsLoading(true);
      const updateData = { [field]: value };
      const utilityId = utilitySettings?._id || "";

      console.log(utilityId, "id");

      const response = await updateUtility(utilityId, updateData);

      setUtilitySettings(prev => ({
        ...prev,
        ...response.payload  // Assuming the API returns the updated settings
      }));
      toast.success(`${field} updated successfully`);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      toast.error(`Failed to update ${field}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUtilitySettings();
  }, []);

  const handleEditClick = (field: keyof UtilitySettings) => {
    setCurrentField(field);
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentField) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const value = formData.get(currentField) as string;
    updateUtilitySetting(currentField, value);
  };

  const fieldLabels: Record<keyof Omit<UtilitySettings, '_id'>, string> = {
    email: "Email",
    phoneNo: "Phone Number",
    facebookLink: "Facebook Link",
    instagramLink: "Instagram Link",
    linkedin: "Linkedin Link",
    location: "Location",
    twitter: "Twitter Link",
    chatNumber: "Chat Number",
    days: "Newsletter Email Sent Days",
  };

  // Filter and prepare table data
  const tableData = Object.entries(utilitySettings)
    .filter(([key]) => !['_id', 'deletedAt', 'updatedAt', 'lastEmailSentDate'].includes(key))
    .map(([key, value], index) => ({
      id: key,
      serial: index + 1,
      field: key,
      label: fieldLabels[key as keyof Omit<UtilitySettings, '_id'>],
      value: value || "Not set",
    }));

  // Apply search filter
  const filteredData = searchTerm
    ? tableData.filter(item =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.value).toLowerCase().includes(searchTerm.toLowerCase())
    )
    : tableData;

  // Apply pagination
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Utility Settings</h1>
          <p className="text-muted-foreground">Manage your application's utility settings</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search settings..."
            className="pl-8 w-[200px] lg:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          /></div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Sr. No</TableHead>
              <TableHead>Setting</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.serial}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span>{item.label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[400px] truncate">
                    {item.value}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(item.field as keyof UtilitySettings)}
                      className="h-8 w-8 p-0"
                    >
                      <SquarePen className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* <DataTablePagination
        currentPage={currentPage}
        totalPages={Math.ceil(filteredData.length / itemsPerPage)}
        onPageChange={setCurrentPage}
        onPageSizeChange={setItemsPerPage}
        pageSize={itemsPerPage}
        totalItems={filteredData.length}
      /> */}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {currentField && fieldLabels[currentField as keyof Omit<UtilitySettings, '_id'>]}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={currentField || ""}>
                {currentField && fieldLabels[currentField as keyof Omit<UtilitySettings, '_id'>]}
              </Label>
              <Input
                name={currentField || ""}
                defaultValue={currentField ? utilitySettings[currentField] : ""}
                placeholder={`Enter ${currentField ? fieldLabels[currentField as keyof Omit<UtilitySettings, '_id'>].toLowerCase() : 'value'}`}
                required
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}