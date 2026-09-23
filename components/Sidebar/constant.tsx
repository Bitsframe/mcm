import {
  Home,
  Users,
  CalendarCheck2,
  Warehouse,
  Hammer,
  Calculator,
  Settings,
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
//
// Bonus came back into the sidebar on 2026-09-23 with the v2 calculation, then
// came out again the same day on request — the pages and routes are untouched.
// When it is restored, the children's `name` values must stay 'bonus-location'
// and 'bonus-individual': withAuthorization matches those exact names to grant
// the `control` permission access to the bonus pages.
// Hidden from the UI but otherwise intact: Bonus, Credits, Transactions, Stock Panel,
// Promo Codes, Reputation, Pharmacy and Medical Forms came out of the sidebar, then
// (2026-09-22) Inventory, Patients Onsite/Offsite and the standalone Specials entry —
// Specials is reached as a Website Content tab. Location Limits and Staff came out of
// the Controls tabs. Their pages, API routes and data
// are untouched, and the paths below are deliberately kept, so restoring an entry is a
// one-liner — see git history for the exact blocks.

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
  WAREHOUSE: {
    MANAGE: "/warehouse/manage",
  },
  CONTROLS: "/controls",
  CREDITS: "/credits",
  TRANSACTIONS: "/transactions",
  BONUS: {
    LOCATION: "/bonus/location",
    INDIVIDUAL: "/bonus/individual",
  },
  TOOLS: {
    EMAIL_BROADCAST: '/tools/emailbroadcast',
    WEBSITE_CONTENT: '/tools/websitecontent',
    PROMO_CODES: '/tools/promo-codes',
    ROLES: '/tools/roles',
    USER_MANAGEMENT: '/tools/user-management',
    SETTINGS: '/tools/settings',
    PHARMACY: '/tools/pharmacy',
    SPECIALS: '/tools/specials',
    MEDICAL_FORMS: '/tools/medicalforms',
  },
} as const;

export const routeList: Route[] = [
  {
    id: 'home',
    name: "dashboard",
    label: "Sidebar_k2",
    icon: Home,
    route: ROUTES.HOME,
  },
  {
    id: 'patients',
    name: "patients",
    label: "Sidebar_k3",
    icon: Users,
    route: ROUTES.PATIENTS.ALL,
  },
  {
    id: 'appointments',
    name: "appointment",
    label: "Sidebar_k7",
    icon: CalendarCheck2,
    route: ROUTES.APPOINTMENTS,
  },
  {
    id: 'pos',
    name: "pos",
    label: "Sidebar_k10",
    icon: Calculator,
    children: [
      { id: 'pos-sales', name: "pos", label: "Sidebar_k19", route: ROUTES.POS.SALES },
      { id: 'pos-history', name: "pos", label: "Sidebar_k21", route: ROUTES.POS.HISTORY },
      { id: 'pos-return', name: "pos", label: "Sidebar_k20", route: ROUTES.POS.RETURN },
    ],
  },
  {
    id: 'warehouse',
    name: "warehouse",
    label: "Sidebar_k25",
    icon: Warehouse,
    route: ROUTES.WAREHOUSE.MANAGE,
  },
  {
    id: 'controls',
    name: "control",
    label: "Sidebar_k26",
    icon: Settings,
    route: ROUTES.CONTROLS
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
        id: 'tools-roles',
        name: "roles",
        label: "Roles",
        route: ROUTES.TOOLS.ROLES
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
