import axios from "axios";

const BaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

// Helper function to get token safely
export const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

export const getAllTelegram = async (searchTerm?: string) => {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["x-auth-token"] = token;
    }

    const res = await axios.get(`${BaseUrl}/telegram/getAllTelegram${searchTerm ? `?search=${searchTerm}` : ""}`, {
      headers,
    });
    console.log(res.data);
    return res.data;
  } catch (error) {
    console.error("Error on Contact Fetch", error);
    throw error;
  }
};

export const createChannel = async (telegramData: any) => {
  console.log(telegramData, "formData");
  const token = getAuthToken();
  try {
    const response = await axios.post(
      `${BaseUrl}/telegram/createTelegram`,
      telegramData,
      {
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating channel:", error);
    throw error;
  }
};

// Update the updateChannel function
export const updateChannel = async (id: string, formData: any) => {
  const token = getAuthToken();
  try {
    const response = await axios.put(
      `${BaseUrl}/telegram/updateTelegram?id=${id}`,
      formData,
      {
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating channel:", error);
    throw error;
  }
};
export const deleteChannel = async (id: string) => {
  const token = getAuthToken();

  try {
    const response = await axios.delete(
      `${BaseUrl}/telegram/deleteTelegram?id=${id}`,
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

//channel plan api
export const getAllTelegramPlan = async (id: string) => {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["x-auth-token"] = token;
    }

    const res = await axios.get(
      `${BaseUrl}/telegramPlan/getAllTelegramPlan?telegramId=${id}`,
      { headers }
    );
    console.log(res.data);
    return res.data;
  } catch (error) {
    console.error("Error on Contact Fetch", error);
    throw error;
  }
};

export const createChannelPlan = async (channelData: any) => {
  const token = getAuthToken();

  try {
    const response = await axios.post(
      `${BaseUrl}/telegramPlan/createTelePlan`,
      channelData,
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

export const updateChannelPlan = async (id: string, channelData: any) => {
  const token = getAuthToken();

  try {
    const response = await axios.put(
      `${BaseUrl}/telegramPlan/updateTelegramPlan?id=${id}`,
      channelData,
      {
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

export const deleteChannelPlan = async (id: string) => {
  const token = getAuthToken();

  try {
    const response = await axios.delete(
      `${BaseUrl}/telegramPlan/deleteTelegramPlan?id=${id}`,
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
