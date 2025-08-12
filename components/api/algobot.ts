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

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  payload: {
    data: T[];
    count: number;
  };
}

interface AlgoBot {
  botName: string;
  description: string;
  price: number | string;
  validity: string;
  image?: File | string;
}

export const createAlgoBot = async (botData: any) => {
  const formData = new FormData();
  const token = getAuthToken();



  try {
    const response = await axios.post(`${API_BASE_URL}/algoBot/createBot`, botData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-auth-token': token,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating algo bot:', error);
    throw error;
  }
};


export const updateAlgoBot = async (id: string, botData: any) => {
  const formData = new FormData();
  const token = getAuthToken();



  try {
    const response = await axios.put(`${API_BASE_URL}/algoBot/updateBot?id=${id}`, botData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-auth-token': token,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating algo bot:', error);
    throw error;
  }
};

export const getAllAlgoBots = async (params?: PaginationParams) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/algoBot/getAllBot?${params?.page ? `page=${params.page}` : ''}&${params?.limit ? `limit=${params.limit}` : ''}&${params?.search ? `search=${params.search}` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching algo bots:', error);
    throw error;
  }
};


export const deleteAlgoBot = async (id: string) => {
  const token = getAuthToken();
  try {
    const response = await axios.delete(`${API_BASE_URL}/algoBot/deleteBot?id=${id}`, {
      headers: {
        'x-auth-token': token,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting algo bot:', error);
    throw error;
  }
};

