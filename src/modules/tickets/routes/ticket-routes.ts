import { TicketDocument } from "@mongodb-types";
import { BaseRoutes, authorizeMiddleware } from "../../../system";
import { TicketController } from "../controllers/ticket-controller";
import { TicketDTO, UpdateTicketDTO } from "../models/ticket.dto";

const ticketController = new TicketController();

export class TicketRouter extends BaseRoutes<TicketDocument> {
  constructor() {
    super({
      controller: ticketController,
      endpoint: "/tickets",
      dtoCreateClass: TicketDTO,
      dtoUpdateClass: UpdateTicketDTO,
    });
  }

  protected override initRoutes(): void {
    this.initGetExportCSVRoute();

    this.router.get(
      "/tickets/report",
      authorizeMiddleware("tickets/report", "read"),
      (req, res, next) => ticketController.reportHandler(req, res, next)
    );

    this.initGetByIdRoute();
    this.initGetRoute();
    this.initPostRoute();
    this.initPostImportCSV();
    this.initPutRoute();
    this.initDeleteRoute();
  }
}
