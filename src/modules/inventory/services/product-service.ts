import mongoose, { ClientSession } from "mongoose";
import { BaseService, runTransaction } from "../../../system";
import { productModel, ProductDocument } from "../models/product.model";
import { ProductDTO, UpdateProductDTO } from "../models/product.dto";
import { stockBalanceModel } from "../models/stock-balance.model";
import { isValidFileUpload } from "../../../system/libraries/file-storage/file-utils";
import { InnerFile } from "../../../system/libraries/file-storage/file-upload.types";

/** Stock summary returned by the product stock-summary endpoint. */
export interface ProductStockSummary {
  onHand: number;
  incoming: number;
  committed: number;
  available: number;
}

/** Business logic service for product operations with file upload handling */
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
        (data as any).photo = fileId;
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
        photo = fileId as any;
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

  /**
   * Computes the stock summary for a single product by aggregating all
   * stock-balance documents for that product across every warehouse/location.
   * `incoming`/`committed` are not yet tracked (no purchase-order/sales-order
   * allocation logic exists) and default to 0; `available` equals `onHand`.
   * @param productId - The product _id to summarize.
   * @returns The stock summary `{ onHand, incoming, committed, available }`.
   */
  async getStockSummary(productId: string): Promise<ProductStockSummary> {
    const boundBalanceModel =
      this.connectionManager.bindModelToDb(stockBalanceModel);
    const result = await boundBalanceModel.aggregate<{ onHand: number }>([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } },
      { $group: { _id: "$productId", onHand: { $sum: "$quantity" } } },
    ]);
    const onHand = result[0]?.onHand ?? 0;
    return {
      onHand,
      incoming: 0,
      committed: 0,
      available: onHand,
    };
  }
}
