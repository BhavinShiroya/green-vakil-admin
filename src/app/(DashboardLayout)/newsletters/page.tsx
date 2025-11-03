"use client";

import * as React from "react";
import { useTheme } from "@mui/material/styles";
import {
  Typography,
  TableHead,
  Chip,
  Box,
  Table,
  TableBody,
  TableCell,
  TablePagination,
  TableRow,
  TableFooter,
  TableContainer,
  CircularProgress,
  Tooltip,
  IconButton,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";

import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";

import { Stack } from "@mui/system";
import BlankCard from "@/app/components/shared/BlankCard";
import { useEffect, useState } from "react";
import apiClient from "@/utils/axios";
import RoleGuard from "@/app/components/RoleGuard";

// Define the newsletter interface based on the API response
interface Newsletter {
  id: string;
  email: string;
  name?: string;
  status?: string;
  isActive?: boolean;
  subscribedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any; // Allow additional fields
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
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
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

const Newsletters = () => {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalNewsletters, setTotalNewsletters] = useState(0);

  // Filter state
  const [isActiveFilter, setIsActiveFilter] = useState<string>("");

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [newsletterToDelete, setNewsletterToDelete] =
    useState<Newsletter | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchNewsletters = async (
    currentPage: number,
    limit: number,
    isActive: string = ""
  ) => {
    try {
      setLoading(true);

      const params: any = {
        sortBy: "createdAt:desc",
        limit: limit,
        page: currentPage + 1, // API is 1-indexed, MUI pagination is 0-indexed
      };

      // Only add filter parameters if they are selected
      if (isActive && isActive.trim() !== "") {
        params.isActive = isActive === "true";
      }

      const response = await apiClient.get("/newsletters", {
        params: params,
      });

      console.log("Newsletters API Response:", response.data);
      console.log("Newsletters data:", response.data.results || response.data);

      // Handle different API response structures
      if (Array.isArray(response.data)) {
        setNewsletters(response.data);
        setTotalNewsletters(response.data.length);
      } else if (response.data.results) {
        setNewsletters(response.data.results);
        setTotalNewsletters(
          response.data.totalResults || response.data.total || 0
        );
      } else {
        setNewsletters([]);
        setTotalNewsletters(0);
      }
    } catch (error) {
      console.error("Error fetching newsletters:", error);
      setNewsletters([]);
      setTotalNewsletters(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsletters(page, rowsPerPage, isActiveFilter);
  }, [page, rowsPerPage, isActiveFilter]);

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

  // IsActive filter handler
  const handleIsActiveFilterChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setIsActiveFilter(event.target.value);
    setPage(0); // Reset to first page when filtering
  };

  // Handle delete newsletter
  const handleDeleteClick = (newsletter: Newsletter) => {
    setNewsletterToDelete(newsletter);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!newsletterToDelete) return;

    try {
      setDeleting(true);
      await apiClient.delete(`/newsletters/${newsletterToDelete.id}`);

      // Remove the newsletter from the local state
      setNewsletters((prev) =>
        prev.filter((newsletter) => newsletter.id !== newsletterToDelete.id)
      );
      setTotalNewsletters((prev) => prev - 1);

      // Close modal
      setDeleteModalOpen(false);
      setNewsletterToDelete(null);

      // Show success toast
      toast.success("Newsletter deleted successfully!");
    } catch (error) {
      console.error("Error deleting newsletter:", error);
      toast.error("Failed to delete newsletter. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setNewsletterToDelete(null);
  };

  // Truncate text for display
  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
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
            Newsletter Management
          </Typography>
        </Box>
      </Box>

      {/* Filters */}
      <BlankCard>
        <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider" }}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Filter by Active Status"
                variant="outlined"
                size="small"
                select
                value={isActiveFilter}
                onChange={handleIsActiveFilterChange}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </TextField>
            </Stack>
          </Stack>
        </Box>
      </BlankCard>

      {/* Newsletter List */}
      <BlankCard>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer sx={{ maxWidth: "100%", overflow: "hidden" }}>
            <Table
              aria-label="newsletters pagination table"
              sx={{
                tableLayout: "fixed",
                width: "100%",
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: "25%" }}>
                    <Typography variant="h6">Email</Typography>
                  </TableCell>
                  <TableCell sx={{ width: "15%" }}>
                    <Typography variant="h6">Is Active</Typography>
                  </TableCell>
                  <TableCell sx={{ width: "20%" }}>
                    <Typography variant="h6">Subscribed At</Typography>
                  </TableCell>
                  <TableCell sx={{ width: "20%" }}>
                    <Typography variant="h6">Created At</Typography>
                  </TableCell>
                  <TableCell sx={{ width: "10%", textAlign: "center" }}>
                    <Typography variant="h6">Actions</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {newsletters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ py: 3 }}
                      >
                        No newsletters found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  newsletters.map((newsletter, index) => (
                    <TableRow key={newsletter.id || index}>
                      <TableCell>
                        <Tooltip
                          title={newsletter.email || "No email"}
                          arrow
                          placement="top"
                        >
                          <Typography variant="subtitle2" fontWeight="400">
                            {truncateText(newsletter.email || "No email", 30)}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={
                            newsletter.isActive === true ? "success" : "error"
                          }
                          sx={{
                            borderRadius: "6px",
                            textTransform: "capitalize",
                          }}
                          size="small"
                          label={
                            newsletter.isActive === true ? "True" : "False"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(
                            newsletter.subscribedAt ||
                              newsletter.createdAt ||
                              ""
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(newsletter.createdAt || "")}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <Tooltip
                          title="Delete newsletter"
                          arrow
                          placement="top"
                        >
                          <IconButton
                            onClick={() => handleDeleteClick(newsletter)}
                            size="small"
                            sx={{
                              color: "error.main",
                              "&:hover": {
                                backgroundColor: "error.dark",
                                color: "white",
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    colSpan={5}
                    count={totalNewsletters}
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteModalOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Newsletter</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the newsletter "
            {newsletterToDelete?.email || "Untitled"}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={
              deleting ? <CircularProgress size={16} /> : <DeleteIcon />
            }
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </RoleGuard>
  );
};

export default Newsletters;
