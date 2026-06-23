import { randomUUID } from "crypto";
import { XMLParser } from "fast-xml-parser";
import { ConnectionManager, ValidationException } from "../../../system";
import {
  journalEntryModel,
  JournalEntryStatus,
} from "../../accounting/models/journal-entry.model";
import { InnerFile } from "../../../system/libraries/file-storage/file-upload.types";
import { isValidFileUpload } from "../../../system/libraries/file-storage/file-utils";

export class CrEinvoiceReceptionService {
  private connectionManager = new ConnectionManager();
  private xmlParser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });

  async importReceived(
    firmadoXmlFile: Express.Multer.File,
    haciendaXmlFile: Express.Multer.File | undefined,
    pdfFile: Express.Multer.File | undefined,
  ): Promise<{ _id: string }> {
    const bucket = this.connectionManager.bindBucketToDb();

    // Upload firmado XML (required)
    const firmadoXmlFileDoc: InnerFile = {
      fileId: await bucket.uploadFile(firmadoXmlFile),
      name: firmadoXmlFile.originalname,
      mimeType: firmadoXmlFile.mimetype,
      size: firmadoXmlFile.size,
    };

    // Upload hacienda XML (optional)
    let haciendaXmlFileDoc: InnerFile | undefined;
    if (isValidFileUpload(haciendaXmlFile)) {
      haciendaXmlFileDoc = {
        fileId: await bucket.uploadFile(haciendaXmlFile as Express.Multer.File),
        name: (haciendaXmlFile as Express.Multer.File).originalname,
        mimeType: (haciendaXmlFile as Express.Multer.File).mimetype,
        size: (haciendaXmlFile as Express.Multer.File).size,
      };
    }

    // Upload PDF (optional)
    let pdfFileDoc: InnerFile | undefined;
    if (isValidFileUpload(pdfFile)) {
      pdfFileDoc = {
        fileId: await bucket.uploadFile(pdfFile as Express.Multer.File),
        name: (pdfFile as Express.Multer.File).originalname,
        mimeType: (pdfFile as Express.Multer.File).mimetype,
        size: (pdfFile as Express.Multer.File).size,
      };
    }

    // Parse the firmado XML — fast-xml-parser may return numeric-looking values
    // as JS numbers, so every field used as a string must be coerced with String().
    const xmlContent = firmadoXmlFile.buffer.toString("utf-8");
    const parsed = this.xmlParser.parse(xmlContent);

    const rootKeys = [
      "FacturaElectronica",
      "TiqueteElectronico",
      "FacturaElectronicaCompra",
      "FacturaElectronicaExportacion",
      "NotaDebitoElectronica",
      "NotaCreditoElectronica",
      "ReciboElectronicoPago",
    ];
    let doc: any = null;
    for (const key of rootKeys) {
      if (parsed[key]) {
        doc = parsed[key];
        break;
      }
    }
    if (!doc) {
      throw new ValidationException(
        "Could not parse XML: no recognized root element found.",
      );
    }

    // String() coercion is required: XMLParser converts numeric-looking values to numbers
    const clave: string = String(doc.Clave ?? "");
    const numeroConsecutivo: string = String(doc.NumeroConsecutivo ?? "");
    const fechaEmision = doc.FechaEmision
      ? new Date(String(doc.FechaEmision))
      : new Date();

    const emisor = doc.Emisor ?? {};
    const resumen = doc.ResumenFactura ?? {};
    const detalle = doc.DetalleServicio ?? {};

    const emisorVat: string = String(
      emisor.Identificacion?.Numero ?? "",
    ).replace(/\D/g, "");
    // Zero-pad to match Contact.crVatType enum ["01"–"06"]
    const rawTipo: string = String(emisor.Identificacion?.Tipo ?? "1");
    const emisorVatType: string = rawTipo.padStart(2, "0");
    const validVatTypes = ["01", "02", "03", "04", "05", "06"];
    // individual: cédula física (01), DIMEX (03), pasaporte (05)
    const individualTipos = ["01", "03", "05"];
    const emisorContactType: "individual" | "company" = individualTipos.includes(emisorVatType)
      ? "individual"
      : "company";
    const emisorNombre: string = String(emisor.Nombre ?? "");

    const totalComprobante: number = parseFloat(
      String(resumen.TotalComprobante ?? 0),
    );
    const totalImpuesto: number = parseFloat(
      String(resumen.TotalImpuesto ?? 0),
    );
    const totalVentaNeta: number = parseFloat(
      String(resumen.TotalVentaNeta ?? 0),
    );
    const codigoMoneda: string = String(
      resumen.CodigoTipoMoneda?.CodigoMoneda ?? "CRC",
    );

    const contactModel = this.connectionManager.getModel<any>("Contact");
    let contact = emisorVat
      ? await contactModel.findOne({ vat: emisorVat }).lean()
      : null;
    if (!contact && emisorNombre) {
      const [created] = await contactModel.create([
        {
          name: emisorNombre,
          vat: emisorVat,
          type: emisorContactType,
          ...(validVatTypes.includes(emisorVatType) ? { crVatType: emisorVatType } : {}),
          active: true,
        },
      ]);
      contact = created;
    }

    const currencyModel = this.connectionManager.getModel<any>("Currency");
    const currency =
      (await currencyModel.findOne({ code: codigoMoneda }).lean()) ??
      (await currencyModel.findOne({ code: "CRC" }).lean()) ??
      (await currencyModel.findOne({}).lean());

    if (!currency) {
      throw new ValidationException(
        "No currency found in the system — create at least one currency first.",
      );
    }

    const journalDbModel = this.connectionManager.getModel<any>("Journal");
    const journal = await journalDbModel.findOne({}).lean();
    if (!journal) {
      throw new ValidationException(
        "No journal found in the system — configure a journal first.",
      );
    }

    const accountModel = this.connectionManager.getModel<any>("Account");
    const defaultAccount = await accountModel.findOne({}).lean();
    if (!defaultAccount) {
      throw new ValidationException(
        "No account found in the system — configure a chart of accounts first.",
      );
    }

    const productModel = this.connectionManager.getModel<any>("InventoryProduct");
    const rawLines = Array.isArray(detalle.LineaDetalle)
      ? detalle.LineaDetalle
      : detalle.LineaDetalle
        ? [detalle.LineaDetalle]
        : [];

    const lines: any[] = [];
    for (const line of rawLines) {
      const codigo: string = String(line.Codigo ?? "");
      const description: string = String(line.Detalle ?? "");
      const quantity: number = parseFloat(String(line.Cantidad ?? 1));
      const unitPrice: number = parseFloat(String(line.PrecioUnitario ?? 0));

      let product = codigo
        ? await productModel.findOne({ codigoComercial: codigo }).lean()
        : null;

      if (!product && description) {
        // sku is required + unique; use the Hacienda comercial code when present,
        // otherwise generate a short unique fallback.
        const sku = codigo || `IMP-${randomUUID().slice(0, 8).toUpperCase()}`;
        const [created] = await productModel.create([
          {
            name: description,
            sku,
            codigoComercial: codigo || undefined,
            salePrice: unitPrice,
            active: true,
          },
        ]);
        product = created;
      }

      lines.push({
        lineType: "product",
        accountId: defaultAccount._id,
        description,
        debit: 0,
        credit: unitPrice * quantity,
        productId: product?._id ?? undefined,
        quantity,
        unitPrice,
        taxIds: [],
        amount: unitPrice * quantity,
      });
    }

    const model = this.connectionManager.bindModelToDb(journalEntryModel);
    const [created] = await model.create([
      {
        isInvoice: true,
        status: JournalEntryStatus.DRAFT,
        journalId: (journal as any)._id,
        date: fechaEmision,
        currencyId: (currency as any)._id,
        contactId: contact?._id ?? undefined,
        lines,
        untaxedAmount: totalVentaNeta,
        taxAmount: totalImpuesto,
        totalAmount: totalComprobante,
        amountDue: totalComprobante,
        active: true,
        crEinvoiceType: "MA",
        crClave: clave,
        crNumeroConsecutivo: numeroConsecutivo,
        crFirmadoXmlFile: firmadoXmlFileDoc,
        crHaciendaXmlFile: haciendaXmlFileDoc,
        crPdfFile: pdfFileDoc,
        crAcceptanceStatus: "draft",
      },
    ]);

    return { _id: String(created._id) };
  }
}

export const crEinvoiceReceptionService = new CrEinvoiceReceptionService();
