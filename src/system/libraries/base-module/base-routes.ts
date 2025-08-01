import { BaseController } from "./base-controller";
import { Router } from "express";
import multer from "multer";
import { validateBodyMiddleware } from "../../middlewares";

export class BaseRoutes<T> {
  controller!: BaseController<T>;
  endpoint!: string;
  dtoCreateClass!: new () => any;
  dtoUpdateClass!: new () => any;

  protected router = Router();
  protected upload = multer();

  constructor(
    params: Pick<
      BaseRoutes<T>,
      "controller" | "endpoint" | "dtoCreateClass" | "dtoUpdateClass"
    >
  ) {
    Object.assign(this, params);

    // init of routes
    this.initGetRoute();
    this.initPostRoute();
    this.initPutRoute();
    this.initDeleteRoute();
  }

  get getRouter() {
    return this.router;
  }

  protected initGetRoute() {
    this.router.get(this.endpoint, this.controller.get);
  }

  protected initPostRoute() {
    this.router.post(
      this.endpoint,
      this.upload.any(),
      validateBodyMiddleware(this.dtoCreateClass),
      this.controller.create
    );
  }

  protected initPutRoute() {
    this.router.put(
      this.endpoint,
      this.upload.any(),
      validateBodyMiddleware(this.dtoUpdateClass),
      this.controller.update
    );
  }

  protected initDeleteRoute() {
    this.router.delete(this.endpoint, this.controller.delete);
  }
}
