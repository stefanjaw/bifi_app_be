export class CrEinvoiceValidatorService {
  validateForSubmission(invoice: any, settings: any): string[] {
    const errors: string[] = [];

    // ── Settings ─────────────────────────────────────────────────────────────
    if (!settings.proveedorSistemas?.trim()) {
      errors.push("Configuración: falta el proveedor de sistemas (proveedorSistemas).");
    }
    if (!settings.haciendaUsername?.trim()) {
      errors.push("Configuración: falta el nombre de usuario de Hacienda (haciendaUsername).");
    }
    if (!settings.haciendaPassword?.trim() && !settings.certificateFile?.fileId) {
      errors.push("Configuración: falta la contraseña de Hacienda o el archivo del certificado digital.");
    }

    if (!settings.emisorCompanyId) {
      errors.push("Configuración: no se ha configurado la compañía emisora (emisorCompanyId).");
    } else {
      const emisorContact = (settings.emisorCompanyId as any)?.contactId as any;
      if (!emisorContact?.vat) {
        errors.push("Emisor: la compañía no tiene número de identificación (vat).");
      }
      if (!emisorContact?.crVatType) {
        errors.push("Emisor: la compañía no tiene tipo de identificación configurado (crVatType).");
      }
      if (!emisorContact?.state) {
        errors.push(
          "Emisor: la compañía no tiene Provincia configurada. La Ubicación del Emisor es obligatoria para Hacienda."
        );
      }
      // Actividad económica del emisor
      const hasEmisorActivity =
        invoice.crCodigoActividadEmisor?.trim() ||
        (emisorContact?.crEconomicActivityCodes ?? []).length > 0;
      if (!hasEmisorActivity) {
        errors.push(
          "Emisor: la compañía no tiene actividades económicas configuradas. Configure al menos una en el contacto de la empresa, y selecciónela en la factura."
        );
      }
      // Nombre comercial del emisor
      if (!emisorContact?.commercialName?.trim()) {
        errors.push("Emisor: falta el nombre comercial (NombreComercial) en el contacto de la empresa.");
      }
    }

    // ── Invoice-level fields ──────────────────────────────────────────────────
    if (!invoice.crEinvoiceType) {
      errors.push("Factura: falta el tipo de comprobante electrónico (Tipo de Factura).");
    }
    if (!invoice.crCondicionVentaId) {
      errors.push("Factura: falta la condición de venta.");
    }
    if (!invoice.crMedioPagoId) {
      errors.push("Factura: falta el medio de pago.");
    }

    // ── Receptor (contact) ────────────────────────────────────────────────────
    // Contact rules by document type:
    //   TE           — entirely optional; if present, only Nombre required.
    //   NC, ND       — optional (may be created from a TE with no contact);
    //                  if present, full FE-style validation applies.
    //   FE/FEC/FEE/REP — required; full FE-style validation applies.
    const einvoiceType: string = invoice.crEinvoiceType ?? "FE";

    const validateFullReceptor = (contact: any) => {
      if (!contact.name) {
        errors.push("Receptor: el contacto no tiene nombre.");
      }
      if (!contact.vat) {
        errors.push("Receptor: el contacto no tiene número de identificación (vat).");
      }
      if (!contact.crVatType) {
        errors.push("Receptor: el contacto no tiene tipo de identificación configurado (crVatType).");
      }
      const hasReceptorActivity =
        invoice.crCodigoActividadReceptor?.trim() ||
        (contact?.crEconomicActivityCodes ?? []).length > 0;
      if (!hasReceptorActivity) {
        errors.push(
          "Receptor: el contacto no tiene actividades económicas configuradas. Configure al menos una en el contacto, y selecciónela en la factura."
        );
      }
      if (!contact.commercialName?.trim()) {
        errors.push("Receptor: el contacto no tiene nombre comercial (NombreComercial).");
      }
    };

    // FEC: the JSON Receptor is the small-business seller whose paper receipt we are digitalizing.
    // v4.4 spec change #13 makes NombreComercial optional for FEC (Odoo XML builder confirms:
    // it uses `if NombreComercial` before writing the element).
    // However, the Odoo XML builder accesses Receptor['Ubicacion'] unconditionally for FEC
    // (no .get() guard on the outer key), so Provincia MUST be present or Python throws
    // KeyError: 'Ubicacion'. Require state unless the seller is a foreigner (crVatType 05/06).
    // CodigoActividadReceptor is also hard-required by the server for FEC.
    const validateFecReceptor = (contact: any) => {
      if (!contact.name) {
        errors.push("Receptor (FEC): el contacto del vendedor no tiene nombre.");
      }
      if (!contact.vat) {
        errors.push("Receptor (FEC): el contacto del vendedor no tiene número de identificación (vat).");
      }
      if (!contact.crVatType) {
        errors.push("Receptor (FEC): el contacto del vendedor no tiene tipo de identificación configurado (crVatType).");
      }
      const hasReceptorActivity =
        invoice.crCodigoActividadReceptor?.trim() ||
        (contact?.crEconomicActivityCodes ?? []).length > 0;
      if (!hasReceptorActivity) {
        errors.push(
          "Receptor (FEC): el contacto del vendedor debe tener actividades económicas configuradas. El servidor de Hacienda requiere CodigoActividadReceptor para Facturas Electrónicas de Compra."
        );
      }
      // Ubicacion is required by the Odoo XML builder for domestic sellers (crVatType 01-04).
      // For extranjeros (05) and no-contribuyentes (06) it is optional per the v4.4 spec.
      const vatType: string = contact.crVatType ?? "";
      if (vatType !== "05" && vatType !== "06") {
        if (!contact.state?.trim()) {
          errors.push(
            "Receptor (FEC): el contacto del vendedor debe tener Provincia (state) configurada. Es requerida por el servidor de Hacienda para Facturas Electrónicas de Compra."
          );
        }
      }
    };

    if (einvoiceType === "TE") {
      // TE: receptor entirely optional; only Nombre required when present
      if (invoice.contactId) {
        const contact = invoice.contactId as any;
        if (!contact.name) {
          errors.push("Receptor (TE): el contacto asignado no tiene nombre.");
        }
      }
    } else if (einvoiceType === "NC" || einvoiceType === "ND") {
      // NC/ND: receptor optional (can originate from a TE with no contact);
      // when present, full FE-style validation applies
      if (invoice.contactId) {
        validateFullReceptor(invoice.contactId as any);
      }
    } else if (einvoiceType === "FEC") {
      // FEC: receptor (small-business seller) is required; uses relaxed rules
      if (!invoice.contactId) {
        errors.push("Factura (FEC): falta el contacto del vendedor. Debe asignar el establecimiento que emitió el comprobante físico.");
      } else {
        validateFecReceptor(invoice.contactId as any);
      }
      // InformacionReferencia is mandatory for FEC per v4.4 XSD (spec change #125).
      // Without it Hacienda rejects with cvc-complex-type.2.4.a (Signature before InformacionReferencia).
      if (!invoice.crInformacionReferencia?.tipoDocIR?.trim()) {
        errors.push(
          "Factura (FEC): debe completar la Información de Referencia (Tipo de Documento). Es obligatoria para toda Factura Electrónica de Compra según el esquema XSD v4.4."
        );
      }
    } else {
      // FE, FEE, REP: receptor is required with full validation
      if (!invoice.contactId) {
        errors.push("Factura: falta el receptor. Debe asignar un contacto a la factura.");
      } else {
        validateFullReceptor(invoice.contactId as any);
      }
    }

    // ── Line items ────────────────────────────────────────────────────────────
    const productLines = (invoice.lines ?? []).filter(
      (l: any) => !l.lineType || l.lineType === "product"
    );

    if (productLines.length === 0) {
      errors.push("Factura: debe tener al menos una línea de producto.");
    }

    productLines.forEach((line: any, index: number) => {
      const lineNum = index + 1;
      const product = line.productId as any;

      if (!product) {
        errors.push(`Línea ${lineNum}: no tiene producto asignado.`);
        return;
      }

      const productName = product.name ?? "producto";

      if (!line.quantity || Number(line.quantity) <= 0) {
        errors.push(`Línea ${lineNum} (${productName}): la cantidad debe ser mayor a 0.`);
      }

      if (!product.codigoComercial) {
        errors.push(
          `Línea ${lineNum} (${productName}): falta el código CABYS (codigoComercial). Configúrelo en el producto.`
        );
      }

      const taxes = (line.taxIds ?? []).filter(
        (t: any) => t && typeof t === "object" && t._id
      );

      taxes.forEach((tax: any, taxIndex: number) => {
        const taxLabel = `Línea ${lineNum} (${productName}), impuesto ${taxIndex + 1} (${tax.name ?? ""})`;
        if (!tax.crCodigo) {
          errors.push(`${taxLabel}: falta el código de impuesto CR (crCodigo).`);
        }
        if (!tax.crCodigoTarifa) {
          errors.push(`${taxLabel}: falta el código de tarifa CR (crCodigoTarifa).`);
        }
        if (tax.crTarifa == null) {
          errors.push(`${taxLabel}: falta el valor de la tarifa CR (crTarifa).`);
        }
      });
    });

    return errors;
  }
}

export const crEinvoiceValidatorService = new CrEinvoiceValidatorService();
