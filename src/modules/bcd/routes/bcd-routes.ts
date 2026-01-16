import { BCDDocument } from "@mongodb-types";
import { authorizeMiddleware, BaseRoutes } from "../../../system";
import { BCDController } from "../controllers/bcd-controller";
import { BcdDTO, UpdateBcdDTO } from "../models/bcd.dto";

export class BCDRouter extends BaseRoutes<BCDDocument> {
  constructor() {
    super({
      controller: new BCDController(),
      endpoint: "/bcds",
      dtoCreateClass: BcdDTO,
      dtoUpdateClass: UpdateBcdDTO,
    });
  }

  protected override initRoutes(): void {
    this.initUploadBCDDataToFTPRoute();
    this.initUpdateBCDsFromFTPRoute();
    super.initRoutes();
  }

  initUploadBCDDataToFTPRoute() {
    this.router.post(
      `${this.endpoint}/upload-ftp/:id`,
      authorizeMiddleware(`${this.resource}/upload-ftp/:id`, "create"),
      (this.controller as BCDController).postUploadBCDDataToFTP
    );
  }

  initUpdateBCDsFromFTPRoute() {
    this.router.put(
      `${this.endpoint}/update-ftp`,
      authorizeMiddleware(`${this.resource}/update-ftp`, "update"),
      (this.controller as BCDController).putUpdateBCDsFromFTPP
    );
  }
}
