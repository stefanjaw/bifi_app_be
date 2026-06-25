import { BaseService } from "../../../system";
import { ContactDocument } from "@mongodb-types";
import { contactModel } from "../../contacts/models/contact.model";
import { purchaseOrderModel } from "../models/purchase-order.model";

export class PurchaseSuppliersService extends BaseService<ContactDocument> {
  constructor() {
    super({ model: contactModel });
  }

  async getAll(
    searchParams: Record<string, any> = {},
    paginationOptions: {
      page?: number;
      limit?: number;
      paginate?: boolean;
    } = {}
  ) {
    const { showAll, ...filters } = searchParams;
    const query =
      showAll === "true"
        ? filters
        : await this._contactsWithOrdersQuery(filters);

    const boundContactModel =
      this.connectionManager.bindModelToDb(contactModel);

    if (paginationOptions.paginate) {
      return await boundContactModel.paginate(query, {
        page: paginationOptions.page ?? 1,
        limit: paginationOptions.limit ?? 10,
      });
    }

    return await boundContactModel.find(query);
  }

  async getSupplierById(id: string) {
    const boundContactModel =
      this.connectionManager.bindModelToDb(contactModel);
    return await boundContactModel.findById(id);
  }

  private async _contactsWithOrdersQuery(
    extraFilters: Record<string, any> = {}
  ) {
    const boundPurchaseOrderModel =
      this.connectionManager.bindModelToDb(purchaseOrderModel);
    const contactIds = await boundPurchaseOrderModel.distinct("contactId");
    return { _id: { $in: contactIds }, ...extraFilters };
  }
}
