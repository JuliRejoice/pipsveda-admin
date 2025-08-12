'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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


export default function UserSignupChart() {
  const [data, setData] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      const response = await getUserSignupReport();
      console.log(response);
      setData(response.payload || []); 
    };
    fetchData();
  }, []);

  console.log(data)
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip cursor={false} />
        <Bar dataKey="userCount" fill="#8884d8" radius={[5, 5, 0, 0]} barSize={50}/>
      </BarChart>
    </ResponsiveContainer>
  );
}