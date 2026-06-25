import { BaseController } from "./base-controller";
import { Router } from "express";
import multer from "multer";
import {
  authorizeMiddleware,
  validateBodyMiddleware,
  validateAndTransformCSVMiddleware,
} from "../../middlewares";

export class BaseRoutes<T> {
  controller!: BaseController<T>;
  endpoint!: string;
  dtoCreateClass!: new () => any;
  dtoUpdateClass!: new () => any;
  csvDtoClass?: new () => any;

  protected router = Router();
  protected upload = multer();
  protected resource!: string;

  /**
   * Creates a new BaseRoutes instance, derives the resource name from the endpoint,
   * and registers all CRUD + CSV routes.
   * @param params - Object defining controller, endpoint, DTO classes, and optional csvDtoClass.
   */
  constructor(
    params: Pick<
      BaseRoutes<T>,
      | "controller"
      | "endpoint"
      | "dtoCreateClass"
      | "dtoUpdateClass"
      | "csvDtoClass"
    >
  ) {
    Object.assign(this, params);

    // init of resources
    this.resource = this.endpoint.replace("/", "");

    // init of routes
    this.initRoutes();
  }

  /**
   * Registers all standard routes on the internal router.
   * Order: exportCSV → getById → get → post → importCSV → put → delete.
   */
  protected initRoutes(): void {
    this.initGetExportCSVRoute();
    this.initGetByIdRoute();
    this.initGetRoute();
    this.initPostRoute();
    this.initPostImportCSV();
    this.initPutRoute();
    this.initDeleteRoute();
  }

  /**
   * Returns the internal Express Router instance with all registered routes.
   * @returns The internal Express Router instance.
   */
  get getRouter() {
    return this.router;
  }

  /**
   * Initializes the GET /{endpoint}/export route.
   * This route returns a CSV file containing all records of the collection.
   * The `exportCSV` method of the controller is called to generate the CSV file.
   * Middleware: authorizeMiddleware(`${this.resource}/export`, "read").
   */
  protected initGetExportCSVRoute(): void {
    this.router.get(
      `${this.endpoint}/export`,
      authorizeMiddleware(`${this.resource}/export`, "read"),
      this.controller.exportCSV
    );
  }

  /**
   * Initializes the GET /{endpoint}/:id route.
   * Middleware: authorizeMiddleware(this.resource, "read").
   */
  protected initGetByIdRoute(): void {
    this.router.get(
      `${this.endpoint}/:id`,
      authorizeMiddleware(this.resource, "read"),
      this.controller.getById
    );
  }

  /**
   * Initializes the GET /{endpoint} route.
   * Middleware: authorizeMiddleware(this.resource, "read").
   */
  protected initGetRoute(): void {
    this.router.get(
      this.endpoint,
      authorizeMiddleware(this.resource, "read"),
      this.controller.get
    );
  }

  /**
   * Initializes the POST /{endpoint} route.
   * Accepts multipart uploads, validates the body against dtoCreateClass,
   * then checks authorizeMiddleware(this.resource, "create").
   */
  protected initPostRoute(): void {
    this.router.post(
      this.endpoint,
      this.upload.any(),
      validateBodyMiddleware(this.dtoCreateClass),
      authorizeMiddleware(this.resource, "create"),
      this.controller.create
    );
  }

  /**
   * Initializes the POST /{endpoint}/import route.
   * Expects a CSV file uploaded as multipart form data with field name "csv".
   * Validates against csvDtoClass (or dtoCreateClass as fallback),
   * then checks authorizeMiddleware(`${this.resource}/import`, "create").
   */
  protected initPostImportCSV(): void {
    this.router.post(
      `${this.endpoint}/import`,
      this.upload.single("csv"),
      validateAndTransformCSVMiddleware(
        this.csvDtoClass || this.dtoCreateClass
      ),
      authorizeMiddleware(`${this.resource}/import`, "create"),
      this.controller.importCSV
    );
  }

  /**
   * Initializes the PUT /{endpoint} route.
   * Accepts multipart uploads, validates the body against dtoUpdateClass,
   * then checks authorizeMiddleware(this.resource, "update").
   */
  protected initPutRoute(): void {
    this.router.put(
      this.endpoint,
      this.upload.any(),
      validateBodyMiddleware(this.dtoUpdateClass),
      authorizeMiddleware(this.resource, "update"),
      this.controller.update
    );
  }

  /**
   * Initializes the DELETE /{endpoint} route.
   * Middleware: authorizeMiddleware(this.resource, "delete").
   */
  protected initDeleteRoute(): void {
    this.router.delete(
      this.endpoint,
      authorizeMiddleware(this.resource, "delete"),
      this.controller.delete
    );
  }
}
