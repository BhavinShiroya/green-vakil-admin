"use client";

import { useEffect } from "react";
import { useAuth } from "@/app/context/authContext";
import { Box, CircularProgress, Typography } from "@mui/material";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

const RoleGuard = ({
  children,
  allowedRoles,
  redirectTo = "/articles",
}: RoleGuardProps) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user || !user.role) {
        // No user or role, redirect to articles
        if (typeof window !== "undefined") {
          window.location.href = redirectTo;
        }
        return;
      }

      const userRole = user.role.toLowerCase();
      const normalizedAllowedRoles = allowedRoles.map((role) =>
        role.toLowerCase()
      );

      // Check if user's role is in allowed roles
      if (!normalizedAllowedRoles.includes(userRole)) {
        // User doesn't have access, redirect immediately
        if (typeof window !== "undefined") {
          window.location.href = redirectTo;
        }
      }
    }
  }, [user, loading, allowedRoles, redirectTo]);

  // Show loading while checking
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Checking permissions...
        </Typography>
      </Box>
    );
  }

  // Check if user has access
  if (!user || !user.role) {
    return null; // Will redirect
  }

  const userRole = user.role.toLowerCase();
  const normalizedAllowedRoles = allowedRoles.map((role) => role.toLowerCase());

  if (!normalizedAllowedRoles.includes(userRole)) {
    return null; // Will redirect
  }

  // User has access, render children
  return <>{children}</>;
};

export default RoleGuard;
