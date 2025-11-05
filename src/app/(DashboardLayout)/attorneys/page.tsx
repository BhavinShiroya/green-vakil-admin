"use client";

import * as React from "react";
import { useTheme } from "@mui/material/styles";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
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
  MenuItem,
  Autocomplete,
} from "@mui/material";

import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Stack } from "@mui/system";
import BlankCard from "@/app/components/shared/BlankCard";
import { useEffect, useState } from "react";
import apiClient from "@/utils/axios";
import RoleGuard from "@/app/components/RoleGuard";
import PageContainer from "@/app/components/container/PageContainer";
import { State, City } from "country-state-city";

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

  // Add modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [adding, setAdding] = useState(false);

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

  // Validation schema for add attorney form
  const addAttorneySchema = yup.object().shape({
    fullName: yup.string().required("Full name is required"),
    email: yup
      .string()
      .email("Invalid email address")
      .required("Email is required"),
    phone: yup
      .string()
      .required("Phone number is required")
      .test(
        "phone-format",
        "Phone number must be in format: XXX-XXX-XXXX",
        function (value) {
          if (!value || value === "") return true; // Allow empty
          return /^\d{3}-\d{3}-\d{4}$/.test(value);
        }
      ),
    state: yup.string().required("State is required"),
    city: yup
      .string()
      .nullable()
      .required("City is required")
      .transform((value) => value || ""),
    legalService: yup.string().required("Legal service is required"),
  });

  // State and city dropdown state
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string>("");

  // React Hook Form setup for add attorney
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    trigger,
  } = useForm({
    resolver: yupResolver(addAttorneySchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      state: "",
      city: "",
      legalService: "",
    },
  });

  // Initialize US states
  useEffect(() => {
    const usStates = State.getStatesOfCountry("US");
    setStates(usStates.map((state) => state.name));
  }, []);

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

  // Handle add attorney
  const handleAddClick = () => {
    setAddModalOpen(true);
  };

  const handleAddClose = () => {
    setAddModalOpen(false);
    reset();
    setSelectedState("");
    setCities([]);
  };

  const onSubmitAddAttorney = async (data: any) => {
    try {
      setAdding(true);
      await apiClient.post("/attorneys", {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phone,
        state: data.state,
        city: data.city,
        legalService: data.legalService,
      });

      // Refresh the attorneys list
      await fetchAttorneys(page, rowsPerPage);

      // Close modal and reset form
      handleAddClose();

      // Show success toast
      toast.success("Attorney added successfully!");
    } catch (error: any) {
      console.error("Error adding attorney:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to add attorney. Please try again.";
      toast.error(errorMessage);
    } finally {
      setAdding(false);
    }
  };

  // Legal services options
  const legalServices = [
    "Immigration Law",
    "Real Estate Law",
    "Corporate Business Law",
    "Family Divorce Law",
    "Estate Planning Wills",
    "Criminal Defense",
    "Personal Injury Law",
    "Employment Labor Law",
    "Not Sure / Other",
  ];

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
        <Box
          sx={{
            mb: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
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
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            sx={{
              textTransform: "none",
            }}
          >
            Add Attorney
          </Button>
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

        {/* Add Attorney Dialog */}
        <Dialog
          open={addModalOpen}
          onClose={handleAddClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add Attorney</DialogTitle>
          <DialogContent>
            <Box
              component="form"
              onSubmit={handleSubmit(onSubmitAddAttorney)}
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
            >
              {/* First Name and Email in one row */}
              <Box sx={{ display: "flex", gap: 2 }}>
                <Controller
                  name="fullName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Full Name"
                      fullWidth
                      variant="outlined"
                      error={!!errors.fullName}
                      helperText={errors.fullName?.message}
                    />
                  )}
                />
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email"
                      type="email"
                      fullWidth
                      variant="outlined"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Box>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Phone Number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                    inputProps={{
                      maxLength: 12,
                    }}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Remove all non-digit characters
                      const digits = value.replace(/\D/g, "");
                      // Limit to 10 digits
                      const limitedDigits = digits.slice(0, 10);
                      // Format as XXX-XXX-XXXX
                      let formatted = "";
                      if (limitedDigits.length > 0) {
                        if (limitedDigits.length <= 3) {
                          formatted = limitedDigits;
                        } else if (limitedDigits.length <= 6) {
                          formatted = `${limitedDigits.slice(
                            0,
                            3
                          )}-${limitedDigits.slice(3)}`;
                        } else {
                          formatted = `${limitedDigits.slice(
                            0,
                            3
                          )}-${limitedDigits.slice(3, 6)}-${limitedDigits.slice(
                            6
                          )}`;
                        }
                      }
                      field.onChange(formatted);
                    }}
                  />
                )}
              />
              {/* State and City in one row */}
              <Box sx={{ display: "flex", gap: 2 }}>
                <Controller
                  name="state"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={states}
                      value={selectedState || null}
                      sx={{ width: "100%" }}
                      onChange={(event, newValue) => {
                        const stateValue = newValue || "";
                        field.onChange(stateValue);
                        setSelectedState(stateValue);

                        setValue("city", "" as any); // Clear city form field
                        trigger("city"); // Revalidate city field
                        if (newValue === "American Samoa") {
                          setCities(["Pago Pago", "Tafuna", "Leone"]);
                        } else if (newValue === "Baker Island") {
                          setCities(["Baker City"]);
                        } else if (newValue === "Wake Island") {
                          setCities(["Wake City"]);
                        } else if (
                          newValue === "United States Virgin Islands"
                        ) {
                          setCities([
                            "Charlotte Amalie",
                            "Christiansted",
                            "Frederiksted",
                          ]);
                        } else if (
                          newValue === "United States Minor Outlying Islands"
                        ) {
                          setCities(["Johnston Atoll", "Kingman Reef"]);
                        } else if (newValue === "Palmyra Atoll") {
                          setCities(["Cooper Island"]);
                        } else if (newValue === "Northern Mariana Islands") {
                          setCities(["Saipan", "Tinian", "Rota"]);
                        } else if (newValue === "Navassa Island") {
                          setCities(["Navassa City"]);
                        } else if (newValue === "Midway Atoll") {
                          setCities(["Sand Island"]);
                        } else if (newValue === "Jarvis Island") {
                          setCities(["Jarvis City"]);
                        } else if (newValue === "Johnston Atoll") {
                          setCities(["Johnston City"]);
                        } else if (newValue === "Howland Island") {
                          setCities(["Howland City"]);
                        } else if (newValue === "Kingman Reef") {
                          setCities(["Kingman City"]);
                        } else if (newValue) {
                          const selectedStateObj = State.getStatesOfCountry(
                            "US"
                          ).find((state) => state.name === newValue);
                          const stateCode = selectedStateObj?.isoCode;
                          if (stateCode) {
                            const citiesInState = City.getCitiesOfState(
                              "US",
                              stateCode
                            );
                            setCities(citiesInState.map((city) => city.name));
                          }
                        } else {
                          setCities([]);
                        }
                      }}
                      onInputChange={(event, newInputValue) => {
                        // Update selectedState when user types, so city field gets enabled
                        setSelectedState(newInputValue);
                        field.onChange(newInputValue || "");
                        // Clear city when state input is cleared or changed
                        setValue("city", "" as any);
                        trigger("city");
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="State"
                          variant="outlined"
                          fullWidth
                          error={!!errors.state}
                          helperText={errors.state ? errors.state.message : ""}
                        />
                      )}
                    />
                  )}
                />

                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      freeSolo
                      {...field}
                      options={cities}
                      value={(watch("city") as unknown as string) || ""}
                      sx={{ width: "100%" }}
                      onChange={(event, newValue) => {
                        field.onChange(newValue || "");
                        // Trigger validation to clear any errors
                        trigger("city");
                      }}
                      onInputChange={(event, newInputValue) => {
                        // Update form field value when user types custom city
                        field.onChange(newInputValue || "");

                        // Trigger validation to clear any errors
                        trigger("city");
                      }}
                      disabled={!watch("state")}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="City"
                          variant="outlined"
                          fullWidth
                          error={!!errors.city}
                          helperText={errors.city ? errors.city.message : ""}
                        />
                      )}
                    />
                  )}
                />
              </Box>
              <Controller
                name="legalService"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Legal Service"
                    select
                    fullWidth
                    variant="outlined"
                    error={!!errors.legalService}
                    helperText={errors.legalService?.message}
                  >
                    {legalServices.map((service) => (
                      <MenuItem key={service} value={service}>
                        {service}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAddClose} disabled={adding}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmitAddAttorney)}
              color="primary"
              variant="contained"
              disabled={adding}
              startIcon={adding ? <CircularProgress size={16} /> : <AddIcon />}
            >
              {adding ? "Adding..." : "Save"}
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
