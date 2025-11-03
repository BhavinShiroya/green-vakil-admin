"use client";
import Typography from "@mui/material/Typography";
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
        <DashboardCard title="Dashboard">
          <Typography>This is a dashboard page</Typography>
        </DashboardCard>
      </PageContainer>
    </RoleGuard>
  );
}
