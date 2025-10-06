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
import { Box, Typography, Button, Stack, Alert, Paper } from "@mui/material";

import "./Tiptap.css";
import Thumbnail from "@/app/components/Thumbnail/page";
import BlankCard from "@/app/components/shared/BlankCard";
import { Grid } from "@mui/system";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import StatusCard from "@/app/components/StatusCard/page";
import CategoryCard from "@/app/components/categoryCard/page";

const Articles = () => {
  const [mounted, setMounted] = useState(false);
  const [savedContent, setSavedContent] = useState("");

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Start writing your article here...</p>",
    immediatelyRender: false, // Fix SSR hydration error
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSave = () => {
    if (editor) {
      const content = editor.getHTML();
      setSavedContent(content);
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
                />
                {/* <Typography variant="body2">
                  A product name is required and recommended to be unique.
                </Typography> */}
              </Grid>
              <Grid display="flex" alignItems="center" size={12}>
                <CustomFormLabel htmlFor="desc">
                  Article Content
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
                />
              </RichTextEditorProvider>
            </Paper>

            <Stack direction="row" spacing={2} sx={{ mb: 3,paddingInline:3 }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={!editor?.getText().trim()}
              >
                Save Article
              </Button>
              <Button
                variant="outlined"
                onClick={handleClear}
                disabled={!editor?.getText().trim()}
              >
                Clear
              </Button>
            </Stack>

            {savedContent && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Article saved successfully! Content length:{" "}
                {editor?.getText().length || 0} characters.
              </Alert>
            )}

            {savedContent && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Preview:
                </Typography>
                <Paper
                  elevation={1}
                  sx={{
                    p: 3,
                    border: "1px solid",
                    borderColor: "grey.300",
                    borderRadius: 1,
                    bgcolor: "grey.50",
                  }}
                  dangerouslySetInnerHTML={{ __html: savedContent }}
                />
              </Box>
            )}
          </Box>
        </BlankCard>

        <Box sx={{ paddingLeft: 3 }}>
          <BlankCard>
            <Thumbnail />
          </BlankCard>
          <Box sx={{ marginBlock:3 }}>
            <BlankCard>
              <StatusCard />
            </BlankCard>
          </Box>
          <BlankCard>
            <CategoryCard />
          </BlankCard>
        </Box>
      </Box>
    </Box>
  );
};

export default Articles;
