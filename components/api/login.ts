import axios from 'axios'
const BaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export const SignIn = async (data: { email: string; password: string; name: string }) => {
    const res = await axios.post(
      `${BaseUrl}/user/signin`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return res;
}

export const signOut = async () => {
 localStorage.removeItem('token');
}