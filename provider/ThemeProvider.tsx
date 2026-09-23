"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Flowbite } from "flowbite-react";
import { flowbiteTheme } from "./flowbite-theme";

/**
 * Light only. The few MUI pieces still in use (progress spinners, modals) take
 * their accent, radius and font from here so they match the Tailwind tokens in
 * app/globals.css. There is no dark mode and no runtime theme switch.
 */
const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#166534", dark: "#125229", light: "#2E8756" },
    error: { main: "#D70015" },
    success: { main: "#22C55E" },
    warning: { main: "#FF9500" },
    text: { primary: "#1D1D1F", secondary: "#6E6E73" },
    divider: "#E5E5EA",
    background: { default: "#F5F5F7", paper: "#FFFFFF" },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", var(--font-inter), "Segoe UI", Roboto, sans-serif',
    fontSize: 13,
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiPaper: {
      styleOverrides: {
        root: { boxShadow: "0 0 0 1px rgba(0,0,0,0.06), 0 12px 40px rgba(0,0,0,0.14)" },
      },
    },
  },
});

export default function ThemeProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={theme}>
      <Flowbite theme={{ mode: "light", theme: flowbiteTheme }}>{children}</Flowbite>
    </ThemeProvider>
  );
}
