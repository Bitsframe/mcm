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
  label: string;
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
    USER_MANAGEMENT: '/tools/user-management',
    TEXT_BROADCAST:'/tools/textbroadcast',
    SETTINGS:'/tools/settings'
  }
} as const;

// export const routeList: Route[] = [
//   {
//     id: 'home',
//     name: "Sidebar_k1",
//     icon: home,
//     children: [
//       { id: 'home-dashboard', name: "Sidebar_k2", route: ROUTES.HOME },
//     ],
//   },
//   {
//     id: 'patients',
//     name: "Sidebar_k3",
//     icon: patients,
//     children: [
//       { id: 'patients-all', name: "Sidebar_k4", route: ROUTES.PATIENTS.ALL },
//       { id: 'patients-onsite', name: "Sidebar_k5", route: ROUTES.PATIENTS.ONSITE },
//       { id: 'patients-offsite', name: "Sidebar_k6", route: ROUTES.PATIENTS.OFFSITE },
//     ],
//   },
//   {
//     id: 'appointments',
//     name: "Sidebar_k7",
//     icon: appointment,
//     route: ROUTES.APPOINTMENTS,
//   },
//   {
//     id: 'reputation',
//     name: "Sidebar_k8",
//     icon: reputation,
//     children: [
//       { 
//         id: 'reputation-private-feedback', 
//         name: "Sidebar_k9", 
//         route: ROUTES.REPUTATION.PRIVATE_FEEDBACK 
//       },
//     ],
//   },
//   {
//     id: 'pos',
//     name: "Sidebar_k10",
//     icon: pos,
//     children: [
//       { id: 'pos-sales', name: "Sidebar_k19", route: ROUTES.POS.SALES },
//       { id: 'pos-return', name: "Sidebar_k20", route: ROUTES.POS.RETURN },
//       { id: 'pos-history', name: "Sidebar_k21", route: ROUTES.POS.HISTORY },
//     ],
//   },
//   {
//     id: 'inventory',
//     name: "Sidebar_k11",
//     icon: inventory,
//     route: ROUTES.INVENTORY.MANAGE,
//   },
//   {
//     id:'inventory-stock',
//     name: "Sidebar_k12",
//     icon: inventory,
//     route: ROUTES.INVENTORY.STOCK_PANEL
//   },
//   {
//     id: 'tools',
//     name: "Sidebar_k13",
//     icon: tools,
//     children: [
//       { 
//         id: 'tools-email', 
//         name: "Sidebar_k14", 
//         route: ROUTES.TOOLS.EMAIL_BROADCAST 
//       },
//       { 
//         id: 'tools-website', 
//         name: "Sidebar_k15", 
//         route: ROUTES.TOOLS.WEBSITE_CONTENT 
//       },
//       { 
//         id: 'tools-promo', 
//         name: "Sidebar_k16", 
//         route: ROUTES.TOOLS.PROMO_CODES 
//       },
//       { 
//         id: 'tools-roles', 
//         name: "Sidebar_k17", 
//         route: ROUTES.TOOLS.ROLES_PERMISSIONS 
//       },
//       { 
//         id: 'tools-users', 
//         name: "Sidebar_k18", 
//         route: ROUTES.TOOLS.USER_MANAGEMENT 
//       },
//       { 
//         id: 'tools-text', 
//         name: "text-broadcast", 
//         route: ROUTES.TOOLS.TEXT_BROADCAST
//       },
//     ],
//   },
// ];

export const routeList: Route[] = [
  {
    id: 'home',
    name: "Home",
    label: "Sidebar_k1",
    icon: home,
    children: [
      { id: 'home-dashboard', name: "Dashboard", label: "Sidebar_k2", route: ROUTES.HOME },
    ],
  },
  {
    id: 'patients',
    name: "Patients",
    label: "Sidebar_k3",
    icon: patients,
    children: [
      { id: 'patients-all', name: "All Patients", label: "Sidebar_k4", route: ROUTES.PATIENTS.ALL },
      { id: 'patients-onsite', name: "On-site", label: "Sidebar_k5", route: ROUTES.PATIENTS.ONSITE },
      { id: 'patients-offsite', name: "Off-site", label: "Sidebar_k6", route: ROUTES.PATIENTS.OFFSITE },
    ],
  },
  {
    id: 'appointments',
    name: "Appointments",
    label: "Sidebar_k7",
    icon: appointment,
    route: ROUTES.APPOINTMENTS,
  },
  {
    id: 'reputation',
    name: "Reputation",
    label: "Sidebar_k8",
    icon: reputation,
    children: [
      { 
        id: 'reputation-private-feedback', 
        name: "Private Feedback", 
        label: "Sidebar_k9",
        route: ROUTES.REPUTATION.PRIVATE_FEEDBACK 
      },
    ],
  },
  {
    id: 'pos',
    name: "POS",
    label: "Sidebar_k10",
    icon: pos,
    children: [
      { id: 'pos-sales', name: "Sales", label: "Sidebar_k19", route: ROUTES.POS.SALES },
      { id: 'pos-return', name: "Return", label: "Sidebar_k20", route: ROUTES.POS.RETURN },
      { id: 'pos-history', name: "History", label: "Sidebar_k21", route: ROUTES.POS.HISTORY },
    ],
  },
  {
    id: 'inventory',
    name: "Inventory",
    label: "Sidebar_k11",
    icon: inventory,
    route: ROUTES.INVENTORY.MANAGE,
  },
  {
    id:'inventory-stock',
    name: "Stock Panel",
    label: "Sidebar_k12",
    icon: inventory,
    route: ROUTES.INVENTORY.STOCK_PANEL
  },
  {
    id: 'tools',
    name: "Tools",
    label: "Sidebar_k13",
    icon: tools,
    children: [
      { 
        id: 'tools-email', 
        name: "Email Broadcast",
        label: "Sidebar_k14",
        route: ROUTES.TOOLS.EMAIL_BROADCAST 
      },
      { 
        id: 'tools-website', 
        name: "Website Content",
        label: "Sidebar_k15", 
        route: ROUTES.TOOLS.WEBSITE_CONTENT 
      },
      { 
        id: 'tools-promo', 
        name: "Promo Codes", 
        label: "Sidebar_k16", 
        route: ROUTES.TOOLS.PROMO_CODES 
      },
      { 
        id: 'tools-roles', 
        name: "Roles and Permissions", 
        label: "Sidebar_k17",
        route: ROUTES.TOOLS.ROLES_PERMISSIONS 
      },
      { 
        id: 'tools-users', 
        name: "User Management",
        label: "Sidebar_k18", 
        route: ROUTES.TOOLS.USER_MANAGEMENT 
      },
      {
        id: 'tools-text', 
        name: "Text-Broadcast",
        label: "Text-Broadcast",
        route: ROUTES.TOOLS.TEXT_BROADCAST,
      },
      {
        id: 'settings',
        name: "Settings",
        label: "Settings",
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