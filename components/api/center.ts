import axios from 'axios';
const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const getAllCenter = async (params?: PaginationParams) => {
    try {
      const searchParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
      }
      
      const queryString = searchParams.toString();
      const url = `${API_BASE_URL}/center/getAllCenter${queryString ? `?${queryString}` : ''}`;
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching centers:', error);
      throw error;
    }
  };
  
  export const createCenter = async (centerData: any) => {
    const token = getAuthToken();
  
    try {
      const response = await axios.post(`${API_BASE_URL}/center/createCenter`, centerData, {
        headers: {
          'x-auth-token': token,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  };
  
  export const updateCenter = async (id: string, centerData: any) => {
    const token = getAuthToken();
  
    try {
      const response = await axios.put(`${API_BASE_URL}/center/editCenter?id=${id}`, centerData, {
        headers: {
          'x-auth-token': token,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };
  
  export const deleteCenter = async (id: string) => {
    const token = getAuthToken();
  
    try {
      const response = await axios.delete(`${API_BASE_URL}/center/deleteCenter?id=${id}`, {
        headers: {
          'x-auth-token': token,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };