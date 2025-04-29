import {
  home,
  appointment,
  inventory,
  patients,
  pos,
  reputation,
  tools,
} from "@/assets/SVGs";

import { 
  Home, 
  Circle, 
  Users, 
  CalendarCheck2, 
  BadgeCheck, 
  Warehouse, 
  Layers, 
  Hammer,
  IdCard,
  Calculator
} from "lucide-react";
import { ComponentType } from "react";




// Types
interface Icon {
  src: string;
  height: number;
  width: number;
}

interface Route {
  id: string;
  name: string;
  icon?: ComponentType<{ className?: string }>;
  route?: string;
  children?: Route[];
  label: string;
}

// Route path constants
const ROUTES = {
  HOME: "/",
  PATIENTS: {
    ALL: "/patients/all",
    ONSITE: "/patients/onsite",
    OFFSITE: "/patients/offsite",
  },
  APPOINTMENTS: "/appointments",
  REPUTATION: {
    PRIVATE_FEEDBACK: "/reputation/privatefeedback",
  },
  POS: {
    SALES: "/pos/sales",
    RETURN: "/pos/return",
    HISTORY: "/pos/history",
  },
  INVENTORY: {
    STOCK_PANEL: "/inventory/stockpanel",
    MANAGE: "/inventory/manage",
  },
  TOOLS: {
    EMAIL_BROADCAST: '/tools/emailbroadcast',
    WEBSITE_CONTENT: '/tools/websitecontent',
    PROMO_CODES: '/tools/promo-codes',
    ROLES_PERMISSIONS: '/tools/roles-permissions',
    USER_MANAGEMENT: '/tools/user-management',
    // TEXT_BROADCAST: '/tools/textbroadcast',
    SETTINGS: '/tools/settings',
  },
} as const;

export const routeList: Route[] = [
  {
    id: 'home',
    name: "dashboard",
    label: "Sidebar_k1",
    icon: Home,
    children: [
      { id: 'home-dashboard', name: "dashboard", label: "Sidebar_k2", route: ROUTES.HOME },
    ],
  },
  {
    id: 'patients',
    name: "patients",
    label: "Sidebar_k3",
    icon: Users,
    children: [
      { id: 'patients-all', name: "patients", label: "Sidebar_k4", route: ROUTES.PATIENTS.ALL },
      { id: 'patients-onsite', name: "patients", label: "Sidebar_k5", route: ROUTES.PATIENTS.ONSITE },
      { id: 'patients-offsite', name: "patients", label: "Sidebar_k6", route: ROUTES.PATIENTS.OFFSITE },
    ],
  },
  {
    id: 'appointments',
    name: "appointment",
    label: "Sidebar_k7",
    icon: CalendarCheck2,
    route: ROUTES.APPOINTMENTS,
  },
  {
    id: 'reputation',
    name: "reputation",
    label: "Sidebar_k8",
    icon: IdCard,
    children: [
      {
        id: 'reputation-private-feedback',
        name: "reputation",
        label: "Sidebar_k9",
        route: ROUTES.REPUTATION.PRIVATE_FEEDBACK
      },
    ],
  },
  {
    id: 'pos',
    name: "pos",
    label: "Sidebar_k10",
    icon: Calculator,
    children: [
      { id: 'pos-sales', name: "pos", label: "Sidebar_k19", route: ROUTES.POS.SALES },
      { id: 'pos-return', name: "pos", label: "Sidebar_k20", route: ROUTES.POS.RETURN },
      { id: 'pos-history', name: "pos", label: "Sidebar_k21", route: ROUTES.POS.HISTORY },
    ],
  },
  {
    id: 'inventory',
    name: "inventory",
    label: "Sidebar_k11",
    icon: Warehouse,
    route: ROUTES.INVENTORY.MANAGE,
  },
  {
    id: 'inventory-stock',
    name: "inventory",
    label: "Sidebar_k12",
    icon: Layers,
    route: ROUTES.INVENTORY.STOCK_PANEL,
  },
  {
    id: 'tools',
    name: "tools",
    label: "Sidebar_k13",
    icon: Hammer,
    children: [
      {
        id: 'tools-email',
        name: "email broadcast",
        label: "Sidebar_k14",
        route: ROUTES.TOOLS.EMAIL_BROADCAST
      },
      {
        id: 'tools-website',
        name: "website content",
        label: "Sidebar_k15",
        route: ROUTES.TOOLS.WEBSITE_CONTENT
      },
      {
        id: 'tools-promo',
        name: "promo codes",
        label: "Sidebar_k16",
        route: ROUTES.TOOLS.PROMO_CODES
      },
      {
        id: 'tools-roles',
        name: "roles and permissions",
        label: "Sidebar_k17",
        route: ROUTES.TOOLS.ROLES_PERMISSIONS
      },
      {
        id: 'tools-users',
        name: "user management",
        label: "Sidebar_k18",
        route: ROUTES.TOOLS.USER_MANAGEMENT
      },
      {
        id: 'settings',
        name: "settings",
        label: "Sidebar_k22",
        route: ROUTES.TOOLS.SETTINGS
      }
    ],
  }
]

// Helper type to extract all route paths
type RoutePaths = typeof ROUTES;

// Helper functions
export const isActiveRoute = (currentPath: string, route?: string): boolean => {
  if (!route) return false;
  return currentPath.startsWith(route);
};

export const findRouteByPath = (
  path: string,
  routes: Route[]
): Route | null => {
  for (const route of routes) {
    if (route.route === path) return route;
    if (route.children) {
      const found = findRouteByPath(path, route.children);
      if (found) return found;
    }
  }
  return null;
};

export type { Route, RoutePaths };
