'use client';

import { useState, useEffect } from 'react';
import { getPaymentHistory } from '@/components/api/payment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Search, FileSearch, ArrowUpDown, MoreHorizontal, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  itemType: 'course' | 'algobot' | 'telegram' | 'other';
  itemId: string;
  itemName: string;
  createdAt: string;
  updatedAt: string;
  metaAccountNo: string[];
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
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const coursesSales = [
  { name: 'Advanced Trading Strategies', sales: 45, revenue: '$13,455' },
  { name: 'Crypto Trading Basics', sales: 67, revenue: '$13,333' },
  { name: 'Options Trading Masterclass', sales: 23, revenue: '$6,900' }
];

const algobotSales = [
  { name: 'Scalping Master Bot', sales: 45, revenue: '$22,455' },
  { name: 'Trend Following Bot', sales: 67, revenue: '$26,733' },
  { name: 'Arbitrage Bot', sales: 23, revenue: '$16,077' }
];

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [activeTab, setActiveTab] = useState('payments');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setIsLoading(true);
        const response = await getPaymentHistory();
        
        if (response.success) {
          const paymentsData = response.payload.data || [];
          setPayments(paymentsData);
        } else {
          console.error('API Error:', response.message);
          setError('Failed to load payment history');
        }
      } catch (err) {
        console.error('Error fetching payments:', err);
        setError('An error occurred while loading payments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const filterPaymentsByTab = (payments: Payment[]) => {
    return payments.filter(payment => {
      switch (activeTab) {
        case 'payments':
          return filterType === 'all' || payment.itemType === filterType;
        case 'courses':
          const hasCourseData = !!payment.courseId?.CourseName || payment.itemType === 'course';
          return payment.itemType === 'course' || hasCourseData;
        case 'algobots':
          return payment.itemType === 'algobot' || !!payment.botId?.strategyId?.title;
        case 'telegram':
          return payment.itemType === 'telegram' || !!payment.telegramId?.telegramId?.channelName;
        default:
          return true;
      }
    });
  };

  const searchPayments = (payments: Payment[], term: string) => {
    if (!term.trim()) return payments;
    
    const searchTerm = term.toLowerCase();
    return payments.filter(payment => {
      return (
        (payment.userName?.toLowerCase().includes(searchTerm) ||
        payment.itemName?.toLowerCase().includes(searchTerm) ||
        payment.paymentId?.toLowerCase().includes(searchTerm) ||
        payment.orderId?.toLowerCase().includes(searchTerm) ||
        payment.userEmail?.toLowerCase().includes(searchTerm) ||
        payment.courseId?.CourseName?.toLowerCase().includes(searchTerm) ||
        payment.botId?.strategyId?.title?.toLowerCase().includes(searchTerm) ||
        payment.telegramId?.telegramId?.channelName?.toLowerCase().includes(searchTerm) ||
        payment.planType?.toLowerCase().includes(searchTerm))
      );
    });
  };

  const filteredByTab = filterPaymentsByTab(payments);
  const filteredPayments = searchTerm ? searchPayments(filteredByTab, searchTerm) : filteredByTab;

  const renderSearchInput = (placeholder: string = 'Search...') => (
    <div className="mb-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );

  const renderNoData = (isSearch: boolean) => (
    <div className="text-center py-12 text-gray-500">
      <p className="text-lg font-medium">No data found</p>
      <p className="text-sm mt-1">
        {isSearch ? 'Try a different search term' : 'There are no records to display'}
      </p>
    </div>
  );

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'refunded':
        return <Badge className="bg-blue-100 text-blue-800">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Function to render the appropriate table based on the active tab
  const renderTable = () => {
    // Use filteredPayments directly as it already handles the active tab filtering
    const data = filteredPayments;

    const renderStatusBadge = (status: string) => {
      switch (status.toLowerCase()) {
        case 'completed':
          return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
        case 'pending':
          return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
        case 'failed':
          return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
        case 'refunded':
          return <Badge className="bg-blue-100 text-blue-800">Refunded</Badge>;
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    };

    if (activeTab === 'courses') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr. No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-red-500 text-sm">Error loading courses. Please try again.</p>
                      <Button variant="outline" onClick={() => window.location.reload()} className="mt-2">Retry</Button>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-500 text-sm">
                        {searchTerm ? 'No matching courses found' : 'No course records available'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment, index) => (
                  <tr key={payment._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.courseId?.CourseName || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {payment.courseId?.courseType || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${payment.price || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.orderId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatusBadge(payment.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === 'algobots') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr. No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AlgoBot Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meta Acc No.</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-red-500 text-sm">Error loading algobots. Please try again.</p>
                      <Button variant="outline" onClick={() => window.location.reload()} className="mt-2">Retry</Button>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-500 text-sm">
                        {searchTerm ? 'No matching algobots found' : 'No algobot records available'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment, index) => (
                  <tr key={payment._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment?.botId?.strategyId?.title || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment?.botId?.planType || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${payment?.price || '0.00'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.orderId || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(payment.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Dialog>
                        <DialogTrigger asChild>
                          <div 
                            className="cursor-pointer"
                            onClick={() => setSelectedPayment(payment)}
                          >
                            {payment?.metaAccountNo?.length > 0 ? (
                              <Badge variant="outline" className="hover:bg-gray-100">
                                View {payment.metaAccountNo.length} Account{payment.metaAccountNo.length !== 1 ? 's' : ''}
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === 'telegram') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr. No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telegram Channel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-red-500 text-sm">Error loading data. Please try again.</p>
                      <Button variant="outline" onClick={() => window.location.reload()} className="mt-2">Retry</Button>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    {renderNoData(!!searchTerm)}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment, index) => (
                  <tr key={payment._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment?.telegramId?.telegramId?.channelName || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment?.planType || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${payment?.price || '0.00'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment?.orderId || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(payment?.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      );
    }

    // Default view (All Payments)
    return (
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr. No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strategy Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telegram Channel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meta Account No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-500 text-sm">Error loading payments. Please try again.</p>
                    <Button variant="outline" onClick={() => window.location.reload()} className="mt-2">Retry</Button>
                  </div>
                </td>
              </tr>
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500 text-sm">
                      {searchTerm ? 'No matching payments found' : 'No payment records available'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
            filteredPayments.map((payment, index) => (
              <tr key={payment._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payment.createdAt ? formatDate(payment.createdAt) : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payment?.courseId?.CourseName ? payment.courseId.CourseName : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payment?.botId?.strategyId?.title ? payment?.botId?.strategyId?.title : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payment?.telegramId?.telegramId?.channelName ? payment?.telegramId?.telegramId?.channelName : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payment?.courseId?.courseType ? payment?.courseId?.courseType : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payment?.botId?.planType ? payment?.botId?.planType : payment?.telegramId?.planType ? payment?.telegramId?.planType : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${payment?.price || '0.00'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payment?.orderId || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Dialog>
                    <DialogTrigger asChild>
                      <div 
                        className="cursor-pointer"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        {payment?.botId ? renderStatusBadge("View More") : "-"}
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
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderStatusBadge(payment.status)}
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
        onValueChange={setActiveTab}
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
                <p className="text-sm mt-1">
                No payment records available at the moment.
                </p>
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
                <p className="text-sm mt-1">
                No payment records available at the moment.
                </p>
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
                <p className="text-sm mt-1">
                No payment records available at the moment.
                </p>
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