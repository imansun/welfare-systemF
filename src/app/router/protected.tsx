import { Navigate, RouteObject } from "react-router";

import AuthGuard from "@/middleware/AuthGuard";
import { DynamicLayout } from "../layouts/DynamicLayout";
import { AppLayout } from "../layouts/AppLayout";

/**
 * Protected routes configuration
 * These routes require authentication to access
 * Uses AuthGuard middleware to verify user authentication
 */
const protectedRoutes: RouteObject = {
  id: "protected",
  Component: AuthGuard,
  children: [
    // The dynamic layout supports both the main layout and the sideblock.
    {
      Component: DynamicLayout,
      children: [
        {
          index: true,
          element: <Navigate to="/dashboards/home" />,
        },
        {
          path: "dashboards",
          children: [
            {
              index: true,
              element: <Navigate to="/dashboards/home" />,
            },
            {
              path: "home",
              lazy: async () => ({
                Component: (await import("@/app/pages/dashboards/home"))
                  .default,
              }),
            },
            {
              path: "companies",
              lazy: async () => ({
                Component: (await import("@/app/pages/dashboards/companies"))
                  .default,
              }),
            },
            {
              path: "units",
              lazy: async () => ({
                Component: (await import("@/app/pages/dashboards/units"))
                  .default,
              }),
            },
            {
              path: "items",
              lazy: async () => ({
                Component: (await import("@/app/pages/dashboards/items"))
                  .default,
              }),
            },
            {
              path: "employees",
              lazy: async () => ({
                Component: (await import("@/app/pages/dashboards/employees"))
                  .default,
              }),
            },
            {
              path: "periods",
              lazy: async () => ({
                Component: (await import("@/app/pages/dashboards/periods"))
                  .default,
              }),
            },
            {
              path: "imports",
              lazy: async () => ({
                Component: (await import("@/app/pages/dashboards/imports"))
                  .default,
              }),
            },
            {
              path: "invoices",
              lazy: async () => ({
                Component: (await import("@/app/pages/dashboards/invoices"))
                  .default,
              }),
            },
          ],
        },
        {
          path: "tools",
          children: [
            {
              index: true,
              element: <Navigate to="/tools/salary-receipt" />,
            },
            {
              path: "salary-receipt",
              lazy: async () => ({
                Component: (
                  await import("@/app/pages/tools/salary-receipt")
                ).default,
              }),
            },
          ],
        },
      ],
    },

    // The app layout supports only the main layout. Avoid using it for other layouts.
    {
      Component: AppLayout,
      children: [
        {
          path: "settings",
          lazy: async () => ({
            Component: (await import("@/app/pages/settings/Layout")).default,
          }),
          children: [
            {
              index: true,
              element: <Navigate to="/settings/general" />,
            },
            {
              path: "general",
              lazy: async () => ({
                Component: (
                  await import("@/app/pages/settings/sections/General")
                ).default,
              }),
            },
            {
              path: "appearance",
              lazy: async () => ({
                Component: (
                  await import("@/app/pages/settings/sections/Appearance")
                ).default,
              }),
            },
          ],
        },
      ],
    },
  ],
};

export { protectedRoutes };
