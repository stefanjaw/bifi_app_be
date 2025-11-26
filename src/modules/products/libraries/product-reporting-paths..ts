import { IReportingPaths } from "../../reporting/interfaces/reporting";

export const productReportingPaths: IReportingPaths = [
  {
    label: "Model",
    path: "productModel",
  },
  {
    label: "Equipment Types",
    path: "productTypeIds[].name",
  },
  {
    label: "Vendors",
    path: "vendorIds[].name",
  },
  {
    label: "Makes",
    path: "makeIds[].name",
  },
  {
    label: "Serial Number",
    path: "serialNumber",
  },
  {
    label: "Condition",
    path: "condition",
  },
  {
    label: "Status",
    path: "status",
  },
];
