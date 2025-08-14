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


//algobots-category api
export const getAllCategory = async (params?: PaginationParams) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/categories/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching algo bots:', error);
    throw error;
  }
};

export const createCategory = async (categoryData: any) => {
  const token = getAuthToken();

  try {
    const response = await axios.post(`${API_BASE_URL}/categories/add`, categoryData, {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const updateCategory = async (id: string, categoryData: any) => {
  const token = getAuthToken();

  try {
    const response = await axios.put(`${API_BASE_URL}/categories/edit/${id}`, categoryData, {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (id: string) => {
  const token = getAuthToken();

  try {
    const response = await axios.delete(`${API_BASE_URL}/categories/delete/${id}`, {
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

//Bot Provider API
export const getBotProviderDropDown = async (params?: PaginationParams) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/botProvider/dropdown`);
    return response.data;
  } catch (error) {
    console.error('Error fetching algo bots:', error);
    throw error;
  }
};

//Bot API
export const getAllBots = async (params?: PaginationParams) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/bot/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching bots:', error);
    throw error;
  }
};

export const createBot = async (botData: { botProviderId: string; name: string }) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_BASE_URL}/bot/add`, botData, {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating bot:', error);
    throw error;
  }
};

export const updateBot = async (id: string, botData: { botProviderId: string; name: string }) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_BASE_URL}/bot/edit/${id}`, botData, {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating bot:', error);
    throw error;
  }
};

export const deleteBot = async (id: string) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${API_BASE_URL}/bot/delete/${id}`, {
      headers: {
        'x-auth-token': token,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting bot:', error);
    throw error;
  }
};


