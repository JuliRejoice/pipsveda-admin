import axios from 'axios';

const BaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

// Helper function to get token safely
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

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  payload: {
    data: T[];
    count: number;
  };
}

export interface Customer {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  phone: string;
  location: string;
  birthday: string;
  gender: string;
  createdAt: string;
  roleId: {
    _id: string;
    name: string;
  };
}

export const getCustomers = async (params?: PaginationParams) => {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['x-auth-token'] = token;
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = `${BaseUrl}/user/get${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json() as PaginatedResponse<Customer>;
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw error;
  }
};

export const updateCustomer = async (id: string, payload: any) => {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['x-auth-token'] = token;
    }

    const res = await axios.put(
      `${BaseUrl}/user/update?id=${id}`,
      payload,
      { headers }
    );
    return res.data;
  } catch (error) {
    console.error("Error updating customer", error);
    throw error;
  }
};

export const deleteCustomer = async (id: string) => {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['x-auth-token'] = token;
    }

    const res = await axios.delete(
      `${BaseUrl}/user/deleteUser?id=${id}`,
      { headers }
    );
    return res.data;
  } catch (error) {
    console.error("Error deleting customer", error);
    throw error;
  }
};

export const setCustomerStatus = async (id: string, isActive: boolean) => {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['x-auth-token'] = token;
    }

    const res = await axios.put(
      `${BaseUrl}/user/userStatus?id=${id}&isActive=${isActive}`,
      {},
      { headers }
    );
    return res.data;
  } catch (error) {
    console.error("Error updating customer status", error);
    throw error;
  }
};

export const createCustomer = async (payload: any) => {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['x-auth-token'] = token;
    }

    const res = await axios.post(
      `${BaseUrl}/user/createUser`,
      payload,
      { headers }
    );
    return res.data;
  } catch (error) {
    console.error("Error creating customer", error);
    throw error;
  }
};