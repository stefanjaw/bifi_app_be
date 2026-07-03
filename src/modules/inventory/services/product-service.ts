import { ClientSession } from "mongoose";
import { BaseService, runTransaction } from "../../../system";
import { productModel, ProductDocument } from "../models/product.model";
import { ProductDTO, UpdateProductDTO } from "../models/product.dto";
import { isValidFileUpload } from "../../../system/libraries/file-storage/file-utils";
import { InnerFile } from "../../../system/libraries/file-storage/file-upload.types";

export class ProductService extends BaseService<ProductDocument> {
  constructor() {
    super({ model: productModel });
  }

  override async create(
    data: ProductDTO,
    session?: ClientSession | undefined,
  ): Promise<ProductDocument> {
    return runTransaction<ProductDocument>(session, async (newSession) => {
      const bucket = this.connectionManager.bindBucketToDb();

      if (isValidFileUpload(data.photo)) {
        const fileId = await bucket.uploadFile(
          Array.isArray(data.photo) ? data.photo[0] : data.photo,
        );
        data.photo = fileId;
      } else {
        delete (data as any).photo;
      }

      if (
        isValidFileUpload(data.attachments) &&
        Array.isArray(data.attachments)
      ) {
        data.attachments = await Promise.all(
          (data.attachments as Express.Multer.File[]).map<Promise<InnerFile>>(
            async (file) => ({
              fileId: await bucket.uploadFile(file),
              name: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
            }),
          ),
        );
      } else {
        delete (data as any).attachments;
      }

      return super.create(data, newSession);
    });
  }

  override async update(
    data: UpdateProductDTO,
    session?: ClientSession | undefined,
  ): Promise<ProductDocument> {
    return runTransaction<ProductDocument>(session, async (newSession) => {
      const bucket = this.connectionManager.bindBucketToDb();

      let photo = data.photo;
      if (isValidFileUpload(photo)) {
        const fileId = await bucket.uploadFile(
          Array.isArray(photo) ? photo[0] : photo,
        );
        photo = fileId;
      } else if (photo !== undefined) {
        photo = null;
      }
      data.photo = photo;

      let attachments = data.attachments;
      if (isValidFileUpload(attachments) && Array.isArray(attachments)) {
        attachments = await Promise.all(
          (attachments as Express.Multer.File[]).map<Promise<InnerFile>>(
            async (file) => ({
              fileId: await bucket.uploadFile(file),
              name: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
            }),
          ),
        );
        data.attachments = attachments;
      } else {
        delete (data as any).attachments;
      }

      return super.update(data, newSession);
    });
  }
}
