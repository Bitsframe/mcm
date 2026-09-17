import {
  Home,
  Users,
  CalendarCheck2,
  Warehouse,
  Grid,
  Hammer,
  IdCard,
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
// Credits, Transactions, Bonus, Stock Panel and Promo Codes were taken out of the
// sidebar but their pages, APIs and data are untouched. The paths stay here so
// putting an entry back is a one-liner; see git history for the removed blocks.

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
  BONUS: "/bonus",
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
      { id: 'pos-history', name: "pos", label: "Sidebar_k21", route: ROUTES.POS.HISTORY },
      { id: 'pos-return', name: "pos", label: "Sidebar_k20", route: ROUTES.POS.RETURN },
    ],
  },
  {
    id: 'inventory',
    name: "inventory",
    label: "Sidebar_k11",
    icon: Grid,
    route: ROUTES.INVENTORY.MANAGE,
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
        id: 'tools-specials',
        name: "specials",
        label: "Sidebar_k37",
        route: ROUTES.TOOLS.SPECIALS
      },
      {
        id: 'settings',
        name: "settings",
        label: "Sidebar_k22",
        route: ROUTES.TOOLS.SETTINGS
      },
      {
        id: 'tools-pharmacy',
        name: "pharmacy",
        label: "Sidebar_k35",
        route: ROUTES.TOOLS.PHARMACY
      },
      {
        id: 'tools-medical-forms',
        name: "medical forms",
        label: "Sidebar_k36",
        route: ROUTES.TOOLS.MEDICAL_FORMS
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
