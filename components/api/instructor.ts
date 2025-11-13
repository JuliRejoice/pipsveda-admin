import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

interface Instructor {
  _id?: string;
  name: string;
  email: string;
  bio: string;
  photo?: string;
  courses?: string[];
  isActive?: boolean;
}

export const getAllInstructors = async (data: { page?: number; limit?: number; search?: string }) => {

  const params = new URLSearchParams();
    if (data.page) params.append('page', data.page.toString());
    if (data.limit) params.append('limit', data.limit.toString());
    if (data.search) params.append('search', data.search);
  try {
    const response = await axios.get(`${BASE_URL}/instructor/getAllInstructor?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching instructors:', error);
    throw error;
  }
};

export const getInstructorById = async (id: string) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/instructor/getAllInstructor?id=${id}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching instructor:", error);
    throw error;
  }
};

export const createInstructor = async (data: FormData) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/instructor/createInstructor`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Error response:", error.response.data);
      return error.response.data;
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received:", error.request);
      throw new Error("No response received from server");
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error:", error.message);
      throw error;
    }
  }
};

export const updateInstructor = async (id: string, data: FormData) => {
  try {
    const response = await axios.put(
      `${BASE_URL}/instructor/updateInstructor?id=${id}`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating instructor:", error);
    throw error;
  }
};

export const deleteInstructor = async (id: string) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/instructor/deleteInstructor?id=${id}`
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting instructor:", error);
    throw error;
  }
};
