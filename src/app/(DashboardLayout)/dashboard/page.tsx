"use client";
import Typography from "@mui/material/Typography";
import { Box, Grid, Card, CardContent } from "@mui/material";
import PageContainer from "@/app/components/container/PageContainer";
import DashboardCard from "@/app/components/shared/DashboardCard";
import Breadcrumb from "../layout/shared/breadcrumb/Breadcrumb";
import RoleGuard from "@/app/components/RoleGuard";

const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Dashboard",
  },
];

export default function Dashboard() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <PageContainer title="Dashboard" description="this is Dashboard page">
        {/* breadcrumb */}
        <Breadcrumb title="Dashboard" items={BCrumb} />
        {/* end breadcrumb */}

        {/* Stats Boxes */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3}>
            {[
              {
                number: 30,
                bgColor: "primary.light",
                textColor: "primary.dark",
              },
              {
                number: 30,
                bgColor: "secondary.light",
                textColor: "secondary.dark",
              },
              {
                number: 40,
                bgColor: "success.light",
                textColor: "success.dark",
              },
              {
                number: 50,
                bgColor: "warning.light",
                textColor: "warning.dark",
              },
            ].map((item, index) => (
              <Grid
                key={index}
                size={{
                  xs: 12,
                  sm: 6,
                  md: 2,
                }}
              >
                <Card
                  sx={{
                    minHeight: 120,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: 2,
                    borderRadius: 2,
                    bgcolor: item.bgColor,
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 600,
                        textAlign: "center",
                        color: item.textColor,
                      }}
                    >
                      {item.number}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <DashboardCard title="Dashboard">
          <Typography>This is a dashboard page</Typography>
        </DashboardCard>
      </PageContainer>
    </RoleGuard>
  );
}
