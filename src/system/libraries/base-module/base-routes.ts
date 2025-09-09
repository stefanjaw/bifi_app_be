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

  protected initRoutes() {
    this.initGetExportCSVRoute();
    this.initGetByIdRoute();
    this.initGetRoute();
    this.initPostRoute();
    this.initPostImportCSV();
    this.initPutRoute();
    this.initDeleteRoute();
  }

  get getRouter() {
    return this.router;
  }

  protected initGetExportCSVRoute() {
    this.router.get(
      `${this.endpoint}/export`,
      authorizeMiddleware(this.resource, "read"),
      this.controller.exportCSV
    );
  }

  protected initGetByIdRoute() {
    this.router.get(
      `${this.endpoint}/:id`,
      authorizeMiddleware(this.resource, "read"),
      this.controller.getById
    );
  }

  protected initGetRoute() {
    this.router.get(
      this.endpoint,
      authorizeMiddleware(this.resource, "read"),
      this.controller.get
    );
  }

  protected initPostRoute() {
    this.router.post(
      this.endpoint,
      this.upload.any(),
      validateBodyMiddleware(this.dtoCreateClass),
      authorizeMiddleware(this.resource, "create"),
      this.controller.create
    );
  }

  /**
   * Initialize the POST /{endpoint}/import route.
   *
   * This route expects a CSV file to be sent in the request body.
   * The file is validated against the `csvDtoClass` if provided, otherwise
   * it is validated against the `dtoCreateClass`.
   * The `importCSV` method of the controller is called with the validated records.
   */
  protected initPostImportCSV() {
    this.router.post(
      `${this.endpoint}/import`,
      this.upload.single("csv"),
      validateAndTransformCSVMiddleware(
        this.csvDtoClass || this.dtoCreateClass
      ),
      authorizeMiddleware(this.resource, "create"),
      this.controller.importCSV
    );
  }

  protected initPutRoute() {
    this.router.put(
      this.endpoint,
      this.upload.any(),
      validateBodyMiddleware(this.dtoUpdateClass),
      authorizeMiddleware(this.resource, "update"),
      this.controller.update
    );
  }

  protected initDeleteRoute() {
    this.router.delete(
      this.endpoint,
      authorizeMiddleware(this.resource, "delete"),
      this.controller.delete
    );
  }
}
