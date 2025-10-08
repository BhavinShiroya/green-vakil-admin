"use client";
import React, { useState } from "react";
import Box from "@mui/material/Box";
import { Typography, useTheme, Chip, CircularProgress } from "@mui/material";
import { useDropzone } from "react-dropzone";
import apiClient from "@/utils/axios";

interface ThumbnailProps {
  onFilesChange?: (files: File[]) => void;
  onUploadSuccess?: (uploadData: any) => void;
  error?: boolean;
  helperText?: string;
  existingImages?: Array<{
    fileUrl: string;
    fileName: string;
    fileSize?: number;
  }>;
}

interface UploadResponse {
  fileUrl: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

const Thumbnail = ({
  onFilesChange,
  onUploadSuccess,
  error,
  helperText,
  existingImages = [],
}: ThumbnailProps) => {
  const theme = useTheme();
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadResponse[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      // Clear any previous errors for this file
      setUploadErrors((prev) =>
        prev.filter((error) => !error.includes(file.name))
      );

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", file);

      // Upload file to get file URL
      const uploadResponse = await apiClient.post("/upload/file", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Prepare the upload data according to the API spec
      const uploadData = {
        fileUrl: uploadResponse.data.fileUrl || uploadResponse.data.url,
        filePath:
          uploadResponse.data.filePath || `uploads/${Date.now()}-${file.name}`,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      };

      console.log("File uploaded successfully:", uploadData);

      // Add to uploaded files
      setUploadedFiles((prev) => [...prev, uploadData]);

      // Clear any previous errors for this specific file
      setUploadErrors((prev) =>
        prev.filter((error) => !error.includes(file.name))
      );

      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess(uploadData);
      }

      return uploadData;
    } catch (error: any) {
      console.error("Error uploading file:", error);

      // Add error message to state
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        `Failed to upload ${file.name}`;

      setUploadErrors((prev) => [...prev, `${file.name}: ${errorMessage}`]);

      throw error;
    } finally {
      setUploading(false);
    }
  };

  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    multiple: true, // Enable multiple file selection
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    onDrop: async (files) => {
      // Clear all previous errors when new files are dropped
      setUploadErrors([]);

      if (onFilesChange) {
        onFilesChange(files);
      }

      // Upload each file
      for (const file of files) {
        try {
          await uploadFile(file);
        } catch (error) {
          console.error("Failed to upload file:", file.name, error);
        }
      }
    },
  });

  const files = acceptedFiles.map((file: File, i) => {
    const uploadedFile = uploadedFiles.find((uf) => uf.fileName === file.name);

    return (
      <Box
        key={i}
        py={1}
        mt={2}
        sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={1}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body1" fontWeight="500">
              {file.name}
            </Typography>
            {uploading && !uploadedFile && <CircularProgress size={16} />}
            {uploadedFile && (
              <Chip color="success" label="Uploaded" size="small" />
            )}
          </Box>
          <Chip color="primary" label={`${file.size} Bytes`} />
        </Box>

        {/* Show uploaded image preview */}
        {uploadedFile && uploadedFile.fileUrl && (
          <Box mt={2} sx={{ textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Image Preview:
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                maxWidth: "100%",
                maxHeight: "200px",
                overflow: "hidden",
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.grey[50],
              }}
            >
              <img
                src={uploadedFile.fileUrl}
                alt={`Preview of ${file.name}`}
                style={{
                  maxWidth: "100%",
                  maxHeight: "200px",
                  objectFit: "contain",
                  display: "block",
                }}
                onError={(e) => {
                  console.error("Error loading image:", uploadedFile.fileUrl);
                  e.currentTarget.style.display = "none";
                }}
              />
            </Box>
          </Box>
        )}
      </Box>
    );
  });

  return (
    <Box p={3}>
      <Typography variant="h5">Thumbnails</Typography>

      <Box
        mt={3}
        fontSize="12px"
        sx={{
          backgroundColor: error ? "error.light" : "primary.light",
          color: error ? "error.main" : "primary.main",
          padding: "30px",
          textAlign: "center",
          border: `1px dashed`,
          borderColor: error ? "error.main" : "primary.main",
        }}
        {...getRootProps({ className: "dropzone" })}
      >
        <input {...getInputProps()} />
        <p>
          Drag &apos;n&apos; drop multiple images here, or click to select
          images
        </p>
      </Box>
      <Typography variant="body2" textAlign="center" mt={1}>
        Upload multiple thumbnail images. Only *.png, *.jpg, *.jpeg, *.gif, and
        *.webp image files are accepted.
      </Typography>
      {helperText && (
        <Typography
          variant="body2"
          color="error.main"
          mt={1}
          textAlign="center"
        >
          {helperText}
        </Typography>
      )}
      {/* Display existing images */}
      {existingImages.length > 0 && (
        <Box mt={2}>
          <Typography variant="h6" fontSize="15px">
            Current Images ({existingImages.length})
          </Typography>
          <Box mt={1}>
            {existingImages.map((image, index) => (
              <Box
                key={index}
                py={1}
                mt={2}
                sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={1}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body1" fontWeight="500">
                      {image.fileName}
                    </Typography>
                    <Chip color="info" label="Current" size="small" />
                  </Box>
                  {image.fileSize && (
                    <Chip color="primary" label={`${image.fileSize} Bytes`} />
                  )}
                </Box>

                {/* Show existing image preview */}
                <Box mt={2} sx={{ textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Current Image:
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      maxWidth: "100%",
                      maxHeight: "200px",
                      overflow: "hidden",
                      borderRadius: 1,
                      border: `1px solid ${theme.palette.divider}`,
                      backgroundColor: theme.palette.grey[50],
                    }}
                  >
                    <img
                      src={image.fileUrl}
                      alt={`Current image: ${image.fileName}`}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "200px",
                        objectFit: "contain",
                        display: "block",
                      }}
                      onError={(e) => {
                        console.error(
                          "Error loading existing image:",
                          image.fileUrl
                        );
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Box mt={2}>
        <Typography variant="h6" fontSize="15px">
          Uploaded Images ({acceptedFiles.length})
        </Typography>
        <Typography variant="body1">{files}</Typography>
      </Box>

      {/* Display upload errors */}
      {uploadErrors.length > 0 && (
        <Box mt={2}>
          <Typography variant="h6" fontSize="15px" color="error.main">
            Upload Errors
          </Typography>
          <Box mt={1}>
            {uploadErrors.map((error, index) => (
              <Typography
                key={index}
                variant="body2"
                color="error.main"
                sx={{
                  backgroundColor: theme.palette.error.light,
                  padding: 1,
                  borderRadius: 1,
                  marginBottom: 0.5,
                  border: `1px solid ${theme.palette.error.main}`,
                }}
              >
                {error}
              </Typography>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Thumbnail;
