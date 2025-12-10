import axios from "axios";
const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const getAllYoutube = async (params?: PaginationParams) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/youtube/getAllYoutube`);
    return response.data;
  } catch (error) {
    console.error("Error fetching algo bots:", error);
    throw error;
  }
};

export const getCategoryDropdown = async (params?: PaginationParams) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/categories/dropdown`);
    return response.data;
  } catch (error) {
    console.error("Error fetching algo bots:", error);
    throw error;
  }
};

export const createYoutube = async (categoryData: any) => {
  const token = getAuthToken();

  try {
    const response = await axios.post(
      `${API_BASE_URL}/youtube/createNewYouTube`,
      categoryData,
      {
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
};

export const updateYoutube = async (id: string, formData: any) => {
  const token = getAuthToken();
  try {
    const response = await axios.put(
      `${API_BASE_URL}/youtube/updateYouTube?id=${id}`,
      formData,
      {
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        timeout: 30000,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteYoutube = async (id: string) => {
  const token = getAuthToken();

  try {
    const response = await axios.delete(
      `${API_BASE_URL}/youtube/deleteYoutube?id=${id}`,
      {
        headers: {
          "x-auth-token": token,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};
