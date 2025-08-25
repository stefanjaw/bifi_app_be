import { ClientSession } from "mongoose";
import {
  BaseService,
  GridFSBucketService,
  NotFoundException,
  runTransaction,
} from "../../../system";
import { productModel } from "../models/product.model";
import { ProductDocument } from "../../../types/mongoose.gen";
import { ProductStatusService } from "./product-status-service";
import { ActivityHistoryService } from "../../activity-history/services/activity-history-service";
import { UpdateProductDTO } from "../models/product.dto";
import { isValidFileUpload } from "../../../system/libraries/file-storage/file-utils";

export class ProductService extends BaseService<ProductDocument> {
  private productStatusService = new ProductStatusService();
  private activityHistoryService = new ActivityHistoryService();

  constructor() {
    super({ model: productModel });
  }

  private get gridFSBucket() {
    return GridFSBucketService.getInstance();
  }

  /**
   * Creates a product with the given data and returns the created document.
   * If the data contains a "photo" field with an object value, it will be handled as a file upload and the file ID will be stored in the "photo" field of the product data.
   * If the data contains a "maintenanceDate" field, the product's maintenance dates will be updated accordingly.
   * @param data The data to create the product with.
   * @param session The optional client session to use for the transaction.
   * @returns The created product document.
   */
  override async create(
    data: Record<string, any>,
    session?: ClientSession | undefined
  ): Promise<ProductDocument> {
    return runTransaction<ProductDocument>(session, async (newSession) => {
      // Handle file upload if provided
      if (isValidFileUpload(data.photo)) {
        const fileId = await this.gridFSBucket.uploadFile(
          Array.isArray(data.photo) ? data.photo[0] : data.photo
        );
        data.photo = fileId; // Store the file ID in the product data
      }

      // Create the product
      let product = await super.create(data, newSession);

      // If maintenance was sent, then update the maintenance dates
      if (data.maintenanceDate) {
        product = await this.productStatusService.updateProductMaintenanceDates(
          product._id,
          newSession
        );
      }

      // ADD ACTIVITY HISTORY
      await this.activityHistoryService.create(
        {
          title: "Product Created",
          details: "Created. Notes: Product has been created",
          performDate: new Date(),
          model: "Product",
          modelId: product._id,
        },
        newSession
      );

      return product;
    });
  }

  /**
   * Updates a product with the given data and returns the updated document.
   * If the data contains a "photo" field with an object value, it will be handled as a file upload and the file ID will be stored in the "photo" field of the product data.
   * If the data contains a "maintenanceDate" field, the product's maintenance dates will be updated accordingly.
   * @param data The data to update the product with.
   * @param session The optional client session to use for the transaction.
   * @returns The updated product document.
   */
  override async update(
    data: UpdateProductDTO,
    session?: ClientSession | undefined
  ): Promise<ProductDocument> {
    return runTransaction<ProductDocument>(session, async (newSession) => {
      const existing = await this.model.findById(data._id);
      if (!existing) throw new NotFoundException("Product does not exist");

      // Handle file upload if provided
      if (isValidFileUpload(data.photo)) {
        const fileId = await this.gridFSBucket.uploadFile(
          Array.isArray(data.photo) ? data.photo[0] : data.photo
        );
        data.photo = fileId; // Store the file ID in the product data
      } else if (data.photo !== undefined) {
        // Delete the file if no file is provided and there is a value on the photo field
        data.photo = null;
      }

      // Update the product
      let product = await super.update(data, newSession);

      // If maintenance was sent, then update the maintenance dates
      if (data.maintenanceDate) {
        product = await this.productStatusService.updateProductMaintenanceDates(
          product._id,
          newSession
        );
      }

      // ADD ACTIVITY HISTORY
      await this.activityHistoryService.create(
        {
          title: "Product Modified",
          details: "Modified. Notes: Product has been modified",
          performDate: new Date(),
          model: "Product",
          modelId: product._id,
        },
        newSession
      );

      return product;
    });
  }
}
