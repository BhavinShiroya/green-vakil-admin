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
} from "@mui/material";

import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ParentCard from "@/app/components/shared/ParentCard";
import { Stack } from "@mui/system";
import BlankCard from "@/app/components/shared/BlankCard";
import { useEffect, useState } from "react";
import apiClient from "@/utils/axios";

// Define the contact interface based on the actual API response
interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  legalService: string;
  email: string;
  phoneNumber: string;
  state: string;
  city: string;
  message: string;
  createdAt: string;
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

const Contact = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalContacts, setTotalContacts] = useState(0);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchContacts = async (currentPage: number, limit: number) => {
    try {
      setLoading(true);

      const response = await apiClient.get("/contacts", {
        params: {
          sortBy: "createdAt:desc",
          limit: limit,
          page: currentPage + 1, // API is 1-indexed, MUI pagination is 0-indexed
          // createdAt: "desc",
        },
      });

      setContacts(response.data.results || []);
      setTotalContacts(response.data.totalResults || 0);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setContacts([]);
      setTotalContacts(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts(page, rowsPerPage);
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

  // Generate a random avatar for contacts
  const getRandomAvatar = (index: number) => {
    const avatarIndex = (index % 10) + 1;
    return `/images/profile/user-${avatarIndex}.jpg`;
  };

  // Get status color based on legal service
  const getServiceChipColor = (service: string) => {
    const lowerService = service.toLowerCase();
    if (lowerService.includes("immigration")) return "primary";
    if (lowerService.includes("business")) return "success";
    if (lowerService.includes("family")) return "warning";
    if (lowerService.includes("criminal")) return "error";
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

  // Handle delete contact
  const handleDeleteClick = (contact: Contact) => {
    setContactToDelete(contact);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contactToDelete) return;

    try {
      setDeleting(true);
      await apiClient.delete(`/contacts/${contactToDelete.id}`);

      // Remove the contact from the local state
      setContacts((prev) =>
        prev.filter((contact) => contact.id !== contactToDelete.id)
      );
      setTotalContacts((prev) => prev - 1);

      // Close modal
      setDeleteModalOpen(false);
      setContactToDelete(null);

      // Show success toast
      toast.success("Client deleted successfully!");
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Failed to delete client. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setContactToDelete(null);
  };

  return (
    // <ParentCard title="Contacts Management">
    <>
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
            Clients Management
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
              aria-label="contacts pagination table"
              sx={{
                tableLayout: "fixed",
                width: "100%",
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: "15%" }}>
                    <Typography variant="h6">Name</Typography>
                  </TableCell>
                  <TableCell sx={{ width: "13%" }}>
                    <Typography variant="h6">Legal Service</Typography>
                  </TableCell>
                  <TableCell sx={{ width: "15%" }}>
                    <Typography variant="h6">Email</Typography>
                  </TableCell>
                  <TableCell sx={{ width: "13%" }}>
                    <Typography variant="h6">Phone</Typography>
                  </TableCell>
                  <TableCell sx={{ width: "12%" }}>
                    <Typography variant="h6">Location</Typography>
                  </TableCell>
                  <TableCell sx={{ width: "20%" }}>
                    <Typography variant="h6">Message</Typography>
                  </TableCell>
                  <TableCell sx={{ width: "12%" }}>
                    <Typography variant="h6">Date / time</Typography>
                  </TableCell>
                  <TableCell sx={{ width: "8%", textAlign: "center" }}>
                    <Typography variant="h6">Actions</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contacts.map((contact, index) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <Tooltip
                        title={`${contact.firstName} ${contact.lastName}`}
                        arrow
                        placement="top"
                      >
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar
                            src={getRandomAvatar(index)}
                            alt={`${contact.firstName} ${contact.lastName}`}
                          />
                          <Box>
                            <Typography variant="subtitle2" fontWeight="400">
                              {contact.firstName} {contact.lastName}
                            </Typography>
                          </Box>
                        </Stack>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title={`${contact.legalService}`}
                        arrow
                        placement="top"
                      >
                        <Chip
                          color={getServiceChipColor(contact.legalService)}
                          sx={{
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                          size="small"
                          label={contact.legalService}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={contact.email} arrow placement="top">
                        <Typography
                          color="textSecondary"
                          variant="subtitle2"
                          fontWeight="400"
                          sx={{
                            overflow: "hidden",
                            // textOverflow: "ellipsis",
                            // whiteSpace: "nowrap",
                            cursor: "pointer",
                          }}
                        >
                          {contact.email}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title={contact.phoneNumber}
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
                          {contact.phoneNumber}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title={`${contact.city}, ${contact.state}`}
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
                            {contact.city}
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
                            {contact.state}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={contact.message} arrow placement="top">
                        <Typography
                          color="textSecondary"
                          variant="subtitle2"
                          fontWeight="400"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            // whiteSpace: "nowrap",
                            cursor: "pointer",
                          }}
                        >
                          {contact.message}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="400">
                        {formatDate(contact.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      <Tooltip title="Delete client" arrow placement="top">
                        <IconButton
                          onClick={() => handleDeleteClick(contact)}
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
                    colSpan={8}
                    count={totalContacts}
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
        <DialogTitle>Delete Client</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the client "
            {contactToDelete
              ? `${contactToDelete.firstName} ${contactToDelete.lastName}`
              : "Untitled"}
            "?
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
      {/* </ParentCard> */}
    </>
  );
};

export default Contact;
