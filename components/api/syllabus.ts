import axios from "axios";

const BaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

const getHeaders = () => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["x-auth-token"] = token;
  return headers;
};

export const createSyllabus = async (syllabusData: any[]) => {
  try {
    const payload = { syllabus: syllabusData };
    const res = await axios.post(
      `${BaseUrl}/syllabus/createNewSyllabus`,
      payload,
      { headers: getHeaders() }
    );
    return res.data;
  } catch (error) {
    console.error("Error creating syllabus:", error);
    throw error;
  }
};

export const updateSyllabus = async (id: string, data: any) => {
  try {
    const res = await axios.put(
      `${BaseUrl}/syllabus/updateSyllabus?id=${id}`,
      data,
      { headers: getHeaders() }
    );
    return res.data;
  } catch (error) {
    console.error("Error updating syllabus:", error);
    throw error;
  }
};

export const getAllSyllabus = async (courseId: string) => {
  try {
    const res = await axios.get(`${BaseUrl}/syllabus/getAllSyllabus/?courseId=${courseId}`, {
      headers: getHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching syllabus:", error);
    throw error;
  }
};

export const deleteSyllabus = async (id: string) => {
  try {
    const res = await axios.delete(
      `${BaseUrl}/syllabus/deleteSyllabus?id=${id}`,
      { headers: getHeaders() }
    );
    return res.data;
  } catch (error) {
    console.error("Error deleting syllabus:", error);
    throw error;
  }
};
