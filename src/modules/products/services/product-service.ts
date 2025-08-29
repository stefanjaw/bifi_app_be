import { ClientSession } from "mongoose";
import {
  BaseService,
  GridFSBucketService,
  NotFoundException,
  runTransaction,
} from "../../../system";
import { productModel } from "../models/product.model";
import {
  // ProductAttachmentDocument,
  ProductDocument,
} from "../../../types/mongoose.gen";
import { ProductStatusService } from "./product-status-service";
import { ActivityHistoryService } from "../../activity-history/services/activity-history-service";
// import { productComissioningModel } from "../../product-comissioning/models/product-comissioning.model";
// import { productMaintenanceModel } from "../../product-maintenance/models/product-maintenance.model";
import { isValidFileUpload } from "../../../system/libraries/file-storage/file-utils";
import { UpdateProductDTO } from "../models/product.dto";
import { InnerFile } from "../../../system/libraries/file-storage/file-upload.types";

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
   * Retrieves a product by its ID, including all associated documents.
   * @param id - The ID of the product to retrieve.
   * @returns The product document with all associated documents, or undefined if not found.
   */
  // override async getById(id: string): Promise<ProductDocument | undefined> {
  //   return await runTransaction<ProductDocument | undefined>(
  //     undefined,
  //     async (newSession) => {
  //       const product = (await super.getById(id))?.toObject();

  //       if (!product) {
  //         throw new NotFoundException("Product not found");
  //       }

  //       product.attachments = await this.getAttachmentsPerProduct(
  //         product,
  //         newSession
  //       );

  //       return product;
  //     }
  //   );
  // }

  /**
   * Retrieves all documents associated with a product from both product comissioning and product maintenance.
   * @param product - The product document.
   * @param session - Optional mongoose session.
   * @returns An array of all documents associated with the product.
   */
  // private async getAttachmentsPerProduct(
  //   product: ProductDocument,
  //   session: ClientSession | null = null
  // ) {
  //   const files = product.attachments || [];

  //   // Get the product's comissions
  //   const productComissions = await productComissioningModel
  //     .find({
  //       productId: product._id,
  //     })
  //     .session(session);

  //   // Get the product's maintenances
  //   const productMaintenances = await productMaintenanceModel
  //     .find({
  //       productId: product._id,
  //     })
  //     .session(session);

  //   // Add the attachments to the files array
  //   productComissions
  //     ?.flatMap((comission) => comission.attachments)
  //     .forEach((attachment) => {
  //       files.push(attachment);
  //     });

  //   productMaintenances
  //     ?.flatMap((maintenance) => maintenance.attachments)
  //     .forEach((attachment) => {
  //       files.push(attachment);
  //     });

  //   return files;
  // }

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
      let photo = data.photo;

      // If a file is provided, upload it and store the file ID in the product data
      if (isValidFileUpload(photo)) {
        const fileId = await this.gridFSBucket.uploadFile(
          Array.isArray(photo) ? photo[0] : photo
        );
        photo = fileId; // Store the file ID in the product data
      } else if (photo !== undefined) {
        // Delete the file if no file is provided and there is a value on the photo field
        photo = null;
      }

      // Handle file uploads for attachments
      let attachments = (data as any).attachments;
      let attachmentsMetadata = (data as any).attachmentsMetadata as object[];

      if (isValidFileUpload(attachments) && Array.isArray(attachments)) {
        attachments = await Promise.all(
          attachments.map<Promise<InnerFile>>(async (file, i) => ({
            fileId: await this.gridFSBucket.uploadFile(file),
            name: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            fileMetadata: attachmentsMetadata?.[i],
          }))
        );
      } else if (attachments !== undefined) {
        // Delete the file if no file is provided and there is a value on the photo field
        attachments = null;
      }

      // Update the product
      let product = await super.update(
        {
          ...data,
          photo,
          attachments,
        },
        newSession
      );

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
