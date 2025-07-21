import isBetween from "dayjs/plugin/isBetween";
import dayjs from "dayjs";
import { runTransaction, ValidationException } from "../../../system";
import { ClientSession, Types } from "mongoose";
import {
  ProductComissioningDocument,
  ProductDocument,
  ProductMaintenanceDocument,
} from "@mongodb-types";
import { productStatus } from "../models/product-status.type";
import { productModel } from "../models/product.model";
dayjs.extend(isBetween);

export class ProductStatusService {
  /**
   * Updates the status of a product based on its maintenance and commissioning records.
   *
   * This function retrieves the product by its ID and evaluates its active maintenances
   * and commissioning outcome to determine the appropriate status. The product status
   * can be set to "under-service" if an active service maintenance is found, "in-pm" for
   * preventive maintenance, or "active" if the commissioning outcome is a pass. If none
   * of these conditions are met, the status remains "awaiting-comissioning".
   *
   * @param productId - The ID of the product to update.
   * @param session - The optional client session to use for the transaction.
   */

  updateProductStatus(
    productId: string | Types.ObjectId,
    session: ClientSession | undefined
  ) {
    return runTransaction<ProductDocument>(session, async (newSession) => {
      let productStatus: productStatus = "awaiting-comissioning";

      const product = await productModel
        .findById(productId)
        .session(newSession);

      if (!product) throw new ValidationException("Product not found");

      const maintenances: ProductMaintenanceDocument[] =
        product.productMaintenances;
      const comissioning: ProductComissioningDocument | null =
        product.productComission;

      // check if service is available
      const service = maintenances.find(
        (m) => m.active && m.type === "service"
      );

      // check if preventive maintenance
      const preventive = maintenances.find(
        (m) => m.active && m.type === "preventive-maintenance"
      );

      if (service) {
        productStatus = "under-service";
      } else if (preventive) {
        productStatus = "in-pm";
      } else if (comissioning && comissioning.outcome === "pass") {
        productStatus = "active";
      }

      return (await productModel.findByIdAndUpdate(
        productId,
        {
          status: productStatus,
        },
        { session: newSession, new: true }
      )) as ProductDocument;
    });
  }

  /**
   * Checks if a product has an active and approved comissioning.
   *
   * This function retrieves the product by its ID and evaluates its active
   * comissioning to determine if it is approved. The function returns a boolean
   * indicating if the product has an active and approved comissioning.
   *
   * @param productId - The ID of the product to check.
   * @param session - The optional client session to use for the transaction.
   * @returns A boolean indicating if the product has an active and approved comissioning.
   */
  productHasActiveComissioning(
    productId: string,
    session: ClientSession | undefined
  ) {
    return runTransaction<boolean>(session, async (newSession) => {
      const product = await productModel
        .findById(productId)
        .session(newSession);

      return product?.productComission?.outcome === "pass";
    });
  }

  /**
   * Calculates and updates the next maintenance dates for a product.
   *
   * This method fetches a product by its ID and retrieves its associated
   * maintenance window to calculate the upcoming maintenance dates.
   * The next maintenance date is based on the recurrency details
   * specified in the maintenance window. The method updates the product's
   * record with the calculated minimum, maximum, and target maintenance dates.
   *
   * @param productId - The ID of the product for which to update maintenance dates.
   * @param session - The optional client session to use for the transaction.
   * @returns The updated product document with new maintenance dates.
   * @throws ValidationException if the product or its maintenance window is not found.
   */

  updateNextProductMaintenanceDates(
    productId: string | Types.ObjectId,
    session: ClientSession | undefined
  ) {
    return runTransaction<ProductDocument>(session, async (newSession) => {
      const product = await productModel
        .findById(productId)
        .session(newSession);

      // Check if the product exists and is comissioned
      if (!product) throw new ValidationException("Product not found");
      if (product.productComission?.outcome !== "pass")
        throw new ValidationException(
          "Product not comissioned, must be comissioned to update maintenance dates"
        );

      const window = product.maintenanceWindowIds?.[0];

      if (!window)
        throw new ValidationException("Maintenance window not found");

      // get recurrency for the maintenanceDate
      const { unit, count } = window.parseRecurrencyForDayjs();

      // calculate min and max maintenance dates and curr maintenance date
      const maintenanceDate = dayjs(product.maintenanceDate).add(count, unit);
      const minMaintenanceDate = dayjs(maintenanceDate).subtract(
        window.daysBefore,
        "day"
      );
      const maxMaintenanceDate = dayjs(maintenanceDate).add(
        window.daysAfter,
        "day"
      );

      return (await productModel.findByIdAndUpdate(
        productId,
        {
          minMaintenanceDate: minMaintenanceDate.toDate(),
          maxMaintenanceDate: maxMaintenanceDate.toDate(),
          maintenanceDate: maintenanceDate.toDate(),
        },
        { session: newSession, new: true }
      )) as ProductDocument;
    });
  }

  /**
   * Updates the maintenance dates for a product based on its maintenance window.
   *
   * This function retrieves the product by its ID and evaluates its active
   * maintenance window to determine the next maintenance dates. The function
   * then updates the product with the new maintenance dates.
   *
   * @param productId - The ID of the product to update.
   * @param session - The optional client session to use for the transaction.
   * @returns The updated product document.
   */
  updateProductMaintenanceDates(
    productId: string | Types.ObjectId,
    session: ClientSession | undefined
  ) {
    return runTransaction<ProductDocument>(session, async (newSession) => {
      const product = await productModel
        .findById(productId)
        .session(newSession);

      // Check if the product exists and is comissioned
      if (!product) throw new ValidationException("Product not found");
      if (product.productComission?.outcome !== "pass")
        throw new ValidationException(
          "Product not comissioned, must be comissioned to update maintenance dates"
        );

      const window = product.maintenanceWindowIds?.[0];

      if (!window)
        throw new ValidationException("Maintenance window not found");

      const minMaintenanceDate = dayjs(product.maintenanceDate).subtract(
        window.daysBefore,
        "day"
      );
      const maxMaintenanceDate = dayjs(product.maintenanceDate).add(
        window.daysAfter,
        "day"
      );

      return (await productModel.findByIdAndUpdate(
        productId,
        {
          minMaintenanceDate: minMaintenanceDate.toDate(),
          maxMaintenanceDate: maxMaintenanceDate.toDate(),
        },
        { session: newSession, new: true }
      )) as ProductDocument;
    });
  }
}
