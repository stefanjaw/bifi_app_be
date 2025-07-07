import { BaseController } from "../../../utils";
import { product } from "../models/product";
import { ProductService } from "../services/product-service";

const productService = new ProductService();

export class ProductController extends BaseController<product> {
  constructor() {
    super(productService);
    super.setParsingFields = [
      { key: "productTypeIds", type: "array" },
      { key: "vendorIds", type: "array" },
      { key: "maintenanceWindowIds", type: "array" },
      { key: "locationId", type: "object" },
    ];
  }
}
