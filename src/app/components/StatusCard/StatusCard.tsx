"use client";
import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import { Grid, Typography } from "@mui/material";
import { MenuItem, Avatar } from "@mui/material";
import CustomSelect from "../forms/theme-elements/CustomSelect";
// import CustomSelect from "@/app/components/forms/theme-elements/CustomSelect";

interface StatusCardProps {
  value?: number;
  onChange?: (value: number) => void;
}

const StatusCard = ({ value = 0, onChange }: StatusCardProps) => {
  const [status, setStatus] = useState(value);

  // Sync internal state with prop changes
  useEffect(() => {
    setStatus(value);
  }, [value]);

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
        <Typography variant="h5">Status</Typography>

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
            <MenuItem value={0}>Draft</MenuItem>
            <MenuItem value={1}>Archived</MenuItem>
            <MenuItem value={2}>Published</MenuItem>
          </CustomSelect>
          <Typography variant="body2" mt={1} ml={1}>
            Set the article status.
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StatusCard;
