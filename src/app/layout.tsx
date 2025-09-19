import React from "react";
import MyApp from "./app";
import NextTopLoader from "nextjs-toploader";
import "./global.css";
import { CustomizerContextProvider } from "./context/customizerContext";
import { AuthProvider } from "./context/authContext";

export const metadata = {
  title: "Greenway Lawyer",
  description: "Greenway Lawyer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NextTopLoader color="#5D87FF" />
        <CustomizerContextProvider>
          <AuthProvider>
            <MyApp>{children}</MyApp>
          </AuthProvider>
        </CustomizerContextProvider>
      </body>
    </html>
  );
}
