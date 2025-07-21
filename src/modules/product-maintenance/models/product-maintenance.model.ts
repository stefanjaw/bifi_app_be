import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { ProductMaintenanceDocument } from "@mongodb-types";

const productMaintenanceSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
    trim: true,
  },
  attachments: {
    type: [Schema.Types.ObjectId],
    autopopulate: false,
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    autopopulate: {
      select:
        "productModel serialNumber acquiredDate acquiredPrice currentPrice condition locationId warrantyDate remarks status",
      maxDepth: 1, // Limit depth to one level
    },
    required: true,
  },
  date: {
    type: Date,
    required: false,
    default: new Date(),
  },
  type: {
    type: String,
    enum: ["service", "preventive-maintenance"],
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

productMaintenanceSchema.plugin(paginate);
productMaintenanceSchema.plugin(autopopulate);

const productMaintenanceModel = mongoose.model<
  ProductMaintenanceDocument,
  PaginateModel<ProductMaintenanceDocument>
>("ProductMaintenance", productMaintenanceSchema);

export { productMaintenanceModel };
