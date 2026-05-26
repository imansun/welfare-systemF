// src\app\navigation\segments\dashboards.ts
import { baseNavigationObj } from "../baseNavigation";
import { NavigationTree } from "@/@types/navigation";

const ROOT_DASHBOARDS = "/dashboards";

const path = (root: string, item: string) => `${root}${item}`;

export const dashboards: NavigationTree = {
  ...baseNavigationObj["dashboards"],
  type: "root",
  childs: [
    {
      id: "dashboards.home",
      path: path(ROOT_DASHBOARDS, "/home"),
      type: "item",
      title: "Home",
      transKey: "nav.dashboards.home",
      icon: "dashboards.home",
    },
    {
      id: "dashboards.companies",
      path: path(ROOT_DASHBOARDS, "/companies"),
      type: "item",
      title: "Companies",
      transKey: "nav.dashboards.companies",
      icon: "dashboards.companies",
    },
    {
      id: "dashboards.units",
      path: path(ROOT_DASHBOARDS, "/units"),
      type: "item",
      title: "Units",
      transKey: "nav.dashboards.units",
      icon: "dashboards.units",
    },
    {
      id: "dashboards.items",
      path: path(ROOT_DASHBOARDS, "/items"),
      type: "item",
      title: "Items",
      transKey: "nav.dashboards.items",
      icon: "dashboards.items",
    },
    {
      id: "dashboards.employees",
      path: path(ROOT_DASHBOARDS, "/employees"),
      type: "item",
      title: "Employees",
      transKey: "nav.dashboards.employees",
      icon: "dashboards.employees",
    },
    {
      id: "dashboards.periods",
      path: path(ROOT_DASHBOARDS, "/periods"),
      type: "item",
      title: "Periods",
      transKey: "nav.dashboards.periods",
      icon: "dashboards.periods",
    },
    {
      id: "dashboards.imports",
      path: path(ROOT_DASHBOARDS, "/imports"),
      type: "item",
      title: "Imports",
      transKey: "nav.dashboards.imports",
      icon: "dashboards.imports",
    },
    {
      id: "dashboards.invoices",
      path: path(ROOT_DASHBOARDS, "/invoices"),
      type: "item",
      title: "Invoices",
      transKey: "nav.dashboards.invoices",
      icon: "dashboards.invoices",
    },
  ],
};
