import { baseNavigationObj } from "../baseNavigation";
import { NavigationTree } from "@/@types/navigation";

const ROOT_TOOLS = "/tools";

const path = (root: string, item: string) => `${root}${item}`;

export const tools: NavigationTree = {
  ...baseNavigationObj["tools"],
  type: "root",
  childs: [
    {
      id: "tools.salary-receipt",
      path: path(ROOT_TOOLS, "/salary-receipt"),
      type: "item",
      title: "Salary Receipt",
      transKey: "nav.tools.salary-receipt",
      icon: "tools.salary-receipt",
    },
    // {
    //   id: "tools.calculator",
    //   path: path(ROOT_TOOLS, "/calculator"),
    //   type: "item",
    //   title: "Calculator",
    //   transKey: "nav.tools.calculator",
    //   icon: "currency-dollar",
    // },
    // {
    //   id: "tools.qr-generator",
    //   path: path(ROOT_TOOLS, "/qr-generator"),
    //   type: "item",
    //   title: "QR Generator",
    //   transKey: "nav.tools.qr-generator",
    //   icon: "doc",
    // },
  ],
};
