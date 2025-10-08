'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Loader2 } from 'lucide-react';

interface RevenueBreakdownProps {
  period: 'weekly' | 'monthly' | 'yearly';
  data: {
    courses?: {
      courseId: string;
      totalPrice: number;
      records: Array<any>;
    };
    algoBots?: {
      botId: string;
      totalPrice: number;
      records: Array<any>;
    };
  };
  isLoading?: boolean;
}

const COLORS = {
  courses: '#8884d8',
  algoBots: '#82ca9d',
  telegram: '#ffc658'
};

export default function RevenueBreakdown({ period, data, isLoading = false }:RevenueBreakdownProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown - {period.charAt(0).toUpperCase() + period.slice(1)}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  // 🧠 Transform data
  const transformedData = [
    {
      name: 'Courses',
      value: data?.courses?.totalPrice || 0,
      color: COLORS.courses,
    },
    {
      name: 'Algo Bots',
      value: data?.algoBots?.totalPrice || 0,
      color: COLORS.algoBots,
    }
  ];

  return (
    <Card className='shadow-lg rounded-xl border-0'>
      <CardHeader>
        <CardTitle>Revenue Breakdown - {period.charAt(0).toUpperCase() + period.slice(1)}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            {transformedData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-4 bg-background rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium font-lexend">{item.name}</span>
                </div>
                <span className="text-xl font-bold font-lexend">${item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={transformedData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {transformedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value?.toLocaleString() || 0}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
