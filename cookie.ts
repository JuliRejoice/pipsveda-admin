import { Cookies } from "react-cookie-consent";
export const isBrowser = () => typeof window !== "undefined";
export const getCookie = (key: string) => {
  if (isBrowser()) {
    return Cookies.get(key);
  }
};

export const setCookie = (key: any, value: any, options: any) => {
  Cookies.set(key, value, options);
};

export const removeCookie = (key: any) => {
  Cookies.remove(key);
};

export const getCookieFromRequest = async (req: { headers: { cookie: string; }; }, cookieName: any) => {
  const cookie = await req.headers.cookie?.split(";").find((cookie: string) => cookie.trim().startsWith(`${cookieName}=`));
  if (!cookie) return null;
  return cookie.split("=")[1];
};