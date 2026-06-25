import { BaseRoutes } from "../../../system";
import { UomCategoryDocument } from "../models/uom-category.model";
import { UomCategoryController } from "../controllers/uom-category-controller";
import {
  UomCategoryDTO,
  UpdateUomCategoryDTO,
} from "../models/uom-category.dto";

const uomCategoryController = new UomCategoryController();

export class UomCategoryRouter extends BaseRoutes<UomCategoryDocument> {
  constructor() {
    super({
      controller: uomCategoryController,
      endpoint: "/inventory/uom-categories",
      dtoCreateClass: UomCategoryDTO,
      dtoUpdateClass: UpdateUomCategoryDTO,
    });
  }
}
