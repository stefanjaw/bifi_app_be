import { ClientSession } from "mongoose";
import {
  BaseService,
  GridFSBucketService,
  ValidationException,
} from "../../../system";
import { productComissioningModel } from "../models/product-comissioning.model";
import { ProductComissioningDocument } from "../../../types/mongoose.gen";

export class ProductComissioningService extends BaseService<ProductComissioningDocument> {
  constructor() {
    super({ model: productComissioningModel });
  }

  private get gridFSBucket() {
    return GridFSBucketService.getInstance();
  }

  override async create(
    data: Record<string, any>,
    session?: ClientSession | undefined
  ): Promise<ProductComissioningDocument> {
    return super.runTransaction<ProductComissioningDocument>(
      session,
      async (newSession) => {
        // CHECK THAT NO OTHER COMISSION AWAS ISSUED FOR THE PRODUCT
        const existingComission = await super.get(
          { productId: data.productId, active: true },
          undefined,
          newSession
        );

        if (Array.isArray(existingComission) && existingComission.length > 0) {
          throw new ValidationException(
            "A commissioning already exists for this product."
          );
        }

        if (data.attachments && Array.isArray(data.attachments)) {
          for (const file of data.attachments) {
            if (file && typeof file === "object") {
              const fileId = await this.gridFSBucket.uploadFile(file, {
                encoding: file.encoding,
                mimetype: file.mimetype,
                originalname: file.originalname,
                size: file.size,
              });

              // Replace the file object with its ID
              const index = data.attachments.indexOf(file);
              if (index !== -1) {
                data.attachments[index] = fileId;
              }
            }
          }
        }

        return await super.create(data, newSession);
      }
    );
  }

  override async update(
    data: Record<string, any>,
    session?: ClientSession | undefined
  ): Promise<ProductComissioningDocument> {
    return super.runTransaction<ProductComissioningDocument>(
      session,
      async (newSession) => {
        // CHECK THAT NO OTHER COMISSION AWAS ISSUED FOR THE PRODUCT
        const existingComission = await super.get(
          { productId: data.productId, active: true, _id: { $ne: data._id } },
          undefined,
          newSession
        );

        if (Array.isArray(existingComission) && existingComission.length > 0) {
          throw new ValidationException(
            "A commissioning already exists for this product."
          );
        }

        if (data.attachments && Array.isArray(data.attachments)) {
          for (const file of data.attachments) {
            if (file && typeof file === "object") {
              const fileId = await this.gridFSBucket.uploadFile(file, {
                encoding: file.encoding,
                mimetype: file.mimetype,
                originalname: file.originalname,
                size: file.size,
              });

              // Replace the file object with its ID
              const index = data.attachments.indexOf(file);
              if (index !== -1) {
                data.attachments[index] = fileId;
              }
            }
          }
        }

        return await super.update(data, newSession);
      }
    );
  }
}
