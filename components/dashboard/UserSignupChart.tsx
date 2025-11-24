'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getUserSignupReport } from '../api/dashboard';

// const data = [
//   { name: 'Mon', signups: 24 },
//   { name: 'Tue', signups: 38 },
//   { name: 'Wed', signups: 29 },
//   { name: 'Thu', signups: 45 },
//   { name: 'Fri', signups: 52 },
//   { name: 'Sat', signups: 67 },
//   { name: 'Sun', signups: 41 },
// ];

export const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#fff', padding: '10px', border: '1px solid #ccc' }}>
        <p>{label}</p>
        <p>Users: {payload[0].value}</p>
      </div>
    );
  }

  return null;
};


export default function UserSignupChart() {
  const [data, setData] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      const response = await getUserSignupReport();
      setData(response.payload || []); 
    };
    fetchData();
  }, []);

  return (
    <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="day" />
    <YAxis />
    <Tooltip cursor={false} content={<CustomTooltip />} />
    <Legend 
      formatter={(value: string) => {
        const labelMap: Record<string, string> = {
          userCount: 'Weekly Signup Activity (Last 7 Days)'
        };
        return labelMap[value] || value;
      }}
    />
    <Bar 
      dataKey="userCount" 
      name="Weekly Signup Activity (Last 7 Days)"
      fill="#8884d8" 
      radius={[5, 5, 0, 0]} 
      barSize={50}
    />
  </BarChart>
</ResponsiveContainer>
  );
}