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

export const getAllCenters = async () => {
  try {
    const res = await axios.get(`${BaseUrl}/center/getAllCenter`, {
      headers: getHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching centers:", error);
    throw error;
  }
};

export const createBanner = async (imageFile: File) => {
  try {
    const formData = new FormData();
    formData.append("image", imageFile);

    const res = await axios.post(
      `${BaseUrl}/banner/createNewBanner`,
      formData,
      {
        headers: {
          ...getHeaders(),
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return res.data;
  } catch (error) {
    console.error("Error creating banner:", error);
    throw error;
  }
};

export const updateBanner = async (id: string, imageFile: File) => {
  try {
    const formData = new FormData();
    formData.append("image", imageFile);

    const res = await axios.put(
      `${BaseUrl}/banner/updateBanner?id=${id}`,
      formData,
      {
        headers: {
          ...getHeaders(),
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return res.data;
  } catch (error) {
    console.error("Error updating banner:", error);
    throw error;
  }
};

export const getAllBanners = async () => {
  try {
    const res = await axios.get(`${BaseUrl}/banner/getBanner`, {
      headers: getHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching banners:", error);
    throw error;
  }
};

export const deleteBanner = async (id: string) => {
  try {
    const res = await axios.delete(`${BaseUrl}/banner/deleteBanner?id=${id}`, {
      headers: getHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("Error deleting banner:", error);
    throw error;
  }
};

