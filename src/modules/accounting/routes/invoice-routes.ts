import { BaseRoutes, authorizeMiddleware } from "../../../system";
import { JournalEntryDocument } from "../models/journal-entry.model";
import { InvoiceController } from "../controllers/invoice-controller";
import {
  AccountingInvoiceDTO,
  UpdateAccountingInvoiceDTO,
} from "../models/invoice.dto";

const invoiceController = new InvoiceController();

export class InvoiceRouter extends BaseRoutes<JournalEntryDocument> {
  constructor() {
    super({
      controller: invoiceController,
      endpoint: "/accounting/invoices",
      dtoCreateClass: AccountingInvoiceDTO,
      dtoUpdateClass: UpdateAccountingInvoiceDTO,
    });
  }

  protected override initRoutes() {
    super.initRoutes();

    this.router.get(
      "/accounting/invoices/:id/payments",
      authorizeMiddleware("accounting/invoices", "read"),
      invoiceController.getPayments
    );

    this.router.post(
      "/accounting/invoices/:id/register-payment",
      authorizeMiddleware("accounting/invoices", "update"),
      invoiceController.registerPayment
    );

    this.router.put(
      "/accounting/invoices/:id/post",
      authorizeMiddleware("accounting/invoices", "update"),
      invoiceController.postInvoice
    );

    this.router.put(
      "/accounting/invoices/:id/cancel",
      authorizeMiddleware("accounting/invoices", "update"),
      invoiceController.cancelInvoice
    );
  }
}
