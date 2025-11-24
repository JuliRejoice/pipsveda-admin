import axios from "axios";

const BaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

const getAuthToken = (): string | null => {
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

export interface WithdrawalsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface WithdrawalResponse {
  success: boolean;
  message: string;
  payload: {
    data: any[];
    count: number;
  };
}

export interface StatusUpdateResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const getWithdrawals = async (
  query: WithdrawalsQuery = {}
): Promise<WithdrawalResponse> => {
  try {
    const { page = 1, limit = 10, search, status } = query;
    const params = new URLSearchParams();

    params.append("page", page.toString());
    params.append("limit", limit.toString());

    if (search) {
      params.append("search", search);
    }

    // Only append status if it's a valid status and not "all"
    if (status && status !== "all") {
      // Ensure the status is lowercase to match backend expectations
      params.append("status", status.toLowerCase());
    }

    const url = new URL(`${BaseUrl}/withdrawal/getAllRequest`);
    url.search = params.toString();

    console.log("API Request URL:", url.toString());

    const res = await axios.get(url.toString(), {
      headers: getHeaders(),
    });

    return res.data;
  } catch (error: any) {
    console.error("Error fetching withdrawals:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch withdrawals",
      payload: {
        data: [],
        count: 0,
      },
    };
  }
};

export const updateWithdrawalStatus = async (
  id: string,
  data: {
    name: string;
    email: string;
    phone: string;
    amount: string;
    status: string;
    walletId: string;
    chain: string;
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    imageUrl?: string;
    transactionId?: string;
  }
): Promise<StatusUpdateResponse> => {
  try {
    const res = await axios.put(
      `${BaseUrl}/withdrawal/updateRequest?id=${id}`,
      data,
      { headers: getHeaders() }
    );

    return {
      success: true,
      message: "Withdrawal updated successfully",
      data: res.data.data,
    };
  } catch (error: any) {
    console.error("Error updating withdrawal:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update withdrawal",
    };
  }
};
