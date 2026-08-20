import { ApiKeyDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { ApiKeyController } from "../controllers/api-key-controller";
import { CreateApiKeyDTO, UpdateApiKeyDTO } from "../models/api-key.dto";

const apiKeyController = new ApiKeyController();

export class ApiKeyRouter extends BaseRoutes<ApiKeyDocument> {
  constructor() {
    super({
      controller: apiKeyController,
      endpoint: "/api-keys",
      dtoCreateClass: CreateApiKeyDTO,
      dtoUpdateClass: UpdateApiKeyDTO,
    });
  }
}
