import { NextFunction, Request, Response } from "express";
import { BaseController } from "../../../system/libraries/base-module/base-controller";
import { JournalEntryDocument } from "../models/journal-entry.model";
import { JournalEntryService } from "../services/journal-entry-service";
import { GlIntegrationService } from "../services/gl-integration-service";

/**
 * Controller for the GL sweep actions: posts pending stock movements as
 * journal entries (Phase B2, action-only — no own entity).
 */
export class GlController extends BaseController<JournalEntryDocument> {
  private glIntegrationService = new GlIntegrationService();

  constructor() {
    super({ service: new JournalEntryService() });
  }

  /** Runs one sweep pass of pending stock movements and reports the result */
  async postPendingHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.glIntegrationService.postPendingMovements();
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  }
}
