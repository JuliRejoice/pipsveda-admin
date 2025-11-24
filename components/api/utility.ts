import axios from 'axios';

const BaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

// Helper function to get token safely
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const getUtility = async () => {
    try {
        const token = getAuthToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        
        if (token) {
            headers['x-auth-token'] = token;
        }

        const res = await axios.get(`${BaseUrl}/utilitySetting/`, { headers });
        return res.data;
    } catch (error) {
        console.error("Error on Contact Fetch", error);
        throw error;
    }
};

export const updateUtility = async (id: string, utilityData: any) => {
    const token = getAuthToken();
  
    try {
      const response = await axios.put(`${BaseUrl}/utilitySetting/edit/${id}`, utilityData, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating algo bot:', error);
      throw error;
    }
  };