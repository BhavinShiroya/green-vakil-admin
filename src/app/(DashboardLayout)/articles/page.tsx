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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import Link from "next/link";

import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";

import { Stack } from "@mui/system";
import BlankCard from "@/app/components/shared/BlankCard";
import { useEffect, useState } from "react";
import apiClient from "@/utils/axios";

// Define the article interface based on the API response
interface Article {
  id: string;
  title: string;
  slug: string;
  description: string;
  filePath: string;
  category: string;
  status: string;
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

const Articles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalArticles, setTotalArticles] = useState(0);

  // Category filter state
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Image preview dialog state
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const fetchArticles = async (
    currentPage: number,
    limit: number,
    category: string = "",
    status: string = ""
  ) => {
    try {
      setLoading(true);

      const params: any = {
        sortBy: "createdAt:desc",
        limit: limit,
        page: currentPage + 1, // API is 1-indexed, MUI pagination is 0-indexed
      };

      // Only add filter parameters if they are selected
      if (category && category.trim() !== "") {
        params.category = category;
      }
      if (status && status.trim() !== "") {
        params.status = status;
      }

      const response = await apiClient.get("/articles", {
        params: params,
      });

      console.log("Articles API Response:", response.data);
      console.log("Articles data:", response.data.results);

      setArticles(response.data.results || []);
      setTotalArticles(response.data.totalResults || 0);
    } catch (error) {
      console.error("Error fetching articles:", error);
      setArticles([]);
      setTotalArticles(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles(page, rowsPerPage, categoryFilter, statusFilter);
  }, [page, rowsPerPage, categoryFilter, statusFilter]);

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

  // Category filter handler
  const handleCategoryFilterChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCategoryFilter(event.target.value);
    setPage(0); // Reset to first page when filtering
  };

  // Status filter handler
  const handleStatusFilterChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setStatusFilter(event.target.value);
    setPage(0); // Reset to first page when filtering
  };

  // Generate article image URL from file path
  const getArticleImageUrl = (filePath: string) => {
    if (!filePath) return null;
    // If filePath is already a full URL, return it
    if (filePath.startsWith("http")) return filePath;

    // Try different possible URL constructions
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const possibleUrls = [
      `${baseUrl}/uploads/${filePath}`,
      `${baseUrl}/images/${filePath}`,
      `${baseUrl}/public/uploads/${filePath}`,
      `${baseUrl}/static/uploads/${filePath}`,
      filePath, // Try the filePath as-is
    ];

    console.log("File path:", filePath);
    console.log("Possible URLs:", possibleUrls);

    // Return the first URL for now, we'll add fallback logic
    return possibleUrls[0];
  };

  // Fallback to random avatar if no image
  const getRandomAvatar = (index: number) => {
    const avatarIndex = (index % 10) + 1;
    return `/images/profile/user-${avatarIndex}.jpg`;
  };

  // Get status color based on status
  const getStatusChipColor = (status: string) => {
    if (!status) return "default";
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("published")) return "success";
    if (lowerStatus.includes("draft")) return "warning";
    if (lowerStatus.includes("inactive")) return "error";
    if (lowerStatus.includes("active")) return "primary";
    return "default";
  };

  // Get category color
  const getCategoryChipColor = (category: string) => {
    if (!category) return "default";
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes("immigration")) return "primary";
    if (lowerCategory.includes("real estate")) return "success";
    if (lowerCategory.includes("corporate")) return "warning";
    if (lowerCategory.includes("family")) return "error";
    if (lowerCategory.includes("estate planning")) return "info";
    if (lowerCategory.includes("criminal")) return "error";
    if (lowerCategory.includes("personal injury")) return "warning";
    if (lowerCategory.includes("employment")) return "primary";
    return "default";
  };

  // Format date and time
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Truncate text for display
  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Handle image preview
  const handleImageClick = (filePath: string) => {
    const imageUrl = getArticleImageUrl(filePath);
    if (imageUrl) {
      setPreviewImage(imageUrl);
      setPreviewOpen(true);
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewImage(null);
  };

  return (
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
            Articles Management
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
                label="Filter by Category"
                variant="outlined"
                size="small"
                select
                value={categoryFilter}
                onChange={handleCategoryFilterChange}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="immigration-law">Immigration Law</MenuItem>
                <MenuItem value="real-estate-law">Real Estate Law</MenuItem>
                <MenuItem value="corporate-&-business-law">
                  Corporate & Business Law
                </MenuItem>
                <MenuItem value="family-&-divorce-law">
                  Family & Divorce Law
                </MenuItem>
                <MenuItem value="estate-planning-&-wills">
                  Estate Planning & Wills
                </MenuItem>
                <MenuItem value="criminal-defense">Criminal Defense</MenuItem>
                <MenuItem value="personal-injury-law">
                  Personal Injury Law
                </MenuItem>
                <MenuItem value="employment-&-labor-law">
                  Employment & Labor Law
                </MenuItem>
                <MenuItem value="not-sure-/-other">Not Sure / Other</MenuItem>
              </TextField>

              <TextField
                label="Filter by Status"
                variant="outlined"
                size="small"
                select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="active">Active</MenuItem>
              </TextField>
            </Stack>

            <Button
              variant="contained"
              component={Link}
              href="/create-articles"
            >
              Create Articles
            </Button>
          </Stack>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer sx={{ maxWidth: "100%", overflow: "hidden" }}>
            <Table
              aria-label="articles pagination table"
              sx={{
                tableLayout: "fixed",
                width: "100%",
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: "20%" }}>
                    <Typography variant="h6">Title</Typography>
                  </TableCell>
                  <TableCell sx={{ width: "15%" }}>
                    <Typography variant="h6">Slug</Typography>
                  </TableCell>
                  <TableCell sx={{ width: "15%" }}>
                    <Typography variant="h6">Category</Typography>
                  </TableCell>
                  <TableCell sx={{ width: "10%" }}>
                    <Typography variant="h6">Status</Typography>
                  </TableCell>
                  <TableCell sx={{ width: "40%", textAlign: "center" }}>
                    <Typography variant="h6">Image</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {articles.map((article, index) => (
                  <TableRow key={article.id}>
                    <TableCell>
                      <Tooltip
                        title={article.title || "No title"}
                        arrow
                        placement="top"
                      >
                        <Typography variant="subtitle2" fontWeight="400">
                          {truncateText(article.title || "No title", 30)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title={article.slug || "No slug"}
                        arrow
                        placement="top"
                      >
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          sx={{
                            fontFamily: "monospace",
                            fontSize: "0.75rem",
                            backgroundColor: "grey.100",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            display: "inline-block",
                            maxWidth: "100%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {article.slug || "No slug"}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title={`Category: ${article.category || "No category"}`}
                        arrow
                        placement="top"
                      >
                        <Chip
                          color={getCategoryChipColor(article.category || "")}
                          sx={{
                            borderRadius: "6px",
                            cursor: "pointer",
                            textTransform: "capitalize",
                          }}
                          size="small"
                          label={(article.category || "No category").replace(
                            /-/g,
                            " "
                          )}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title={`Status: ${article.status || "No status"}`}
                        arrow
                        placement="top"
                      >
                        <Chip
                          color={getStatusChipColor(article.status || "")}
                          sx={{
                            borderRadius: "6px",
                            cursor: "pointer",
                            textTransform: "capitalize",
                          }}
                          size="small"
                          label={article.status || "No status"}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: "80px",
                          width: "100%",
                        }}
                      >
                        <Box
                          component="img"
                          src={
                            article.filePath
                              ? getArticleImageUrl(article.filePath) || ""
                              : getRandomAvatar(index)
                          }
                          alt={article.title || "Article image"}
                          sx={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "cover",
                            borderRadius: 1,
                            cursor: "pointer",
                            border: "1px solid",
                            borderColor: "divider",
                            backgroundColor: "grey.100",
                            "&:hover": {
                              opacity: 0.8,
                              transform: "scale(1.02)",
                              transition: "all 0.2s ease-in-out",
                            },
                          }}
                          onClick={() =>
                            article.filePath &&
                            handleImageClick(article.filePath)
                          }
                          onLoad={() => {
                            console.log(
                              "Image loaded successfully:",
                              article.filePath || "fallback"
                            );
                          }}
                          onError={(e) => {
                            console.error("Image failed to load:", {
                              filePath: article.filePath,
                              constructedUrl: getArticleImageUrl(
                                article.filePath || ""
                              ),
                              error: e,
                            });
                            // Show a fallback image
                            e.currentTarget.src = getRandomAvatar(index);
                          }}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    colSpan={5}
                    count={totalArticles}
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

      {/* Image Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Article Image Preview</DialogTitle>
        <DialogContent>
          {previewImage && (
            <Box
              component="img"
              src={previewImage}
              alt="Article preview"
              sx={{
                width: "100%",
                height: "auto",
                maxHeight: "70vh",
                objectFit: "contain",
                borderRadius: 1,
              }}
              onError={(e) => {
                console.error("Image failed to load:", previewImage);
                e.currentTarget.style.display = "none";
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Articles;
