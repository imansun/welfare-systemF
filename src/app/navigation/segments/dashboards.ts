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
  ],
};
