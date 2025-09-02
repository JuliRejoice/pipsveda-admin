'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


export default function RevenueChart({ data }: { data: any }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend
          formatter={(value: string) => {
            const labelMap: Record<string, string> = {
              courseRevenue: 'Course Revenue',
              botRevenue: 'Bot Revenue',
            };
            return labelMap[value] || value;
          }}
        />
        <Line type="monotone" dataKey="courseRevenue" stroke="#8884d8" strokeWidth={2} />
        <Line type="monotone" dataKey="botRevenue" stroke="#82ca9d" strokeWidth={2} />
        {/* <Line type="monotone" dataKey="telegram" stroke="#ffc658" strokeWidth={2} /> */}
      </LineChart>
    </ResponsiveContainer>
  );
}