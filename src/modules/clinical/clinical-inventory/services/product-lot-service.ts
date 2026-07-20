import { BaseService, NotFoundException } from "../../../../system";
import { productLotModel } from "../models/product-lot.model";
import { ProductLotDocument, InventoryProductDocument } from "@mongodb-types";
import { ClientSession } from "mongoose";

/** Business logic service for product lot operations with reference fields */
export class ProductLotService extends BaseService<ProductLotDocument> {
  constructor() {
    super({
      model: productLotModel,
      refFields: [
        {
          path: "products",
          getModel: () => this.connectionManager.getModel("InventoryProduct"),
          isArray: true,
        },
      ],
    });
  }

  /**
   * Adds a product to a lot.
   * @param lotId - The product lot ID
   * @param productId - The product ID to add
   * @param session - Optional Mongoose client session
   */
  async addProduct(
    lotId: string,
    productId: string,
    session?: ClientSession,
  ): Promise<ProductLotDocument> {
    const lot = await productLotModel.findById(lotId).session(session || null);
    if (!lot) throw new NotFoundException("Product lot not found");

    const exists = (lot.products || []).some(
      (p: InventoryProductDocument) => p.toString() === productId,
    );
    if (!exists) {
      lot.products.push(productId);
      await lot.save({ session: session || undefined });
    }

    return lot;
  }

  /**
   * Removes a product from a lot.
   * @param lotId - The product lot ID
   * @param productId - The product ID to remove
   * @param session - Optional Mongoose client session
   */
  async removeProduct(
    lotId: string,
    productId: string,
    session?: ClientSession,
  ): Promise<ProductLotDocument> {
    const lot = await productLotModel.findById(lotId).session(session || null);
    if (!lot) throw new NotFoundException("Product lot not found");

    await productLotModel.updateOne(
      { _id: lotId },
      { $pull: { products: productId } },
      { session: session || undefined },
    );

    return lot;
  }
}
