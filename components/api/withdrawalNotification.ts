import axios from "axios";

const BaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

export const updateWithdrawalNotification = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    let url = `${BaseUrl}/withdrawal/updateReadStatus`;
    url += `?isReadAll=true`;

    const response = await axios.put(
      url,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error updating withdrawal notification", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Failed to update withdrawal notification",
    };
  }
};
