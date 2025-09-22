"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";
import Cookies from "js-cookie";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user was previously logged in (from cookies)
    const accessToken = Cookies.get("accessToken");
    const userData = Cookies.get("userData");

    if (accessToken && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error parsing user data from cookies:", error);
        // Clear invalid cookies
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");
        Cookies.remove("userData");
      }
    }
    setLoading(false);
  }, []);

  const getAccessToken = (): string | null => {
    return Cookies.get("accessToken") || null;
  };

  const getRefreshToken = (): string | null => {
    return Cookies.get("refreshToken") || null;
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await axios.post(
        "https://fronterainfotech.com/v1/auth/login",
        {
          email,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.status === 200) {
        const { user: userData, tokens } = response.data;

        // Store user data
        if (userData) {
          setUser(userData);
          // Store user data in cookies (expires in 30 days)
          Cookies.set("userData", JSON.stringify(userData), { expires: 30 });
        }

        // Store tokens in cookies
        if (tokens?.access?.token) {
          // Set access token with expiry
          const accessExpiry = tokens.access.expires
            ? new Date(tokens.access.expires)
            : 1; // 1 day default
          Cookies.set("accessToken", tokens.access.token, {
            expires: accessExpiry,
          });
        }

        if (tokens?.refresh?.token) {
          // Set refresh token with expiry
          const refreshExpiry = tokens.refresh.expires
            ? new Date(tokens.refresh.expires)
            : 30; // 30 days default
          Cookies.set("refreshToken", tokens.refresh.token, {
            expires: refreshExpiry,
          });
        }

        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: "Invalid credentials" };
      }
    } catch (error: any) {
      console.error("Login error:", error);

      let errorMessage = "Login failed. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = "Invalid email or password";
      } else if (error.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      }

      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    // Remove all authentication cookies
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    Cookies.remove("userData");
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
    getAccessToken,
    getRefreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
