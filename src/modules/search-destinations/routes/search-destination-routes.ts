import { BaseRoutes, authorizeMiddleware } from "../../../system";
import { SearchDestinationDocument } from "@mongodb-types";
import { SearchDestinationController } from "../controllers/search-destination-controller";
import {
  SearchDestinationDTO,
  UpdateSearchDestinationDTO,
} from "../models/search-destination.dto";

const searchDestinationController = new SearchDestinationController();

export class SearchDestinationRouter extends BaseRoutes<SearchDestinationDocument> {
  constructor() {
    super({
      controller: searchDestinationController,
      endpoint: "/search-destinations",
      dtoCreateClass: SearchDestinationDTO,
      dtoUpdateClass: UpdateSearchDestinationDTO,
    });
  }

  protected override initRoutes() {
    // Custom routes MUST be registered before the base `/:id` route so that
    // `/all` and `/sync` are not captured by the param route.
    this.router.get(
      "/search-destinations/all",
      authorizeMiddleware("search-destinations", "read"),
      searchDestinationController.getAll,
    );

    this.router.post(
      "/search-destinations/sync",
      authorizeMiddleware("search-destinations", "update"),
      searchDestinationController.sync,
    );

    // Standard CRUD (getById, get, create, update, delete, csv).
    super.initRoutes();
  }
}
