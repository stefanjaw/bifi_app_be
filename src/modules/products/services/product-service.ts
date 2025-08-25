import { ClientSession, PaginateResult } from "mongoose";
import {
  BaseService,
  GridFSBucketService,
  orderByQuery,
  runTransaction,
} from "../../../system";
import { productModel } from "../models/product.model";
import { ProductDocument } from "../../../types/mongoose.gen";
import { ProductStatusService } from "./product-status-service";
import { ActivityHistoryService } from "../../activity-history/services/activity-history-service";
import { productComissioningModel } from "../../product-comissioning/models/product-comissioning.model";
import { productMaintenanceModel } from "../../product-maintenance/models/product-maintenance.model";

type paginationOptions =
  | { paginate: true; page: number; limit: number }
  | { paginate: false };

export class ProductService extends BaseService<ProductDocument> {
  private productStatusService = new ProductStatusService();
  private activityHistoryService = new ActivityHistoryService();

  constructor() {
    super({ model: productModel });
  }

  private get gridFSBucket() {
    return GridFSBucketService.getInstance();
  }

  override get(
    searchParams: Record<string, any>,
    paginationOptions: undefined,
    orderBy: orderByQuery["orderBy"] | undefined,
    count: boolean | undefined,
    session: ClientSession | undefined
  ): Promise<ProductDocument[]>;
  override get(
    searchParams: Record<string, any>,
    paginationOptions: paginationOptions & { paginate: true },
    orderBy: orderByQuery["orderBy"] | undefined,
    count: boolean | undefined,
    session: ClientSession | undefined
  ): Promise<PaginateResult<ProductDocument>>;

  /**
   * Retrieves products from the database.
   * @param searchParams - The search params as key value pair.
   * @param paginationOptions - The pagination options with `paginate` set to `true`.
   * @param orderBy - The order by query.
   * @param count - Whether to count the number of records.
   * @param session - Optional mongoose session.
   * @returns A promise that resolves to a mongoose paginate result or an array of products.
   * If `paginationOptions.paginate` is `true`, a mongoose paginate result is returned.
   * If `paginationOptions.paginate` is `false`, an array of products is returned.
   * If `count` is `true`, the count of the number of records is returned.
   */
  override get(
    searchParams: Record<string, any>,
    paginationOptions: paginationOptions | undefined,
    orderBy: orderByQuery["orderBy"] | undefined,
    count: boolean | undefined,
    session?: ClientSession | undefined
  ): Promise<PaginateResult<ProductDocument> | ProductDocument[]> {
    return runTransaction<PaginateResult<ProductDocument> | ProductDocument[]>(
      session,
      async (newSession) => {
        let products: PaginateResult<ProductDocument> | ProductDocument[];

        if (paginationOptions && paginationOptions.paginate) {
          products = await super.get(
            searchParams,
            paginationOptions,
            orderBy,
            count,
            newSession
          );
        } else {
          products = await super.get(
            searchParams,
            undefined,
            orderBy,
            count,
            newSession
          );
        }

        const lenght = this.isPagination(products)
          ? products.docs.length
          : products.length;

        // Thus it is a single product, example, when updating or creating, and
        // we want to return the product with its documents
        if (lenght > 1 || count) return products;

        // Thus it is a single product
        const product = this.isPagination(products)
          ? products.docs[0].toObject()
          : products[0].toObject();

        // Get the product's documents
        product.documents = await this.getDocumentsPerProduct(
          product,
          newSession
        );

        // Thus it is a single product
        products = this.isPagination(products)
          ? { ...products, docs: [product] }
          : [product];

        return products;
      }
    );
  }

  /**
   * Retrieves all documents associated with a product from both product comissioning and product maintenance.
   * @param product - The product document.
   * @param session - Optional mongoose session.
   * @returns An array of all documents associated with the product.
   */
  private async getDocumentsPerProduct(
    product: ProductDocument,
    session: ClientSession | null = null
  ) {
    const files: object[] = [];

    // Get the product's comissions
    const productComissions = await productComissioningModel
      .find({
        productId: product._id,
      })
      .session(session);

    // Get the product's maintenances
    const productMaintenances = await productMaintenanceModel
      .find({
        productId: product._id,
      })
      .session(session);

    // Add the attachments to the files array
    productComissions
      ?.flatMap((comission) => comission.attachments)
      .forEach((attachment) => {
        files.push(attachment);
      });

    productMaintenances
      ?.flatMap((maintenance) => maintenance.attachments)
      .forEach((attachment) => {
        files.push(attachment);
      });

    return files;
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
