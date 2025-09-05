'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, UserPlus, ShoppingCart, MessageSquare, CheckCircle } from 'lucide-react';

const notifications = [
  {
    id: 1,
    type: 'signup',
    title: 'New User Registration',
    message: 'John Doe has signed up for an account',
    time: '2 minutes ago',
    read: false,
    icon: UserPlus
  },
  {
    id: 2,
    type: 'purchase',
    title: 'Course Purchase',
    message: 'Jane Smith purchased "Advanced Trading Strategies" for $299',
    time: '5 minutes ago',
    read: false,
    icon: ShoppingCart
  },
  {
    id: 3,
    type: 'purchase',
    title: 'AlgoBot Purchase',
    message: 'Mike Johnson purchased "Scalping Master Bot" for $499',
    time: '1 hour ago',
    read: true,
    icon: ShoppingCart
  },
  {
    id: 4,
    type: 'signup',
    title: 'New User Registration',
    message: 'Sarah Wilson has signed up for an account',
    time: '2 hours ago',
    read: true,
    icon: UserPlus
  },
  {
    id: 5,
    type: 'purchase',
    title: 'Telegram Subscription',
    message: 'Alex Brown subscribed to Premium Telegram Channel for $29',
    time: '3 hours ago',
    read: true,
    icon: MessageSquare
  }
];

export default function Notifications() {
  const [notificationList, setNotificationList] = useState(notifications);
  
  const markAsRead = (id: number) => {
    setNotificationList(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };
  
  const markAllAsRead = () => {
    setNotificationList(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };
  
  const unreadCount = notificationList.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="default" className="bg-red-500">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <Button onClick={markAllAsRead} disabled={unreadCount === 0}>
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark All Read
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Recent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notificationList.map((notification) => {
              const Icon = notification.icon;
              return (
                <div 
                  key={notification.id} 
                  className={`flex items-start space-x-4 p-4 rounded-lg border transition-colors ${
                    notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className={`p-2 rounded-full ${
                    notification.type === 'signup' ? 'bg-green-100' : 
                    notification.type === 'purchase' ? 'bg-blue-100' : 
                    'bg-purple-100'
                  }`}>
                    <Icon className={`h-4 w-4 ${
                      notification.type === 'signup' ? 'text-green-600' : 
                      notification.type === 'purchase' ? 'text-blue-600' : 
                      'text-purple-600'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{notification.title}</h3>
                      <span className="text-base font-semibold text-gray-500 font-lexend">{notification.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  </div>
                  
                  {!notification.read && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                    >
                      Mark Read
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}