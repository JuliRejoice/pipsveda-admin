"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Eye,
  MoreVertical,
  Trash2,
  CheckCircle,
  XCircle,
  Settings,
  Edit,
  Lock,
  View,
  EyeIcon,
} from "lucide-react";
import { WithdrawalDetailsDialog } from "@/components/withdrawal/WithdrawalDetailsDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/ui/DataTablePagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getWithdrawals,
  updateWithdrawalStatus,
} from "@/components/api/withdrawal";
import { updateCustomer } from "@/components/api/customer";
import { getUtility, updateUtility } from "@/components/api/utility";
import { CryptoChainModal } from "@/components/withdrawal/CryptoChainModal";

// Types
type WithdrawalStatus = "approved" | "rejected" | "pending" | "";
interface WithdrawalItem {
  withdrawalType: any;
  _id: string;
  accountHolderName: string;
  accountNumber: string;
  amount: string;
  chain: string;
  createdAt: string;
  email: string;
  ifscCode: string;
  isActive: boolean;
  name: string;
  phone: string;
  status: WithdrawalStatus;
  uid: {
    _id: string;
    email: string;
    name: string;
    password: string;
    roleId: string;
    [key: string]: any;
  };
  updatedAt: string;
  walletId: string;
  transactionId?: string;
  requestedAt: string;
}

interface UtilitySettings {
  _id?: string;
  referralPercentage: number;
  chatNumber?: string;
  days?: number;
  email?: string;
  facebookLink?: string;
  instagramLink?: string;
  lastEmailSentDate?: string;
  linkedin?: string;
  location?: string;
  phoneNo?: string;
  telegramLink?: string;
  twitter?: string;
  updatedAt?: string;
  whatsAppLink?: string | null;
}

