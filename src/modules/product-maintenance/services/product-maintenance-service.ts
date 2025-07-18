import { ProductComissioningService } from "./../../product-comissioning/services/product-comissioning-service";
import {
  ProductComissioningDocument,
  ProductMaintenanceDocument,
} from "@mongodb-types";
import {
  BaseService,
  GridFSBucketService,
  ValidationException,
} from "../../../system";
import { productMaintenanceModel } from "../models/product-maintenance.model";
import { ClientSession } from "mongoose";

export class ProductMaintenanceService extends BaseService<ProductMaintenanceDocument> {
  private productComissioningService = new ProductComissioningService();

  constructor() {
    super({ model: productMaintenanceModel });
  }

  private get gridFSBucket() {
    return GridFSBucketService.getInstance();
  }

  override async create(
    data: Record<string, any>,
    session?: ClientSession | undefined
  ): Promise<ProductMaintenanceDocument> {
    return super.runTransaction<ProductMaintenanceDocument>(
      session,
      async (newSession) => {
        // CHECK THAT THE PRODUCT HAS A COMISSION ISSUED AND IT SUCCEED
        const existingComission = (await this.productComissioningService.get(
          { productId: data.productId, active: true },
          undefined,
          undefined,
          newSession
        )) as ProductComissioningDocument[];

        if (!existingComission || existingComission.length === 0) {
          throw new ValidationException(
            "A commissioning must be issued for this product."
          );
        }

        if (existingComission[0].outcome !== "pass") {
          throw new ValidationException(
            "The commissioning for this product has not been approved."
          );
        }

        // Handle file upload if provided
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
  ): Promise<ProductMaintenanceDocument> {
    return super.runTransaction<ProductMaintenanceDocument>(
      session,
      async (newSession) => {
        // Handle file upload if provided
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
