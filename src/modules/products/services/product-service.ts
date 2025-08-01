import { ClientSession } from "mongoose";
import {
  BaseService,
  GridFSBucketService,
  runTransaction,
} from "../../../system";
import { productModel } from "../models/product.model";
import { ProductDocument } from "../../../types/mongoose.gen";
import { ProductStatusService } from "./product-status-service";
import { ActivityHistoryService } from "../../activity-history/services/activity-history-service";

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
      if (data.photo) {
        const fileId = await this.gridFSBucket.uploadFile(data.photo);
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
          details: "Product has been created",
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
    data: Record<string, any>,
    session?: ClientSession | undefined
  ): Promise<ProductDocument> {
    return runTransaction<ProductDocument>(session, async (newSession) => {
      // Handle file upload if provided
      if (data.photo) {
        const fileId = await this.gridFSBucket.uploadFile(data.photo);
        data.photo = fileId; // Store the file ID in the product data
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

      if (product.status === "decomissioned") {
        // ADD ACTIVITY HISTORY
        await this.activityHistoryService.create(
          {
            title: "Decomissioned",
            details: "Decomissioned. Notes: All actions are disabled",
            performDate: new Date(),
            model: "Product",
            modelId: product._id,
          },
          newSession
        );
      }

      return product;
    });
  }
}
