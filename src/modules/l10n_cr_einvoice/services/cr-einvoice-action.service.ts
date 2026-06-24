import { ConnectionManager, ValidationException } from "../../../system";
import {
  journalEntryModel,
  JournalEntryDocument,
  JournalEntryStatus,
} from "../../accounting/models/journal-entry.model";
import { CrEinvoiceSettingsService } from "../settings/services/cr-einvoice-settings-service";
import { haciendaSubmissionService } from "./hacienda-submission.service";
import { crEinvoiceJsonBuilderService } from "./cr-einvoice-json-builder.service";
import { crEinvoiceValidatorService } from "./cr-einvoice-validator.service";
import {
  TIPO_COMPROBANTE_CODES,
  buildNumeroConsecutivo,
  buildClave,
} from "../utils/cr-clave-builder";
import { SequenceService } from "../../sequences/services/sequence-service";

const crEinvoiceSettingsService = new CrEinvoiceSettingsService();
const sequenceService = new SequenceService();

export class CrEinvoiceActionService {
  private connectionManager = new ConnectionManager();

  async submitToHacienda(id: string): Promise<JournalEntryDocument> {
    const settingsRaw = await crEinvoiceSettingsService.getSettings();
    if (!settingsRaw) {
      throw new ValidationException("CR E-Invoice settings not configured.");
    }

    const settingsModel = this.connectionManager.bindModelToDb(
      (crEinvoiceSettingsService as any).model,
    );
    const settings: any = await settingsModel
      .findById((settingsRaw as any)._id)
      .populate({
        path: "emisorCompanyId",
        populate: {
          path: "contactId",
          select:
            "name lastName email vat phoneNumber crVatType crEconomicActivityCodes commercialName state city crDistrito streetAddress",
        },
      });

    const model = this.connectionManager.bindModelToDb(journalEntryModel);
    const invoice = await model.findById(id);
    if (!invoice) throw new ValidationException("Invoice not found.");
    if (!invoice.isInvoice)
      throw new ValidationException("Document is not an invoice.");

    const validationErrors = crEinvoiceValidatorService.validateForSubmission(
      invoice.toObject(),
      settings,
    );
    if (validationErrors.length > 0) {
      throw new ValidationException(validationErrors.join("\n"));
    }

    const einvoiceType = (invoice as any).crEinvoiceType ?? "FE";
    const tipoComprobanteCode = TIPO_COMPROBANTE_CODES[einvoiceType] ?? "01";

    const seqName = `CrEInvoice-${einvoiceType}`;
    const counter = await sequenceService.getNextCounterByName(seqName);

    const codigoEstablecimiento =
      (settings as any).codigoEstablecimiento ?? "001";
    const codigoPuntoVenta = (settings as any).codigoPuntoVenta ?? "00001";
    const numeroConsecutivo = buildNumeroConsecutivo(
      codigoEstablecimiento,
      codigoPuntoVenta,
      tipoComprobanteCode,
      counter,
    );

    const fechaEmision = new Date();
    const emisorContact = (settings as any).emisorCompanyId?.contactId as any;
    const emisorCedula = (emisorContact?.vat ?? "").replace(/\D/g, "");
    const clave = buildClave(numeroConsecutivo, fechaEmision, emisorCedula);

    await model.findByIdAndUpdate(id, {
      crClave: clave,
      crNumeroConsecutivo: numeroConsecutivo,
      crEinvoiceStatus: "pending",
    });

    const populatedInvoice = await model.findById(id);
    const entryData = {
      ...(populatedInvoice?.toObject() ?? {}),
      crClave: clave,
      crNumeroConsecutivo: numeroConsecutivo,
      crFechaEmision: fechaEmision,
    };

    const payload = await crEinvoiceJsonBuilderService.buildFromJournalEntry(
      entryData,
      settings,
    );

    try {
      const haciendaResponse = await haciendaSubmissionService.submitPayload(
        payload,
        settings,
        process.env["CR_EINVOICE_CALLBACK_URL"],
      );
      return model.findByIdAndUpdate(
        id,
        { crHaciendaResponse: haciendaResponse, crEinvoiceStatus: "sent" },
        { new: true },
      ) as any;
    } catch (error: any) {
      const errorDetail =
        error?.response?.data ?? error?.message ?? String(error);
      console.error("[CR E-Invoice] Hacienda submission error:", errorDetail);
      await model.findByIdAndUpdate(id, {
        crEinvoiceStatus: "failed",
        crHaciendaResponse: { error: errorDetail },
      });
      throw error;
    }
  }

