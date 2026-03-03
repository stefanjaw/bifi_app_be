import { BaseController } from "../../../system";
import { UomCategoryDocument } from "../models/uom-category.model";
import { UomCategoryService } from "../services/uom-category-service";

const uomCategoryService = new UomCategoryService();

export class UomCategoryController extends BaseController<UomCategoryDocument> {
  constructor() {
    super({ service: uomCategoryService });
  }
}
