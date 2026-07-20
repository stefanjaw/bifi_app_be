import { BaseRoutes, authorizeMiddleware } from "../../../../system";
import { InterventionDocument } from "@mongodb-types";
import { InterventionController } from "../controllers/intervention-controller";
import {
  InterventionDTO,
  UpdateInterventionDTO,
} from "../models/intervention.dto";

const interventionController = new InterventionController();

/** Route definitions for intervention endpoints */
export class InterventionRouter extends BaseRoutes<InterventionDocument> {
  constructor() {
    super({
      controller: interventionController,
      endpoint: "/interventions",
      dtoCreateClass: InterventionDTO,
      dtoUpdateClass: UpdateInterventionDTO,
    });
  }

  protected override initRoutes() {
    super.initRoutes();

    this.router.put(
      "/interventions/:id/add-order-set",
      authorizeMiddleware("interventions", "update"),
      interventionController.addOrderSet,
    );

    this.router.put(
      "/interventions/:id/remove-order-set",
      authorizeMiddleware("interventions", "update"),
      interventionController.removeOrderSet,
    );

    this.router.put(
      "/interventions/:id/add-multiple-order",
      authorizeMiddleware("interventions", "update"),
      interventionController.addMultipleOrders,
    );

    this.router.put(
      "/interventions/:id/remove-multiple-order",
      authorizeMiddleware("interventions", "update"),
      interventionController.removeMultipleOrders,
    );
  }
}
