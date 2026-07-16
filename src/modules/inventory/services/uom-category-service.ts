import { BaseService } from "../../../system";
import {
  uomCategoryModel,
  UomCategoryDocument,
} from "../models/uom-category.model";

/** Business logic service for UOM category operations */
export class UomCategoryService extends BaseService<UomCategoryDocument> {
  constructor() {
    super({ model: uomCategoryModel });
  }
}
