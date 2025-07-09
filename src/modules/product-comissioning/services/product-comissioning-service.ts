import { ClientSession } from "mongoose";
import { BaseService, GridFSBucketService } from "../../../utils";
import {
  productComissioning,
  productComissioningModel,
} from "../models/product-comissioning";

export class ProductComissioningService extends BaseService<productComissioning> {
  constructor() {
    super(productComissioningModel);
  }

  private get gridFSBucket() {
    return GridFSBucketService.getInstance();
  }

  override async create(
    data: Record<string, any>,
    session?: ClientSession | undefined
  ): Promise<productComissioning> {
    return super.runTransaction<productComissioning>(
      session,
      async (newSession) => {
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
  ): Promise<productComissioning> {
    return super.runTransaction<productComissioning>(
      session,
      async (newSession) => {
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
