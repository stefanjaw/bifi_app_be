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
    callbackUrl?: string
  ): Promise<any> {
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

    return response.data;
  }

  async pollStatus(clave: string, settings: CrEinvoiceSettingsDocument): Promise<any> {
    const token = await haciendaAuthService.getToken(settings);
    const baseUrl = this.getBaseUrl(settings);

    const response = await axios.get(`${baseUrl}recepcion/${clave}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  }
}

export const haciendaSubmissionService = new HaciendaSubmissionService();
