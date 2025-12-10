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

export const getAllCourseCategory = async (params?: PaginationParams) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/courseCategory/getAllCourseCategory`
    );
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

export const createCourseCategory = async (categoryData: any) => {
  const token = getAuthToken();

  try {
    const response = await axios.post(
      `${API_BASE_URL}/courseCategory/addNewCourseCategory`,
      categoryData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
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

export const updateCourseCategory = async (
  id: string,
  data: FormData | { name: string }
) => {
  const token = getAuthToken();
  const isFormData = data instanceof FormData;

  try {
    const headers: any = {
      "x-auth-token": token,
    };

    // Only set Content-Type for non-FormData
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const response = await axios({
      method: "put",
      url: `${API_BASE_URL}/courseCategory/editCourseCategory?id=${id}`,
      data: isFormData ? data : JSON.stringify(data),
      headers,
      timeout: 10000,
    });

    return response.data;
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

export const deleteCourseCategory = async (id: string) => {
  const token = getAuthToken();

  try {
    const response = await axios.delete(
      `${API_BASE_URL}/courseCategory/deleteCourseCategory?id=${id}`,
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
