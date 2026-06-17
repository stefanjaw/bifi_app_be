import { Router } from "express";
import { authorizeMiddleware } from "../../../system";
import { SearchDestinationController } from "../controllers/search-destination-controller";

/**
 * Standalone `/api/search` endpoint. Kept separate from the
 * `/search-destinations` CRUD router so it reads as an app-wide search
 * entrypoint (and can serve non-frontend consumers), while still delegating
 * to the same portable search provider.
 */
export class SearchRouter {
  private router = Router();
  private controller = new SearchDestinationController();

  constructor() {
    this.router.get(
      "/search",
      authorizeMiddleware("search-destinations", "read"),
      this.controller.search
    );
  }

  get getRouter() {
    return this.router;
  }
}
