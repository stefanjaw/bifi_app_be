import { purchaseOrderModel } from "../models/purchase-order.model";
import { contactModel } from "../../contacts/models/contact.model";

export class PurchaseSuppliersService {
  async getAll(
    searchParams: Record<string, any> = {},
    paginationOptions: { page?: number; limit?: number; paginate?: boolean } = {},
  ) {
    const { showAll, ...filters } = searchParams;
    const query =
      showAll === "true"
        ? filters
        : await this._contactsWithOrdersQuery(filters);

    if (paginationOptions.paginate) {
      return await contactModel.paginate(query, {
        page: paginationOptions.page ?? 1,
        limit: paginationOptions.limit ?? 10,
      });
    }

    return await contactModel.find(query);
  }

  async getById(id: string) {
    return await contactModel.findById(id);
  }

  private async _contactsWithOrdersQuery(extraFilters: Record<string, any> = {}) {
    const contactIds = await purchaseOrderModel.distinct("contactId");
    return { _id: { $in: contactIds }, ...extraFilters };
  }
}
