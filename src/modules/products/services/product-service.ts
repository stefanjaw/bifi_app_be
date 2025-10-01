import mongoose, { ClientSession, PaginateModel } from "mongoose";
import {
  BaseService,
  GridFSBucketService,
  NotFoundException,
  runTransaction,
  ValidationException,
} from "../../../system";
import { productModel } from "../models/product.model";
import { ProductStatusService } from "./product-status-service";
import { isValidFileUpload } from "../../../system/libraries/file-storage/file-utils";
import { ProductDTO, UpdateProductDTO } from "../models/product.dto";
import { InnerFile } from "../../../system/libraries/file-storage/file-upload.types";
import { ProductTypeService } from "../../product-types/services/product-type-service";
import { ContactService } from "../../contacts/services/contact-service";
import { ProductCSVDTO } from "../models/product-csv.dto";
import {
  ContactDocument,
  ProductDocument,
  ProductTypeDocument,
  RoomDocument,
} from "@mongodb-types";

export class ProductService extends BaseService<ProductDocument> {
  private productStatusService = new ProductStatusService();
  private productTypeService = new ProductTypeService();
  private contactsService = new ContactService();

  constructor() {
    super({
      model: productModel,
      // refFields: ["productTypeIds", "vendorIds", "makeIds"],
      refFields: [
        {
          path: "productTypeIds",
          getModel: () =>
            mongoose.model("ProductType") as PaginateModel<ProductTypeDocument>,
          isArray: true,
        },
        {
          path: "vendorIds",
          getModel: () =>
            mongoose.model("Contact") as PaginateModel<ContactDocument>,
          isArray: true,
        },
        {
          path: "makeIds",
          getModel: () =>
            mongoose.model("Contact") as PaginateModel<ContactDocument>,
          isArray: true,
        },
        {
          path: "locationId",
          getModel: () => mongoose.model("Room") as PaginateModel<RoomDocument>,
          isArray: false,
        },
      ],
    });
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
    data: ProductDTO,
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

      // productType & make
      const makeId = await this.createMakeId(data, false, newSession);
      const productTypeId = await this.createProductTypeId(
        data,
        false,
        newSession
      );

      // Create the product
      let product = await super.create(
        { ...data, makeIds: [makeId], productTypeIds: [productTypeId] },
        newSession
      );

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

      // productType & make
      const makeId = await this.createMakeId(data, true, newSession);
      const productTypeId = await this.createProductTypeId(
        data,
        true,
        newSession
      );

      // Update the product
      let product = await super.update(
        {
          ...data,
          photo,
          attachments,
          ...(makeId && { makeIds: [makeId] }),
          ...(productTypeId && { productTypeIds: [productTypeId] }),
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

      return product;
    });
  }

  /**
   * Creates a product type id with the given data and returns the created id.
   * If the data contains a "productTypeInformation" field with an object value,
   * it will be handled as a product type creation and the product type id will be stored in the "productTypeIds"
   * field of the product data.
   * @param data The data to create the product type id with.
   * @param newSession The optional client session to use for the transaction.
   * @returns The created product type id.
   * @throws ValidationException if the product type is not provided.
   **/
  private async createProductTypeId(
    data: ProductDTO | UpdateProductDTO,
    isUpdate: boolean,
    session: ClientSession
  ) {
    return await runTransaction<string | undefined>(
      session,
      async (newSession) => {
        // productType
        let productTypeId = data.productTypeIds?.[0] || undefined;

        if (data.productTypeInformation && !productTypeId) {
          productTypeId = (
            data.productTypeInformation._id
              ? await this.productTypeService.update(
                  {
                    ...data.productTypeInformation,
                    _id: data.productTypeInformation._id || "",
                  },
                  newSession
                )
              : await this.productTypeService.create(
                  data.productTypeInformation,
                  newSession
                )
          )._id.toString();
        }

        if (!productTypeId && !isUpdate)
          throw new ValidationException("Product type is required");

        return productTypeId;
      }
    );
  }

  /**
   * Creates a make id with the given data and returns the created id.
   * If the data contains a "makeInformation" field with an object value,
   * it will be handled as a make creation and the make id will be stored in the "makeIds"
   * field of the product data.
   * @param data The data to create the make id with.
   * @param newSession The optional client session to use for the transaction.
   * @returns The created make id.
   * @throws ValidationException if the make is not provided.
   */
  private async createMakeId(
    data: ProductDTO | UpdateProductDTO,
    isUpdate: boolean,
    session: ClientSession
  ) {
    return await runTransaction<string | undefined>(
      session,
      async (newSession) => {
        // make
        let makeId = data.makeIds?.[0] || undefined;

        if (data.makeInformation && !makeId) {
          makeId = (
            data.makeInformation._id
              ? await this.contactsService.update(
                  {
                    ...data.makeInformation,
                    _id: data.makeInformation._id || "",
                  },
                  newSession
                )
              : await this.contactsService.create(
                  data.makeInformation,
                  newSession
                )
          )._id.toString();
        }

        if (!makeId && !isUpdate)
          throw new ValidationException("Make is required");

        return makeId;
      }
    );
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
        status:
          p.status
            ?.replace("-", " ")
            .split(" ")
            .map((s) => `${s.charAt(0).toUpperCase() + s.slice(1)}`)
            .join(" ") ?? "",
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
    data: ProductCSVDTO[],
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
                        phoneNumber: "0000000000",
                        type: "company",
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
                        phoneNumber: "0000000000",
                        type: "company",
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
            acquiredDate: product.acquiredDate,
            acquiredPrice: product.acquiredPrice,
            currentPrice: product.currentPrice,
            condition: product.condition,
            productTypeIds: productTypeIds,
            vendorIds: vendorIds,
            makeIds: makeIds,
            warrantyDate: product.warrantyDate,
            remarks: product.remarks,
            active: product.active,
          });
        }

        return await super.importCSV(products, newSession);
      }
    );
  }
}
