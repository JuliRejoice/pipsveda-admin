'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UserPlus, DollarSign, TrendingUp, Users } from 'lucide-react';

const referralData = [
  {
    id: 1,
    referrer: 'John Doe',
    email: 'john@example.com',
    referrals: 5,
    earnings: '$125',
    conversion: 60,
    joinDate: '2024-01-15'
  },
  {
    id: 2,
    referrer: 'Jane Smith',
    email: 'jane@example.com',
    referrals: 12,
    earnings: '$300',
    conversion: 75,
    joinDate: '2024-01-10'
  },
  {
    id: 3,
    referrer: 'Mike Johnson',
    email: 'mike@example.com',
    referrals: 8,
    earnings: '$200',
    conversion: 50,
    joinDate: '2024-01-20'
  }
];

const stats = [
  {
    title: 'Total Referrals',
    value: '156',
    change: '+12%',
    icon: Users
  },
  {
    title: 'Referral Revenue',
    value: '$3,250',
    change: '+25%',
    icon: DollarSign
  },
  {
    title: 'Conversion Rate',
    value: '68%',
    change: '+5%',
    icon: TrendingUp
  },
  {
    title: 'Active Referrers',
    value: '45',
    change: '+8%',
    icon: UserPlus
  }
];

export default function Referrals() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Referrals Management</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Referrers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {referralData.map((referrer) => (
              <div key={referrer.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {referrer.referrer.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium">{referrer.referrer}</h3>
                    <p className="text-base font-semibold text-gray-500">{referrer.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-8">
                  <div className="text-center">
                    <p className="text-xl font-bold">{referrer.referrals}</p>
                    <p className="text-xs text-gray-500">Referrals</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-green-600">{referrer.earnings}</p>
                    <p className="text-xs text-gray-500">Earnings</p>
                  </div>
                  <div className="text-center min-w-[100px]">
                    <div className="flex items-center space-x-2">
                      <Progress 
                        value={Number(referrer.conversion) || 0}
                        className="w-16" 
                      />
                      <span className="text-sm font-medium">{referrer.conversion}%</span>
                    </div>
                    <p className="text-xs text-gray-500">Conversion</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline">{referrer.joinDate}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}