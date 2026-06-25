import { Router } from "express";
import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { authorizeMiddleware } from "../../../system";
import { crEinvoiceActionService } from "../services/cr-einvoice-action.service";
import { crEinvoiceReceptionService } from "../services/cr-einvoice-reception.service";
import { haciendaSubmissionService } from "../services/hacienda-submission.service";
import { crEinvoiceJsonBuilderService } from "../services/cr-einvoice-json-builder.service";
import { CrEinvoiceSettingsService } from "../settings/services/cr-einvoice-settings-service";
import { ConnectionManager, ValidationException } from "../../../system";
import { journalEntryModel } from "../../accounting/models/journal-entry.model";
import { buildNumeroConsecutivo, buildClave } from "../utils/cr-clave-builder";
import { SequenceService } from "../../sequences/services/sequence-service";

const upload = multer();
const crEinvoiceSettingsService = new CrEinvoiceSettingsService();
const sequenceService = new SequenceService();

const sendData = (res: Response, data: any) => {
  res.status(200).json({ data });
};

export class CrEinvoiceActionRouter {
  private router = Router();
  private connectionManager = new ConnectionManager();

  constructor() {
    this.initRoutes();
  }

  get getRouter() {
    return this.router;
  }

  private initRoutes() {
    this.router.post(
      "/cr-einvoice/import-received",
      upload.fields([
        { name: "firmadoXml", maxCount: 1 },
        { name: "haciendaXml", maxCount: 1 },
        { name: "pdf", maxCount: 1 },
      ]),
      authorizeMiddleware("accounting/invoices", "create"),
      this.importReceived
    );

    this.router.post(
      "/cr-einvoice/:id/submit-einvoice",
      authorizeMiddleware("accounting/invoices", "update"),
      this.submitEinvoice
    );

    this.router.post(
      "/cr-einvoice/:id/poll-einvoice-status",
      authorizeMiddleware("accounting/invoices", "update"),
      this.pollEinvoiceStatus
    );

    this.router.post(
      "/cr-einvoice/:id/create-note",
      authorizeMiddleware("accounting/invoices", "create"),
      this.createNote
    );

    this.router.post(
      "/cr-einvoice/:id/submit-acceptance",
      authorizeMiddleware("accounting/invoices", "update"),
      this.submitAcceptance
    );

    this.router.get(
      "/cr-einvoice/:id/poll-acceptance-status",
      authorizeMiddleware("accounting/invoices", "update"),
      this.pollAcceptanceStatus
    );
  }

