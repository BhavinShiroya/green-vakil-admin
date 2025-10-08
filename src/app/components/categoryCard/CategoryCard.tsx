"use client";
import React, { useState } from "react";
import Box from "@mui/material/Box";
import { Grid, Typography } from "@mui/material";
import { MenuItem, Avatar } from "@mui/material";
import CustomSelect from "../forms/theme-elements/CustomSelect";
// import CustomSelect from "@/app/components/forms/theme-elements/CustomSelect";

interface CategoryCardProps {
  value?: number;
  onChange?: (value: number) => void;
}

const CategoryCard = ({ value = 0, onChange }: CategoryCardProps) => {
  const [status, setStatus] = useState(value);

  const handleChange = (event: any) => {
    const newValue = event.target.value;
    setStatus(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Category</Typography>

        {/* <Avatar
          sx={{
            backgroundColor:
              status === 0
                ? "primary.main"
                : status === 1
                ? "error.main"
                : status === 2
                ? "secondary.main"
                : status === 3
                ? "warning.main"
                : "error.main",
            "& svg": { display: "none" },
            width: 15,
            height: 15,
          }}
        ></Avatar> */}
      </Box>
      <Grid container mt={3}>
        <Grid size={12}>
          <CustomSelect value={status} onChange={handleChange} fullWidth>
            <MenuItem value={0}>Immigration Law</MenuItem>
            <MenuItem value={1}>Real Estate Law</MenuItem>
            <MenuItem value={2}>Corporate & Business Law</MenuItem>
            <MenuItem value={3}>Family & Divorce Law</MenuItem>
            <MenuItem value={4}>Estate Planning & Wills</MenuItem>
            <MenuItem value={5}>Criminal Defense</MenuItem>
            <MenuItem value={6}>Personal Injury Law</MenuItem>
            <MenuItem value={7}>Employment & Labor Law</MenuItem>
            <MenuItem value={8}>Not Sure / Other</MenuItem>
          </CustomSelect>
          <Typography variant="body2" mt={1} ml={1}>
            Set the article category.
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CategoryCard;
