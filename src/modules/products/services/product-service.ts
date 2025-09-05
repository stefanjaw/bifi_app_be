import { ClientSession } from "mongoose";
import {
  BaseService,
  GridFSBucketService,
  NotFoundException,
  runTransaction,
} from "../../../system";
import { productModel } from "../models/product.model";
import { ProductDocument } from "../../../types/mongoose.gen";
import { ProductStatusService } from "./product-status-service";
import { isValidFileUpload } from "../../../system/libraries/file-storage/file-utils";
import { UpdateProductDTO } from "../models/product.dto";
import { InnerFile } from "../../../system/libraries/file-storage/file-upload.types";
import { productCSVFormat } from "../models/product-csv-format";
import { ProductTypeService } from "../../product-types/services/product-type-service";
import { ContactService } from "../../contacts/services/contact-service";

export class ProductService extends BaseService<
  ProductDocument,
  productCSVFormat
> {
  private productStatusService = new ProductStatusService();
  private productTypeService = new ProductTypeService();
  private contactsService = new ContactService();

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
      let attachments = data.attachments;
      let attachmentsMetadata = data.attachmentsMetadata as object[];

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
      // await this.activityHistoryService.create(
      //   {
      //     title: "Product Modified",
      //     details: "Modified. Notes: Product has been modified",
      //     performDate: new Date(),
      //     model: "Product",
      //     modelId: product._id,
      //   },
      //   newSession
      // );

      return product;
    });
  }

  /**
   * Exports all products as a CSV file.
   * The CSV will contain the following columns:
   * - productModel
   * - serialNumber
   * - acquiredDate
   * - acquiredPrice
   * - currentPrice
   * - condition
   * - productTypes
   * - vendors
   * - makes
   * - maintenanceWindows
   * - location
   * - warrantyDate
   * - remarks
   * - status
   * - maintenanceDate
   * - active
   *
   * @returns A Buffer containing the CSV data.
   */
  override async exportCSV(data?: Record<string, any>[]): Promise<Buffer> {
    return runTransaction<Buffer>(undefined, async (newSession) => {
      const products = await this.model.find().session(newSession);

      const json = products.map((p) => ({
        productModel: p.productModel,
        serialNumber: p.serialNumber,
        acquiredDate: p.acquiredDate?.toISOString().split("T")[0] ?? "",
        acquiredPrice: p.acquiredPrice,
        currentPrice: p.currentPrice,
        condition: p.condition,
        productTypes: p.productTypeIds?.map((t: any) => t.name).join(";"),
        vendors: p.vendorIds?.map((v: any) => v.email).join(";"),
        makes: p.makeIds.map((m: any) => m.email).join(";"),
        maintenanceWindows: p.maintenanceWindowIds
          .map((m: any) => m.name + " - " + m.recurrency)
          .join(";"),
        location: p.locationId ? p.locationId.code : "",
        warrantyDate: p.warrantyDate?.toISOString().split("T")[0] ?? "",
        remarks: p.remarks,
        status: p.status,
        maintenanceDate: p.maintenanceDate?.toISOString().split("T")[0] ?? "",
        active: p.active,
      }));

      return super.exportCSV(json);
    });
  }

  /**
   * Imports the given data into products.
   * The data should be an array of objects with the following properties:
   * - productModel: string
   * - serialNumber: string
   * - acquiredDate: string (ISO date format)
   * - acquiredPrice: number
   * - currentPrice: number
   * - condition: string
   * - productTypes: string (comma-separated list of product type names)
   * - vendors: string (comma-separated list of vendor email addresses)
   * - makes: string (comma-separated list of make email addresses)
   * - warrantyDate: string (ISO date format)
   * - remarks: string
   * - active: string (true/false)
   *
   * @param data The data to import.
   * @param session The optional client session to use for the transaction.
   * @returns An array of created product documents.
   */
  override async importCSV(
    data: productCSVFormat[],
    session?: ClientSession
  ): Promise<ProductDocument[]> {
    return await runTransaction<ProductDocument[]>(
      session,
      async (newSession) => {
        if (!data || !Array.isArray(data)) {
          throw new Error("Invalid data format");
        }

        const products: any[] = [];

        for (const product of data) {
          const productTypeNames = product.productTypes.split(";");
          const vendorEmails = product.vendors?.split(";");
          const makeEmails = product.makes?.split(";");

          // Find or create product types
          const productTypeIds = await Promise.all(
            productTypeNames.map(async (name) => {
              let productType = (
                await this.productTypeService.get(
                  { name },
                  undefined,
                  undefined,
                  undefined,
                  newSession
                )
              )[0];

              if (!productType)
                productType = await this.productTypeService.create(
                  {
                    name,
                  },
                  newSession
                );

              return productType._id;
            })
          );

          // Find or create vendors
          const vendorIds = vendorEmails
            ? await Promise.all(
                vendorEmails.map(async (email) => {
                  let vendor = (
                    await this.contactsService.get(
                      { email },
                      undefined,
                      undefined,
                      undefined,
                      newSession
                    )
                  )[0];

                  if (!vendor)
                    vendor = await this.contactsService.create(
                      {
                        name: "default",
                        lastName: "default",
                        email,
                      },
                      newSession
                    );

                  return vendor._id;
                })
              )
            : [];

          // Find or create makes
          const makeIds = makeEmails
            ? await Promise.all(
                makeEmails.map(async (email) => {
                  let make = (
                    await this.contactsService.get(
                      { email },
                      undefined,
                      undefined,
                      undefined,
                      newSession
                    )
                  )[0];

                  if (!make)
                    make = await this.contactsService.create(
                      {
                        name: "default",
                        lastName: "default",
                        email,
                      },
                      newSession
                    );

                  return make._id;
                })
              )
            : [];

          products.push({
            productModel: product.productModel,
            serialNumber: product.serialNumber,
            acquiredDate: new Date(product.acquiredDate),
            acquiredPrice: product.acquiredPrice
              ? Number.parseFloat(product.acquiredPrice)
              : undefined,
            currentPrice: product.currentPrice
              ? Number.parseFloat(product.currentPrice)
              : undefined,
            condition: product.condition,
            productTypeIds: productTypeIds,
            vendorIds: vendorIds,
            makeIds: makeIds,
            warrantyDate: product.warrantyDate
              ? new Date(product.warrantyDate)
              : undefined,
            remarks: product.remarks,
            active: product.active === "true" ? true : false,
          });
        }

        return await super.importCSV(products, newSession);
      }
    );
  }
}
