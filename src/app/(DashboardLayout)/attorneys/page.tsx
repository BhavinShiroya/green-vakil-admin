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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";

import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";
import { Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Stack } from "@mui/system";
import BlankCard from "@/app/components/shared/BlankCard";
import { useEffect, useState } from "react";
import apiClient from "@/utils/axios";
import RoleGuard from "@/app/components/RoleGuard";
import PageContainer from "@/app/components/container/PageContainer";

// Define the attorney interface based on the API response
interface Attorney {
  id: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  state?: string;
  city?: string;
  legalService?: string;
  specialization?: string;
  experience?: number;
  bio?: string;
  location?: string;
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

const Attorneys = () => {
  const [attorneys, setAttorneys] = useState<Attorney[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalAttorneys, setTotalAttorneys] = useState(0);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [attorneyToDelete, setAttorneyToDelete] = useState<Attorney | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [attorneyToEdit, setAttorneyToEdit] = useState<Attorney | null>(null);
  const [editing, setEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    state: "",
    city: "",
    legalService: "",
  });

  const fetchAttorneys = async (currentPage: number, limit: number) => {
    try {
      setLoading(true);

      const response = await apiClient.get("/attorneys", {
        params: {
          sortBy: "createdAt:desc",
          limit: limit,
          page: currentPage + 1, // API is 1-indexed, MUI pagination is 0-indexed
        },
      });

      setAttorneys(response.data.results || []);
      setTotalAttorneys(response.data.totalResults || 0);
    } catch (error) {
      console.error("Error fetching attorneys:", error);
      setAttorneys([]);
      setTotalAttorneys(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttorneys(page, rowsPerPage);
  }, [page, rowsPerPage]);

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

  // Generate a random avatar for attorneys
  const getRandomAvatar = (index: number) => {
    const avatarIndex = (index % 10) + 1;
    return `/images/profile/user-${avatarIndex}.jpg`;
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

  // Handle delete attorney
  const handleDeleteClick = (attorney: Attorney) => {
    setAttorneyToDelete(attorney);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!attorneyToDelete) return;

    try {
      setDeleting(true);
      await apiClient.delete(`/attorneys/${attorneyToDelete.id}`);

      // Remove the attorney from the local state
      setAttorneys((prev) =>
        prev.filter((attorney) => attorney.id !== attorneyToDelete.id)
      );
      setTotalAttorneys((prev) => prev - 1);

      // Close modal
      setDeleteModalOpen(false);
      setAttorneyToDelete(null);

      // Show success toast
      toast.success("Attorney deleted successfully!");
    } catch (error) {
      console.error("Error deleting attorney:", error);
      toast.error("Failed to delete attorney. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setAttorneyToDelete(null);
  };

  // Handle edit attorney
  const handleEditClick = async (attorney: Attorney) => {
    try {
      // Fetch the full attorney details first
      const response = await apiClient.get(`/attorneys/${attorney.id}`);
      const fullAttorney = response.data;

      setAttorneyToEdit(fullAttorney);
      setEditFormData({
        fullName: fullAttorney.fullName || "",
        email: fullAttorney.email || "",
        phoneNumber: fullAttorney.phoneNumber || "",
        state: fullAttorney.state || "",
        city: fullAttorney.city || "",
        legalService: fullAttorney.legalService || "",
      });
      setEditModalOpen(true);
    } catch (error) {
      console.error("Error fetching attorney details:", error);
      toast.error("Failed to load attorney details. Please try again.");
    }
  };

  const handleEditFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditConfirm = async () => {
    if (!attorneyToEdit) return;

    try {
      setEditing(true);
      await apiClient.patch(`/attorneys/${attorneyToEdit.id}`, editFormData);

      // Refresh the attorneys list
      await fetchAttorneys(page, rowsPerPage);

      // Close modal
      setEditModalOpen(false);
      setAttorneyToEdit(null);

      // Show success toast
      toast.success("Attorney updated successfully!");
    } catch (error) {
      console.error("Error updating attorney:", error);
      toast.error("Failed to update attorney. Please try again.");
    } finally {
      setEditing(false);
    }
  };

  const handleEditCancel = () => {
    setEditModalOpen(false);
    setAttorneyToEdit(null);
    setEditFormData({
      fullName: "",
      email: "",
      phoneNumber: "",
      state: "",
      city: "",
      legalService: "",
    });
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <PageContainer
        title="Attorneys | Greenway Lawyer Admin"
        description="Attorney Management for Greenway Lawyer"
      >
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
              Attorneys Management
            </Typography>
          </Box>
        </Box>

        <BlankCard>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer sx={{ maxWidth: "100%", overflow: "hidden" }}>
              <Table
                aria-label="attorneys pagination table"
                sx={{
                  tableLayout: "fixed",
                  width: "100%",
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: "16%" }}>
                      <Typography variant="h6">Name</Typography>
                    </TableCell>
                    <TableCell sx={{ width: "16%" }}>
                      <Typography variant="h6">Email</Typography>
                    </TableCell>
                    <TableCell sx={{ width: "14%" }}>
                      <Typography variant="h6">Phone</Typography>
                    </TableCell>
                    <TableCell sx={{ width: "14%" }}>
                      <Typography variant="h6">Legal Service</Typography>
                    </TableCell>
                    <TableCell sx={{ width: "14%" }}>
                      <Typography variant="h6">Location</Typography>
                    </TableCell>
                    <TableCell sx={{ width: "14%" }}>
                      <Typography variant="h6">Created Date</Typography>
                    </TableCell>
                    <TableCell sx={{ width: "12%", textAlign: "center" }}>
                      <Typography variant="h6">Actions</Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attorneys.map((attorney, index) => (
                    <TableRow key={attorney.id}>
                      <TableCell>
                        <Tooltip
                          title={attorney.fullName || "N/A"}
                          arrow
                          placement="top"
                        >
                          <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                          >
                            <Avatar
                              src={getRandomAvatar(index)}
                              alt={attorney.fullName || "Attorney"}
                            />
                            <Box>
                              <Typography variant="subtitle2" fontWeight="400">
                                {attorney.fullName || "N/A"}
                              </Typography>
                            </Box>
                          </Stack>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip
                          title={attorney.email || "N/A"}
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
                            {attorney.email || "N/A"}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip
                          title={attorney.phoneNumber || "N/A"}
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
                            {attorney.phoneNumber || "N/A"}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip
                          title={attorney.legalService || "N/A"}
                          arrow
                          placement="top"
                        >
                          <Chip
                            color="primary"
                            sx={{
                              borderRadius: "6px",
                              cursor: "pointer",
                            }}
                            size="small"
                            label={attorney.legalService || "N/A"}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip
                          title={
                            attorney.city && attorney.state
                              ? `${attorney.city}, ${attorney.state}`
                              : attorney.city || attorney.state || "N/A"
                          }
                          arrow
                          placement="top"
                        >
                          <Box>
                            <Typography
                              color="textSecondary"
                              variant="subtitle2"
                              fontWeight="400"
                              sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {attorney.city || "N/A"}
                            </Typography>
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
                              {attorney.state || "N/A"}
                            </Typography>
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="400">
                          {formatDate(attorney.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <Tooltip title="Delete attorney" arrow placement="top">
                          <IconButton
                            onClick={() => handleDeleteClick(attorney)}
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
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25]}
                      colSpan={7}
                      count={totalAttorneys}
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
          <DialogTitle>Delete Attorney</DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              Are you sure you want to delete the attorney "
              {attorneyToDelete?.fullName || "Untitled"}"?
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

        {/* Edit Attorney Dialog */}
        <Dialog
          open={editModalOpen}
          onClose={handleEditCancel}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Edit Attorney</DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
            >
              <TextField
                label="Full Name"
                name="fullName"
                value={editFormData.fullName}
                onChange={handleEditFormChange}
                fullWidth
                variant="outlined"
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={editFormData.email}
                onChange={handleEditFormChange}
                fullWidth
                variant="outlined"
              />
              <TextField
                label="Phone Number"
                name="phoneNumber"
                value={editFormData.phoneNumber}
                onChange={handleEditFormChange}
                fullWidth
                variant="outlined"
              />
              <TextField
                label="State"
                name="state"
                value={editFormData.state}
                onChange={handleEditFormChange}
                fullWidth
                variant="outlined"
              />
              <TextField
                label="City"
                name="city"
                value={editFormData.city}
                onChange={handleEditFormChange}
                fullWidth
                variant="outlined"
              />
              <TextField
                label="Legal Service"
                name="legalService"
                value={editFormData.legalService}
                onChange={handleEditFormChange}
                fullWidth
                variant="outlined"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditCancel} disabled={editing}>
              Cancel
            </Button>
            <Button
              onClick={handleEditConfirm}
              color="primary"
              variant="contained"
              disabled={editing}
              startIcon={
                editing ? <CircularProgress size={16} /> : <EditIcon />
              }
            >
              {editing ? "Updating..." : "Update"}
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
      </PageContainer>
    </RoleGuard>
  );
};

export default Attorneys;