// Component
export default function WithdrawalsPage() {
  const [utilitySettings, setUtilitySettings] =
    useState<UtilitySettings | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "" | WithdrawalStatus | "all"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  // Edit Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingWithdrawal, setEditingWithdrawal] =
    useState<WithdrawalItem | null>(null);
  const [editStatus, setEditStatus] = useState<WithdrawalStatus>("");
  const [transactionId, setTransactionId] = useState("");

  // Modals
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<WithdrawalItem | null>(null);

  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false);
  const [commissionPercent, setCommissionPercent] = useState<number | "">("");
  const [selectedCommissionTarget, setSelectedCommissionTarget] = useState<
    "all" | "selected" | null
  >(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  useEffect(() => {
    const fetchUtilitySettings = async () => {
      try {
        const response = await getUtility();
        if (response?.payload) {
          setUtilitySettings(response.payload);
        }
      } catch (error) {
        console.error("Error fetching utility settings:", error);
        toast.error("Failed to load utility settings");
      }
    };

    fetchUtilitySettings();
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm.trimStart());
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Function to filter withdrawals based on status
  const getFilteredWithdrawals = () => {
    if (statusFilter === "all" || !statusFilter) {
      return withdrawals;
    }
    return withdrawals.filter((w) => w.status === statusFilter);
  };

  // Fetch function (calls your API)
  const fetchWithdrawals = async () => {
    try {
      setIsFetching(true);

      const query = {
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
        status:
          statusFilter === "all" || !statusFilter ? undefined : statusFilter,
      };

      console.log("API Request Query:", query);

      const res = await getWithdrawals(query);

      console.log("API Response:", {
        success: res.success,
        count: res.payload?.count,
        dataLength: res.payload?.data?.length,
        data: res.payload?.data,
      });

      const list: WithdrawalItem[] = res.payload?.data || [];
      const count: number = res.payload?.count || 0;

      setWithdrawals(list);
      setTotalItems(count);
      setTotalPages(Math.max(1, Math.ceil(count / itemsPerPage)));
    } catch (err) {
      console.error("fetchWithdrawals error", err);
      toast.error("Failed to load withdrawals");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, debouncedSearch, statusFilter]);

  // Commission modal behaviour
  const openCommissionForAll = () => {
    setSelectedCommissionTarget("all");
    setCommissionDialogOpen(true);
    setCommissionPercent("");
  };

  // Open edit dialog for withdrawal
  const handleEditClick = (withdrawal: WithdrawalItem) => {
    setEditingWithdrawal(withdrawal);
    setEditStatus(withdrawal.status);
    setTransactionId(withdrawal.transactionId || "");
    setEditDialogOpen(true);
  };

  // Form validation state
  const [formErrors, setFormErrors] = useState<{
    status?: string;
    transactionId?: string;
  }>({});

  // Validate form fields
  const validateForm = (): boolean => {
    const errors: { status?: string; transactionId?: string } = {};

    // Validate status
    if (!editStatus) {
      errors.status = "Please select a status";
    }

    // Validate transaction ID if status is approved
    if (editStatus === "approved" && !transactionId?.trim()) {
      errors.transactionId =
        "Transaction ID is required for approved withdrawals";
    } else if (editStatus === "approved" && transactionId?.trim().length < 5) {
      errors.transactionId = "Transaction ID must be at least 5 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleUpdateWithdrawal = async () => {
    if (!editingWithdrawal) return;

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoadingAction(true);

      // Prepare the update data with required fields
      const updateData = {
        name: editingWithdrawal.name,
        email: editingWithdrawal.email,
        phone: editingWithdrawal.phone,
        amount: editingWithdrawal.amount,
        walletId: editingWithdrawal.walletId,
        chain: editingWithdrawal.chain,
        accountNumber: editingWithdrawal.accountNumber,
        ifscCode: editingWithdrawal.ifscCode,
        accountHolderName: editingWithdrawal.accountHolderName,
        withdrawalType: editingWithdrawal.withdrawalType,
        status: editStatus,
        transactionId:
          editStatus === "approved" ? transactionId.trim() : undefined,
        // Ensure uid is passed as a string
        uid:
          typeof editingWithdrawal.uid === "object"
            ? editingWithdrawal.uid._id
            : editingWithdrawal.uid,

      };

      const response = await updateWithdrawalStatus(
        editingWithdrawal._id,
        updateData
      );

      if (response.success) {
        toast.success("Withdrawal updated successfully");
        setEditDialogOpen(false);
        setFormErrors({});
        fetchWithdrawals();
      } else {
        toast.error(response.message || "Failed to update withdrawal");
      }
    } catch (error) {
      console.error("Error updating withdrawal:", error);
      toast.error("An error occurred while updating the withdrawal");
    } finally {
      setIsLoadingAction(false);
    }
  };

  // Reset form errors when dialog is closed
  useEffect(() => {
    if (!editDialogOpen) {
      setFormErrors({});
    }
  }, [editDialogOpen]);

  const submitCommission = async () => {
    if (
      commissionPercent === "" ||
      commissionPercent < 0 ||
      commissionPercent > 100
    ) {
      toast.error(
        "Please enter a valid commission percentage between 0 and 100"
      );
      return;
    }

    try {
      setIsLoadingAction(true);
      const referralPercentage = Number(commissionPercent);

      const utilityResponse = await getUtility();
      const utilityId = utilityResponse?.payload?._id || "";

      if (!utilityId) {
        throw new Error("Utility settings not found");
      }

      const updateData = { referralPercentage };
      const response = await updateUtility(utilityId, updateData);

      setUtilitySettings((prev: any) => ({
        ...prev,
        ...response.payload,
        referralPercentage,
      }));
      toast.success(`Saved Successfully`);
      setCommissionDialogOpen(false);
      setCommissionPercent("");
      fetchWithdrawals();
    } catch (error) {
      console.error("Error updating referral percentage:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update referral percentage"
      );
    } finally {
      setIsLoadingAction(false);
    }
  };

  useEffect(() => {
    if (commissionDialogOpen && utilitySettings) {
      setCommissionPercent(utilitySettings.referralPercentage || 0);
    }
  }, [commissionDialogOpen, utilitySettings]);

  return (
    <div className="container mx-auto px-4">
      {/* Header */}
      <div className="space-y-6 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Withdraw Request
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage withdrawal requests & payouts
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search by name..."
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value.trimStart())}
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value: "" | WithdrawalStatus | "all") => {
                setStatusFilter(value);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              onClick={openCommissionForAll}
              variant="default"
              className="w-full  sm:w-auto"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            {/* <div className="ml-6 text-xs text-muted-foreground">
              Current: {utilitySettings?.referralPercentage || 0}%
            </div> */}
          </div>
        </div>
      </div>

      {/* Edit Withdrawal Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[450px] p-6">
          <DialogHeader className="">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Update Withdrawal Status
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="status"
                  className="text-sm font-medium text-gray-700"
                >
                  Status
                </Label>
              </div>
              <div className="space-y-1">
                <Select
                  onValueChange={(value: WithdrawalStatus) => {
                    setEditStatus(value);
                    // Clear transaction ID when status changes to rejected
                    if (value === "rejected") {
                      setTransactionId("");
                    }
                    // Clear error when user makes a selection
                    if (formErrors.status) {
                      setFormErrors((prev) => ({ ...prev, status: undefined }));
                    }
                  }}
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved" className="flex items-center">
                      Approved
                    </SelectItem>
                    <SelectItem value="rejected" className="flex items-center">
                      Rejected
                    </SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.status && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.status}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="transactionId"
                  className="text-sm font-medium text-gray-700"
                >
                  Transaction ID
                </Label>
              </div>
              <div className="space-y-1">
                <div className="relative">
                  <Input
                    id="transactionId"
                    value={transactionId}
                    onChange={(e) => {
                      setTransactionId(e.target.value);
                      // Clear error when user starts typing
                      if (formErrors.transactionId) {
                        setFormErrors((prev) => ({
                          ...prev,
                          transactionId: undefined,
                        }));
                      }
                    }}
                    className={`h-11 w-full pl-3 pr-10 ${
                      formErrors.transactionId ? "border-red-500" : ""
                    }`}
                    placeholder="Enter transaction ID"
                    disabled={isLoadingAction || editStatus !== "approved"}
                  />
                  {transactionId && (
                    <button
                      type="button"
                      onClick={() => {
                        setTransactionId("");
                        if (formErrors.transactionId) {
                          setFormErrors((prev) => ({
                            ...prev,
                            transactionId: undefined,
                          }));
                        }
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isLoadingAction || editStatus !== "approved"}
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {formErrors.transactionId ? (
                  <p className="text-sm text-red-500">
                    {formErrors.transactionId}
                  </p>
                ) : editStatus === "approved" ? (
                  <p className="text-xs text-gray-500">
                    Please enter the transaction ID for the approved withdrawal.
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={isLoadingAction}
              className="px-4 h-10"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpdateWithdrawal}
              disabled={
                isLoadingAction ||
                !editStatus ||
                (editStatus === "approved" && !transactionId.trim())
              }
              className="px-4 h-10 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoadingAction ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="rounded-lg shadow overflow-hidden">
        {isFetching ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center p-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No withdrawals found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Results will appear here when you have withdrawal requests.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sr. No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone No.</TableHead>
                    <TableHead>Withdraw Amount</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Withdrawal Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredWithdrawals().length > 0 ? (
                    getFilteredWithdrawals().map((w, idx) => (
                      <TableRow key={w._id}>
                        <TableCell className="font-medium">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </TableCell>
                        <TableCell>{w.name}</TableCell>
                        <TableCell className="lowercase">{w.email}</TableCell>
                        <TableCell>
                          {w.phone.startsWith("+") ? w.phone : "+" + w.phone}
                        </TableCell>
                        <TableCell>${w.amount}</TableCell>
                        <TableCell>
                          {w.transactionId ? (
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-sm break-all">
                                {w.transactionId}
                              </span>
                              {/* <button
                              onClick={() => {
                                navigator.clipboard?.writeText(
                                  w.transactionId || ""
                                );
                                toast.success("Transaction ID copied");
                              }}
                              className="text-xs px-2 py-1 border rounded"
                            >
                              Copy
                            </button> */}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {w.withdrawalType ? (
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-sm break-all">
                                {w.withdrawalType}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              w.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : w.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {w.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {w.updatedAt
                            ? new Date(w.updatedAt).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => {
                              setSelectedWithdrawal(w);
                              setIsViewOpen(true);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell>
                          {w.status !== "pending" ? (
                            <Button variant="outline" size="sm" disabled>
                              <Lock className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(w);
                              }}
                              disabled={isLoadingAction}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No data found
                      </TableCell>
                    </TableRow>
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

      {/* View Withdrawal Details Dialog */}
      <WithdrawalDetailsDialog
        isOpen={isViewOpen}
        onOpenChange={setIsViewOpen}
        withdrawal={selectedWithdrawal}
      />

      {/* Commission Dialog */}
      <Dialog
        open={commissionDialogOpen}
        onOpenChange={setCommissionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Earning Rate (%)</Label>
              <Input
                id="rate"
                type="number"
                min="0"
                step="1"
                max="100"
                placeholder="0"
                value={commissionPercent}
                onKeyDown={(e) => {
                  if (e.key === "." || e.key === "e") {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  setCommissionPercent(
                    e.target.value.replace(/\D/g, "") as any
                  );
                }}
                className="h-[55px] px-4 text-base font-semibold mt-2"
              />
            </div>
            <CryptoChainModal />

            <div className="flex justify-end space-x-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setCommissionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={submitCommission} disabled={isLoadingAction}>
                {isLoadingAction ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
