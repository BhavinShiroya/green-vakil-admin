"use client";
import React from "react";
import { useAuth } from "@/app/context/authContext";
import { usePathname } from "next/navigation";
import { CircularProgress, Box } from "@mui/material";

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const { isAuthenticated, loading } = useAuth();
  const pathname = usePathname();

  // Allow access to auth-related pages without authentication
  const isAuthPage =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/auth") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/forgot-password");

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // If user is not authenticated and not on an auth page, redirect to login
  if (!isAuthenticated && !isAuthPage) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  return <>{children}</>;
};

export default AuthWrapper;
