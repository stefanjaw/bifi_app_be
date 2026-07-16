import { BaseController } from "../../../system";
import { UomCategoryDocument } from "../models/uom-category.model";
import { UomCategoryService } from "../services/uom-category-service";

const uomCategoryService = new UomCategoryService();

/** Express controller for UOM category CRUD operations */
export class UomCategoryController extends BaseController<UomCategoryDocument> {
  constructor() {
    super({ service: uomCategoryService });
  }
}
