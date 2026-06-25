import { ValidationException } from "../../../system/libraries/exceptions/service-exception";

export const TIPO_COMPROBANTE_CODES: Record<string, string> = {
  FE: "01",
  ND: "02",
  NC: "03",
  TE: "04",
  FEC: "08",
  FEE: "09",
  REP: "10",
};

/** Generates an 8-digit random security code for the Hacienda Clave. @returns An 8-digit numeric string. */
export function generateSecurityCode(): string {
  return Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join(
    ""
  );
}

/** Pads a Costa Rica cédula to 12 digits with leading zeros. @param cedula - The raw cédula string. @returns The zero-padded 12-character string. */
export function padCedula(cedula: string): string {
  return cedula.padStart(12, "0");
}

/**
 * Builds a 20-character consecutive document number for CR electronic invoices.
 * @param codigoEstablecimiento - 3-digit establishment code.
 * @param codigoPuntoVenta - 5-digit point-of-sale code.
 * @param tipoComprobante - 2-digit document type code.
 * @param counter - 10-digit sequential counter.
 * @returns The 20-character consecutive number string.
 */
export function buildNumeroConsecutivo(
  codigoEstablecimiento: string,
  codigoPuntoVenta: string,
  tipoComprobante: string,
  counter: string
): string {
  const estab = codigoEstablecimiento.padStart(3, "0").slice(0, 3);
  const pventa = codigoPuntoVenta.padStart(5, "0").slice(0, 5);
  const tipo = tipoComprobante.padStart(2, "0").slice(0, 2);
  const cnt = counter.padStart(10, "0").slice(0, 10);
  return `${estab}${pventa}${tipo}${cnt}`;
}

/**
 * Builds a 50-character Hacienda Clave (unique document key) for CR electronic invoices.
 * @param numeroConsecutivo - The 20-character consecutive number from buildNumeroConsecutivo.
 * @param fechaEmision - The document issuance date (converted to CR UTC-6).
 * @param emisorCedula - The issuer's cédula (national ID).
 * @param situacion - Situational code (default "1" for normal).
 * @returns The 50-character Clave string.
 * @throws ValidationException if the resulting clave is not exactly 50 characters.
 */
export function buildClave(
  numeroConsecutivo: string,
  fechaEmision: Date,
  emisorCedula: string,
  situacion = "1"
): string {
  const countryCode = "506";
  // CR is UTC-6; use Costa Rica local date for the clave key
  const cr = new Date(fechaEmision.getTime() - 6 * 60 * 60 * 1000);
  const dd = cr.getUTCDate().toString().padStart(2, "0");
  const mm = (cr.getUTCMonth() + 1).toString().padStart(2, "0");
  const yy = cr.getUTCFullYear().toString().slice(-2);
  const cedula = padCedula(emisorCedula);
  const securityCode = generateSecurityCode();
  const clave = `${countryCode}${dd}${mm}${yy}${cedula}${numeroConsecutivo}${situacion}${securityCode}`;
  if (clave.length !== 50) {
    throw new ValidationException(
      `Clave length mismatch: expected 50, got ${clave.length}`
    );
  }
  return clave;
}
