import axios from "axios";

const BaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

// Get auth token
export const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

// Prepare headers
const getHeaders = () => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["x-auth-token"] = token;
  return headers;
};

export const createCryptoChain = async (chain: string) => {
  try {
    const res = await axios.post(
      `${BaseUrl}/cryptoChain/createNewChain`,
      { chain },
      { headers: getHeaders() }
    );
    return res.data;
  } catch (error) {
    console.error("Error creating crypto chain:", error);
    throw error;
  }
};

export const updateCryptoChain = async (id: string, chain: string) => {
  try {
    const res = await axios.put(
      `${BaseUrl}/cryptoChain/updateChain`,
      { chain },
      {
        headers: getHeaders(),
        params: { id },
      }
    );
    return res.data;
  } catch (error) {
    console.error("Error updating crypto chain:", error);
    throw error;
  }
};

export const getAllCryptoChains = async () => {
  try {
    const res = await axios.get(`${BaseUrl}/cryptoChain/getAllChain`, {
      headers: getHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching crypto chains:", error);
    throw error;
  }
};


export const deleteCryptoChain = async (id: string) => {
  try {
    const res = await axios.delete(`${BaseUrl}/cryptoChain/deleteChain`, {
      headers: getHeaders(),
      params: { id },
    });
    return res.data;
  } catch (error) {
    console.error("Error deleting crypto chain:", error);
    throw error;
  }
};
