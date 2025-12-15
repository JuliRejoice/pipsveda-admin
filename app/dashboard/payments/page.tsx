"use client";

import { useState, useEffect } from "react";
import { downloadInvoice, getPaymentHistory } from "@/components/api/payment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, AlertCircle, CreditCard, DownloadIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/ui/DataTablePagination";
import { toast } from "sonner";

interface Payment {
  invoiceNo: any;
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  paymentId: string;
  orderId: string;
  planType: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  paymentMethod: string;
  itemType: "course" | "algobot" | "telegram" | "other";
  itemId: string;
  itemName: string;
  createdAt: string;
  updatedAt: string;
  metaAccountNo: string[];
  telegramAccountNo: string[];
  planExpiry: string;
  noOfBots: number;
  discount: number;
  couponDiscount: number;
  initialPrice: number;
  price: number;
  botId: {
    strategyId: {
      title: string;
    };
    planType: string;
  };
  telegramId: {
    telegramId: {
      channelName: string;
    };
    planType: string;
  };
  courseId: {
    CourseName: string;
    courseType: string;
  };
  uid: {
    name: string;
  };
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid date";

  // Format day, month, year
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  // Format hours, minutes, and AM/PM
  let hours = date.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
};

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [activeTab, setActiveTab] = useState("payments");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingInvoices, setLoadingInvoices] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setIsLoading(true);
        let isType = "";
        if (activeTab === "courses") {
          isType = "Course";
          setCurrentPage(1);
        } else if (activeTab === "algobots") {
          isType = "Bot";
          setCurrentPage(1);
        } else if (activeTab === "telegram") {
          isType = "Telegram";
          setCurrentPage(1);
        }
        const response = await getPaymentHistory({
          page: currentPage,
          limit: itemsPerPage,
          isType: isType,
        });

        if (response.success) {
          const paymentsData = response.payload.data || [];
          setPayments(paymentsData);
          setTotalItems(response.payload.count);
          setTotalPages(Math.ceil(response.payload.count / itemsPerPage));
        } else {
          setError("Failed to load payment history");
        }
      } catch (err) {
        console.error("Error fetching payments:", err);
        setError("An error occurred while loading payments");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, [currentPage, itemsPerPage, activeTab]);
  useEffect(() => {
    setSearchTerm("");
  }, [activeTab]);

  const calculateExpiryDate = (purchaseDate: string, planDuration: string) => {
    if (!planDuration || planDuration === "N/A") return null;

    const purchase = new Date(purchaseDate);
    const duration = parseInt(planDuration);

    if (planDuration.includes("Month")) {
      purchase.setMonth(purchase.getMonth() + duration);
    } else if (planDuration.includes("year")) {
      purchase.setFullYear(purchase.getFullYear() + duration);
    }
    return purchase.toLocaleDateString("en-US");
  };

  const downloadPaymentInvoice = async (payment: Payment) => {
    if (loadingInvoices[payment._id]) return; // Prevent multiple clicks

    try {
      setLoadingInvoices((prev) => ({ ...prev, [payment._id]: true }));
      const expiryDate =
        payment.planExpiry ||
        calculateExpiryDate(payment.createdAt, payment.planType);

      // Handle date safely
      let purchaseDate = "N/A";
      if (payment.createdAt) {
        const date = new Date(payment.createdAt);
        purchaseDate = !isNaN(date.getTime())
          ? date.toLocaleDateString("en-US")
          : "Invalid date";
      }

      const invoicePayload = {
        transactionId: payment.orderId,
        purchaseDate: purchaseDate,
        expiryDate: expiryDate,
        invoiceNo: payment.invoiceNo,
        items: [
          {
            planName:
              payment.telegramId?.telegramId?.channelName ||
              payment.botId?.strategyId?.title ||
              payment.courseId?.CourseName ||
              "N/A",
            planDuration: payment.planType || "N/A",
            metaNo:
              payment.telegramAccountNo || payment.metaAccountNo?.[0] || "N/A",
            qty: payment.noOfBots || 1,
            amount: payment.price || 0,
          },
        ],
        couponDiscount:
          payment.couponDiscount > 0 ? `-${payment.couponDiscount}` : "-",
        planDiscount: payment.discount > 0 ? `-${payment.discount}` : "-",
        totalValue: payment.initialPrice || 0,
        total: payment.price || 0,
      };

      const response = await downloadInvoice(invoicePayload as any);

      if (response?.success && response?.payload) {
        const pdfRes = await fetch(response.payload);
        const blob = await pdfRes.blob();

        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `invoice-${payment.orderId || Date.now()}.pdf`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(url);

        toast.success("Invoice downloaded successfully!");
      } else {
        throw new Error("Failed to generate invoice");
      }
    } catch (error: any) {
      console.error("Error generating invoice:", error);
      toast.error(error.message || "Failed to generate invoice");
    } finally {
      setLoadingInvoices((prev) => ({ ...prev, [payment._id]: false }));
    }
  };

  const filterPaymentsByTab = (payments: Payment[]) => {
    return payments.filter((payment) => {
      switch (activeTab) {
        case "payments":
          return filterType === "all" || payment.itemType === filterType;
        case "courses":
          const hasCourseData =
            !!payment.courseId?.CourseName || payment.itemType === "course";
          return payment.itemType === "course" || hasCourseData;
        case "algobots":
          return (
            payment.itemType === "algobot" || !!payment.botId?.strategyId?.title
          );
        case "telegram":
          return (
            payment.itemType === "telegram" ||
            !!payment.telegramId?.telegramId?.channelName
          );
        default:
          return true;
      }
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const searchPayments = (payments: Payment[], term: string) => {
    if (!term.trim()) return payments;

    const searchTerm = term.toLowerCase();
    return payments.filter((payment) => {
      return (
        payment.uid.name?.toLowerCase().includes(searchTerm) ||
        payment.itemName?.toLowerCase().includes(searchTerm) ||
        payment.paymentId?.toLowerCase().includes(searchTerm) ||
        payment.orderId?.toLowerCase().includes(searchTerm) ||
        payment.userEmail?.toLowerCase().includes(searchTerm) ||
        payment.courseId?.CourseName?.toLowerCase().includes(searchTerm) ||
        payment.botId?.strategyId?.title?.toLowerCase().includes(searchTerm) ||
        payment.telegramId?.telegramId?.channelName
          ?.toLowerCase()
          .includes(searchTerm) ||
        payment.planType?.toLowerCase().includes(searchTerm)
      );
    });
  };

  const filteredByTab = filterPaymentsByTab(payments);
  const filteredPayments = searchTerm
    ? searchPayments(filteredByTab, searchTerm)
    : filteredByTab;

  const renderSearchInput = (placeholder: string = "Search...") => (
    <div className="mb-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value.trimStart())}
          className="pl-10 font-normal"
        />
      </div>
    </div>
  );

  const renderNoData = (isSearch: boolean) => (
    <div className="text-center py-12 text-gray-500">
      <p className="text-2xl text-gray-500 font-medium">No data found</p>
      <p className="text-lg text-gray-900 font-lexend">
        {isSearch
          ? "Try a different search term"
          : "There are no records to display"}
      </p>
    </div>
  );

  // Function to render the appropriate table based on the active tab
  const renderTable = () => {
    // Use filteredPayments directly as it already handles the active tab filtering
    const data = filteredPayments;

    const renderStatusBadge = (status: string) => {
      switch (status.toLowerCase()) {
        case "completed":
          return (
            <Badge className="bg-green-100 text-green-800">Completed</Badge>
          );
        case "pending":
          return (
            <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
          );
        case "failed":
          return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
        case "refunded":
          return <Badge className="bg-blue-100 text-blue-800">Refunded</Badge>;
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    };

    if (activeTab === "courses") {
      return (
        <>
          <div className="whitespace-nowrap mb-5">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-base">Sr. No</TableHead>
                      <TableHead className="text-base">User Name</TableHead>
                      <TableHead className="text-base">Purchase Date</TableHead>
                      <TableHead className="text-base">Course Name</TableHead>
                      <TableHead className="text-base">Course Type</TableHead>
                      <TableHead className="text-base">Amount</TableHead>
                      <TableHead className="text-base">
                        Transaction ID
                      </TableHead>
                      <TableHead className="text-base">
                        Payment Method
                      </TableHead>
                      {/* <TableHead className="text-base">Status</TableHead> */}
                      <TableHead className="text-base">Invoice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8">
                          <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                              <p className="text-muted-foreground">
                                Loading payments...
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8">
                          <div className="flex flex-col items-center justify-center space-y-4 h-64 text-center">
                            <AlertCircle className="h-12 w-12 text-destructive" />
                            <div>
                              <h3 className="text-lg font-medium">
                                Error loading payments
                              </h3>
                              <p className="text-sm text-muted-foreground font-lexend">
                                Please try again later
                              </p>
                              <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => window.location.reload()}
                              >
                                Retry
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8">
                          <div className="flex flex-col items-center justify-center space-y-4 h-64 text-center">
                            <CreditCard className="h-12 w-12 text-muted-foreground" />
                            <div>
                              <h3 className="text-lg font-medium">
                                No payments found
                              </h3>
                              <p className="text-sm text-muted-foreground font-lexend">
                                {searchTerm
                                  ? "No matching payments found"
                                  : "No payment records available"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((payment, index) => {
                        const serialNumber =
                          (currentPage - 1) * itemsPerPage + index + 1;
                        return (
                          <TableRow key={payment._id}>
                            <TableCell>{serialNumber}</TableCell>
                            <TableCell>{payment?.uid?.name}</TableCell>
                            <TableCell>
                              {payment.createdAt
                                ? formatDate(payment.createdAt)
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              {payment.courseId?.CourseName || "-"}
                            </TableCell>
                            <TableCell className="capitalize">
                              {payment.courseId?.courseType || "-"}
                            </TableCell>
                            <TableCell>${payment.price || "0.00"}</TableCell>
                            <TableCell>{payment.orderId || "N/A"}</TableCell>
                            <TableCell>
                              {payment.paymentMethod || "-"}
                            </TableCell>
                            {/* <TableCell>
                              {renderStatusBadge(payment.status)}
                            </TableCell> */}
                            <TableCell className="px-6 py-4 text-left whitespace-nowrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadPaymentInvoice(payment)}
                                disabled={loadingInvoices[payment._id]}
                                className="border-none"
                              >
                                {loadingInvoices[payment._id] ? (
                                  <>
                                    <DownloadIcon
                                      className={`h-4 w-4 animate-pulse ${
                                        loadingInvoices[payment._id]
                                          ? "cursor-not-allowed"
                                          : ""
                                      }`}
                                    />
                                  </>
                                ) : (
                                  <>
                                    <DownloadIcon className="h-4 w-4" />
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
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
            itemsPerPageOptions={[8, 10, 20, 30, 40, 50]}
          />
        </>
      );
    }

    if (activeTab === "algobots") {
      return (
        <>
          <div className="whitespace-nowrap mb-5">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-base">Sr. No</TableHead>
                      <TableHead className="text-base">User Name</TableHead>
                      <TableHead className="text-base">Purchase Date</TableHead>
                      <TableHead className="text-base">AlgoBot Name</TableHead>
                      <TableHead className="text-base">Plan Type</TableHead>
                      <TableHead className="text-base">Amount</TableHead>
                      <TableHead className="text-base">
                        Transaction ID
                      </TableHead>
                      <TableHead className="text-base">Meta Acc No.</TableHead>
                      <TableHead className="text-base">
                        Payment Method
                      </TableHead>
                      {/* <TableHead className="text-base">Status</TableHead> */}
                      <TableHead className="text-base">Invoice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8">
                          <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                              <p className="text-muted-foreground">
                                Loading algobots...
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8">
                          <div className="flex flex-col items-center justify-center space-y-4 h-64 text-center">
                            <AlertCircle className="h-12 w-12 text-destructive" />
                            <div>
                              <h3 className="text-lg font-medium">
                                Error loading algobots
                              </h3>
                              <p className="text-sm text-muted-foreground font-lexend">
                                Please try again later
                              </p>
                              <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => window.location.reload()}
                              >
                                Retry
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8">
                          <div className="flex flex-col items-center justify-center space-y-4 h-64 text-center">
                            <CreditCard className="h-12 w-12 text-muted-foreground" />
                            <div>
                              <h3 className="text-lg font-medium">
                                No Algobot found
                              </h3>
                              <p className="text-sm text-muted-foreground font-lexend">
                                {searchTerm
                                  ? "No matching algobots found"
                                  : "No algobot records available"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((payment, index) => {
                        const serialNumber =
                          (currentPage - 1) * itemsPerPage + index + 1;
                        return (
                          <TableRow key={payment._id}>
                            <TableCell>{serialNumber}</TableCell>
                            <TableCell>{payment?.uid?.name}</TableCell>
                            <TableCell>
                              {payment.createdAt
                                ? formatDate(payment.createdAt)
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              {payment?.botId?.strategyId?.title || "-"}
                            </TableCell>
                            <TableCell className="capitalize">
                              {payment?.botId?.planType?.replace(
                                /([A-Z])/g,
                                " $1"
                              ) || "N/A"}
                            </TableCell>
                            <TableCell>${payment?.price || "0.00"}</TableCell>
                            <TableCell className="font-mono">
                              {payment.orderId || "N/A"}
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <div
                                    className="cursor-pointer"
                                    onClick={() => setSelectedPayment(payment)}
                                  >
                                    {payment?.metaAccountNo?.length > 0 ? (
                                      <Badge variant="outline">
                                        View {payment.metaAccountNo.length}{" "}
                                        Account
                                        {payment.metaAccountNo.length !== 1
                                          ? "s"
                                          : ""}
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="text-gray-400"
                                      >
                                        No Accounts
                                      </Badge>
                                    )}
                                  </div>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                  <DialogHeader>
                                    <DialogTitle>
                                      Meta Account Numbers
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    {payment?.metaAccountNo?.length > 0 ? (
                                      <div className="space-y-2">
                                        {payment.metaAccountNo.map(
                                          (account, idx) => (
                                            <div
                                              key={idx}
                                              className="flex items-center p-3 bg-gray-50 rounded-md"
                                            >
                                              <span className="font-medium">
                                                Account {idx + 1}:
                                              </span>
                                              <span className="font-mono px-3">
                                                {account}
                                              </span>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-gray-500 text-center py-4">
                                        No meta account numbers found
                                      </p>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                            <TableCell>
                              {payment.paymentMethod || "-"}
                            </TableCell>

                            {/* <TableCell>
                              {renderStatusBadge(payment.status)}
                            </TableCell> */}
                            <TableCell className="px-6 py-4 text-left whitespace-nowrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadPaymentInvoice(payment)}
                                disabled={loadingInvoices[payment._id]}
                                className="border-none"
                              >
                                {loadingInvoices[payment._id] ? (
                                  <>
                                    <DownloadIcon
                                      className={`h-4 w-4 animate-pulse ${
                                        loadingInvoices[payment._id]
                                          ? "cursor-not-allowed"
                                          : ""
                                      }`}
                                    />
                                  </>
                                ) : (
                                  <>
                                    <DownloadIcon className="h-4 w-4" />
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
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
            itemsPerPageOptions={[8, 10, 20, 30, 40, 50]}
          />
        </>
      );
    }

    if (activeTab === "telegram") {
      return (
        <>
          <div className="whitespace-nowrap mb-5">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-base">Sr. No</TableHead>
                      <TableHead className="text-base">User Name</TableHead>
                      <TableHead className="text-base">Purchase Date</TableHead>
                      <TableHead className="text-base">
                        Telegram User Name
                      </TableHead>
                      <TableHead className="text-base">
                        Telegram Channel
                      </TableHead>
                      <TableHead className="text-base">Plan Type</TableHead>
                      <TableHead className="text-base">Amount</TableHead>
                      <TableHead className="text-base">
                        Transaction ID
                      </TableHead>
                      <TableHead className="text-base">
                        Payment Method
                      </TableHead>
                      {/* <TableHead className="text-base">Status</TableHead> */}
                      <TableHead className="text-base">Invoice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8">
                          <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                              <p className="text-muted-foreground">
                                Loading Telegram Subscriptions...
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8">
                          <div className="flex flex-col items-center justify-center space-y-4 h-64 text-center">
                            <AlertCircle className="h-12 w-12 text-destructive" />
                            <div>
                              <h3 className="text-lg font-medium">
                                Error loading Telegram Subscriptions
                              </h3>
                              <p className="text-sm text-muted-foreground font-lexend">
                                Please try again later
                              </p>
                              <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => window.location.reload()}
                              >
                                Retry
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8">
                          <div className="flex flex-col items-center justify-center space-y-4 h-64 text-center">
                            <CreditCard className="h-12 w-12 text-muted-foreground" />
                            <div>
                              <h3 className="text-lg font-medium">
                                No telegram subscriptions found
                              </h3>
                              <p className="text-sm text-muted-foreground font-lexend">
                                {searchTerm
                                  ? "No matching telegram subscriptions found"
                                  : "No telegram subscriptions records available"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((payment, index) => (
                        <TableRow key={payment._id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{payment?.uid?.name || "-"}</TableCell>
                          <TableCell>
                            {payment.createdAt
                              ? formatDate(payment.createdAt)
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {payment?.telegramAccountNo || "-"}
                          </TableCell>
                          <TableCell>
                            {payment?.telegramId?.telegramId?.channelName ||
                              "N/A"}
                          </TableCell>
                          <TableCell className="capitalize">
                            {payment?.planType?.replace(/([A-Z])/g, " $1") ||
                              "N/A"}
                          </TableCell>
                          <TableCell>${payment?.price || "0.00"}</TableCell>
                          <TableCell>{payment?.orderId || "N/A"}</TableCell>
                          <TableCell>{payment?.paymentMethod || "-"}</TableCell>
                          {/* <TableCell>
                            {renderStatusBadge(payment?.status)}
                          </TableCell> */}
                          <TableCell className="px-6 py-4 text-left whitespace-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadPaymentInvoice(payment)}
                              disabled={loadingInvoices[payment._id]}
                              className="border-none"
                            >
                              {loadingInvoices[payment._id] ? (
                                <>
                                  <DownloadIcon
                                    className={`h-4 w-4 animate-pulse ${
                                      loadingInvoices[payment._id]
                                        ? "cursor-not-allowed"
                                        : ""
                                    }`}
                                  />
                                </>
                              ) : (
                                <>
                                  <DownloadIcon className="h-4 w-4" />
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
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
            itemsPerPageOptions={[8, 10, 20, 30, 40, 50]}
          />
        </>
      );
    }

    // Default view (All Payments)
    return (
      <>
        <div className="whitespace-nowrap mb-5">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-base px-6 text-left w-[80px]">
                      Sr. No
                    </TableHead>
                    <TableHead className="text-base px-6 text-left w-[200px]">
                      User Name
                    </TableHead>
                    <TableHead className="text-base px-6 text-left w-[200px]">
                      Purchase Date
                    </TableHead>
                    <TableHead className="text-base px-6 text-left w-[250px]">
                      Course Name
                    </TableHead>
                    <TableHead className="text-base px-6 text-left w-[250px]">
                      Strategy Name
                    </TableHead>
                    <TableHead className="text-base px-6 text-left w-[200px]">
                      Telegram Channel
                    </TableHead>
                    <TableHead className="text-base px-6 text-left w-[150px]">
                      Course Type
                    </TableHead>
                    <TableHead className="text-base px-6 text-left w-[120px]">
                      Plan
                    </TableHead>
                    <TableHead className="text-base px-6 text-left w-[100px]">
                      Amount
                    </TableHead>
                    <TableHead className="text-base px-6 text-left w-[300px]">
                      Transaction ID
                    </TableHead>
                    <TableHead className="text-base px-6 text-left w-[180px]">
                      Meta Account No
                    </TableHead>
                    <TableHead className="text-base px-6 text-left w-[180px]">
                      Payment Method
                    </TableHead>
                    {/* <TableHead className="text-base px-6 text-left w-[100px]">
                      Status
                    </TableHead> */}
                    <TableHead className="text-base px-6 text-left w-[100px]">
                      Invoice
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="py-8 px-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-muted-foreground">Loading...</p>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={11} className="py-8 px-6 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4 h-64">
                          <AlertCircle className="h-12 w-12 text-destructive" />
                          <h3 className="text-lg font-medium">
                            Error loading data
                          </h3>
                          <p className="text-sm text-muted-foreground font-lexend">
                            Please try again later
                          </p>
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => window.location.reload()}
                          >
                            Retry
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="py-8 px-6 text-center">
                        <CreditCard className="h-12 w-12 text-muted-foreground" />
                        <h3 className="text-lg font-medium">No data found</h3>
                        <p className="text-sm text-muted-foreground font-lexend">
                          {searchTerm
                            ? "No matching data found"
                            : "No data records available"}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment, index) => {
                      const serialNumber =
                        (currentPage - 1) * itemsPerPage + index + 1;
                      return (
                        <TableRow key={payment._id}>
                          <TableCell className="px-6 py-4 text-left whitespace-nowrap">
                            {serialNumber}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-left whitespace-nowrap">
                            {payment?.uid?.name || "-"}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-left whitespace-nowrap">
                            {payment.createdAt
                              ? formatDate(payment.createdAt)
                              : "N/A"}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-left whitespace-nowrap capitalize">
                            {payment?.courseId?.CourseName || "-"}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-left whitespace-nowrap">
                            {payment?.botId?.strategyId?.title || "-"}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-left whitespace-nowrap">
                            {payment?.telegramId?.telegramId?.channelName ||
                              "-"}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-left whitespace-nowrap">
                            {payment?.courseId?.courseType || "-"}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-left whitespace-nowrap">
                            {payment?.botId?.planType?.replace(
                              /(\d+)([A-Za-z]+)/,
                              "$1 $2"
                            ) ||
                              payment?.telegramId?.planType?.replace(
                                /(\d+)([A-Za-z]+)/,
                                "$1 $2"
                              ) ||
                              "-"}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-left whitespace-nowrap">
                            ${payment?.price || "0.00"}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-left whitespace-nowrap">
                            {payment?.orderId || "N/A"}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-left whitespace-nowrap">
                            <Dialog>
                              <DialogTrigger asChild>
                                <div
                                  className="cursor-pointer"
                                  onClick={() => setSelectedPayment(payment)}
                                >
                                  <span className="text-base font-semibold">
                                    {payment?.botId
                                      ? renderStatusBadge("View More")
                                      : "-"}
                                  </span>
                                </div>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                  <DialogTitle>
                                    Meta Account Numbers
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  {payment?.metaAccountNo?.length > 0 ? (
                                    <div className="space-y-2">
                                      {payment.metaAccountNo.map(
                                        (account, idx) => (
                                          <div
                                            key={idx}
                                            className="flex items-center p-3 bg-gray-50 rounded-md"
                                          >
                                            <span className="font-medium">
                                              Account {idx + 1}:
                                            </span>
                                            <span className="font-mono px-3">
                                              {account}
                                            </span>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 text-center py-4">
                                      No meta account numbers found
                                    </p>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                          <TableCell>{payment?.paymentMethod || "-"}</TableCell>
                          {/* <TableCell className="px-6 py-4 text-left whitespace-nowrap">
                            {renderStatusBadge(payment?.status)}
                          </TableCell> */}
                          <TableCell className="px-6 py-4 text-left whitespace-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadPaymentInvoice(payment)}
                              disabled={loadingInvoices[payment._id]}
                              className="border-none"
                            >
                              {loadingInvoices[payment._id] ? (
                                <>
                                  <DownloadIcon
                                    className={`h-4 w-4 animate-pulse ${
                                      loadingInvoices[payment._id]
                                        ? "cursor-not-allowed"
                                        : ""
                                    }`}
                                  />
                                </>
                              ) : (
                                <>
                                  <DownloadIcon className="h-4 w-4" />
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
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
          itemsPerPageOptions={[8, 10, 20, 30, 40, 50]}
        />
      </>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="payments">All Payments</TabsTrigger>
          <TabsTrigger value="courses">Course Sales</TabsTrigger>
          <TabsTrigger value="algobots">AlgoBot Sales</TabsTrigger>
          <TabsTrigger value="telegram">Telegram</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg font-medium">No data found</p>
                  <p className="text-sm mt-1">
                    No payment records available at the moment.
                  </p>
                </div>
              ) : (
                <>
                  {renderSearchInput("Search payments...")}
                  {filteredPayments.length > 0
                    ? renderTable()
                    : renderNoData(!!searchTerm)}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Sales</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg font-medium">No data found</p>
                  <p className="text-sm mt-1">
                    No payment records available at the moment.
                  </p>
                </div>
              ) : (
                <>
                  {renderSearchInput("Search courses...")}
                  {filteredPayments.length > 0
                    ? renderTable()
                    : renderNoData(!!searchTerm)}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="algobots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AlgoBot Sales</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg font-medium">No data found</p>
                  <p className="text-sm mt-1">
                    No payment records available at the moment.
                  </p>
                </div>
              ) : (
                <>
                  {renderSearchInput("Search algobots...")}
                  {filteredPayments.length > 0
                    ? renderTable()
                    : renderNoData(!!searchTerm)}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="telegram" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Telegram Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg font-medium">No data found</p>
                  <p className="text-sm mt-1">
                    No payment records available at the moment.
                  </p>
                </div>
              ) : (
                <>
                  {renderSearchInput("Search telegram subscriptions...")}
                  {filteredPayments.length > 0
                    ? renderTable()
                    : renderNoData(!!searchTerm)}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
