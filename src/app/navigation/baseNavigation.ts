// src\app\navigation\baseNavigation.ts
import { NavigationTree } from "@/@types/navigation";

/**
 * Object containing the base navigation items for the application.
 * This object serves as a centralized configuration for main navigation elements.
 */
export const baseNavigationObj: Record<string, NavigationTree> = {
  dashboards: {
    id: "dashboards",
    type: "item",
    path: "/dashboards",
    title: "Dashboards",
    transKey: "nav.dashboards.dashboards",
    icon: "dashboards",
  },
  companies: {
    id: "companies",
    type: "item",
    path: "/dashboards/companies",
    title: "Companies",
    transKey: "nav.dashboards.companies",
    icon: "dashboards.companies",
  },
  units: {
    id: "units",
    type: "item",
    path: "/dashboards/units",
    title: "Units",
    transKey: "nav.dashboards.units",
    icon: "dashboards.units",
  },
};

/**
 * Array of navigation items derived from baseNavigationObj.
 * This array format is used for rendering the navigation menu in the application.
 */
export const baseNavigation: NavigationTree[] = Array.from(
  Object.values(baseNavigationObj),
);
