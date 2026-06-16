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

      // Detect application-level errors even when the HTTP status is 2xx
      if (
        data?.error ||
        data?.success === false ||
        data?.status === "error" ||
        data?.status === "failed" ||
        (typeof data?.message === "string" && /error|fail/i.test(data.message))
      ) {
        const msg =
          data?.message ??
          data?.error ??
          data?.error_description ??
          "Custom FE server returned an error response.";
        const err: any = new Error(msg);
        err.response = { data };
        throw err;
      }

      return data;
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
