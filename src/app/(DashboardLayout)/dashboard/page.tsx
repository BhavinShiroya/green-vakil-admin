"use client";
import Typography from "@mui/material/Typography";
import { Box, Grid, Card, CardContent, CircularProgress } from "@mui/material";
import PageContainer from "@/app/components/container/PageContainer";
import DashboardCard from "@/app/components/shared/DashboardCard";
import Breadcrumb from "../layout/shared/breadcrumb/Breadcrumb";
import RoleGuard from "@/app/components/RoleGuard";
import { useEffect, useState } from "react";
import apiClient from "@/utils/axios";

const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Dashboard",
  },
];

interface DashboardStats {
  articles: number;
  attorneys: number;
  contacts: number;
  newsletters: number;
  users: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    articles: 0,
    attorneys: 0,
    contacts: 0,
    newsletters: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/dashboard/stats");
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statsCards = [
    {
      title: "Articles",
      value: stats.articles,
      bgColor: "primary.light",
      textColor: "primary.dark",
    },
    {
      title: "Attorneys",
      value: stats.attorneys,
      bgColor: "secondary.light",
      textColor: "secondary.dark",
    },
    {
      title: "Contacts",
      value: stats.contacts,
      bgColor: "success.light",
      textColor: "success.dark",
    },
    {
      title: "Newsletters",
      value: stats.newsletters,
      bgColor: "warning.light",
      textColor: "warning.dark",
    },
  ];

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <PageContainer title="Dashboard" description="this is Dashboard page">
        {/* breadcrumb */}
        <Breadcrumb title="Dashboard" items={BCrumb} />
        {/* end breadcrumb */}

        {/* Stats Boxes */}
        <Box sx={{ mb: 4 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {statsCards.map((item, index) => (
                <Grid
                  key={index}
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 3,
                  }}
                >
                  <Card
                    sx={{
                      minHeight: 120,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: 2,
                      borderRadius: 2,
                      bgcolor: item.bgColor,
                      p: 2,
                    }}
                  >
                    <CardContent>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 500,
                          textAlign: "center",
                          color: item.textColor,
                          mb: 1,
                        }}
                      >
                        {item.title}
                      </Typography>
                      <Typography
                        variant="h3"
                        sx={{
                          fontWeight: 600,
                          textAlign: "center",
                          color: item.textColor,
                        }}
                      >
                        {item.value}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </PageContainer>
    </RoleGuard>
  );
}
