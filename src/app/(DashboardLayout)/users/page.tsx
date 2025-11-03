"use client";

import * as React from "react";
import { useTheme } from "@mui/material/styles";
import {
  Typography,
  TableHead,
  Avatar,
  Chip,
  Box,
  Table,
  TableBody,
  TableCell,
  TablePagination,
  TableRow,
  TableFooter,
  IconButton,
  TableContainer,
  CircularProgress,
  Tooltip,
  TextField,
  MenuItem,
} from "@mui/material";

import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";

import ParentCard from "@/app/components/shared/ParentCard";
import { Stack } from "@mui/system";
import BlankCard from "@/app/components/shared/BlankCard";
import { useEffect, useState } from "react";
import apiClient from "@/utils/axios";
import RoleGuard from "@/app/components/RoleGuard";

// Define the user interface based on the actual API response
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TablePaginationActionsProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (
    event: React.MouseEvent<HTMLButtonElement>,
    newPage: number
  ) => void;
}

function TablePaginationActions(props: TablePaginationActionsProps) {
  const theme = useTheme();
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleFirstPageButtonClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
      >
        {theme.direction === "rtl" ? <LastPageIcon /> : <FirstPageIcon />}
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
      >
        {theme.direction === "rtl" ? (
          <KeyboardArrowRight />
        ) : (
          <KeyboardArrowLeft />
        )}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        {theme.direction === "rtl" ? (
          <KeyboardArrowLeft />
        ) : (
          <KeyboardArrowRight />
        )}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        {theme.direction === "rtl" ? <FirstPageIcon /> : <LastPageIcon />}
      </IconButton>
    </Box>
  );
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);

  // Role filter state
  const [roleFilter, setRoleFilter] = useState("");

  const fetchUsers = async (
    currentPage: number,
    limit: number,
    role: string = ""
  ) => {
    try {
      setLoading(true);

      const params: any = {
        sortBy: "createdAt:desc",
        limit: limit,
        page: currentPage + 1, // API is 1-indexed, MUI pagination is 0-indexed
      };

      // Only add role parameter if a role is selected
      if (role && role.trim() !== "") {
        params.role = role;
      }

      const response = await apiClient.get("/users", {
        params: params,
      });

      setUsers(response.data.results || []);
      setTotalUsers(response.data.totalResults || 0);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page, rowsPerPage, roleFilter);
  }, [page, rowsPerPage, roleFilter]);

  const handleChangePage = (
    event: any,
    newPage: React.SetStateAction<number>
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: { target: { value: string } }) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to first page when changing rows per page
  };

  // Role filter handler
  const handleRoleFilterChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRoleFilter(event.target.value);
    setPage(0); // Reset to first page when filtering
  };

  // Generate a random avatar for contacts
  const getRandomAvatar = (index: number) => {
    const avatarIndex = (index % 10) + 1;
    return `/images/profile/user-${avatarIndex}.jpg`;
  };

  // Get status color based on role
  const getRoleChipColor = (role: string) => {
    const lowerRole = role.toLowerCase();
    if (lowerRole.includes("admin")) return "error";
    if (lowerRole.includes("lawyer")) return "primary";
    if (lowerRole.includes("user")) return "success";
    if (lowerRole.includes("manager")) return "warning";
    return "default";
  };

  // Format date and time
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: "text.primary",
              mb: 0.5,
              letterSpacing: "-0.025em",
            }}
          >
            Users Management
          </Typography>
        </Box>
      </Box>

      {/* Role Filter */}
      <BlankCard>
        <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider" }}>
          <TextField
            label="Filter by Role"
            variant="outlined"
            size="small"
            select
            value={roleFilter}
            onChange={handleRoleFilterChange}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All Roles</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="attorney">Attorney</MenuItem>
          </TextField>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer sx={{ maxWidth: "100%", overflow: "hidden" }}>
            <Table
              aria-label="users pagination table"
              sx={{
                tableLayout: "fixed",
                width: "100%",
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: "25%" }}>
                    <Typography variant="h6">Name</Typography>
                  </TableCell>
                  <TableCell sx={{ width: "25%" }}>
                    <Typography variant="h6">Email</Typography>
                  </TableCell>
                  <TableCell sx={{ width: "15%" }}>
                    <Typography variant="h6">Role</Typography>
                  </TableCell>
                  <TableCell sx={{ width: "15%" }}>
                    <Typography variant="h6">Email Verified</Typography>
                  </TableCell>
                  <TableCell sx={{ width: "20%" }}>
                    <Typography variant="h6">Created Date</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Tooltip title={user.name} arrow placement="top">
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar
                            src={getRandomAvatar(index)}
                            alt={user.name}
                          />
                          <Box>
                            <Typography variant="subtitle2" fontWeight="400">
                              {user.name}
                            </Typography>
                          </Box>
                        </Stack>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={user.email} arrow placement="top">
                        <Typography
                          color="textSecondary"
                          variant="subtitle2"
                          fontWeight="400"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                          }}
                        >
                          {user.email}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title={`Role: ${user.role}`}
                        arrow
                        placement="top"
                      >
                        <Chip
                          color={getRoleChipColor(user.role)}
                          sx={{
                            borderRadius: "6px",
                            cursor: "pointer",
                            textTransform: "capitalize",
                          }}
                          size="small"
                          label={user.role}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title={`Email ${
                          user.isEmailVerified ? "Verified" : "Not Verified"
                        }`}
                        arrow
                        placement="top"
                      >
                        <Chip
                          color={user.isEmailVerified ? "success" : "warning"}
                          sx={{
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                          size="small"
                          label={user.isEmailVerified ? "Verified" : "Pending"}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title={`Created: ${formatDate(user.createdAt)}`}
                        arrow
                        placement="top"
                      >
                        <Typography
                          color="textSecondary"
                          variant="subtitle2"
                          fontWeight="400"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                          }}
                        >
                          {formatDate(user.createdAt)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    colSpan={5}
                    count={totalUsers}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    ActionsComponent={TablePaginationActions}
                    slotProps={{
                      select: {
                        native: true,
                      },
                    }}
                  />
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        )}
      </BlankCard>
    </RoleGuard>
  );
};

export default Users;
