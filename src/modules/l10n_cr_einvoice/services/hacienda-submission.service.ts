import axios from "axios";
import { CrEinvoiceSettingsDocument } from "../settings/models/cr-einvoice-settings.model";
import { haciendaAuthService } from "./hacienda-auth.service";

export class HaciendaSubmissionService {
  private getBaseUrl(settings: CrEinvoiceSettingsDocument): string {
    if (settings.haciendaEnvironment === "production") {
      return "https://api.comprobanteselectronicos.go.cr/recepcion/v1/";
    }
    return "https://api.comprobanteselectronicos.go.cr/recepcion-sandbox/v1/";
  }

  async submitPayload(
    payload: object,
    settings: CrEinvoiceSettingsDocument,
    callbackUrl?: string,
  ): Promise<any> {
    const customServerUrl = process.env.CR_EINVOICE_SERVER_URL;

    if (customServerUrl) {
      const fullPayload: any = { ...payload };
      if (callbackUrl) fullPayload.callbackUrl = callbackUrl;

      const response = await axios.post(customServerUrl, fullPayload, {
        headers: { "Content-Type": "application/json" },
      });

      const data = response.data;
      console.log("[Hacienda] Custom server response:", JSON.stringify(data));

      // Unwrap JSON-RPC 2.0 envelope if present ({ jsonrpc, id, result: {...} })
      // pollStatus does the same — errors may live inside result, not at the top level
      const unwrapped: any = data?.result !== undefined ? data.result : data;

      // Detect application-level errors even when the HTTP status is 2xx.
      // Check both the JSON-RPC envelope level (data.error) and the unwrapped result.
      const hasError =
        data?.error ||
        unwrapped?.error ||
        unwrapped?.success === false ||
        unwrapped?.status === "error" ||
        unwrapped?.status === "failed" ||
        (typeof unwrapped?.message === "string" &&
          /error|fail|exception|validationerror/i.test(unwrapped.message)) ||
        (typeof unwrapped?.detalleMensaje === "string" &&
          /error|fail|exception/i.test(unwrapped.detalleMensaje)) ||
        (typeof data === "string" && /error|fail|exception/i.test(data));

      if (hasError) {
        const msg =
          unwrapped?.message ??
          unwrapped?.detalleMensaje ??
          (typeof data?.error === "string" ? data.error : data?.error?.message) ??
          data?.error_description ??
          "Custom FE server returned an error response.";
        const err: any = new Error(msg);
        err.response = { data };
        throw err;
      }

      return unwrapped;
    }

    const token = await haciendaAuthService.getToken(settings);
    const baseUrl = this.getBaseUrl(settings);
    const fullPayload: any = { ...payload };
    if (callbackUrl) fullPayload.callbackUrl = callbackUrl;

    const response = await axios.post(`${baseUrl}recepcion`, fullPayload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("[Hacienda] Submission response:", response.data);

    return response.data;
  }

  async pollStatus(
    clave: string,
    settings: CrEinvoiceSettingsDocument,
  ): Promise<any> {
    const customServerUrl = process.env.CR_EINVOICE_SERVER_URL;

    if (customServerUrl) {
      const base = customServerUrl.replace(/\/?$/, "");
      const pollUrl = `${base}/${clave}`;
      const response = await axios.get(pollUrl, {
        headers: { "Content-Type": "application/json" },
        data: {},
      });
      
      return response.data;
    }

    const token = await haciendaAuthService.getToken(settings);
    const baseUrl = this.getBaseUrl(settings);

    const response = await axios.get(`${baseUrl}recepcion/${clave}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  }
}

export const haciendaSubmissionService = new HaciendaSubmissionService();
