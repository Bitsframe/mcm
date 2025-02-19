import {
  home,
  appointment,
  inventory,
  patients,
  pos,
  reputation,
  tools,
} from "@/assets/SVGs";

// Types
interface Icon {
  src: string;
  height: number;
  width: number;
}

interface Route {
  id: string;
  name: string;
  icon?: Icon;
  route?: string;
  children?: Route[];
}

// Route path constants
const ROUTES = {
  HOME: '/',
  PATIENTS: {
    ALL: '/patients/all',
    ONSITE: '/patients/onsite',
    OFFSITE: '/patients/offsite'
  },
  APPOINTMENTS: '/appointments',
  REPUTATION: {
    PRIVATE_FEEDBACK: '/reputation/privatefeedback'
  },
  POS: {
    SALES: '/pos/sales',
    RETURN: '/pos/return',
    HISTORY: '/pos/history'
  },
  INVENTORY: {
    STOCK_PANEL: '/inventory/stockpanel',
    MANAGE: '/inventory/manage'
  },
  TOOLS: {
    EMAIL_BROADCAST: '/tools/emailbroadcast',
    WEBSITE_CONTENT: '/tools/websitecontent',
    PROMO_CODES: '/tools/promo-codes',
    ROLES_PERMISSIONS: '/tools/roles-permissions',
    USER_MANAGEMENT: '/tools/user-management'
  }
} as const;

export const routeList: Route[] = [
  {
    id: 'home',
    name: "Home",
    icon: home,
    children: [
      { id: 'home-dashboard', name: "Dashboard", route: ROUTES.HOME },
    ],
  },
  {
    id: 'patients',
    name: "Patients",
    icon: patients,
    children: [
      { id: 'patients-all', name: "All Patients", route: ROUTES.PATIENTS.ALL },
      { id: 'patients-onsite', name: "On-site", route: ROUTES.PATIENTS.ONSITE },
      { id: 'patients-offsite', name: "Off-site", route: ROUTES.PATIENTS.OFFSITE },
    ],
  },
  {
    id: 'appointments',
    name: "Appointments",
    icon: appointment,
    route: ROUTES.APPOINTMENTS,
  },
  {
    id: 'reputation',
    name: "Reputation",
    icon: reputation,
    children: [
      { 
        id: 'reputation-private-feedback', 
        name: "Private Feedback", 
        route: ROUTES.REPUTATION.PRIVATE_FEEDBACK 
      },
    ],
  },
  {
    id: 'pos',
    name: "POS",
    icon: pos,
    children: [
      { id: 'pos-sales', name: "Sales", route: ROUTES.POS.SALES },
      { id: 'pos-return', name: "Return", route: ROUTES.POS.RETURN },
      { id: 'pos-history', name: "History", route: ROUTES.POS.HISTORY },
    ],
  },
  {
    id: 'inventory',
    name: "Inventory",
    icon: inventory,
    route: ROUTES.INVENTORY.MANAGE,
  },
  {
    id:'inventory-stock',
    name: "Stock Panel",
    icon: inventory,
    route: ROUTES.INVENTORY.STOCK_PANEL
  },
  {
    id: 'tools',
    name: "Tools",
    icon: tools,
    children: [
      { 
        id: 'tools-email', 
        name: "Email Broadcast", 
        route: ROUTES.TOOLS.EMAIL_BROADCAST 
      },
      { 
        id: 'tools-website', 
        name: "Website Content", 
        route: ROUTES.TOOLS.WEBSITE_CONTENT 
      },
      { 
        id: 'tools-promo', 
        name: "Promo Codes", 
        route: ROUTES.TOOLS.PROMO_CODES 
      },
      { 
        id: 'tools-roles', 
        name: "Roles and Permissions", 
        route: ROUTES.TOOLS.ROLES_PERMISSIONS 
      },
      { 
        id: 'tools-users', 
        name: "User Management", 
        route: ROUTES.TOOLS.USER_MANAGEMENT 
      },
    ],
  },
];

// Helper type to extract all route paths
type RoutePaths = typeof ROUTES;

// Helper functions
export const isActiveRoute = (currentPath: string, route?: string): boolean => {
  if (!route) return false;
  return currentPath.startsWith(route);
};

export const findRouteByPath = (path: string, routes: Route[]): Route | null => {
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