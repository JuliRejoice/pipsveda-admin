import axios from 'axios';

const BaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

// Helper function to get token safely
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const getTotalRevenueData = async () => {
    try {
        const response = await axios.get(`${BaseUrl}/payment/getTotalRevenue`, {
            headers: {
                'x-auth-token': getAuthToken(),
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching revenue data:', error);
        return null;
    }
};

export const getUserSignupReport = async () => {
    try {
        const response = await axios.get(`https://259s7s89-6002.inc1.devtunnels.ms/api/v1/user/userSignupReport`, {
            headers: {
                'x-auth-token': getAuthToken(),
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
}

export const getDashboardReportData = async ()=>{
    try {
        const response = await axios.get(`https://259s7s89-6002.inc1.devtunnels.ms/api/v1/user/dashboardReport`, {
            headers: {
                'x-auth-token': getAuthToken(),
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching dashboard report data:', error);
        return null;
    }
}

export const getRevenueBreakdownData = async (startDate:string,endDate:string)=>{
    try {
        const response = await axios.get(`https://259s7s89-6002.inc1.devtunnels.ms/api/v1/user/revenueBreakdown?startDate=${startDate}&endDate=${endDate}`, {
            headers: {
                'x-auth-token': getAuthToken(),
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching revenue breakdown data:', error);
        return null;
    }
}