  async pollEinvoiceStatus(id: string): Promise<JournalEntryDocument> {
    const settings = await crEinvoiceSettingsService.getSettings();
    if (!settings) {
      throw new ValidationException("CR E-Invoice settings not configured.");
    }

    const model = this.connectionManager.bindModelToDb(journalEntryModel);
    const invoice = await model.findById(id);
    if (!invoice) throw new ValidationException("Invoice not found.");
    if (!invoice.isInvoice)
      throw new ValidationException("Document is not an invoice.");

    const clave = (invoice as any).crClave;
    if (!clave)
      throw new ValidationException(
        "Invoice has no CR clave — submit to Hacienda first.",
      );

    const pollResponse = await haciendaSubmissionService.pollStatus(
      clave,
      settings,
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
        : rawState === "recibido" || rawState === "procesando"
        ? "received"
        : (invoice as any).crEinvoiceStatus ?? "sent";

    return model.findByIdAndUpdate(
      id,
      { crHaciendaResponse: data, crEinvoiceStatus: newStatus },
      { new: true },
    ) as any;
  }

  async createNote(
    sourceInvoiceId: string,
    noteType: "NC" | "ND",
    codigo: string,
    razon: string,
    codigoReferenciaOTRO?: string,
  ): Promise<JournalEntryDocument> {
    const model = this.connectionManager.bindModelToDb(journalEntryModel);
    const source = await model.findById(sourceInvoiceId).lean();
    if (!source) throw new ValidationException("Source invoice not found.");
    if (!source.isInvoice)
      throw new ValidationException("Document is not an invoice.");

    const sourceType: string = (source as any).crEinvoiceType ?? "FE";
    const tipoDocMap: Record<string, string> = {
      FE: "01",
      ND: "02",
      NC: "03",
      TE: "04",
      FEE: "01",
      REP: "01",
    };
    let sourceTipoDoc: string;
    if (sourceType === "FEC") {
      sourceTipoDoc = noteType === "NC" ? "17" : "18";
    } else {
      sourceTipoDoc = tipoDocMap[sourceType] ?? "01";
    }

    const newInvoiceData: any = {
      isInvoice: true,
      status: JournalEntryStatus.DRAFT,
      journalId: (source as any).journalId,
      date: new Date(),
      contactId: (source as any).contactId,
      currencyId: (source as any).currencyId,
      paymentTermId: (source as any).paymentTermId,
      dueDate: (source as any).dueDate,
      salespersonId: (source as any).salespersonId,
      fiscalPositionId: (source as any).fiscalPositionId,
      companyId: (source as any).companyId,
      reference: (source as any).reference,
      paymentReference: (source as any).paymentReference,
      lines: ((source as any).lines ?? []).map((l: any) => ({
        accountId: l.accountId,
        description: l.description,
        debit: l.debit,
        credit: l.credit,
        lineType: l.lineType,
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxIds: l.taxIds,
        discountId: l.discountId,
        amount: l.amount,
      })),
      untaxedAmount: (source as any).untaxedAmount,
      taxAmount: (source as any).taxAmount,
      totalAmount: (source as any).totalAmount,
      amountDue: (source as any).amountDue,
      active: true,
      crEinvoiceType: noteType,
      crCondicionVentaId: (source as any).crCondicionVentaId,
      crMedioPagoId: (source as any).crMedioPagoId,
      crPlazoCredito: (source as any).crPlazoCredito,
      crCodigoActividadEmisor: (source as any).crCodigoActividadEmisor,
      crCodigoActividadReceptor: (source as any).crCodigoActividadReceptor,
      crReferenciaInvoiceId: (source as any)._id,
      crInformacionReferencia: {
        tipoDocIR: sourceTipoDoc,
        numero: (source as any).crClave ?? "",
        fechaEmisionIR: (source as any).date,
        codigo,
        ...(codigoReferenciaOTRO ? { codigoReferenciaOTRO } : {}),
        razon,
      },
    };

    const [created] = await model.create([newInvoiceData]);
    return created;
  }
}

export const crEinvoiceActionService = new CrEinvoiceActionService();
