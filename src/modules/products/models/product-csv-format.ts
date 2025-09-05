import { ProductDocument } from "@mongodb-types";
import { CSVStringSeparator } from "../../../system";

// format of csv recieved when importing
export interface productCSVFormat {
  productModel: string;
  serialNumber: string;
  acquiredDate: string;
  acquiredPrice?: string;
  currentPrice?: string;
  condition?: ProductDocument["condition"];
  productTypes: CSVStringSeparator;
  vendors?: CSVStringSeparator;
  makes?: CSVStringSeparator;
  warrantyDate?: string;
  remarks?: string;
  active?: string;
}
