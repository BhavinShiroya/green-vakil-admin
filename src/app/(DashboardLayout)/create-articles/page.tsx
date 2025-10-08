"use client";
import React, { useState, useEffect } from "react";
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
  thumbnail: File[];
  status: number;
  category: number;
}

const CreateArticles = () => {
  const [mounted, setMounted] = useState(false);
  const [savedContent, setSavedContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Simple state for form data
  const [formData, setFormData] = useState<FormData>({
    title: "",
    thumbnail: [],
    status: 0,
    category: 0,
  });
  const [uploadedFileData, setUploadedFileData] = useState<any>(null);

  // Error state for validation messages
  const [errors, setErrors] = useState<{
    title?: string;
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

  const handleSave = async () => {
    // Clear previous errors
    setErrors({});

    // Simple validation
    const newErrors: {
      title?: string;
      content?: string;
      thumbnail?: string;
    } = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!editor?.getText().trim()) {
      newErrors.content = "Article content is required";
    }
    if (formData.thumbnail.length === 0) {
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
        slug: generateSlug(formData.title),
        description: content,
        filePath: uploadedFileData?.fileUrl,
        category: getCategoryText(formData.category)
          .toLowerCase()
          .replace(/\s+/g, "-"),
        status: getStatusText(formData.status).toLowerCase(),
      };

      // Log all data to console
      console.log("Article Form Data:", {
        title: formData.title,
        content: content,
        thumbnail: formData.thumbnail,
        status: formData.status,
        category: formData.category,
        statusText: getStatusText(formData.status),
        categoryText: getCategoryText(formData.category),
        filePath: "Using real Unsplash image URL",
      });

      console.log("API Request Body:", apiRequestBody);

      // Call API to save article
      try {
        await saveArticle(apiRequestBody);
        setSavedContent(content);
      } catch (error) {
        // Error is already handled in saveArticle function
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
            Article Editor
          </Typography>
          <Box sx={{ p: 3, textAlign: "center" }}>Loading editor...</Box>
        </Box>
      </PageContainer>
    );
  }

  return (
    <Box p={3}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <BlankCard>
          <Box sx={{ maxWidth: 800, padding: 3 }}>
            <Typography variant="h4" gutterBottom>
              Article Editor
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
                {isLoading ? "Saving..." : "Save Article"}
              </Button>
              <Button
                variant="outlined"
                onClick={handleClear}
                disabled={!editor?.getText().trim()}
              >
                Clear
              </Button>
            </Stack>
          </Box>
        </BlankCard>

        <Box sx={{ paddingLeft: 3 }}>
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
