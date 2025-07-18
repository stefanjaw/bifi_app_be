import { ClientSession } from "mongoose";
import { BaseService, GridFSBucketService } from "../../../system";
import { productModel } from "../models/product.model";
import { ProductDocument } from "../../../types/mongoose.gen";

export class ProductService extends BaseService<ProductDocument> {
  constructor() {
    super({ model: productModel });
  }

  private get gridFSBucket() {
    return GridFSBucketService.getInstance();
  }

  /**
   * Creates a product with the given data and returns the created document.
   * If the data contains a "photo" field with an object value, it will be handled as a file upload and the file ID will be stored in the "photo" field of the product data.
   * @param data The data to create the product with.
   * @param session The optional client session to use for the transaction.
   * @returns The created product document.
   */
  override async create(
    data: Record<string, any>,
    session?: ClientSession | undefined
  ): Promise<ProductDocument> {
    return super.runTransaction<ProductDocument>(
      session,
      async (newSession) => {
        // Handle file upload if provided
        if (data.photo && typeof data.photo === "object") {
          const fileId = await this.gridFSBucket.uploadFile(data.photo, {
            encoding: data.photo?.encoding,
            mimetype: data.photo?.mimetype,
            originalname: data.photo?.originalname,
            size: data.photo?.size,
          });

          data.photo = fileId; // Store the file ID in the product data
        }

        // Create the product
        const product = await super.create(data, newSession);

        return product;
      }
    );
  }

  /**
   * Updates a product with the given data and returns the updated document.
   * If the data contains a "photo" field with an object value, it will be handled as a file upload and the file ID will be stored in the "photo" field of the product data.
   * @param data The data to update the product with.
   * @param session The optional client session to use for the transaction.
   * @returns The updated product document.
   */
  override async update(
    data: Record<string, any>,
    session?: ClientSession | undefined
  ): Promise<ProductDocument> {
    return super.runTransaction<ProductDocument>(
      session,
      async (newSession) => {
        // Handle file upload if provided
        if (data.photo && typeof data.photo === "object") {
          const fileId = await this.gridFSBucket.uploadFile(data.photo, {
            encoding: data.photo?.encoding,
            mimetype: data.photo?.mimetype,
            originalname: data.photo?.originalname,
            size: data.photo?.size,
          });

          data.photo = fileId; // Store the file ID in the product data
        }

        // Update the product
        const product = await super.update(data, newSession);

        return product;
      }
    );
  }
}
