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

export function generateSecurityCode(): string {
  return Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join(
    ""
  );
}

export function padCedula(cedula: string): string {
  return cedula.padStart(12, "0");
}

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
