import axios from 'axios';

const BaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

// Helper function to get token safely
export const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token');
    }
    return null;
};

interface PaymentResponse {
    success: boolean;
    payload: {
        data: any[];
        count: number;
        totalPages: number;
        currentPage: number;
    };
}

interface PaginationParams {
    page?: number;
    limit?: number;
    isType?: string;
}

export const getPaymentHistory = async (params?: PaginationParams): Promise<PaymentResponse> => {
    try {
        const token = getAuthToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['x-auth-token'] = token;
        }

        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.isType) queryParams.append('isType', params.isType);

        const queryString = queryParams.toString();
        // let url = `${BaseUrl}/payment/getAllPaymentHistory?page=${page}&limit=${limit}`;
        // if (isType) {
        //     url += `&isType=${isType}`;
        // }

        const url = `${BaseUrl}/payment/getAllPaymentHistory${queryString ? `?${queryString}` : ''}`;

        const res = await axios.get(url, { headers });
        return res.data;
    } catch (error) {
        console.error("Error fetching payment history:", error);
        throw error;
    }
};