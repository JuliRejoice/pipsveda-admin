"use client";

import { useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RevenueChart from "@/components/dashboard/RevenueChart";
import UserSignupChart from "@/components/dashboard/UserSignupChart";
import RevenueBreakdown from "@/components/dashboard/RevenueBreakdown";
import { DollarSign, Users, BookOpen, Bot, TrendingUp, TrendingDown } from "lucide-react";
import { getDashboardReportData, getRevenueBreakdownData, getTotalRevenueData } from "@/components/api/dashboard";

const getDateRange = (period: string) => {
  const now = new Date();
  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  switch (period) {
    case "weekly": {
      const day = now.getDay(); // 0 (Sun) to 6 (Sat)
      const mondayOffset = day === 0 ? -6 : 1 - day; // if Sunday, go back 6 days
      const startDate = new Date(now);
      startDate.setDate(now.getDate() + mondayOffset);
      return {
        startDate: formatDate(startDate),
        endDate: formatDate(now),
      };
    }
    case "monthly": {
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate: formatDate(startDate),
        endDate: formatDate(now),
      };
    }
    case "yearly": {
      const startDate = new Date(now.getFullYear(), 0, 1); // Jan 1st
      return {
        startDate: formatDate(startDate),
        endDate: formatDate(now),
      };
    }
    default:
      return {
        startDate: formatDate(now),
        endDate: formatDate(now),
      };
  }
};

export default function Dashboard() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [totalRevenueData, setTotalRevenueData] = useState<any>([]);
  const [dashboardReportData, setDashboardReportData] = useState<any>([]);
  const [revenueBreakdownData, setRevenueBreakdownData] = useState<any>({});
  const [activeTab, setActiveTab] = useState("weekly");
  const [isLoading, setIsLoading] = useState(true);

  const fetchRevenueBreakdown = async (period: string) => {
    setIsLoading(true);
    const { startDate, endDate } = getDateRange(period);
    const data = await getRevenueBreakdownData(startDate, endDate);
    setRevenueBreakdownData((prev: any) => ({
      ...prev,
      [period]: data?.payload || [],
    }));
    setIsLoading(false);
  };

  useLayoutEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/");
    } else {
      setChecked(true);
    }

    getTotalRevenueData().then((data) => {
      setTotalRevenueData(data?.payload);
    });

    getDashboardReportData().then((data) => {
      setDashboardReportData(data?.payload);
    });

    // Initial fetch for the default tab
    fetchRevenueBreakdown("weekly");
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (!revenueBreakdownData[value]) {
      fetchRevenueBreakdown(value);
    }
  };

  const stats = [
    { title: "Total Revenue", value: totalRevenueData?.totalRevenue, change: `${totalRevenueData?.revenueChange?.percent}`, icon: DollarSign },
    { title: "Active Users", value: dashboardReportData?.activeUsers?.count, change: `${dashboardReportData?.activeUsers?.percent}`, icon: Users },
    { title: "Course Sales", value: dashboardReportData?.courseSales?.count, change: `${dashboardReportData?.courseSales?.percent}`, icon: BookOpen },
    { title: "AlgoBot Sales", value: dashboardReportData?.algoBotSales?.count, change: `${dashboardReportData?.algoBotSales?.percent}`, icon: Bot },
  ];

  if (!checked) {
    // Skip rendering until token is verified
    return null;
  }

  return (
    <div className="space-y-6">
     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  {stats.map((stat, index) => {
    const Icon = stat.icon;
    const colors = [
      { bg: 'bg-purple-100', text: 'text-black' },      // Purple
      { bg: 'bg-pink-100', text: 'text-black' },      // Blue
      { bg: 'bg-orange-100', text: 'text-black' },      // Orange
      { bg: 'bg-green-100', text: 'text-black' },      // Green
    ][index % 4];
    
    return (
      <Card key={stat.title} className={`${colors.bg} ${colors.text} border-0`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {stat.title}
          </CardTitle>
          <div className={`h-8 w-8 rounded-full ${colors.bg} bg-opacity-20 flex items-center justify-center`}>
            <Icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stat.value}</div>
          <p className="text-xs text-opacity-80">
            {stat.change}% from last month
          </p>
        </CardContent>
      </Card>
    );
  })}
</div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg rounded-xl border-0">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={totalRevenueData?.monthlyRevenue} />
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-xl border-0">
          <CardHeader>
            <CardTitle>New User Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <UserSignupChart />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="weekly" value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger className="text-base" value="weekly">Weekly</TabsTrigger>
          <TabsTrigger className="text-base" value="monthly">Monthly</TabsTrigger>
          <TabsTrigger className="text-base" value="yearly">Yearly</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          <RevenueBreakdown period="weekly" data={revenueBreakdownData.weekly || []} isLoading={isLoading && activeTab === "weekly"} />
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <RevenueBreakdown period="monthly" data={revenueBreakdownData.monthly || []} isLoading={isLoading && activeTab === "monthly"} />
        </TabsContent>

        <TabsContent value="yearly" className="space-y-4">
          <RevenueBreakdown period="yearly" data={revenueBreakdownData.yearly || []} isLoading={isLoading && activeTab === "yearly"} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
