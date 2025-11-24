import axios from "axios";

const BaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

// Helper function to get token safely
export const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

export const createCourse = async (payload: FormData) => {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers["x-auth-token"] = token;
    }

    const res = await axios.post(`${BaseUrl}/course/createCourse`, payload, {
      headers,
      transformRequest: [
        (data, headers) => {
          delete headers["Content-Type"];
          return data;
        },
      ],
    });
    return res.data;
  } catch (error) {
    console.error("Error creating course", error);
    throw error;
  }
};
export interface CourseApiResponse {
  success: boolean;
  message: string;
  payload: {
    data: Course[];
    count: number;
  };
}

export interface Course {
  _id: string;
  CourseName: string;
  description?: string;
  courseType: string;
  courseStart?: string;
  courseEnd?: string;
  meetingLink?: string;
  zoomLink?: string;
  city?: string;
  state?: string;
  country?: string;
  instructor?: string;
  language?: string;
  address?: string;
  isActive?: boolean;
  price?: number;
  createdAt?: string;
  updatedAt?: string;
  courseVideo?: string;
  hours?: string;
  email?: string;
  phone?: string;
  isDefineCourse?: string;
  courseCategory?: string;
}

export const getAllCourseCategory = async ({
  page = 1,
  limit = 10,
  search = "",
  courseType = "",
}: {
  page?: number;
  limit?: number;
  search?: string;
  courseType?: string;
} = {}) => {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers["x-auth-token"] = token;
    }

    // Build query string with pagination and filtering
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(courseType && { courseType }),
    });

    const res = await axios.get(
      `${BaseUrl}/courseCategory/getAllCourseCategory`,
      { headers }
    );
    return res.data;
  } catch (error) {
    console.error("Error fetching courses", error);
    throw error;
  }
};

export const getCourses = async ({
  page = 1,
  limit = 10,
  search = "",
  courseType = "",
}: {
  page?: number;
  limit?: number;
  search?: string;
  courseType?: string;
} = {}): Promise<CourseApiResponse> => {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers["x-auth-token"] = token;
    }

    // Build query string with pagination and filtering
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(courseType && { courseType }),
    });

    const res = await axios.get(
      `${BaseUrl}/course/getAllCourse?${params.toString()}`,
      { headers }
    );
    return res.data;
  } catch (error) {
    console.error("Error fetching courses", error);
    throw error;
  }
};

export const updateCourse = async (id: string, payload: FormData) => {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {}; // Remove Content-Type header

    if (token) {
      headers["x-auth-token"] = token;
    }

    const res = await axios.put(
      `${BaseUrl}/course/updateCourse?id=${id}`,
      payload,
      {
        headers,
        // Remove the default JSON content type
        transformRequest: [
          (data, headers) => {
            // Let the browser set the correct Content-Type with boundary
            delete headers["Content-Type"];
            return data;
          },
        ],
      }
    );
    return res.data;
  } catch (error) {
    console.error("Error updating course", error);
    throw error;
  }
};

export const deleteCourse = async (id: string) => {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers["x-auth-token"] = token;
    }

    const res = await axios.delete(`${BaseUrl}/course/deleteCourse?id=${id}`, {
      headers,
    });
    return res.data;
  } catch (error) {
    console.error("Error deleting course", error);
    throw error;
  }
};

export const getChapters = async (id: string) => {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers["x-auth-token"] = token;
    }

    const res = await axios.get(
      `${BaseUrl}/chapter/getAllChapter?courseId=${id}`,
      { headers }
    );
    return res.data;
  } catch (error) {
    console.error("Error fetching chapters", error);
    throw error;
  }
};

export const createChapter = async (payload: any) => {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "multipart/form-data",
    };

    if (token) {
      headers["x-auth-token"] = token;
    }

    const res = await axios.post(`${BaseUrl}/chapter/createChapter`, payload, {
      headers,
    });
    return res.data;
  } catch (error) {
    console.error("Error creating chapter", error);
    throw error;
  }
};

export const updateChapter = async (id: string, payload: any) => {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["x-auth-token"] = token;
    }

    const res = await axios.put(
      `${BaseUrl}/chapter/updateChapter?id=${id}`,
      payload,
      { headers }
    );
    return res.data;
  } catch (error) {
    console.error("Error updating chapter", error);
    throw error;
  }
};

export const deleteChapter = async (id: string) => {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers["x-auth-token"] = token;
    }

    const res = await axios.delete(
      `${BaseUrl}/chapter/deleteChapter?id=${id}`,
      { headers }
    );
    return res.data;
  } catch (error) {
    console.error("Error deleting chapter", error);
    throw error;
  }
};

//session api
export const getSession = async (id: string) => {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers["x-auth-token"] = token;
    }

    const res = await axios.get(
      `${BaseUrl}/sesstion/getAllSession?courseId=${id}`,
      { headers }
    );
    return res.data;
  } catch (error) {
    console.error("Error fetching chapters", error);
    throw error;
  }
};

export const createSession = async (payload: any) => {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "multipart/form-data",
    };

    if (token) {
      headers["x-auth-token"] = token;
    }

    const res = await axios.post(`${BaseUrl}/sesstion/createSession`, payload, {
      headers,
    });
    return res.data;
  } catch (error) {
    console.error("Error creating chapter", error);
    throw error;
  }
};

export const updateSession = async (id: string, payload: any) => {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "multipart/form-data",
    };

    if (token) {
      headers["x-auth-token"] = token;
    }

    const res = await axios.put(
      `${BaseUrl}/sesstion/updateSession?id=${id}`,
      payload,
      { headers }
    );
    return res.data;
  } catch (error) {
    console.error("Error updating chapter", error);
    throw error;
  }
};

export const deleteSession = async (id: string) => {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers["x-auth-token"] = token;
    }

    const res = await axios.delete(
      `${BaseUrl}/sesstion/deleteSession?id=${id}`,
      { headers }
    );
    return res.data;
  } catch (error) {
    console.error("Error deleting chapter", error);
    throw error;
  }
};

const getHeaders = () => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["x-auth-token"] = token;
  return headers;
};

// Create multiple batches
export const createNewBatch = async (payload: any) => {
  try {
    const res = await axios.post(`${BaseUrl}/batch/createNewBatch`, payload, {
      headers: getHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("Error creating batch:", error);
    throw error;
  }
};

//  Get all batches
export const getAllBatch = async (courseId: string) => {
  try {
    const res = await axios.get(
      `${BaseUrl}/batch/getAllBatch?courseId=${courseId}`,
      {
        headers: getHeaders(),
      }
    );
    return res.data;
  } catch (error) {
    console.error("Error fetching batches:", error);
    throw error;
  }
};

// Update batch by ID
export const updateBatch = async (id: string, payload: any) => {
  try {
    const res = await axios.put(
      `${BaseUrl}/batch/updateBatch?id=${id}`,
      payload,
      {
        headers: getHeaders(),
      }
    );
    return res.data;
  } catch (error) {
    console.error("Error updating batch:", error);
    throw error;
  }
};

// Delete batch by ID
export const deleteBatch = async (id: string) => {
  try {
    const res = await axios.delete(`${BaseUrl}/batch/deleteBatch?id=${id}`, {
      headers: getHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("Error deleting batch:", error);
    throw error;
  }
};
export const uploadImage = async (imageFile: File) => {
  try {
    const formData = new FormData();
    formData.append("image", imageFile);

    const res = await axios.post(`${BaseUrl}/user/upload-image`, formData, {
      headers: {
        ...getHeaders(),
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};
