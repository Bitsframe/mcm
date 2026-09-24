"use client";

import { createContext } from "react";

/**
 * Whether the left sidebar is showing icons only.
 *
 * The state is owned by RootLayoutComponent, which also sets the sidebar's
 * width; the panel and the clinic footer read it from here so they can drop
 * their labels to match rather than overflow a 76px rail.
 */
export const SidebarCollapseContext = createContext<boolean>(false);
