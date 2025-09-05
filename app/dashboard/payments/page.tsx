"use client";

import { useState, useEffect } from "react";
import { getPaymentHistory } from "@/components/api/payment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, AlertCircle, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePagination } from "@/components/ui/DataTablePagination";

interface Payment {
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
  price: number;
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
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

  const filterPaymentsByTab = (payments: Payment[]) => {
    return payments.filter((payment) => {
      switch (activeTab) {
        case "payments":
          return filterType === "all" || payment.itemType === filterType;
        case "courses":
          const hasCourseData = !!payment.courseId?.CourseName || payment.itemType === "course";
          return payment.itemType === "course" || hasCourseData;
        case "algobots":
          return payment.itemType === "algobot" || !!payment.botId?.strategyId?.title;
        case "telegram":
          return payment.itemType === "telegram" || !!payment.telegramId?.telegramId?.channelName;
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
      return payment.userName?.toLowerCase().includes(searchTerm) || payment.itemName?.toLowerCase().includes(searchTerm) || payment.paymentId?.toLowerCase().includes(searchTerm) || payment.orderId?.toLowerCase().includes(searchTerm) || payment.userEmail?.toLowerCase().includes(searchTerm) || payment.courseId?.CourseName?.toLowerCase().includes(searchTerm) || payment.botId?.strategyId?.title?.toLowerCase().includes(searchTerm) || payment.telegramId?.telegramId?.channelName?.toLowerCase().includes(searchTerm) || payment.planType?.toLowerCase().includes(searchTerm);
    });
  };

  const filteredByTab = filterPaymentsByTab(payments);
  const filteredPayments = searchTerm ? searchPayments(filteredByTab, searchTerm) : filteredByTab;

  const renderSearchInput = (placeholder: string = "Search...") => (
    <div className="mb-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input placeholder={placeholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 font-normal" />
      </div>
    </div>
  );

  const renderNoData = (isSearch: boolean) => (
    <div className="text-center py-12 text-gray-500">
      <p className="text-2xl text-gray-500 font-medium">No data found</p>
      <p className="text-lg text-gray-900 font-lexend">{isSearch ? "Try a different search term" : "There are no records to display"}</p>
    </div>
  );

  // Function to render the appropriate table based on the active tab
  const renderTable = () => {
    // Use filteredPayments directly as it already handles the active tab filtering
    const data = filteredPayments;

    const renderStatusBadge = (status: string) => {
      switch (status.toLowerCase()) {
        case "completed":
          return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
        case "pending":
          return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
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
                      <TableHead className="text-base">Transaction ID</TableHead>
                      <TableHead className="text-base">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8">
                          <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                              <p className="text-muted-foreground">Loading payments...</p>
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
                              <h3 className="text-lg font-medium">Error loading payments</h3>
                              <p className="text-sm text-muted-foreground font-lexend">Please try again later</p>
                              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
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
                              <h3 className="text-lg font-medium">No payments found</h3>
                              <p className="text-sm text-muted-foreground font-lexend">{searchTerm ? "No matching payments found" : "No payment records available"}</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((payment, index) => (
                        <TableRow key={payment._id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{payment?.uid?.name}</TableCell>
                          <TableCell>{payment.createdAt ? formatDate(payment.createdAt) : "N/A"}</TableCell>
                          <TableCell>{payment.courseId?.CourseName || "-"}</TableCell>
                          <TableCell className="capitalize">{payment.courseId?.courseType || "-"}</TableCell>
                          <TableCell>${payment.price || "0.00"}</TableCell>
                          <TableCell>{payment.orderId || "N/A"}</TableCell>
                          <TableCell>{renderStatusBadge(payment.status)}</TableCell>
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
                      <TableHead className="text-base">Transaction ID</TableHead>
                      <TableHead className="text-base">Status</TableHead>
                      <TableHead className="text-base">Meta Acc No.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8">
                          <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                              <p className="text-muted-foreground">Loading algobots...</p>
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
                              <h3 className="text-lg font-medium">Error loading algobots</h3>
                              <p className="text-sm text-muted-foreground font-lexend">Please try again later</p>
                              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
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
                              <h3 className="text-lg font-medium">No Algobot found</h3>
                              <p className="text-sm text-muted-foreground font-lexend">{searchTerm ? "No matching algobots found" : "No algobot records available"}</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((payment, index) => (
                        <TableRow key={payment._id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{payment?.uid?.name}</TableCell>
                          <TableCell>{payment.createdAt ? formatDate(payment.createdAt) : "N/A"}</TableCell>
                          <TableCell>{payment?.botId?.strategyId?.title || "-"}</TableCell>
                          <TableCell className="capitalize">{payment?.botId?.planType || "N/A"}</TableCell>
                          <TableCell>${payment?.price || "0.00"}</TableCell>
                          <TableCell className="font-mono">{payment.orderId || "N/A"}</TableCell>
                          <TableCell>{renderStatusBadge(payment.status)}</TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <div className="cursor-pointer" onClick={() => setSelectedPayment(payment)}>
                                  {payment?.metaAccountNo?.length > 0 ? (
                                    <Badge variant="outline" className="hover:bg-gray-100">
                                      View {payment.metaAccountNo.length} Account{payment.metaAccountNo.length !== 1 ? "s" : ""}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-gray-400">
                                      No Accounts
                                    </Badge>
                                  )}
                                </div>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                  <DialogTitle>Meta Account Numbers</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  {payment?.metaAccountNo?.length > 0 ? (
                                    <div className="space-y-2">
                                      {payment.metaAccountNo.map((account, idx) => (
                                        <div key={idx} className="flex items-center p-3 bg-gray-50 rounded-md">
                                          <span className="font-medium">Account {idx + 1}:</span>
                                          <span className="font-mono px-3">{account}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 text-center py-4">No meta account numbers found</p>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div >
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
                      <TableHead className="text-base">Telegram Account Number</TableHead>
                      <TableHead className="text-base">Telegram Channel</TableHead>
                      <TableHead className="text-base">Plan Type</TableHead>
                      <TableHead className="text-base">Amount</TableHead>
                      <TableHead className="text-base">Transaction ID</TableHead>
                      <TableHead className="text-base">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8">
                          <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                              <p className="text-muted-foreground">Loading Telegram Subscriptions...</p>
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
                              <h3 className="text-lg font-medium">Error loading Telegram Subscriptions</h3>
                              <p className="text-sm text-muted-foreground font-lexend">Please try again later</p>
                              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
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
                              <h3 className="text-lg font-medium">No telegram subscriptions found</h3>
                              <p className="text-sm text-muted-foreground font-lexend">{searchTerm ? "No matching telegram subscriptions found" : "No telegram subscriptions records available"}</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((payment, index) => (
                        <TableRow key={payment._id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{payment?.uid?.name || "-"}</TableCell>
                          <TableCell>{payment.createdAt ? formatDate(payment.createdAt) : "N/A"}</TableCell>
                          <TableCell>{payment?.telegramAccountNo || "-"}</TableCell>
                          <TableCell>{payment?.telegramId?.telegramId?.channelName || "N/A"}</TableCell>
                          <TableCell className="capitalize">{payment?.planType || "N/A"}</TableCell>
                          <TableCell>${payment?.price || "0.00"}</TableCell>
                          <TableCell>{payment?.orderId || "N/A"}</TableCell>
                          <TableCell>{renderStatusBadge(payment?.status)}</TableCell>
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
                    <TableHead className="text-base px-6 text-left w-[80px]">Sr. No</TableHead>
                    <TableHead className="text-base px-6 text-left w-[200px]">User Name</TableHead>
                    <TableHead className="text-base px-6 text-left w-[200px]">Purchase Date</TableHead>
                    <TableHead className="text-base px-6 text-left w-[250px]">Course Name</TableHead>
                    <TableHead className="text-base px-6 text-left w-[250px]">Strategy Name</TableHead>
                    <TableHead className="text-base px-6 text-left w-[200px]">Telegram Channel</TableHead>
                    <TableHead className="text-base px-6 text-left w-[150px]">Course Type</TableHead>
                    <TableHead className="text-base px-6 text-left w-[120px]">Plan</TableHead>
                    <TableHead className="text-base px-6 text-left w-[100px]">Amount</TableHead>
                    <TableHead className="text-base px-6 text-left w-[300px]">Transaction ID</TableHead>
                    <TableHead className="text-base px-6 text-left w-[180px]">Meta Account No</TableHead>
                    <TableHead className="text-base px-6 text-left w-[100px]">Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="py-8 px-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading...</p>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={11} className="py-8 px-6 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4 h-64">
                          <AlertCircle className="h-12 w-12 text-destructive" />
                          <h3 className="text-lg font-medium">Error loading data</h3>
                          <p className="text-sm text-muted-foreground font-lexend">Please try again later</p>
                          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
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
                        <p className="text-sm text-muted-foreground font-lexend">{searchTerm ? "No matching data found" : "No data records available"}</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment, index) => (
                      <TableRow key={payment._id}>
                        <TableCell className="px-6 py-4 text-left whitespace-nowrap">{index + 1}</TableCell>
                        <TableCell className="px-6 py-4 text-left whitespace-nowrap">{payment?.uid?.name || "-"}</TableCell>
                        <TableCell className="px-6 py-4 text-left whitespace-nowrap">{payment.createdAt ? formatDate(payment.createdAt) : "N/A"}</TableCell>
                        <TableCell className="px-6 py-4 text-left whitespace-nowrap capitalize">{payment?.courseId?.CourseName || "-"}</TableCell>
                        <TableCell className="px-6 py-4 text-left whitespace-nowrap">{payment?.botId?.strategyId?.title || "-"}</TableCell>
                        <TableCell className="px-6 py-4 text-left whitespace-nowrap">{payment?.telegramId?.telegramId?.channelName || "-"}</TableCell>
                        <TableCell className="px-6 py-4 text-left whitespace-nowrap">{payment?.courseId?.courseType || "-"}</TableCell>
                        <TableCell className="px-6 py-4 text-left whitespace-nowrap">{payment?.botId?.planType || payment?.telegramId?.planType || "-"}</TableCell>
                        <TableCell className="px-6 py-4 text-left whitespace-nowrap">${payment?.price || "0.00"}</TableCell>
                        <TableCell className="px-6 py-4 text-left whitespace-nowrap">{payment?.orderId || "N/A"}</TableCell>
                        <TableCell className="px-6 py-4 text-left whitespace-nowrap">
                          <Dialog>
                            <DialogTrigger asChild>
                              <div className="cursor-pointer" onClick={() => setSelectedPayment(payment)}>
                                <span className="text-base font-semibold">{payment?.botId ? renderStatusBadge("View More") : "-"}</span>
                              </div>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Meta Account Numbers</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                {payment?.metaAccountNo?.length > 0 ? (
                                  <div className="space-y-2">
                                    {payment.metaAccountNo.map((account, idx) => (
                                      <div key={idx} className="flex items-center p-3 bg-gray-50 rounded-md">
                                        <span className="font-medium">Account {idx + 1}:</span>
                                        <span className="font-mono px-3">{account}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-500 text-center py-4">No meta account numbers found</p>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-left whitespace-nowrap">{renderStatusBadge(payment?.status)}</TableCell>
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
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
          <p className="text-muted-foreground">Track all your transactions in one place.</p>
        </div>
      </div>

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
                  <p className="text-sm mt-1">No payment records available at the moment.</p>
                </div>
              ) : (
                <>
                  {renderSearchInput("Search payments...")}
                  {filteredPayments.length > 0 ? renderTable() : renderNoData(!!searchTerm)}
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
                  <p className="text-sm mt-1">No payment records available at the moment.</p>
                </div>
              ) : (
                <>
                  {renderSearchInput("Search courses...")}
                  {filteredPayments.length > 0 ? renderTable() : renderNoData(!!searchTerm)}
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
                  <p className="text-sm mt-1">No payment records available at the moment.</p>
                </div>
              ) : (
                <>
                  {renderSearchInput("Search algobots...")}
                  {filteredPayments.length > 0 ? renderTable() : renderNoData(!!searchTerm)}
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
                  <p className="text-sm mt-1">No payment records available at the moment.</p>
                </div>
              ) : (
                <>
                  {renderSearchInput("Search telegram subscriptions...")}
                  {filteredPayments.length > 0 ? renderTable() : renderNoData(!!searchTerm)}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
