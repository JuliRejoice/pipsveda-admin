import axios from 'axios';

const BaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

// Helper function to get token safely
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const getPaymentHistory = async () => {
    try {
        const token = getAuthToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        
        if (token) {
            headers['x-auth-token'] = token;
        }

        const res = await axios.get(`${BaseUrl}/payment/getAllPaymentHistory`, { headers });
        console.log(res.data);
        return res.data;
    } catch (error) {
        console.error("Error on Contact Fetch", error);
        throw error;
    }
};