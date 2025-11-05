import React, { useState } from "react";
import Link from "next/link";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import * as dropdownData from "./data";

import { IconMail } from "@tabler/icons-react";
import { Stack } from "@mui/system";
import Image from "next/image";
import { useAuth } from "@/app/context/authContext";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import apiClient from "@/utils/axios";

// Validation schema for change password
const changePasswordSchema = yup.object().shape({
  currentPassword: yup.string().required("Current password is required"),
  newPassword: yup
    .string()
    .required("New password is required")
    .min(6, "Password must be at least 6 characters"),
  confirmPassword: yup
    .string()
    .required("Confirm password is required")
    .oneOf([yup.ref("newPassword")], "Passwords must match"),
});

const Profile = () => {
  const [anchorEl2, setAnchorEl2] = useState(null);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [changing, setChanging] = useState(false);
  const { logout, user, isAuthenticated } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleClick2 = (event: any) => {
    setAnchorEl2(event.currentTarget);
  };
  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  const handleLogout = () => {
    logout();
    handleClose2();
  };

  const handleChangePasswordClick = () => {
    setChangePasswordModalOpen(true);
    handleClose2();
  };

  const handleChangePasswordClose = () => {
    setChangePasswordModalOpen(false);
    reset();
  };

  const onSubmitChangePassword = async (data: any) => {
    try {
      setChanging(true);
      await apiClient.post("/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      // Close modal and reset form
      handleChangePasswordClose();

      // Show success toast
      toast.success("Password changed successfully!");
    } catch (error: any) {
      console.error("Error changing password:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to change password. Please try again.";
      toast.error(errorMessage);
    } finally {
      setChanging(false);
    }
  };

  return (
    <Box>
      <IconButton
        size="large"
        aria-label="show 11 new notifications"
        color="inherit"
        aria-controls="msgs-menu"
        aria-haspopup="true"
        sx={{
          ...(typeof anchorEl2 === "object" && {
            color: "primary.main",
          }),
        }}
        onClick={handleClick2}
      >
        <Avatar
          src={"/images/profile/user-1.jpg"}
          alt={"ProfileImg"}
          sx={{
            width: 35,
            height: 35,
          }}
        />
      </IconButton>
      {/* ------------------------------------------- */}
      {/* Message Dropdown */}
      {/* ------------------------------------------- */}
      <Menu
        id="msgs-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        sx={{
          "& .MuiMenu-paper": {
            width: "360px",
            p: 4,
          },
        }}
      >
        <Typography variant="h5">User Profile</Typography>
        <Stack direction="row" py={3} spacing={2} alignItems="center">
          <Avatar
            src={"/images/profile/user-1.jpg"}
            alt={"ProfileImg"}
            sx={{ width: 95, height: 95 }}
          />
          <Box>
            <Typography
              variant="subtitle2"
              color="textPrimary"
              fontWeight={600}
            >
              {user?.name || "User"}
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {user?.role || "Guest"}
            </Typography>
            <Typography
              variant="subtitle2"
              color="textSecondary"
              display="flex"
              alignItems="center"
              gap={1}
            >
              <IconMail width={15} height={15} />
              {user?.email || "No email"}
            </Typography>
          </Box>
        </Stack>
        <Divider />
        {dropdownData.profile.map((profile) => (
          <Box key={profile.title}>
            <Box
              sx={{ py: 2, px: 0 }}
              className="hover-text-primary"
              onClick={
                profile.title === "Change Password"
                  ? handleChangePasswordClick
                  : undefined
              }
              style={{
                cursor:
                  profile.title === "Change Password" ? "pointer" : "default",
              }}
            >
              {profile.title === "Change Password" ? (
                <Stack direction="row" spacing={2}>
                  <Box
                    width="45px"
                    height="45px"
                    bgcolor="primary.light"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink="0"
                  >
                    <Avatar
                      src={profile.icon}
                      alt={profile.icon}
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 0,
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      color="textPrimary"
                      className="text-hover"
                      noWrap
                      sx={{
                        width: "240px",
                      }}
                    >
                      {profile.title}
                    </Typography>
                    <Typography
                      color="textSecondary"
                      variant="subtitle2"
                      sx={{
                        width: "240px",
                      }}
                      noWrap
                    >
                      {profile.subtitle}
                    </Typography>
                  </Box>
                </Stack>
              ) : (
                <Link href={profile.href}>
                  <Stack direction="row" spacing={2}>
                    <Box
                      width="45px"
                      height="45px"
                      bgcolor="primary.light"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink="0"
                    >
                      <Avatar
                        src={profile.icon}
                        alt={profile.icon}
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: 0,
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        color="textPrimary"
                        className="text-hover"
                        noWrap
                        sx={{
                          width: "240px",
                        }}
                      >
                        {profile.title}
                      </Typography>
                      <Typography
                        color="textSecondary"
                        variant="subtitle2"
                        sx={{
                          width: "240px",
                        }}
                        noWrap
                      >
                        {profile.subtitle}
                      </Typography>
                    </Box>
                  </Stack>
                </Link>
              )}
            </Box>
          </Box>
        ))}
        <Box mt={2}>
          {/* <Box
            bgcolor="primary.light"
            p={3}
            mb={3}
            overflow="hidden"
            position="relative"
          >
            <Box display="flex" justifyContent="space-between">
              <Box>
                <Typography variant="h5" mb={2}>
                  Unlimited <br />
                  Access
                </Typography>
                <Button variant="contained" color="primary">
                  Upgrade
                </Button>
              </Box>
              <Image
                src={"/images/backgrounds/unlimited-bg.png"}
                width={150}
                height={183}
                alt="unlimited"
                className="signup-bg"
              />
            </Box>
          </Box> */}
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      </Menu>

      {/* Change Password Dialog */}
      <Dialog
        open={changePasswordModalOpen}
        onClose={handleChangePasswordClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmitChangePassword)}
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
          >
            <Controller
              name="currentPassword"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Current Password"
                  type="password"
                  fullWidth
                  variant="outlined"
                  error={!!errors.currentPassword}
                  helperText={errors.currentPassword?.message}
                />
              )}
            />
            <Controller
              name="newPassword"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="New Password"
                  type="password"
                  fullWidth
                  variant="outlined"
                  error={!!errors.newPassword}
                  helperText={errors.newPassword?.message}
                />
              )}
            />
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Confirm Password"
                  type="password"
                  fullWidth
                  variant="outlined"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleChangePasswordClose} disabled={changing}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmitChangePassword)}
            color="primary"
            variant="contained"
            disabled={changing}
            startIcon={changing ? <CircularProgress size={16} /> : null}
          >
            {changing ? "Changing..." : "Change Password"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
