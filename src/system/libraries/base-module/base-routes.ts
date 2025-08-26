import { BaseController } from "./base-controller";
import { Request, Response, Router } from "express";
import multer from "multer";
import { authorizeMiddleware, validateBodyMiddleware } from "../../middlewares";

export class BaseRoutes<T> {
  controller!: BaseController<T>;
  endpoint!: string;
  dtoCreateClass!: new () => any;
  dtoUpdateClass!: new () => any;

  protected router = Router();
  protected upload = multer();
  protected resource!: string;

  constructor(
    params: Pick<
      BaseRoutes<T>,
      "controller" | "endpoint" | "dtoCreateClass" | "dtoUpdateClass"
    >
  ) {
    Object.assign(this, params);

    // init of resources
    this.resource = this.endpoint.replace("/", "");

    // init of routes
    this.initRoutes();
  }

  protected initRoutes() {
    this.initGetByIdRoute();
    this.initGetRoute();
    this.initPostRoute();
    this.initPutRoute();
    this.initDeleteRoute();
  }

  get getRouter() {
    return this.router;
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
