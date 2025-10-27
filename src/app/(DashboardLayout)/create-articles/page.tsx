"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  MenuButtonBold,
  MenuButtonItalic,
  MenuControlsContainer,
  MenuDivider,
  MenuSelectHeading,
  RichTextEditorProvider,
  RichTextField,
  MenuButtonStrikethrough,
  MenuButtonOrderedList,
  MenuButtonBulletedList,
  MenuButtonBlockquote,
  MenuButtonCode,
  MenuButtonHorizontalRule,
  MenuButtonUndo,
  MenuButtonRedo,
  MenuButtonRemoveFormatting,
} from "mui-tiptap";
import PageContainer from "@/app/components/container/PageContainer";
import { Box, Typography, Button, Stack, Paper } from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "./Tiptap.css";
import Thumbnail from "@/app/components/Thumbnail/Thumbnail";
import BlankCard from "@/app/components/shared/BlankCard";
import { Grid } from "@mui/system";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import StatusCard from "@/app/components/StatusCard/StatusCard";
import CategoryCard from "@/app/components/categoryCard/CategoryCard";
import apiClient from "@/utils/axios";

// Form data interface
interface FormData {
  title: string;
  subtitle: string;
  authorName: string;
  thumbnail: File[];
  status: number;
  category: number;
}