  private importReceived = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const files = req.files as
        | { [fieldname: string]: Express.Multer.File[] }
        | undefined;
      const firmadoXmlFiles = files?.["firmadoXml"];
      if (!firmadoXmlFiles || firmadoXmlFiles.length === 0) {
        res
          .status(400)
          .json({ data: null, message: "firmadoXml file is required." });
        return;
      }
      const result = await crEinvoiceReceptionService.importReceived(
        firmadoXmlFiles[0],
        files?.["haciendaXml"]?.[0],
        files?.["pdf"]?.[0]
      );
      sendData(res, result);
    } catch (error: any) {
      next(error);
    }
  };

  private submitEinvoice = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await crEinvoiceActionService.submitToHacienda(
        req.params.id
      );
      sendData(res, result);
    } catch (error: any) {
      next(error);
    }
  };

  private pollEinvoiceStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await crEinvoiceActionService.pollEinvoiceStatus(
        req.params.id
      );
      sendData(res, result);
    } catch (error: any) {
      next(error);
    }
  };

  private createNote = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { noteType, codigo, codigoReferenciaOTRO, razon } = req.body;
      const result = await crEinvoiceActionService.createNote(
        req.params.id,
        noteType,
        codigo,
        razon,
        codigoReferenciaOTRO
      );
      sendData(res, result);
    } catch (error: any) {
      next(error);
    }
  };

  private submitAcceptance = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const model = this.connectionManager.bindModelToDb(journalEntryModel);
      const invoice = await model.findById(id);
      if (!invoice) throw new ValidationException("Invoice not found.");

      const einvoiceType: string = (invoice as any).crEinvoiceType ?? "";
      if (!["MA", "MAP", "MR"].includes(einvoiceType)) {
        throw new ValidationException(
          "Only MA, MAP, or MR invoices can submit an acceptance message."
        );
      }

      const settingsRaw = await crEinvoiceSettingsService.getSettings();
      if (!settingsRaw) {
        throw new ValidationException("CR E-Invoice settings not configured.");
      }

      const settingsModel = this.connectionManager.bindModelToDb(
        (crEinvoiceSettingsService as any).model
      );
      const settings: any = await settingsModel
        .findById((settingsRaw as any)._id)
        .populate({
          path: "emisorCompanyId",
          populate: {
            path: "contactId",
            select: "name vat crVatType crEconomicActivityCodes",
          },
        });

      const seqName = "CrEInvoice-MR";
      const counter = await sequenceService.getNextCounterByName(seqName);

      const codigoEstablecimiento = settings.codigoEstablecimiento ?? "001";
      const codigoPuntoVenta = settings.codigoPuntoVenta ?? "00001";
      const numeroConsecutivo = buildNumeroConsecutivo(
        codigoEstablecimiento,
        codigoPuntoVenta,
        "05",
        counter
      );

      const emisorContact = settings.emisorCompanyId?.contactId as any;
      const emisorCedula = (emisorContact?.vat ?? "").replace(/\D/g, "");
      const clave = buildClave(numeroConsecutivo, new Date(), emisorCedula);

      await model.findByIdAndUpdate(id, {
        crMensajeReceptorNumeroConsecutivo: numeroConsecutivo,
        crAcceptanceStatus: "sent",
      });

      const updatedInvoice = await model.findById(id);
      const payload = await crEinvoiceJsonBuilderService.buildMensajeReceptor(
        updatedInvoice?.toObject() ?? {},
        settings,
        clave,
        numeroConsecutivo
      );

      try {
        const haciendaResponse = await haciendaSubmissionService.submitPayload(
          payload,
          settings
        );
        const updated = await model.findByIdAndUpdate(
          id,
          { crAcceptanceHaciendaResponse: haciendaResponse },
          { new: true }
        );
        sendData(res, updated);
      } catch (error: any) {
        const errorDetail =
          error?.response?.data ?? error?.message ?? String(error);
        await model.findByIdAndUpdate(id, {
          crAcceptanceStatus: "draft",
          crAcceptanceHaciendaResponse: { error: errorDetail },
        });
        throw error;
      }
    } catch (error: any) {
      next(error);
    }
  };

  private pollAcceptanceStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const model = this.connectionManager.bindModelToDb(journalEntryModel);
      const invoice = await model.findById(id);
      if (!invoice) throw new ValidationException("Invoice not found.");

      const settings = await crEinvoiceSettingsService.getSettings();
      if (!settings) {
        throw new ValidationException("CR E-Invoice settings not configured.");
      }

      const invoiceClave: string = (invoice as any).crClave ?? "";
      const consecutivo: string =
        (invoice as any).crMensajeReceptorNumeroConsecutivo ?? "";
      const clave: string =
        invoiceClave && consecutivo
          ? `${invoiceClave}-${consecutivo}`
          : invoiceClave || consecutivo;
      if (!clave) {
        throw new ValidationException(
          "No acceptance clave — submit acceptance first."
        );
      }

      const pollResponse = await haciendaSubmissionService.pollStatus(
        clave,
        settings
      );
      const data = pollResponse?.result ?? pollResponse;
      const rawState = (
        data?.["ind-estado"] ??
        data?.indEstado ??
        data?.estado ??
        ""
      ).toLowerCase();

      const newStatus: string =
        rawState === "aceptado"
          ? "accepted"
          : rawState === "rechazado"
          ? "rejected"
          : (invoice as any).crAcceptanceStatus ?? "sent";

      const updated = await model.findByIdAndUpdate(
        id,
        { crAcceptanceHaciendaResponse: data, crAcceptanceStatus: newStatus },
        { new: true }
      );
      sendData(res, updated);
    } catch (error: any) {
      next(error);
    }
  };
}
