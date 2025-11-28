"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SquarePen, Phone, Mail, Search, Plus } from "lucide-react";
import { toast } from "sonner";
import { getUtility, updateUtility } from "@/components/api/utility";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  telegramLink: string;
  whatsAppLink: string;
};

export default function ContactLinks() {
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
    telegramLink: "",
    whatsAppLink: "",
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentField, setCurrentField] = useState<
    keyof UtilitySettings | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const fetchUtilitySettings = async () => {
    try {
      // Replace with actual API call
      const res = await getUtility();
      setUtilitySettings(res?.payload || {});
    } catch (err) {
      console.error("Failed to fetch utility settings:", err);
    }
  };

  const updateUtilitySetting = async (
    field: keyof UtilitySettings,
    value: string
  ) => {
    try {
      setIsLoading(true);
      const updateData = { [field]: value };
      const utilityId = utilitySettings?._id || "";

      const response = await updateUtility(utilityId, updateData);

      setUtilitySettings((prev) => ({
        ...prev,
        ...response.payload, // Assuming the API returns the updated settings
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

  const fieldLabels: Record<keyof Omit<UtilitySettings, "_id">, string> = {
    email: "Email",
    phoneNo: "Phone Number",
    facebookLink: "Facebook Link",
    instagramLink: "Instagram Link",
    linkedin: "Linkedin Link",
    location: "Location",
    twitter: "Twitter Link",
    chatNumber: "Chat Number",
    days: "Newsletter Email Sent Days",
    telegramLink: "Telegram Link",
    whatsAppLink: "WhatsApp Link",
  };

  // Filter and prepare table data
  const tableData = Object.entries(utilitySettings)
    .filter(
      ([key]) =>
        ![
          "_id",
          "deletedAt",
          "updatedAt",
          "lastEmailSentDate",
          "referralPercentage",
        ].includes(key)
    )
    .map(([key, value], index) => ({
      id: key,
      serial: index + 1,
      field: key,
      label: fieldLabels[key as keyof Omit<UtilitySettings, "_id">],
      value: value || "Not set",
    }));

  const filteredData = searchTerm
    ? tableData.filter(
        (item) =>
          item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(item.value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : tableData;

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const formatPhoneNumber = (phone: string): string => {
    if (!phone || phone === "Not set") return phone;
    return phone.startsWith("+") ? phone : `+${phone}`;
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2/4 -translate-y-2/4 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search settings..."
            className="pl-8 w-[200px] lg:w-[300px] font-normal"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.trimStart())}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-base w-[80px]">Sr. No</TableHead>
              <TableHead className="text-base">Setting</TableHead>
              <TableHead className="text-base">Value</TableHead>
              <TableHead className="text-base">Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.serial}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span>{item.label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[400px] truncate">
                    {item.field === "phoneNo" || item.field === "chatNumber"
                      ? formatPhoneNumber(item.value)
                      : item.value}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleEditClick(item.field as keyof UtilitySettings)
                      }
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
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-lg text-gray-900 font-lexend"
                >
                  No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalItems > itemsPerPage && (
        <div className="mt-6">
          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            itemsPerPageOptions={[8, 10, 20, 30, 50]}
            className="border-t pt-4"
          />
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {currentField &&
                fieldLabels[currentField as keyof Omit<UtilitySettings, "_id">]}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={currentField || ""}>
                {currentField &&
                  fieldLabels[
                    currentField as keyof Omit<UtilitySettings, "_id">
                  ]}
              </Label>
              <Input
                name={currentField || ""}
                defaultValue={currentField ? utilitySettings[currentField] : ""}
                placeholder={`Enter ${
                  currentField
                    ? fieldLabels[
                        currentField as keyof Omit<UtilitySettings, "_id">
                      ].toLowerCase()
                    : "value"
                }`}
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