const CreateArticles = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [savedContent, setSavedContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [articleId, setArticleId] = useState<string | null>(null);
  const [articleData, setArticleData] = useState<any>(null);
  const [existingImages, setExistingImages] = useState<
    Array<{
      fileUrl: string;
      fileName: string;
      fileSize?: number;
    }>
  >([]);

  // Simple state for form data
  const [formData, setFormData] = useState<FormData>({
    title: "",
    subtitle: "",
    authorName: "",
    thumbnail: [],
    status: 0,
    category: 0,
  });
  const [uploadedFileData, setUploadedFileData] = useState<any>(null);

  // Error state for validation messages
  const [errors, setErrors] = useState<{
    title?: string;
    subtitle?: string;
    authorName?: string;
    content?: string;
    thumbnail?: string;
  }>({});

  const editor = useEditor({
    extensions: [StarterKit],
    // content: "<p>Start writing your article here...</p>",
    immediatelyRender: false, // Fix SSR hydration error
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Clear content error when user starts typing
  useEffect(() => {
    if (editor) {
      const handleUpdate = () => {
        if (errors.content && editor.getText().trim()) {
          setErrors({ ...errors, content: undefined });
        }
      };

      editor.on("update", handleUpdate);
      return () => {
        editor.off("update", handleUpdate);
      };
    }
  }, [editor, errors]);

  // Check for edit mode and fetch article data
  useEffect(() => {
    const edit = searchParams.get("edit");
    const id = searchParams.get("id");

    if (edit === "true" && id) {
      setIsEditMode(true);
      setArticleId(id);
      fetchArticleData(id);
    }
  }, [searchParams]);

  // Set editor content when editor is ready and we have article data
  useEffect(() => {
    if (editor && articleData && isEditMode) {
      const content =
        articleData.description ||
        articleData.content ||
        articleData.body ||
        "";
      console.log("Editor is ready, setting content:", content);

      // Clean and format the content for the editor
      const cleanContent = cleanHtmlContent(content);
      editor.commands.setContent(cleanContent);
    }
  }, [editor, articleData, isEditMode]);

  // Debug formData changes
  useEffect(() => {
    if (isEditMode) {
      console.log("FormData updated:", formData);
    }
  }, [formData, isEditMode]);

  // Fetch article data for editing
  const fetchArticleData = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/articles/${id}`);
      const article = response.data;

      console.log("Raw article data from API:", article);
      console.log("Available fields:", Object.keys(article));

      setArticleData(article);

      // Extract existing image information
      if (article.filePath) {
        const imageData = {
          fileUrl: article.filePath, // Assuming filePath is the full URL
          fileName: article.fileName || `article-${article.id}-image`,
          fileSize: article.fileSize || 0,
        };
        setExistingImages([imageData]);
        console.log("Existing image data:", imageData);
      } else {
        setExistingImages([]);
      }

      // Pre-fill form data
      const statusValue = getStatusValue(article.status);
      const categoryValue = getCategoryValue(article.category);

      console.log("Converted values:", {
        originalStatus: article.status,
        convertedStatus: statusValue,
        originalCategory: article.category,
        convertedCategory: categoryValue,
        description: article.description,
      });

      setFormData({
        title: article.title || "",
        subtitle: article.subtitle || "",
        authorName: article.authorName || "",
        thumbnail: [],
        status: statusValue,
        category: categoryValue,
      });

      // Set editor content with a delay to ensure editor is ready
      const content =
        article.description || article.content || article.body || "";
      if (content) {
        setTimeout(() => {
          if (editor) {
            console.log("Setting editor content:", content);
            // Clean and format the content for the editor
            const cleanContent = cleanHtmlContent(content);
            editor.commands.setContent(cleanContent);
          }
        }, 100);
      } else {
        console.log("No content found in article data");
      }

      console.log("Article data loaded for editing:", article);
    } catch (error) {
      console.error("Error fetching article data:", error);
      toast.error("Failed to load article data for editing");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to clean HTML content for the editor
  const cleanHtmlContent = (content: string) => {
    if (!content) return "";

    // Decode HTML entities
    const decoded = content
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ");

    return decoded;
  };

  // Helper functions to convert API values to form values
  const getStatusValue = (status: string) => {
    const statusMap = {
      draft: 0,
      archived: 1,
      published: 2,
    };
    return statusMap[status as keyof typeof statusMap] || 0;
  };

  const getCategoryValue = (category: string) => {
    const categoryMap = {
      "immigration-law": 0,
      "real-estate-law": 1,
      "corporate-business-law": 2,
      "family-divorce-law": 3,
      "estate-planning-wills": 4,
      "criminal-defense": 5,
      "personal-injury-law": 6,
      "employment-labor-law": 7,
      "not-sure-/-other": 8,
    };
    return categoryMap[category as keyof typeof categoryMap] || 0;
  };

  const handleSave = async () => {
    // Clear previous errors
    setErrors({});

    // Simple validation
    const newErrors: {
      title?: string;
      subtitle?: string;
      authorName?: string;
      content?: string;
      thumbnail?: string;
    } = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.subtitle.trim()) {
      newErrors.subtitle = "Subtitle is required";
    } else if (formData.subtitle.length > 250) {
      newErrors.subtitle = "Subtitle must be 250 characters or less";
    }
    if (!formData.authorName.trim()) {
      newErrors.authorName = "Author name is required";
    }
    if (!editor?.getText().trim()) {
      newErrors.content = "Article content is required";
    }
    // Check for thumbnail - either new uploads or existing images in edit mode
    const hasNewThumbnails = formData.thumbnail.length > 0;
    const hasExistingImages = isEditMode && existingImages.length > 0;

    if (!hasNewThumbnails && !hasExistingImages) {
      newErrors.thumbnail = "Thumbnail is required";
    }

    // If there are errors, set them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (editor) {
      const content = editor.getHTML();

      // Prepare API request body
      const apiRequestBody = {
        title: formData.title,
        subtitle: formData.subtitle,
        authorName: formData.authorName,
        slug: generateSlug(formData.title),
        description: content,
        filePath:
          uploadedFileData?.fileUrl ||
          (isEditMode && existingImages.length > 0
            ? existingImages[0].fileUrl
            : undefined),
        category: getCategoryText(formData.category)
          .toLowerCase()
          .replace(/[\s&]+/g, "-"),
        status: getStatusText(formData.status).toLowerCase(),
      };

      // Log all data to console

      // Call API to save or update article
      try {
        if (isEditMode && articleId) {
          await updateArticle(articleId, apiRequestBody);
        } else {
          await saveArticle(apiRequestBody);
        }
        setSavedContent(content);
      } catch (error) {
        // Error is already handled in saveArticle/updateArticle function
      }
    }
  };

  const getStatusText = (statusValue: number) => {
    const statusMap = {
      0: "Draft",
      1: "Archived",
      2: "Published",
    };
    return statusMap[statusValue as keyof typeof statusMap] || "Unknown";
  };

  const getCategoryText = (categoryValue: number) => {
    const categoryMap = {
      0: "Immigration Law",
      1: "Real Estate Law",
      2: "Corporate & Business Law",
      3: "Family & Divorce Law",
      4: "Estate Planning & Wills",
      5: "Criminal Defense",
      6: "Personal Injury Law",
      7: "Employment & Labor Law",
      8: "Not Sure / Other",
    };
    return categoryMap[categoryValue as keyof typeof categoryMap] || "Unknown";
  };

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .trim();
  };

  // Generate file path for uploaded image
  const generateFilePath = (file: File) => {
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    return `userId/${timestamp}-${file.name}`;
  };

  // API call to save article
  const saveArticle = async (articleData: any) => {
    try {
      setIsLoading(true);

      const response = await apiClient.post("/articles", articleData);

      console.log("Article saved successfully:", response.data);
      toast.success("Article saved successfully!");

      // Redirect to articles page after successful save
      setTimeout(() => {
        router.push("/articles");
      }, 1500); // Wait 1.5 seconds to show the success message

      return response.data;
    } catch (error: any) {
      console.error(
        "Error saving article:",
        error.response?.data || error.message
      );
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to save article. Please try again.";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // API call to update article
  const updateArticle = async (id: string, articleData: any) => {
    try {
      setIsLoading(true);

      const response = await apiClient.post(`/articles/${id}`, articleData);

      console.log("Article updated successfully:", response.data);
      toast.success("Article updated successfully!");

      // Redirect to articles page after successful update
      setTimeout(() => {
        router.push("/articles");
      }, 1500); // Wait 1.5 seconds to show the success message

      return response.data;
    } catch (error: any) {
      console.error(
        "Error updating article:",
        error.response?.data || error.message
      );
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update article. Please try again.";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    if (editor) {
      editor.commands.clearContent();
      setSavedContent("");
    }
  };

  if (!mounted) {
    return (
      <PageContainer title="Articles">
        <Box sx={{ maxWidth: 1200, mx: "auto" }}>
          <Typography variant="h4" gutterBottom>
            {isEditMode ? "Edit Article" : "Article Editor"}
          </Typography>
          <Box sx={{ p: 3, textAlign: "center" }}>Loading editor...</Box>
        </Box>
      </PageContainer>
    );
  }

  return (
    <Box p={3}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <BlankCard>
          <Box sx={{ maxWidth: 800, padding: 3, height: "fit-content" }}>
            <Typography variant="h4" gutterBottom>
              {isEditMode ? "Edit Article" : "Article Editor"}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Create and edit your articles using the rich text editor below.
            </Typography>

            <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
              <Grid display="flex" alignItems="center" size={12}>
                <CustomFormLabel htmlFor="p_name" sx={{ mt: 0 }}>
                  Article Title{" "}
                  <Typography color="error.main" component="span">
                    *
                  </Typography>
                </CustomFormLabel>
              </Grid>
              <Grid size={12}>
                <CustomTextField
                  id="p_name"
                  placeholder="Article Title"
                  fullWidth
                  value={formData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setFormData({ ...formData, title: e.target.value });
                    // Clear error when user starts typing
                    if (errors.title) {
                      setErrors({ ...errors, title: undefined });
                    }
                  }}
                  error={!!errors.title}
                  helperText={errors.title}
                />
              </Grid>
              <Grid display="flex" alignItems="center" size={12} mt={2}>
                <CustomFormLabel htmlFor="subtitle" sx={{ mt: 0 }}>
                  Article Subtitle{" "}
                  <Typography color="error.main" component="span">
                    *
                  </Typography>
                </CustomFormLabel>
              </Grid>
              <Grid size={12}>
                <CustomTextField
                  id="subtitle"
                  placeholder="Article Subtitle"
                  fullWidth
                  value={formData.subtitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const value = e.target.value;
                    if (value.length <= 250) {
                      setFormData({ ...formData, subtitle: value });
                      // Clear error when user starts typing
                      if (errors.subtitle) {
                        setErrors({ ...errors, subtitle: undefined });
                      }
                    }
                  }}
                  error={!!errors.subtitle}
                  helperText={
                    errors.subtitle ||
                    `${formData.subtitle.length}/250 characters`
                  }
                  inputProps={{ maxLength: 250 }}
                />
              </Grid>
              <Grid display="flex" alignItems="center" size={12} mt={2}>
                <CustomFormLabel htmlFor="authorName" sx={{ mt: 0 }}>
                  Author Name{" "}
                  <Typography color="error.main" component="span">
                    *
                  </Typography>
                </CustomFormLabel>
              </Grid>
              <Grid size={12}>
                <CustomTextField
                  id="authorName"
                  placeholder="Author Name"
                  fullWidth
                  value={formData.authorName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setFormData({ ...formData, authorName: e.target.value });
                    // Clear error when user starts typing
                    if (errors.authorName) {
                      setErrors({ ...errors, authorName: undefined });
                    }
                  }}
                  error={!!errors.authorName}
                  helperText={errors.authorName}
                />
              </Grid>
              <Grid display="flex" alignItems="center" size={12} mt={2}>
                <CustomFormLabel htmlFor="content">
                  Article Content{" "}
                  <Typography color="error.main" component="span">
                    *
                  </Typography>
                </CustomFormLabel>
              </Grid>
              <RichTextEditorProvider editor={editor}>
                <RichTextField
                  controls={
                    <MenuControlsContainer>
                      <MenuSelectHeading />
                      <MenuDivider />
                      <MenuButtonBold />
                      <MenuButtonItalic />
                      <MenuButtonStrikethrough />
                      <MenuDivider />
                      <MenuButtonOrderedList />
                      <MenuButtonBulletedList />
                      <MenuDivider />
                      <MenuButtonBlockquote />
                      <MenuButtonCode />
                      <MenuButtonHorizontalRule />
                      <MenuDivider />
                      <MenuButtonUndo />
                      <MenuButtonRedo />
                      <MenuDivider />
                      <MenuButtonRemoveFormatting />
                    </MenuControlsContainer>
                  }
                  sx={{
                    minHeight: "300px",
                    "& .ProseMirror": {
                      minHeight: "250px",
                    },
                  }}
                />
              </RichTextEditorProvider>
              {errors.content && (
                <Typography
                  variant="body2"
                  color="error.main"
                  sx={{ mt: 1, ml: 1 }}
                >
                  {errors.content}
                </Typography>
              )}
            </Paper>

            <Stack direction="row" spacing={2} sx={{ mb: 3, paddingInline: 3 }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading
                  ? isEditMode
                    ? "Updating..."
                    : "Saving..."
                  : isEditMode
                  ? "Update Article"
                  : "Save Article"}
              </Button>
              <Button
                variant="outlined"
                onClick={handleClear}
                // disabled={!editor?.getText().trim()}
              >
                Clear
              </Button>
            </Stack>
          </Box>
        </BlankCard>

        <Box sx={{ paddingLeft: 3, width: "400px", flexShrink: 0 }}>
          <BlankCard>
            <Thumbnail
              onFilesChange={(files) => {
                setFormData({ ...formData, thumbnail: files });
                // Clear error when user uploads files
                if (errors.thumbnail) {
                  setErrors({ ...errors, thumbnail: undefined });
                }
              }}
              onUploadSuccess={(uploadData) => {
                setUploadedFileData(uploadData);
                console.log("File uploaded successfully:", uploadData);
              }}
              error={!!errors.thumbnail}
              helperText={errors.thumbnail}
              existingImages={existingImages}
            />
          </BlankCard>
          <Box sx={{ marginBlock: 3 }}>
            <BlankCard>
              <StatusCard
                value={formData.status}
                onChange={(value: number) =>
                  setFormData({ ...formData, status: value })
                }
              />
            </BlankCard>
          </Box>
          <BlankCard>
            <CategoryCard
              value={formData.category}
              onChange={(value: number) =>
                setFormData({ ...formData, category: value })
              }
            />
          </BlankCard>
        </Box>
      </Box>

      {/* React Toastify Container */}
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Box>
  );
};

export default CreateArticles;
