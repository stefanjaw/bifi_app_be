import { BaseService } from "../../../system";
import {
  uomCategoryModel,
  UomCategoryDocument,
} from "../models/uom-category.model";

export class UomCategoryService extends BaseService<UomCategoryDocument> {
  constructor() {
    super({ model: uomCategoryModel });
  }
}
