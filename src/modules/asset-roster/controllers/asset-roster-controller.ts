import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import {
  BaseController,
  FileValidatorService,
  ValidationException,
} from "../../../system";
import { AssetRosterService } from "../services/asset-roster-service";
import { AssetRosterDocument } from "@mongodb-types";
import { ArchiveAssetRostersDTO } from "../models/asset-roster.dto";

const assetRosterService = new AssetRosterService();

export class AssetRosterController extends BaseController<AssetRosterDocument> {
  fileValidator = new FileValidatorService();

  private acceptedAttarchmentTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
  ];

  constructor() {
    super({ service: assetRosterService });
  }

  protected override async createHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const files = req.files as
      | { photo?: Express.Multer.File[]; attachments?: Express.Multer.File[] }
      | undefined;

    const photo = files?.photo?.[0];
    const attachments = files?.attachments;

    if (photo) {
      try {
        this.fileValidator.validateImageFile(photo);
      } catch (error: any) {
        next(error);
        return;
      }

      req.body.photo = photo;
    }

    if (attachments) {
      try {
        for (const attachment of attachments) {
          this.fileValidator.validateFileType(
            attachment,
            this.acceptedAttarchmentTypes,
          );
        }
      } catch (error: any) {
        next(error);
        return;
      }
    }

    await super.createHandler(req, res, next);
  }

  protected override async updateHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const files = req.files as
      | { photo?: Express.Multer.File[]; attachments?: Express.Multer.File[] }
      | undefined;

    const photo = files?.photo?.[0];
    const attachments = files?.attachments;

    if (photo) {
      try {
        this.fileValidator.validateImageFile(photo);
      } catch (error: any) {
        next(error);
        return;
      }

      req.body.photo = photo;
    }

    if (attachments) {
      try {
        for (const attachment of attachments) {
          this.fileValidator.validateFileType(
            attachment,
            this.acceptedAttarchmentTypes,
          );
        }

        req.body.attachments = attachments;
      } catch (error: any) {
        next(error);
        return;
      }
    }

    await super.updateHandler(req, res, next);
  }

  /**
   * Exports all active assets by default, or only the IDs supplied through the
   * optional `ids` query parameter.
   *
   * Example:
   * GET /asset-rosters/export?ids=ID_ONE,ID_TWO
   */
  protected override async exportCSVHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const rawIds = req.query.ids;

      // Preserve the current "Export CSV" behavior when no selection was sent.
      if (rawIds === undefined) {
        await super.exportCSVHandler(req, res, next);
        return;
      }

      if (typeof rawIds !== "string") {
        throw new ValidationException("ids must be a comma-separated list.");
      }

      const assetRosterIds = rawIds
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

      if (
        assetRosterIds.length === 0 ||
        assetRosterIds.some((id) => !Types.ObjectId.isValid(id))
      ) {
        throw new ValidationException(
          "Select at least one valid asset record to export.",
        );
      }

      const data = await assetRosterService.exportCSV(
        undefined,
        assetRosterIds,
      );

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "inline; filename=selected-asset-rosters.csv",
      );

      res.write(data);
      res.end();
    } catch (error: any) {
      next(error);
    }
  }

  archiveSelected = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { ids } = req.body as ArchiveAssetRostersDTO;

      const result = await assetRosterService.archiveSelected(ids);

      this.sendData(res, result);
    } catch (error: any) {
      next(error);
    }
  };

  unarchiveSelected = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { ids } = req.body as ArchiveAssetRostersDTO;

      const result = await assetRosterService.unarchiveSelected(ids);

      this.sendData(res, result);
    } catch (error: any) {
      next(error);
    }
  };

  validateImport = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await assetRosterService.validateImport(req.body);
      this.sendData(res, result);
    } catch (error: any) {
      next(error);
    }
  };

  // for skipping PM
  protected async updateSkipAssetPMHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const body = req.body;
      const assetRoster = await assetRosterService.skipAssetPM(body);

      this.sendData(res, assetRoster);
    } catch (error: any) {
      next(error);
    }
  }

  updateSkipAssetPM = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    await this.updateSkipAssetPMHandler(req, res, next);
  };

  protected async readDocumentsHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      const question: string | undefined = req.body.question;

      if (!files || files.length === 0) {
        throw new ValidationException("At least one file is required");
      }

      for (const attachment of files) {
        this.fileValidator.validateFileType(
          attachment,
          this.acceptedAttarchmentTypes,
        );
      }

      const result = await (
        this.service as AssetRosterService
      ).readMaintenanceDocuments(files, question);

      this.sendData(res, result);

      const resulting = await (
        this.service as AssetRosterService
      ).readMaintenanceDocuments(files, question);

      console.log("GenAI full response:", resulting);
    } catch (error: any) {
      next(error);
    }
  }

  readDocuments = async (req: Request, res: Response, next: NextFunction) => {
    await this.readDocumentsHandler(req, res, next);
  };
}
